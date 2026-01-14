"use client";
import { useEffect, useState } from 'react';
import { signIn } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Checkbox,
  Button,
  Alert,
  Divider,
  addToast,
   Select,
  SelectItem,
    Form,
} from "@heroui/react";
import {
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { 
  UserIcon, 
  GlobeAltIcon, 
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { lang } from "../Lang/lang";
import { motion } from "framer-motion";
import { Car } from "lucide-react";
type UserForm = {
  name: string;
  name_ar?: string | null;
  email?: string | null;
  phone?: string | null;
  role_id?: string | number | null;
  password?: string;
  tenant_id?: number;
};
type CustomerForm = {
  customer_type: "individual" | "corporate";
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  password: string;
  phone?: string;
  whatsapp?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  id_type?: "id_card" | "passport";
  id_number?: string;
  driving_license_number?: string;
  license_country?: string;
  license_expiry_date?: string;
  address?: string;
  city?: string;
  country?: string;
  preferred_language?: string;
  notes?: string;
  loyalty_points?: number;
  loyalty_level?: "bronze" | "silver" | "gold" | "vip";
  total_bookings?: number;
  active_bookings?: number;
  completed_bookings?: number;
  cancelled_bookings?: number;
  last_booking_date?: string;
  average_rental_days?: number;
  risk_score?: number;
  late_returns_count?: number;
  damage_incidents_count?: number;
  fraud_flag?: boolean;
  status?: string;
};

const pageSize = 6;
const API_BASE_URL = '/api/v1/admin';
const DEFAULT_TENANT_ID = 1;

export default function LoginPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [formData, setFormData] = useState<UserForm>({
  name: '',
  name_ar: '',
  email: '',
  phone: '',
  role_id: '',
  tenant_id: DEFAULT_TENANT_ID,
  });
  const [customerFormData, setCustomerFormData] = useState<CustomerForm>({
  customer_type: "individual",
  email: "",
  password: "",
  preferred_language: "en",
  loyalty_points: 0,
  loyalty_level: "bronze",
  total_bookings: 0,
  active_bookings: 0,
  completed_bookings: 0,
  cancelled_bookings: 0,
  risk_score: 0,
  late_returns_count: 0,
  damage_incidents_count: 0,
  fraud_flag: false,
  status: "active",
});

   const [submitError, setSubmitError] = useState<string[] | string>([]);

   const [showSignUpOptions, setShowSignUpOptions] =
    useState(false);
   const [signUpType, setSignUpType] =
    useState<"customer" | "company" | null>(null);

    const fetchRoles = async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const params = new URLSearchParams({
        tenant_id: DEFAULT_TENANT_ID.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/roles?${params}`, {
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data.data)) {
        setRoles(data.data);
        setRolesError(null);
      } else if (Array.isArray(data)) {
        setRoles(data);
        setRolesError(null);
      } else {
        throw new Error('Invalid roles data format');
      }
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      const errorMsg = language === 'ar' 
        ? `فشل تحميل الأدوار: ${error?.message || 'خطأ في الخادم'}` 
        : `Failed to load roles: ${error?.message || 'Server error'}`;
      setRolesError(errorMsg);
      setRoles([]);
      
      addToast({ 
        title: language === 'ar' ? 'تحذير' : 'Warning', 
        description: errorMsg, 
        color: 'warning' 
      });
    } finally {
      setRolesLoading(false);
    }
  };
   useEffect(() => {
      fetchRoles();
    }, [language]);
    const resetForm = () => {
  setFormData({
    name: '',
    name_ar: '',
    email: '',
    phone: '',
    role_id: '',
    password: '',
    tenant_id: DEFAULT_TENANT_ID,
  });

  setSubmitError([]);
  };
    const resetCustomerForm = () => {
  setCustomerFormData({
    customer_type: "individual",
    email: "",           // added
    password: "",        // added
    preferred_language: "en",
    loyalty_points: 0,
    loyalty_level: "bronze",
    total_bookings: 0,
    active_bookings: 0,
    completed_bookings: 0,
    cancelled_bookings: 0,
    risk_score: 0,
    late_returns_count: 0,
    damage_incidents_count: 0,
    fraud_flag: false,
    status: "active",
  });
  setSubmitError([]);
  };

  const saveUser = async () => {
  // --- Validation --- //
  if (!formData.role_id) {
    setSubmitError(language === 'ar' ? 'يجب اختيار الدور الوظيفي' : 'Role is required');
    return;
  }

  if (!formData.password) {
    setSubmitError(language === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required');
    return;
  }

  // --- Build Payload --- //
  const payload = {
    full_name: formData.name.trim(),
    full_name_ar: formData.name_ar?.trim() || null,
    email: formData.email?.trim() || null,
    phone: formData.phone?.trim() || null,
    role_id: Number(formData.role_id),
    tenant_id: DEFAULT_TENANT_ID,
    password: formData.password,
  };

  // --- Send Request --- //
  setLoadingForm(true);
  setSubmitError([]);

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'accept-language': language,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setSubmitError(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
      return;
    }

    // --- Success --- //
    addToast({
      title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      description: data?.message || (language === 'ar' ? 'تم حفظ المستخدم بنجاح' : 'User saved successfully'),
      color: 'success',
    });

    // Reset form & UI
    resetForm();
    setSignUpType(null);
    setShowSignUpOptions(false);
  } catch (err) {
    setSubmitError(language === 'ar' ? 'خطأ في الخادم' : 'Server error');
  } finally {
    setLoadingForm(false);
  }
};

  const saveCustomer = async () => {
  // --- Validation --- //
  if (!customerFormData.customer_type) {
    setSubmitError(language === 'ar' ? 'يجب اختيار نوع الكستمر' : 'Customer type is required');
    return;
  }

  if (!customerFormData.email) {
    setSubmitError(language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required');
    return;
  }

  if (!customerFormData.password) {
    setSubmitError(language === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required');
    return;
  }

  // --- Build Payload --- //
  const payload = {
    customer_type: customerFormData.customer_type,
    full_name: customerFormData.full_name?.trim() || null,
    first_name: customerFormData.first_name?.trim() || null,
    last_name: customerFormData.last_name?.trim() || null,
    email: customerFormData.email?.trim() || null,
    password: customerFormData.password,
    phone: customerFormData.phone?.trim() || null,
    whatsapp: customerFormData.whatsapp?.trim() || null,
    nationality: customerFormData.nationality?.trim() || null,
    date_of_birth: customerFormData.date_of_birth || null,
    gender: customerFormData.gender || null,
    id_type: customerFormData.id_type || null,
    id_number: customerFormData.id_number || null,
    driving_license_number: customerFormData.driving_license_number || null,
    license_country: customerFormData.license_country || null,
    license_expiry_date: customerFormData.license_expiry_date || null,
    address: customerFormData.address || null,
    city: customerFormData.city || null,
    country: customerFormData.country || null,
    preferred_language: customerFormData.preferred_language || 'en',
    notes: customerFormData.notes || null,
    loyalty_points: customerFormData.loyalty_points || 0,
    loyalty_level: customerFormData.loyalty_level || 'bronze',
    total_bookings: customerFormData.total_bookings || 0,
    active_bookings: customerFormData.active_bookings || 0,
    completed_bookings: customerFormData.completed_bookings || 0,
    cancelled_bookings: customerFormData.cancelled_bookings || 0,
    last_booking_date: customerFormData.last_booking_date || null,
    average_rental_days: customerFormData.average_rental_days || 0,
    risk_score: customerFormData.risk_score || 0,
    late_returns_count: customerFormData.late_returns_count || 0,
    damage_incidents_count: customerFormData.damage_incidents_count || 0,
    fraud_flag: customerFormData.fraud_flag || false,
    status: customerFormData.status || 'active',
  };

  // --- Send Request --- //
  setLoadingForm(true);
  setSubmitError([]);

  try {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'accept-language': language,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setSubmitError(data?.error || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
      return;
    }

    // --- Success --- //
    addToast({
      title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      description:
        data?.message || (language === 'ar' ? 'تم حفظ الكستمر بنجاح' : 'Customer saved successfully'),
      color: 'success',
    });

    // Reset form & UI
    resetCustomerForm();
    setSignUpType(null);
    setShowSignUpOptions(false);
  } catch (err) {
    setSubmitError(language === 'ar' ? 'خطأ في الخادم' : 'Server error');
  } finally {
    setLoadingForm(false);
  }
};


  // --- Handlers ---
 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email || !password) {
    setError(
      language === "ar"
        ? "يرجى إدخال البريد الإلكتروني وكلمة المرور"
        : "Please enter email and password"
    );
    return;
  }

  setIsLoading(true);
  setError("");

  try {
    const tryLogin = async (type: "user" | "admin") =>
      signIn("credentials", {
        redirect: false,
        email,
        password,
        lang: language,
        type,
      });
    let res = await tryLogin("user");
    if (res?.error) {
      res = await tryLogin("admin");
    }

    if (res?.error) {
      setError(res.error);
      return;
    }

    router.replace("/"); 
  } catch (err) {
    setError(
      language === "ar"
        ? "حدث خطأ غير متوقع، حاول مرة أخرى"
        : "Unexpected error, please try again"
    );
  } finally {
    setIsLoading(false);
  }
};


  // --- UI Helpers ---
 const renderLoginForm = () => {
  return (
    <form onSubmit={handleLogin} className="w-full">
      <CardBody className="space-y-6 pt-6">
        {/* --- Email Field --- */}
        <Input
          type="email"
          label={lang(language, "email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@legal.com"
          startContent={<EnvelopeIcon className="w-6 h-6 text-purple-500" />}
          required
          variant="flat"
        />

        <Divider className="border-white/10" />

        {/* --- Password Field --- */}
        <Input
          type="password"
          label={lang(language, "password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          startContent={<LockClosedIcon className="w-5 h-5 text-amber-400" />}
          required
          variant="flat"
        />

        {/* --- Remember Me / Forgot Password --- */}
        <div className="flex items-center justify-between text-sm text-white/60">
          <Checkbox color="primary">
            {language === "ar" ? "تذكرني" : "Remember me"}
          </Checkbox>
          <a
            href="#"
            className="text-purple-500 hover:text-indigo-500 font-medium"
          >
            {lang(language, "forgot_password")}
          </a>
        </div>

        {/* --- Error Alert --- */}
        {error && (
          <Alert
            color="danger"
            variant="flat"
            icon={<ShieldCheckIcon className="w-5 h-5" />}
          >
            <span className="text-xs">{error}</span>
          </Alert>
        )}
      </CardBody>

      {/* --- Footer Buttons --- */}
      <CardFooter className="pt-0 flex flex-col gap-3">
        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading}
          className="bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold rounded-xl py-3 hover:scale-105 transition-transform"
        >
          {isLoading
            ? language === "ar"
              ? "جاري تسجيل الدخول..."
              : "Logging in..."
            : lang(language, "login")}
        </Button>

        <Button
          type="button"
          fullWidth
          onClick={() => setShowSignUpOptions(true)}
          className="bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold rounded-xl py-3 hover:scale-105 transition-transform"
        >
          {language === "ar" ? "تسجيل جديد" : "Sign Up"}
        </Button>
      </CardFooter>
    </form>
  );
};


 const renderSignUpOptions = () => {
  return (
    <CardBody className="space-y-6 pt-6 flex flex-col items-center">
      {/* --- Title --- */}
      <h2 className="text-white font-bold text-xl text-center">
        {language === "ar" ? "اختر نوع التسجيل" : "Choose Sign Up Type"}
      </h2>

      {/* --- Sign Up Buttons --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Customer Button */}
        <Button
          type="button"
          fullWidth
          onClick={() => setSignUpType("customer")}
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 shadow-lg text-white font-semibold rounded-2xl py-3 transition-transform duration-200 hover:scale-105"
        >
          <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-green-600 font-bold">
            C
          </span>
          {language === "ar" ? "كستمر" : "Customer"}
        </Button>

        {/* Company Button */}
        <Button
          type="button"
          fullWidth
          onClick={() => setSignUpType("company")}
          className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 shadow-lg text-white font-semibold rounded-2xl py-3 transition-transform duration-200 hover:scale-105"
        >
          <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold">
            B
          </span>
          {language === "ar" ? "شركة" : "Company"}
        </Button>
      </div>

      {/* --- Back Button --- */}
      <Button
        type="button"
        fullWidth
        onClick={() => setShowSignUpOptions(false)}
        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl py-2 mt-3 transition-transform duration-200 hover:scale-105"
      >
        {language === "ar" ? "رجوع" : "Back"}
      </Button>
    </CardBody>
  );
};


const renderCustomerForm = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomer();
  };

  const renderSubmitError = () => {
    if (!submitError) return null;

    const isArrayError = Array.isArray(submitError) && submitError.length > 0;
    const isStringError = typeof submitError === "string" && submitError.trim() !== "";

    if (!isArrayError && !isStringError) return null;

    return (
      <div className="w-full mb-4">
        <Alert
          color="danger"
          variant="flat"
          className="text-sm"
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
        >
          {isArrayError ? (
            <ul className="list-disc list-inside space-y-1">
              {submitError.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          ) : (
            submitError
          )}
        </Alert>
      </div>
    );
  };

  return (
    <CardBody className="space-y-6 pt-6">
      {/* --- Title --- */}
      <h2 className="text-white font-bold text-2xl text-center drop-shadow-md">
        {language === "ar" ? "تسجيل ككستمر" : "Sign Up as Customer"}
      </h2>

      {/* --- Form --- */}
      <Form onSubmit={handleSubmit} className="w-full space-y-4">
        {/* --- Submit Error --- */}
        {renderSubmitError()}

        {/* --- Name Fields --- */}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={language === "ar" ? "الاسم الكامل" : "Full Name"}
            variant="faded"
            startContent={<UserIcon className="h-5 w-5 text-foreground/50" />}
            value={customerFormData.full_name || ""}
            onChange={(e) =>
              setCustomerFormData((prev) => ({ ...prev, full_name: e.target.value }))
            }
          />
          <Input
            label={language === "ar" ? "الاسم الأول" : "First Name"}
            variant="faded"
            value={customerFormData.first_name || ""}
            onChange={(e) =>
              setCustomerFormData((prev) => ({ ...prev, first_name: e.target.value }))
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={language === "ar" ? "الاسم الأخير" : "Last Name"}
            variant="faded"
            value={customerFormData.last_name || ""}
            onChange={(e) =>
              setCustomerFormData((prev) => ({ ...prev, last_name: e.target.value }))
            }
          />
          <Input
            label={language === "ar" ? "البريد الإلكتروني" : "Email"}
            type="email"
            variant="faded"
            value={customerFormData.email || ""}
            onChange={(e) =>
              setCustomerFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            isRequired
          />
        </div>

        {/* --- Password / Phone --- */}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={language === "ar" ? "كلمة المرور" : "Password"}
            type="password"
            variant="faded"
            value={customerFormData.password || ""}
            onChange={(e) =>
              setCustomerFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            isRequired
          />
          <Input
            label={language === "ar" ? "رقم الهاتف" : "Phone"}
            variant="faded"
            value={customerFormData.phone || ""}
            onChange={(e) =>
              setCustomerFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
        </div>

        {/* --- WhatsApp / Nationality --- */}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={language === "ar" ? "واتساب" : "WhatsApp"}
            variant="faded"
            value={customerFormData.whatsapp || ""}
            onChange={(e) =>
              setCustomerFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
            }
          />
          <Input
            label={language === "ar" ? "الجنسية" : "Nationality"}
            variant="faded"
            value={customerFormData.nationality || ""}
            onChange={(e) =>
              setCustomerFormData((prev) => ({ ...prev, nationality: e.target.value }))
            }
          />
        </div>

        {/* --- Date of Birth / Gender --- */}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={language === "ar" ? "تاريخ الميلاد" : "Date of Birth"}
            type="date"
            variant="faded"
            value={customerFormData.date_of_birth || ""}
            onChange={(e) =>
              setCustomerFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))
            }
          />
          <Select
            label={language === "ar" ? "الجنس" : "Gender"}
            value={customerFormData.gender || ""}
            onChange={(e) =>
              setCustomerFormData((prev) => ({ ...prev, gender: e.target.value as any }))
            }
          >
            <SelectItem key="male">{language === "ar" ? "ذكر" : "Male"}</SelectItem>
            <SelectItem key="female">{language === "ar" ? "أنثى" : "Female"}</SelectItem>
          </Select>
        </div>

        {/* --- Buttons --- */}
        <div className="flex flex-col gap-3 mt-4 w-full">
          <Button
            type="submit"
            fullWidth
            isLoading={loadingForm}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-2xl py-3 shadow-lg hover:scale-105 transition-transform duration-200"
          >
            {language === "ar" ? "تسجيل" : "Sign Up"}
          </Button>

          <Button
            type="button"
            fullWidth
            onClick={() => setSignUpType(null)}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl py-2 transition-transform duration-200 hover:scale-105"
          >
            {language === "ar" ? "رجوع" : "Back"}
          </Button>
        </div>
      </Form>
    </CardBody>
  );
};


const renderCompanyForm = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveUser();
  };

  const renderSubmitError = () => {
    if (!submitError) return null;

    const isArrayError = Array.isArray(submitError) && submitError.length > 0;
    const isStringError = typeof submitError === "string" && submitError.trim() !== "";

    if (!isArrayError && !isStringError) return null;

    return (
      <div className="w-full mb-4">
        <Alert
          color="danger"
          variant="flat"
          className="text-sm"
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
        >
          {isArrayError ? (
            <ul className="list-disc list-inside space-y-1">
              {submitError.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          ) : (
            submitError
          )}
        </Alert>
      </div>
    );
  };

  return (
    <CardBody className="space-y-6 pt-6">
      {/* --- Title --- */}
      <h2 className="text-white font-bold text-2xl text-center drop-shadow-md">
        {language === "ar" ? "تسجيل كشركة" : "Sign Up as Company"}
      </h2>

      {/* --- Form --- */}
      <Form onSubmit={handleSubmit} className="w-full space-y-4">
        {/* --- Submit Error --- */}
        {renderSubmitError()}

        {/* --- Name Fields --- */}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label={language === "ar" ? "الاسم الكامل" : "Full Name"}
            variant="faded"
            startContent={<UserIcon className="h-5 w-5 text-foreground/50" />}
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            isRequired
            errorMessage={language === "ar" ? "هذا الحقل مطلوب" : "This field is required"}
          />
          <Input
            label={language === "ar" ? "الاسم بالعربية" : "Arabic Name"}
            variant="faded"
            startContent={<GlobeAltIcon className="h-5 w-5 text-foreground/50" />}
            value={formData.name_ar || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, name_ar: e.target.value }))}
          />
        </div>

        {/* --- Contact Fields --- */}
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            type="email"
            label={language === "ar" ? "البريد الإلكتروني" : "Email"}
            variant="faded"
            startContent={<EnvelopeIcon className="h-5 w-5 text-foreground/50" />}
            value={formData.email || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            isRequired
            errorMessage={language === "ar" ? "هذا الحقل مطلوب" : "This field is required"}
          />
          <Input
            label={language === "ar" ? "رقم الهاتف" : "Phone Number"}
            variant="faded"
            startContent={<DevicePhoneMobileIcon className="h-5 w-5 text-foreground/50" />}
            value={formData.phone || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>

        {/* --- Role & Password Fields --- */}
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label={language === "ar" ? "الدور الوظيفي" : "Role"}
            selectedKeys={formData.role_id ? [String(formData.role_id)] : []}
            onChange={(e) => setFormData((prev) => ({ ...prev, role_id: e.target.value }))}
            isRequired
          >
            {roles.map((role) => (
              <SelectItem key={String(role.id ?? role.role_id)}>
                {language === "ar" ? role.name_ar || role.name || role.role_name : role.name || role.role_name}
              </SelectItem>
            ))}
          </Select>

          <Input
            type="password"
            label={language === "ar" ? "كلمة المرور" : "Password"}
            variant="faded"
            startContent={<LockClosedIcon className="h-5 w-5 text-foreground/50" />}
            value={formData.password || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            isRequired
          />
        </div>

        {/* --- Buttons --- */}
        <div className="space-y-2">
          <Button
            type="submit"
            fullWidth
            isLoading={loadingForm}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl py-2 hover:scale-105 transition-transform"
          >
            {language === "ar" ? "تسجيل" : "Sign Up"}
          </Button>

          <Button
            type="button"
            fullWidth
            onClick={() => setSignUpType(null)}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl py-2 transition-transform duration-200 hover:scale-105"
          >
            {language === "ar" ? "رجوع" : "Back"}
          </Button>
        </div>
      </Form>
    </CardBody>
  );
};


  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row items-center justify-center gap-10 px-6 py-16 bg-gradient-to-b from-slate-900/90 via-slate-800/70 to-slate-900/90 overflow-hidden">
      {/* Background Waves */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[60rem] h-[60rem] bg-gradient-to-r from-slate-700/20 to-slate-900/20 rounded-full blur-[200px] animate-[wave_15s_infinite]" />
        <div className="absolute -bottom-40 -right-40 w-[50rem] h-[50rem] bg-gradient-to-l from-slate-800/30 to-slate-900/30 rounded-full blur-[180px] animate-[wave_20s_infinite]" />
      </div>

      {/* Left Form */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md z-10"
      >
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
          {/* Header */}
          <CardHeader className="flex flex-col items-center gap-4 pt-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <Car className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">AL RATEB</h1>
            <p className="text-sm text-white/60">Luxury Car Rental Login</p>
          </CardHeader>

          {/* Conditional Forms */}
          {!showSignUpOptions && !signUpType && renderLoginForm()}
          {showSignUpOptions && !signUpType && renderSignUpOptions()}
          {signUpType === "customer" && renderCustomerForm()}
          {signUpType === "company" && renderCompanyForm()}

          {/* Security Alert */}
          <div className="mt-6">
            <Alert color="primary" icon={<ShieldCheckIcon className="w-5 h-5" />} variant="flat">
              <span className="text-xs">{lang(language, "security_message")}</span>
            </Alert>
          </div>
        </Card>
      </motion.div>

      {/* Right Image */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden md:block w-full max-w-xl relative z-10 overflow-hidden rounded-3xl h-[28rem]"
      >
        <img
          src="/images/image.png"
          alt="2025 Kia Sorento Snow White Pearl"
          className="w-full h-full object-cover"
        />
      </motion.div>
    </div>
  );
}
