"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { addToast, Alert } from "@heroui/react";
import {
  CalendarIcon,
  MapPinIcon,
  StarIcon,
  ArrowLeftIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useLanguage } from "../context/LanguageContext";

// ---- Types ----
interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: "user" | "customer";
  roles: string[];
  permissions: string[];
}

interface Booking {
  id: number;
  vehicle_make: string;
  vehicle_model: string;
  tenant_id: number;
  customer_id: number;
  branch_id: number;
  branch_name: string;
  branch_name_ar: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  tenant_name: string;
}

// ---- Constants ----
const API_BASE_URL = "/api/v1/admin";

// ---- Component ----
export default function CustomerBookingsPage() {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const user = session?.user as SessionUser | undefined;

  // ---- State ----
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer" | "online">("cash");

  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<number>(0);
  const [paying, setPaying] = useState(false);

  // ---- Effects ----
  useEffect(() => {
    if (user?.type === "customer" && user.id) {
      fetchBookings(user.id);
    } else {
      setLoading(false);
    }
  }, [user]);

  // ---- Handlers ----

  // Fetch Bookings
  const fetchBookings = async (customerId: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/bookings?customer_id=${customerId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch bookings");
        setBookings([]);
        return;
      }

      const sortedBookings = (data.data || []).sort(
        (a: Booking, b: Booking) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
      setBookings(sortedBookings);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  // Create Payment
  const createPayment = async () => {
    if (!selectedBooking) return;
    setPaying(true);

    try {
      const partialAmountValue = isPartialPayment ? partialPaymentAmount : 0;
      const mysqlDate = new Date().toISOString().slice(0, 19).replace("T", " ");
      const isDeposit = isPartialPayment || paymentAmount < selectedBooking.total_amount;

      const payload = {
        tenant_id: selectedBooking.tenant_id,
        customer_id: selectedBooking.customer_id,
        booking_id: selectedBooking.id,
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        status: "pending",
        payment_date: mysqlDate,
        is_deposit: isDeposit,
        partial_amount: partialAmountValue,
        split_details: null,
        late_fee: 0,
      };

      const res = await fetch(`${API_BASE_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": language,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : Object.values(data.error || {}).join("\n")
        );
      }

      addToast({
        title: language === "ar" ? "تم الدفع" : "Payment Added",
        description: language === "ar" ? "تمت إضافة الدفعة بنجاح" : "Payment created successfully",
        color: "success",
      });

      // Reset payment modal
      setShowPaymentForm(false);
      setPartialPaymentAmount(0);
      setIsPartialPayment(false);
    } catch (err: any) {
      addToast({
        title: language === "ar" ? "فشل الدفع" : "Payment Failed",
        description: err.message,
        color: "danger",
      });
    } finally {
      setPaying(false);
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId: number) => {
    const confirmMsg = language === "ar" ? "هل أنت متأكد من إلغاء هذا الحجز؟" : "Are you sure you want to cancel this booking?";
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        addToast({
          title: language === "ar" ? "فشل الإلغاء" : "Cancel Failed",
          description: data.error || "Failed to cancel booking",
          color: "danger",
        });
        return;
      }

      addToast({
        title: language === "ar" ? "تم الإلغاء" : "Cancelled",
        description: data.message || (language === "ar" ? "تم إلغاء الحجز بنجاح" : "Booking cancelled successfully"),
        color: "success",
      });

      fetchBookings(user!.id);
    } catch (err) {
      console.error(err);
      addToast({
        title: language === "ar" ? "فشل الإلغاء" : "Cancel Failed",
        description: language === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Unexpected error, try again",
        color: "danger",
      });
    }
  };

  // ---- Render ----
  if (status === "loading" || loading)
    return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  if (!session)
    return <p className="text-center mt-10 text-red-500">Please log in first.</p>;

  if (user?.type !== "customer")
    return <p className="text-center mt-10 text-red-500">Access denied.</p>;

  return (
 <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          {language === "ar" ? "رجوع" : "Back"}
        </button>

        {/* Page Title */}
       <h1 className="text-3xl font-bold mt-4 text-gray-800 dark:text-white">
          {language === "ar" ? "حجوزاتي" : "My Bookings"}
        </h1>

        {/* Error */}
        {error && <Alert title={language === "ar" ? "فشل التحميل" : "Load Failed"} description={error} variant="flat" color="danger" />}

        {/* No Bookings */}
        {bookings.length === 0 && !loading && !error && (
          <p className="text-gray-500">{language === "ar" ? "لا توجد حجوزات." : "No bookings found."}</p>
        )}

        {/* Booking Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const startDate = new Date(booking.start_date).toLocaleDateString();
            const endDate = new Date(booking.end_date).toLocaleDateString();
            return (
               <div key={booking.id} 
              className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl rounded-2xl p-4 border-l-4 border-cyan-500 hover:shadow-xl transition relative">
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
{booking.vehicle_make} {booking.vehicle_model}</h2>
                  {booking.status !== "cancelled" && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                       className="ml-auto text-red-600 hover:text-red-800 dark:hover:text-red-400 transition"
                       title={language === "ar" ? "إلغاء الحجز" : "Cancel Booking"}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                  {booking.status === "confirmed" && (
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setPaymentAmount(booking.total_amount);
                        setPaymentMethod("cash");
                        setShowPaymentForm(true);
                      }}
                      className="mt-3 w-full bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-600 font-semibold py-2 px-4 rounded-lg transition"
                >
                      {language === "ar" ? "إتمام الدفع" : "Pay Now"}
                    </button>
                  )}
                </div>

                {/* Details */}
             <div className="flex items-center gap-2 mb-1 text-gray-700 dark:text-gray-300">
                   <MapPinIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <span>{language === "ar" ? booking.branch_name_ar : booking.branch_name}</span>
                </div>
                <div className="flex items-center gap-2 mb-1 text-gray-700 dark:text-gray-300">
                  <MapPinIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <span>{booking.tenant_name}</span>
                </div>
             <div className="flex items-center gap-2 mb-1 text-gray-700 dark:text-gray-300">
              <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span>{startDate} → {endDate}</span>
            </div>
                <div className="flex items-center gap-2 mb-1 text-gray-700 dark:text-gray-300">
              <StarIcon className="h-5 w-5 text-amber-400" />
              <span className="text-gray-800 dark:text-gray-200">
                {language === "ar" ? "الإجمالي" : "Total"}: ${booking.total_amount}
              </span>
            </div>
              <div
              className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                booking.status === "pending"
                  ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100"
                  : booking.status === "confirmed"
                  ? "bg-green-200 text-green-800 dark:bg-green-600 dark:text-green-100"
                  : booking.status === "cancelled"
                  ? "bg-red-200 text-red-800 dark:bg-red-600 dark:text-red-100"
                  : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              }`}
            >
                  {booking.status.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentForm && selectedBooking && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md relative text-gray-800 dark:text-gray-200">
<h2 className="text-xl font-bold mb-4">{language === "ar" ? "إتمام الدفع" : "Complete Payment"}</h2>

            {/* Amount */}
 <div className="flex flex-col mb-4">
          <label className="text-sm font-medium">{language === 'ar' ? 'المبلغ' : 'Amount'}</label>
          <span className="mt-1">{paymentAmount}</span>
        </div>
             {/* Partial Payment */}
        <label className="flex items-center mb-4 gap-2">
          <input type="checkbox" checked={isPartialPayment} onChange={(e) => setIsPartialPayment(e.target.checked)} />
          {language === "ar" ? "دفع جزئي" : "Partial Payment"}
        </label>


            {isPartialPayment && (
          <label className="block mb-4">
            {language === "ar" ? "المبلغ الجزئي" : "Partial Amount"}
            <input type="number" value={partialPaymentAmount} onChange={(e) => setPartialPaymentAmount(Number(e.target.value))} max={paymentAmount} className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
          </label>
        )}

     {/* Payment Method */}
        <label className="block mb-4">
          {language === "ar" ? "طريقة الدفع" : "Payment Method"}
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "cash" | "card" | "bank_transfer" | "online")} className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
            <option value="cash">{language === "ar" ? "كاش" : "Cash"}</option>
            <option value="card">{language === "ar" ? "بطاقة" : "Card"}</option>
            <option value="bank_transfer">{language === "ar" ? "تحويل بنكي" : "Bank Transfer"}</option>
            <option value="online">{language === "ar" ? "أونلاين" : "Online"}</option>
          </select>
        </label>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-2">
          <button onClick={() => { setShowPaymentForm(false); setIsPartialPayment(false); setPartialPaymentAmount(0); }} className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600">{language === "ar" ? "إلغاء" : "Cancel"}</button>
          <button onClick={createPayment} disabled={paying} className="px-4 py-2 bg-cyan-600 dark:bg-cyan-500 text-white rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-600 disabled:opacity-50">
            {paying ? (language === "ar" ? "جارٍ الدفع..." : "Paying...") : (language === "ar" ? "دفع" : "Pay")}
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  );
}
