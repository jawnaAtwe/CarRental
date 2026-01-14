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
  branch_name: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
}

const API_BASE_URL = "/api/v1/admin";

export default function CustomerBookingsPage() {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = session?.user as SessionUser | undefined;

  const fetchBookings = async (customerId?: number) => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings?customer_id=${customerId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to fetch bookings");
        setBookings([]);
      } else {
        // ترتيب حسب start_date تصاعدي
        const sorted = (data.data || []).sort(
          (a: Booking, b: Booking) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
        setBookings(sorted);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.type === "customer" && user.id) fetchBookings(user.id);
    else setLoading(false);
  }, [user]);

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من إلغاء هذا الحجز؟" : "Are you sure you want to cancel this booking?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({
          title: language === "ar" ? "فشل الإلغاء" : "Cancel Failed",
          description: data.error || "Failed to cancel booking",
          color: "danger",
        });
      } else {
        addToast({
          title: language === "ar" ? "تم الإلغاء" : "Cancelled",
          description: data.message || (language === "ar" ? "تم إلغاء الحجز بنجاح" : "Booking cancelled successfully"),
          color: "success",
        });
        fetchBookings(user?.id);
      }
    } catch (err) {
      console.error(err);
      addToast({
        title: language === "ar" ? "فشل الإلغاء" : "Cancel Failed",
        description: language === "ar" ? "حدث خطأ، حاول مرة أخرى" : "Unexpected error, try again",
        color: "danger",
      });
    }
  };

  if (status === "loading" || loading)
    return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (!session)
    return <p className="text-center mt-10 text-red-500">Please log in first.</p>;
  if (user?.type !== "customer")
    return <p className="text-center mt-10 text-red-500">Access denied.</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* زر الرجوع */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          {language === "ar" ? "رجوع" : "Back"}
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mt-4">{language === "ar" ? "حجوزاتي" : "My Bookings"}</h1>

        {error && (
          <Alert
            title={language === "ar" ? "فشل التحميل" : "Load Failed"}
            description={error}
            variant="flat"
            color="danger"
          />
        )}

        {bookings.length === 0 && !loading && !error && (
          <p className="text-gray-500">{language === "ar" ? "لا توجد حجوزات." : "No bookings found."}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const startDate = new Date(booking.start_date).toLocaleDateString();
            const endDate = new Date(booking.end_date).toLocaleDateString();
            return (
              <div
                key={booking.id}
                className="bg-white shadow-lg rounded-2xl p-4 border-l-4 border-cyan-500 hover:shadow-xl transition relative"
              >
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-bold">
                    {booking.vehicle_make} {booking.vehicle_model}
                  </h2>

                  {/* زر الإلغاء */}
                  {booking.status !== "cancelled" && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="ml-auto text-red-600 hover:text-red-800 transition"
                      title={language === "ar" ? "إلغاء الحجز" : "Cancel Booking"}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <span>{booking.branch_name}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <span>{startDate} → {endDate}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <StarIcon className="h-5 w-5 text-amber-400" />
                  <span>{language === "ar" ? "الإجمالي" : "Total"}: ${booking.total_amount}</span>
                </div>
                <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold
                  ${booking.status === "pending" ? "bg-yellow-200 text-yellow-800"
                    : booking.status === "confirmed" ? "bg-green-200 text-green-800"
                    : booking.status === "cancelled" ? "bg-red-200 text-red-800"
                    : "bg-gray-200 text-gray-800"}`}>
                  {booking.status.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
