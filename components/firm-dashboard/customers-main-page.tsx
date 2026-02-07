"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useLanguage } from "../context/LanguageContext";
 import { messaging, requestNotificationPermission } from '../../lib/firebase-config';
import { onMessage } from 'firebase/messaging';

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price_per_hour?: number; 
  price_per_day: number;
  price_per_week: number;
  price_per_year:number;
  price_per_month: number;
  currency: string;
  currency_code: string;
  image: string;
}

interface Tenant {
  id: number;
  name: string;
  max_branches: number;
  max_cars: number;
  max_users: number;
}

interface Branch {
  id: number;
  tenant_id: number;
  name: string;
  name_ar: string;
  address: string;
  address_ar: string;
}

interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: "user" | "customer";
  roles: string[];
  permissions: string[];
}

interface BookingMessage {
  text: string;
  type: "success" | "error";
}
const API_BASE_URL = '/api/v1/admin';
const CustomerDashboardPage: React.FC = () => {
    const { language } = useLanguage();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allCars, setAllCars] = useState<Car[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedCars, setSelectedCars] = useState<Car[]>([]);
  const [pickupDate, setPickupDate] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [bookingMessage, setBookingMessage] = useState<BookingMessage | null>(null);

  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  // useEffect(() => {
  //   if (!user || user.type !== "user") return;

  //   const initFCM = async () => {
  //     const token = await requestNotificationPermission();
  //     if (token) {
  //       await fetch("/api/fcm-token", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ user_id: user.id, fcm_token: token }),
  //       });
  //     }
  //   };

  //   initFCM();
  // }, [user]);

useEffect(() => {
  if (!messaging) return;
  const unsubscribe = onMessage(messaging, (payload) => {
    const { title, body } = payload.notification || {};
    if (Notification.permission === "granted") {
      new Notification(title ?? "Notification", { body, icon: "/favicon.ico" });
    }
  });
  return () => unsubscribe();
}, []);


useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/firebase-messaging-sw.js");
  }
}, []);


  // Fetch tenants
  useEffect(() => {
    fetch(`${API_BASE_URL}/tenants?page=1&pageSize=100`)
      .then(res => res.json())
      .then(data => setTenants(data.data || []))
      .catch(err => console.error(err));
  }, []);

  // Fetch branches when tenant selected
  useEffect(() => {
    if (!selectedTenantId) return;
    fetch(`${API_BASE_URL}/branches?tenant_id=${selectedTenantId}&page=1&pageSize=100`)
      .then(res => res.json())
      .then(data => setBranches(data.data || []))
      .catch(err => console.error(err));
  }, [selectedTenantId]);

  // Fetch cars when branch selected
useEffect(() => {
  if (!selectedTenantId || !selectedBranchId) return;

  fetch(`${API_BASE_URL}/vehicles?tenant_id=${selectedTenantId}&branch_id=${selectedBranchId}&page=1&pageSize=100`)
    .then(res => res.json())
    .then(data => {
      const availableCars = (data.data || []).filter((car: any) => car.status === 'available');
      setAllCars(availableCars);
    })
    .catch(err => console.error(err));
}, [selectedTenantId, selectedBranchId]);

  const filteredCars = selectedCompany && selectedBranch ? allCars : [];

  const getNumberOfDays = () => {
    if (!pickupDate || !dropoffDate) return 0;
    const start = new Date(pickupDate);
    const end = new Date(dropoffDate);
    const diffTime = end.getTime() - start.getTime();
    return diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
  };

 const getBookingDuration = () => {
  if (!pickupDate || !dropoffDate) return { hours: 0, days: 0 };

  const start = new Date(pickupDate);
  const end = new Date(dropoffDate);
  const diffMs = end.getTime() - start.getTime();

  if (diffMs <= 0) return { hours: 0, days: 0 };

  const totalHours = diffMs / (1000 * 60 * 60);
  const days = Math.floor(totalHours / 24);
  const hours = Math.ceil(totalHours % 24);

  return { hours, days };
};

const calculateCarPrice = (car: Car): number => {
  const { hours, days } = getBookingDuration();

  let total = 0;
  let remainingDays = days;

  const hourPrice = car.price_per_hour ?? 0;
  const dayPrice = car.price_per_day ?? 0;
  const weekPrice = car.price_per_week ?? 0;
  const monthPrice = car.price_per_month ?? 0;
  const yearPrice = car.price_per_year ?? 0;

  // 🔹 ساعات (إذا أقل من يوم)
  if (days === 0 && hourPrice > 0) {
    return hours * hourPrice;
  }

  // 🔹 سنوات
  if (remainingDays >= 365 && yearPrice > 0) {
    const years = Math.floor(remainingDays / 365);
    total += years * yearPrice;
    remainingDays %= 365;
  }

  // 🔹 شهور
  if (remainingDays >= 30 && monthPrice > 0) {
    const months = Math.floor(remainingDays / 30);
    total += months * monthPrice;
    remainingDays %= 30;
  }

  // 🔹 أسابيع
  if (remainingDays >= 7 && weekPrice > 0) {
    const weeks = Math.floor(remainingDays / 7);
    total += weeks * weekPrice;
    remainingDays %= 7;
  }

  // 🔹 أيام
  total += remainingDays * dayPrice;

  // 🔹 ساعات متبقية
  if (hours > 0 && hourPrice > 0) {
    total += hours * hourPrice;
  }

  return total;
};



  const handleCarSelect = (car: Car) => {
    if (selectedCars.find(c => c.id === car.id)) {
      setSelectedCars(prev => prev.filter(c => c.id !== car.id));
    } else {
      setSelectedCars(prev => [...prev, car]);
    }
    setBookingMessage(null); 
  };


const handleBooking = async () => {
  if (!selectedCars.length || !pickupDate || !dropoffDate || !selectedBranch || !selectedTenantId) {
    setBookingMessage({ text: "Please select all required fields!", type: "error" });
    return;
  }

  if (getNumberOfDays() <= 0) {
    setBookingMessage({ text: "End date must be after pickup date!", type: "error" });
    return;
  }

   try {
  //   // ----- توليد FCM token -----
  //   let fcmToken = await requestNotificationPermission();
  //   if (fcmToken) {
  //     // إرسال الـ token للباك لتخزينه مع المستخدم
  //     await fetch('/api/fcm-token', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ user_id: user?.id, fcm_token: fcmToken }),
  //     });
  //   }

    // ----- تنفيذ الحجز -----
    for (const car of selectedCars) {
      const payload = {
        tenant_id: selectedTenantId,
        branch_id: selectedBranchId,
        vehicle_id: car.id,
        customer_id: user?.id,
        total_amount: calculateCarPrice(car),
        start_date: pickupDate,
        end_date: dropoffDate,
        status: "pending",
        notes: "",
      };

      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingMessage({ text: data.error || "Booking failed!", type: "error" });
        return;
      }
    }

    setBookingMessage({ text: "Booking Successful! 🚗", type: "success" });
    setSelectedCars([]);

    // ----- إرسال إشعار FCM بعد الحجز -----
    // if (fcmToken) {
    //   await fetch('/api/sendNotification', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       token: fcmToken,
    //       title: 'Booking Confirmed!',
    //       body: `Your booking from ${pickupDate} to ${dropoffDate} is confirmed 🚗`,
    //     }),
    //   });
    // }

  } catch (err) {
    console.error(err);
    setBookingMessage({ text: "Booking failed! Check console for details.", type: "error" });
  }
};


  return (
    <div
  className="
    relative min-h-screen w-full flex flex-col md:flex-row
    items-center justify-center gap-10 px-6 py-16 overflow-hidden
    bg-gradient-to-b
    from-gray-100 via-gray-50 to-white
    dark:from-slate-900/90 dark:via-slate-800/70 dark:to-slate-900/90
    text-gray-900 dark:text-white
    transition-colors duration-300
  "
>
<div className="w-full max-w-7xl space-y-10">

    
       <div
  className="
    bg-white/90 dark:bg-gray-800/80
    rounded-2xl shadow-lg
    p-6
    transition-colors
  "
>
   <div>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="font-semibold">{user?.email}</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
         <div className="
    px-4 py-2 rounded font-bold
    bg-amber-200 text-amber-900
    dark:bg-amber-400/30 dark:text-white
    transition-colors ">Points: 1200</div>

<div
  className="
    px-4 py-2 rounded font-bold
    bg-amber-200 text-amber-900
    dark:bg-amber-400/30 dark:text-white
    transition-colors
  "
>
  Active Bookings: 2
</div>

          </div>
        </div>

        {/* Company Selection */}
       <div
  className="
    rounded-2xl shadow-lg p-6 text-center
    bg-gradient-to-r
    from-amber-300 to-amber-500
    dark:from-amber-400 dark:to-amber-600
    text-black
    transition-colors
  "
>
  <h2 className="text-2xl font-bold mb-4">Select a Car Company</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {tenants.map(tenant => (
              <button
                key={tenant.id}
                className={`px-8 py-3 rounded-2xl font-bold transition shadow-lg hover:scale-105 transform ${
                  selectedCompany === tenant.name ? "bg-amber-400 text-black" : "bg-amber-500 text-black hover:bg-amber-400"
                }`}
                onClick={() => {
                  setSelectedCompany(tenant.name);
                  setSelectedTenantId(tenant.id);
                  setSelectedBranch("");
                  setSelectedBranchId(null);
                  setSelectedCars([]);
                  setBookingMessage(null);
                  setAllCars([]);
                }}
              >
                {tenant.name}
              </button>
            ))}
          </div>
        </div>

        {/* Branch Selection */}
        {selectedCompany && branches.length > 0 && (
        <div
  className="
    rounded-2xl shadow-lg p-6 text-center
    bg-white/90 dark:bg-gray-800/70
    text-gray-900 dark:text-white
  "
>

            <h2 className="text-2xl font-bold mb-4">{selectedCompany} Branches</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {branches.map(branch => (
                <button
                  key={branch.id}
                  className={`px-6 py-2 rounded-2xl font-bold transition shadow-lg hover:scale-105 transform ${
                    selectedBranch === branch.name ? "bg-amber-400 text-black" : "bg-amber-500 text-black hover:bg-amber-400"
                  }`}
                  onClick={() => {
                    setSelectedBranch(branch.name);
                    setSelectedBranchId(branch.id);
                    setSelectedCars([]);
                    setBookingMessage(null);
                    setAllCars([]);
                  }}
                >
                  {branch.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Car Selection */}
        {filteredCars.length > 0 && (
          <div className="rounded-2xl shadow-lg p-6 bg-gray-800/70">
            <h2 className="text-2xl font-bold mb-6 text-center">{selectedBranch} Cars</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredCars.map((car, idx) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                  className={`bg-gray-700/80 rounded-2xl shadow-lg hover:scale-105 hover:rotate-1 transition-transform transform cursor-pointer ${
                    selectedCars.find(c => c.id === car.id) ? "border-4 border-amber-400" : ""
                  }`}
                  onClick={() => handleCarSelect(car)}
                >
                  <img src={car.image} alt={`${car.make} ${car.model}`} className="w-full h-48 object-cover rounded-t-2xl" />
                  <div className="p-4 text-white">
                    <h3 className="text-lg font-bold">{car.make} {car.model}</h3>
                    <p className="text-gray-300">{car.year}</p>
                    
          <div className="mt-2 space-y-1 text-sm">
  <p className="font-bold text-amber-400">
    {language === "ar" ? "السعر اليومي" : "Daily Price"}:
    {" "}
    {car.price_per_day} {car.currency_code}
    {language === "ar" ? " / يوم" : " / day"}
  </p>
  <p className="font-bold text-amber-400">
  {language === "ar" ? "السعر بالساعة" : "Hourly Price"}:
  {" "}
  {car.price_per_hour} {car.currency_code}
  {language === "ar" ? " / ساعة" : " / hour"}
</p>

  <p className="text-gray-200">
    {language==="ar" ? "السعر الأسبوعي" : "Weekly Price"}:
    {" "}
    <b>{car.price_per_week} {car.currency_code}</b>
    {language==="ar"  ? " / أسبوع" : " / week"}
  </p>
  <p className="text-gray-200">
    {language === "ar" ? "السعر الشهري" : "Monthly Price"}:
    {" "}
    <b>{car.price_per_month} {car.currency_code}</b>
    {language === "ar" ? " / شهر" : " / month"}
  </p>

  <p className="text-gray-200">
    {language === "ar" ? "السعر السنوي" : "Yearly Price"}:
    {" "}
    <b>{car.price_per_year} {car.currency_code}</b>
    {language === "ar" ? " / سنة" : " / year"}
  </p>
</div>

                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Form */}
        {selectedBranch && (
          <div className="mt-8 max-w-3xl mx-auto p-6 rounded-2xl shadow-lg bg-gradient-to-r from-amber-400 to-amber-600 text-black">
            <h3 className="text-2xl font-bold mb-4 text-center">Booking Summary</h3>

         {/* Dates (Hourly Booking) */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
  <div className="flex flex-col">
    <label className="mb-1 font-semibold">Pickup Date & Time</label>
    <input
      type="datetime-local"
      value={pickupDate}
      onChange={(e) => setPickupDate(e.target.value)}
      className="border rounded px-3 py-2 bg-gray-700 text-white"
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-semibold">Dropoff Date & Time</label>
    <input
      type="datetime-local"
      value={dropoffDate}
      onChange={(e) => setDropoffDate(e.target.value)}
      className="border rounded px-3 py-2 bg-gray-700 text-white"
    />
  </div>
</div>


            {/* Selected Cars */}
            {selectedCars.length > 0 ? (
              <div className="mb-4">
              {selectedCars.map(car => (
  <p key={car.id} className="text-white font-semibold">
    {car.make} {car.model} - {calculateCarPrice(car)} {car.currency_code}
  </p>
))}


              </div>
            ) : (
              <p className="text-gray-200 mb-4">No cars selected</p>
            )}

         

            <button onClick={handleBooking} className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold rounded-xl py-3 hover:scale-105 transition-transform">
              Confirm Booking
            </button>

            {/* Booking Message */}
            {bookingMessage && (
              <p className={`mt-4 font-bold text-center text-lg ${bookingMessage.type === "success" ? "text-green-500" : "text-red-500"}`}>
                {bookingMessage.text}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerDashboardPage;
