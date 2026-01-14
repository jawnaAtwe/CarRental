"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price_per_day: number;
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
      .then(data => setAllCars(data.data || []))
      .catch(err => console.error(err));
  }, [selectedTenantId, selectedBranchId]);

  const filteredCars = selectedCompany && selectedBranch ? allCars : [];

  // حساب عدد الأيام بين تاريخ البداية والنهاية
  const getNumberOfDays = () => {
    if (!pickupDate || !dropoffDate) return 0;
    const start = new Date(pickupDate);
    const end = new Date(dropoffDate);
    const diffTime = end.getTime() - start.getTime();
    return diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
  };

  // السعر الكلي لكل السيارات المختارة
  const totalPrice = selectedCars.reduce((sum, car) => sum + car.price_per_day * getNumberOfDays(), 0);

  const handleCarSelect = (car: Car) => {
    if (selectedCars.find(c => c.id === car.id)) {
      setSelectedCars(prev => prev.filter(c => c.id !== car.id));
    } else {
      setSelectedCars(prev => [...prev, car]);
    }
    setBookingMessage(null); // مسح الرسالة عند تغيير الاختيار
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
      for (const car of selectedCars) {
        const payload = {
          tenant_id: selectedTenantId,
          branch_id: selectedBranchId,
          vehicle_id: car.id,
          customer_id: user?.id,
          start_date: pickupDate,
          end_date: dropoffDate,
          status: "pending",
          total_amount: car.price_per_day * getNumberOfDays(),
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
    } catch (err) {
      console.error(err);
      setBookingMessage({ text: "Booking failed! Check console for details.", type: "error" });
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row items-center justify-center gap-10 px-6 py-16 bg-gradient-to-b from-slate-900/90 via-slate-800/70 to-slate-900/90 overflow-hidden text-white">
      <div className="w-full max-w-7xl space-y-10">

        {/* Customer Info */}
        <div className="bg-gray-800/80 rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">{user?.name}</h2>
            <p className="font-semibold">{user?.email}</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="bg-amber-400/30 text-white px-4 py-2 rounded font-bold">Points: 1200</div>
            <div className="bg-amber-400/30 text-white px-4 py-2 rounded font-bold">Active Bookings: 2</div>
          </div>
        </div>

        {/* Company Selection */}
        <div className="rounded-2xl shadow-lg p-6 text-center bg-gradient-to-r from-amber-400 to-amber-600 text-black">
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
          <div className="rounded-2xl shadow-lg p-6 text-center bg-gray-800/70 text-white">
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
                    <p className="mt-2 font-bold text-amber-400">${car.price_per_day}/day</p>
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

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Pickup Date</label>
                <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="border rounded px-3 py-2 bg-gray-700 text-white"/>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 font-semibold">Dropoff Date</label>
                <input type="date" value={dropoffDate} onChange={e => setDropoffDate(e.target.value)} className="border rounded px-3 py-2 bg-gray-700 text-white"/>
              </div>
            </div>

            {/* Selected Cars */}
            {selectedCars.length > 0 ? (
              <div className="mb-4">
                {selectedCars.map(car => (
                  <p key={car.id} className="text-white font-semibold">
                    {car.make} {car.model} - ${car.price_per_day}/day × {getNumberOfDays()} days = ${car.price_per_day * getNumberOfDays()}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-gray-200 mb-4">No cars selected</p>
            )}

            {/* Total Price */}
            <p className="mb-4 font-bold text-center text-amber-400 text-lg">
              Total Price: ${totalPrice}
            </p>

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
