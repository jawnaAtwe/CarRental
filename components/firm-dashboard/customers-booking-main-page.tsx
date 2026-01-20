"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { addToast, Alert,Input } from "@heroui/react";
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
  late_fee_day: number;
  status: string;
  tenant_name: string;
   currency_code: string;
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
  const [paying, setPaying] = useState(false);

  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [payment, setPayment] = useState({
    amount: 0,
    method: "cash" as "cash" | "card" | "bank_transfer" | "online",
    isPartial: false,
    partialAmount: 0,
  });

  // ---- Effects ----
  useEffect(() => {
    if (user?.type === "customer" && user.id) {
      fetchBookings(user.id);
    } else {
      setLoading(false);
    }
  }, [user]);

  /* ================= HELPERS ================= */
  const calculateLateFee = (booking: Booking | null) => {
  if (!booking) return 0;

  const lateFeePerDay = booking.late_fee_day ?? 0;

  const endDate = new Date(booking.end_date);
  const today = new Date();

  const diffDays = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

  const daysLate = Math.max(0, diffDays ); 

  return lateFeePerDay * daysLate;
};


  const lateFee = calculateLateFee(selectedBooking);

  const paidAmount =
  Number(lateFee || 0) +
  (payment.isPartial && Number(payment.partialAmount) > 0
    ? Number(payment.partialAmount)
    : Number(payment.amount || 0));

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
      const mysqlDate = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

    const payload = {
  tenant_id: selectedBooking.tenant_id,
  customer_id: selectedBooking.customer_id,
  booking_id: selectedBooking.id,
  amount: paidAmount,
  payment_method: payment.method,
  is_partial: payment.isPartial,
  partial_amount: payment.isPartial
    ? Number(payment.partialAmount)
    : 0,
  status: "pending",
  payment_date: mysqlDate,
  is_deposit:
    payment.isPartial ||
    paidAmount < selectedBooking.total_amount,
  paid_amount: paidAmount,
  late_fee: lateFee,
  split_details: null,
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
      if (!res.ok) throw new Error(data.error || "Payment failed");

      addToast({
        title: language === "ar" ? "تم الدفع" : "Payment Added",
        description:
          language === "ar"
            ? "تمت إضافة الدفعة بنجاح"
            : "Payment created successfully",
        color: "success",
      });

      setShowPaymentForm(false);
      setPayment({
        amount: 0,
        method: "cash",
        isPartial: false,
        partialAmount: 0,
      });
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

const fetchPaymentDetails = async (
  customerId: number,
  tenantId: number,
  bookingId: number
) => {
  setLoadingPayments(true);
  try {
    const res = await fetch(
      `${API_BASE_URL}/payments?customer_id=${customerId}&tenant_id=${tenantId}&booking_id=${bookingId}`
    );
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to fetch payment details");

    setPaymentDetails(data.data || []);
    setShowPaymentDetails(true);
  } catch (err: any) {
    addToast({
      title: language === "ar" ? "فشل التحميل" : "Load Failed",
      description: err.message,
      color: "danger",
    });
  } finally {
    setLoadingPayments(false);
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
                 {booking.status !== "cancelled" && (
  <div className="mt-4 flex gap-3">
    
    {/* Pay Icon */}
    {booking.status === "confirmed" && (
      <button
        onClick={() => {
          setSelectedBooking(booking);
          setPayment({
            amount: booking.total_amount,
            method: "cash",
            isPartial: false,
            partialAmount: 0,
          });
          setShowPaymentForm(true);
        }}
        title={language === "ar" ? "إتمام الدفع" : "Pay Now"}
        className="
          p-3 rounded-xl
          bg-cyan-600 hover:bg-cyan-700
          text-white
          shadow-md hover:shadow-lg
          transition
        "
      >
        💳
      </button>
    )}

    {/* Payment Details Icon */}
    <button
      onClick={() =>
        fetchPaymentDetails(
          booking.customer_id,
          booking.tenant_id,
          booking.id
        )
      }
      title={language === "ar" ? "تفاصيل الدفع" : "Payment Details"}
      className="
        p-3 rounded-xl
        bg-gray-100 hover:bg-gray-200
        dark:bg-gray-800 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-200
        shadow-sm hover:shadow-md
        transition
      "
    >
      📄
    </button>

  </div>
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
                {language === "ar" ? "الإجمالي" : "Total"}: {booking.total_amount} {booking.currency_code}
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

    {/* ================= PAYMENT MODAL ================= */}
      {showPaymentForm && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {language === "ar" ? "إتمام الدفع" : "Complete Payment"}
            </h2>

            <Input
              label={language === "ar" ? "المبلغ" : "Amount"}
              value={payment.amount.toString()}
              isReadOnly
            />

            <Input
              label={language === "ar" ? "غرامة التأخير" : "Late Fee"}
              value={lateFee.toString()}
              isReadOnly
            />
<label className="block mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
  {language === "ar" ? "طريقة الدفع" : "Payment Method"}
</label>

<select
  required
  value={payment.method}
  onChange={(e) =>
    setPayment((p) => ({
      ...p,
      method: e.target.value as any,
    }))
  }
  className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2"
>
  <option value="">{language === "ar" ? "اختر طريقة الدفع" : "Select Method"}</option>
  <option value="cash">{language === "ar" ? "كاش" : "Cash"}</option>
  <option value="card">{language === "ar" ? "بطاقة" : "Card"}</option>
  <option value="bank_transfer">
    {language === "ar" ? "تحويل بنكي" : "Bank Transfer"}
  </option>
  <option value="online">{language === "ar" ? "أونلاين" : "Online"}</option>
</select>

            <label className="flex items-center gap-2 my-3">
              <input
                type="checkbox"
                checked={payment.isPartial}
                onChange={(e) =>
                  setPayment((p) => ({
                    ...p,
                    isPartial: e.target.checked,
                  }))
                }
              />
              {language === "ar" ? "دفع جزئي" : "Partial Payment"}
            </label>

            {payment.isPartial && (
              <Input
                type="number"
                label={language === "ar" ? "المبلغ الجزئي" : "Partial Amount"}
                value={payment.partialAmount.toString()}
                onChange={(e) =>
                  setPayment((p) => ({
                    ...p,
                    partialAmount: Number(e.target.value),
                  }))
                }
              />
            )}

           <div className="text-lg font-bold mt-3">
  {language === "ar" ? "المبلغ المدفوع" : "Paid Amount"}:
  {" "}
  {paidAmount} {selectedBooking.currency_code}
</div>


            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={createPayment}
                disabled={paying}
                className="px-4 py-2 bg-cyan-600 text-white rounded"
              >
                {paying
                  ? language === "ar"
                    ? "جارٍ الدفع..."
                    : "Paying..."
                  : language === "ar"
                  ? "دفع"
                  : "Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
{showPaymentDetails && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
      <h2 className="text-xl font-bold mb-4">
        {language === "ar" ? "تفاصيل الدفع" : "Payment Details"}
      </h2>

      <div className="flex-1 overflow-y-auto pr-2">
        {loadingPayments ? (
          <p>{language === "ar" ? "جارٍ التحميل..." : "Loading..."}</p>
        ) : paymentDetails.length === 0 ? (
          <p>
            {language === "ar"
              ? "لا توجد دفعات لهذا الحجز."
              : "No payments found for this booking."}
          </p>
        ) : (
          <div className="space-y-2">
            {paymentDetails.map((p) => (
              <div
                key={p.id}
                className="border p-2 rounded bg-gray-50 dark:bg-gray-800"
              >
               <p>
  {language === "ar" ? "المبلغ المدفوع" : "Paid Amount"}:
  {" "}
  {p.paid_amount} {p.currency_code || selectedBooking?.currency_code}
</p>

                <p>
                  {language === "ar" ? "طريقة الدفع" : "Payment Method"}:{" "}
                  {p.payment_method}
                </p>
                <p>
                  {language === "ar" ? "حالة الدفع" : "Status"}: {p.status}
                </p>
                <p>
                  {language === "ar" ? "تاريخ الدفع" : "Payment Date"}:{" "}
                  {new Date(p.payment_date).toLocaleString()}
                </p>
                {p.late_fee > 0 && (
                  <p>
                    {language === "ar" ? "غرامة التأخير" : "Late Fee"}:
                    {p.late_fee} {p.currency_code || selectedBooking?.currency_code}
                  </p>
                )}
                {p.is_partial && (
                  <p>
                    {language === "ar" ? "دفع جزئي" : "Partial Payment"}: 
                    {p.partial_amount} {p.currency_code || selectedBooking?.currency_code}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => setShowPaymentDetails(false)}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          {language === "ar" ? "إغلاق" : "Close"}
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );

}
