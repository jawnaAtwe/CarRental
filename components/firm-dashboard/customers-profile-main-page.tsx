"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { addToast, Alert, Select, SelectItem } from "@heroui/react";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  CalendarIcon,
  StarIcon,
  LockClosedIcon,
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

const API_BASE_URL = "/api/v1/admin";

const readonlyFields = [
  "id", "email", "customer_type", "status", "hashed_password",
  "loyalty_points", "loyalty_level",
  "total_bookings", "active_bookings", "completed_bookings", "cancelled_bookings",
  "risk_score", "late_returns_count", "damage_incidents_count", "fraud_flag",
  "created_at", "updated_at"
];

export default function CustomerProfilePage() {
  const { data: session, status } = useSession();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string[] | string>([]);

  const user = session?.user as SessionUser | undefined;

  // --- Fetch Profile ---
  const fetchProfile = async (id?: number) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${id}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.type === "customer" && user.id) fetchProfile(user.id);
    else setLoading(false);
  }, [user]);

  if (status === "loading" || loading)
    return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (!session)
    return <p className="text-center mt-10 text-red-500">Please log in first.</p>;
  if (user?.type !== "customer")
    return <p className="text-center mt-10 text-red-500">Access denied.</p>;

  // --- Sections & Stats ---
  const sections: Record<string, { field: string; icon?: any }[]> = {
    "Personal Info": [
      { field: "first_name" },
      { field: "last_name" },
      { field: "full_name" },
      { field: "date_of_birth", icon: CalendarIcon },
      { field: "gender" },
    ],
    "Contact": [
      { field: "email", icon: EnvelopeIcon },
      { field: "phone", icon: PhoneIcon },
      { field: "whatsapp", icon: PhoneIcon },
      { field: "nationality" },
    ],
    "Identity": [
      { field: "id_type", icon: IdentificationIcon },
      { field: "id_number" },
      { field: "driving_license_number" },
      { field: "license_country" },
      { field: "license_expiry_date", icon: CalendarIcon },
    ],
    "Address": [
      { field: "address", icon: MapPinIcon },
      { field: "city" },
      { field: "country" },
      { field: "preferred_language" },
      { field: "notes" },
    ],
  };

  const statsFields = [
    { field: "loyalty_points", label: "Loyalty Points", icon: StarIcon, color: "from-yellow-300 to-yellow-400" },
    { field: "total_bookings", label: "Total Bookings", icon: StarIcon, color: "from-cyan-300 to-blue-400" },
    { field: "active_bookings", label: "Active Bookings", icon: StarIcon, color: "from-green-300 to-green-400" },
    { field: "completed_bookings", label: "Completed Bookings", icon: StarIcon, color: "from-blue-300 to-indigo-400" },
    { field: "cancelled_bookings", label: "Cancelled Bookings", icon: StarIcon, color: "from-red-300 to-red-400" },
    { field: "risk_score", label: "Risk Score", icon: StarIcon, color: "from-pink-300 to-pink-400" },
    { field: "late_returns_count", label: "Late Returns", icon: StarIcon, color: "from-orange-300 to-orange-400" },
    { field: "damage_incidents_count", label: "Damage Incidents", icon: StarIcon, color: "from-gray-300 to-gray-400" },
    { field: "fraud_flag", label: "Fraud Flag", icon: StarIcon, color: "from-red-500 to-red-600" }
  ];

  const formatKey = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  const handleChange = (field: string, value: any) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // --- Save Handler ---
  const handleSave = async () => {
    if (!profile || !user?.id) return;

    const editableData: Record<string, any> = { ...profile };

    // Convert date strings to YYYY-MM-DD
    ["date_of_birth", "license_expiry_date", "last_booking_date"].forEach(field => {
      if (editableData[field]) editableData[field] = editableData[field].split("T")[0];
    });

    try {
      const res = await fetch(`${API_BASE_URL}/customers/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editableData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(data?.error || (language === "ar" ? "فشل حفظ البيانات" : "Save failed"));
        return;
      }

      addToast({
        title: language === "ar" ? "تم الحفظ" : "Saved",
        description: data?.message || (language === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully"),
        color: "success",
      });

      await fetchProfile(user.id);
    } catch (err) {
      console.error(err);
      setSubmitError(language === "ar" ? "حدث خطأ غير متوقع، حاول مرة أخرى" : "Unexpected error, please try again");
    }
  };

  return (
   <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 transition-colors">
  <div className="
    max-w-6xl mx-auto
    bg-white dark:bg-gray-800
    shadow-lg dark:shadow-black/40
    rounded-2xl
    p-8
    space-y-6
    transition-colors
  ">
        {/* Header */}
        <div className="flex items-center gap-6">
 <div className="relative w-36 h-36 rounded-full overflow-hidden shadow-lg group">
  {/* input مخفي للتعديل */}
  <input
    id="profileImageInput"
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => handleChange("profile_image", reader.result);
        reader.readAsDataURL(file);
      }
    }}
  />

  {/* الصورة أو الأيقونة */}
  {profile?.profile_image ? (
    <img
      src={profile.profile_image}
      alt="Profile"
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full bg-cyan-400 flex items-center justify-center">
      <UserIcon className="h-20 w-20 text-white" />
    </div>
  )}

  {/* Overlay عند hover */}
  <div className="
    absolute inset-0 bg-black/50
    flex items-center justify-center gap-4
    opacity-0 group-hover:opacity-100
    transition-opacity
  ">
    {/* تعديل */}
    <button
      type="button"
      onClick={() => document.getElementById("profileImageInput")?.click()}
      className="bg-white text-gray-800 px-4 py-1.5 rounded-xl text-sm font-semibold shadow hover:bg-gray-100 transition"
    >
      {language === "ar" ? "تعديل" : "Edit"}
    </button>

    {/* حذف */}
    {profile?.profile_image && (
      <button
        type="button"
        onClick={() => handleChange("profile_image", null)}
        className="
    bg-white dark:bg-gray-700
    text-gray-800 dark:text-gray-100
    px-4 py-1.5 rounded-xl
    text-sm font-semibold
    shadow
    hover:bg-gray-100 dark:hover:bg-gray-600
    transition
  " >
        {language === "ar" ? "حذف" : "Delete"}
      </button>
    )}
  </div>
</div>




          <div>
            <h1 className="text-3xl font-bold text-gray-800">{profile?.full_name ?? "—"}</h1>
            <div className="mt-2">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white bg-indigo-500 animate-pulse">
                Customer ID: {profile?.id ?? "—"}
              </span>
            </div>
            {profile?.status && (
              <span className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-semibold
                ${profile.status === "active" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"} transition-all duration-300`}>
                {profile.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Customer Type */}
        <div className="mb-6">
          <Select
            label={language === "ar" ? "نوع العميل" : "Customer Type"}
            selectedKeys={profile?.customer_type ? [profile.customer_type] : []}
            isDisabled
          >
            <SelectItem key="individual">{language === "ar" ? "فرد" : "Individual"}</SelectItem>
            <SelectItem key="corporate">{language === "ar" ? "شركة" : "Corporate"}</SelectItem>
          </Select>
        </div>

        {/* Sections */}
        {Object.entries(sections).map(([sectionName, fields]) => (
          <section key={sectionName}>
            <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-1">{sectionName}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(({ field, icon: Icon }) => {
                // --- Input Element Logic ---
                let inputElement: JSX.Element;

                if (["date_of_birth", "license_expiry_date", "last_booking_date"].includes(field)) {
                  inputElement = (
                    <input
                      type="date"
                      className={`border p-2 rounded-lg shadow-sm ${readonlyFields.includes(field)
                        ? "bg-gray-50 cursor-not-allowed opacity-70"
                        : "focus:outline-none focus:ring-2 focus:ring-blue-200"
                      }`}
                      value={profile?.[field] ? profile[field].split("T")[0] : ""}
                      disabled={readonlyFields.includes(field)}
                      onChange={e => handleChange(field, e.target.value)}
                    />
                  );
                } else if (field === "gender") {
                  inputElement = (
                    <select
                      className="border p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={profile?.gender ?? ""}
                      onChange={(e) => handleChange("gender", e.target.value)}
                    >
                      <option value="male">{language === "ar" ? "ذكر" : "Male"}</option>
                      <option value="female">{language === "ar" ? "أنثى" : "Female"}</option>
                    </select>
                  );
                } else {
                  inputElement = (
                    <input
  type="text"
  value={profile?.[field] ?? ""}
  disabled={readonlyFields.includes(field)}
  onChange={e => handleChange(field, e.target.value)}
  className={`
    border p-2 rounded-lg shadow-sm
    text-gray-800 dark:text-gray-100
    border-gray-300 dark:border-gray-600

    ${readonlyFields.includes(field)
      ? `
        bg-gray-100 dark:bg-gray-700
        cursor-not-allowed opacity-80
      `
      : `
        bg-white dark:bg-gray-800
        focus:outline-none
        focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600
      `
    }
  `}
/>

                  );
                }

                return (
                  <div key={field} className="flex flex-col">
                    <label className="font-medium text-gray-600 mb-1 flex items-center gap-1">
                      {Icon && <Icon className="h-5 w-5 text-gray-400" />}
                      {formatKey(field)}
                      {readonlyFields.includes(field) && <LockClosedIcon className="h-4 w-4 text-gray-400 ml-1" />}
                    </label>
                    {inputElement}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Stats Fields */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-1">Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {statsFields.map(({ field, label, icon: Icon, color }) => (
              <div key={field} className={`bg-gradient-to-r ${color} text-white rounded-xl p-4 shadow-md transition transform`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold">{label}</span>
                </div>
                <p className="text-xl font-bold">{profile?.[field] ?? "—"}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleSave}
            disabled={!profile || !user?.id || loading}
            className={`bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition transform hover:scale-105 hover:shadow-lg
              ${(!profile || !user?.id || loading) ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Save Changes
          </button>
        </div>

        {/* Submit Errors */}
        {submitError &&
          ((Array.isArray(submitError) && submitError.length > 0) ||
            (typeof submitError === "string" && submitError.trim() !== "")) && (
            <Alert
              title={language === "ar" ? "فشل التحديث" : "Update Failed"}
              description={
                <ul className="list-disc list-inside">
                  {Array.isArray(submitError)
                    ? submitError.map((err, idx) => <li key={idx}>{err}</li>)
                    : <li>{submitError}</li>}
                </ul>
              }
              variant="flat"
              color="danger"
              className="mt-4"
            />
          )}
      </div>
    </div>
  );
}
