// app/api/v1/admin/customers.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { validateFields } from "../../functions/validation";
import argon2 from "argon2";
const errorMessages = {
  en: {
    unauthorized: "Unauthorized access.",
    missingFields: "Required fields are missing.",
    serverError: "Internal server error.",
    success: "Customer created successfully.",
    missingTenantId: "Tenant ID is required.",
    branchNotFoundFortenant: "Branch not found for this tenant.",
    tenantRequired: "Tenant ID is required.",
    missingCustomerIds: "Customer IDs are required.",
    invalidCustomerIds: "Invalid customer IDs.",
    userExists: "Email already exists.",
    noCustomersFound: "No matching active customers were found.",
    deleted: (count: number) => `Deleted ${count} user(s).`,
    missingCustomerType:"Customer type is required.",
    missingFirstFull:"Full name or first name is required." 
  },
  ar: {
    tenantRequired: "رقم المستأجر (المنظمة) مطلوب.",
    missingCustomerIds: "يجب تزويد أرقام العملاء.",
    invalidCustomerIds: "أرقام العملاء غير صالحة.",
    missingFields: "الحقول المطلوبة مفقودة.",
    branchNotFoundFortenant: "الفرع غير موجود لهذه الشركة.",
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    userExists: "البريد الإلكتروني موجود مسبقاً.",
    success: "تم إنشاء المستخدم بنجاح.",
    noCustomersFound: "لم يتم العثور على عملاء مطابقين.",
    missingTenantId: "معرف المنظمة مطلوب.",
    deleted: (count: number) => `تم حذف ${count} مستخدم${count === 1 ? "" : "ين"}.`,
    missingCustomerType:"نوع العميل مطلوب." ,
    missingFirstFull:"الاسم الكامل أو الاسم الأول مطلوب."
  },
};

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}


/**
 * POST /api/v1/admin/customers
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Request Body (JSON):
 *   - customer_type (string, required)                     : "individual" or "corporate"
 *   - full_name (string, required if first_name missing)  : Customer's full name
 *   - first_name (string, required if full_name missing)  : Customer's first name
 *   - last_name (string, optional)                        : Customer's last name
 *   - email (string, required)                             : Customer's email address (must be valid and unique)
 *   - password (string, required, min 8 chars)            : Password (will be hashed)
 *   - phone (string, optional)                             : Customer's phone number
 *   - whatsapp (string, optional)                          : WhatsApp number
 *   - nationality (string, optional)                       : Nationality
 *   - date_of_birth (string, optional, format YYYY-MM-DD)  : Date of birth
 *   - gender (string, optional)                             : "male" | "female" | "other"
 *   - id_type (string, optional)                             : "id_card" | "passport"
 *   - id_number (string, optional)                           : ID number
 *   - driving_license_number (string, optional)             : Driver's license number
 *   - license_country (string, optional)                    : Country of license
 *   - license_expiry_date (string, optional, format YYYY-MM-DD) : License expiry
 *   - address (string, optional)                             : Address
 *   - city (string, optional)                                 : City
 *   - country (string, optional)                              : Country
 *   - preferred_language (string, optional, default "en")    : Preferred language
 *   - notes (string, optional)                                : Notes
 *   - loyalty_points (number, optional, default 0)           : Loyalty points
 *   - loyalty_level (string, optional, default "bronze")     : Loyalty level ("bronze","silver","gold","vip")
 *   - total_bookings, active_bookings, completed_bookings, cancelled_bookings (number, optional, default 0)
 *   - last_booking_date (string, optional, format YYYY-MM-DD)
 *   - average_rental_days (number, optional)
 *   - risk_score, late_returns_count, damage_incidents_count, fraud_flag (number/boolean, optional, default 0)
 *   - status (string, optional, default "active")           : Customer status
 *
 * Validation:
 *   ✔ Required fields must exist
 *   ✔ Email must be valid and unique
 *   ✔ Password must be at least 8 characters
 *   ✔ Numeric fields must be numbers
 *   ✔ Max length checks for names and IDs
 *   ✔ Enum checks for gender, id_type, loyalty_level, preferred_language
 *
 * Responses:
 *   - 200: { message: "Customer created successfully." }
 *   - 400: { error: "Missing or invalid fields." }
 *   - 409: { error: "Email already exists." }
 *   - 500: { error: "Internal server error." }
 */

export async function POST(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const payload = await req.json();

    const {
      customer_type,
      status,
      first_name,
      last_name,
      full_name,
      email,
      password,
      phone,
      whatsapp,
      nationality,
      date_of_birth,
      gender,
      id_type,
      id_number,
      driving_license_number,
      license_country,
      license_expiry_date,
      address,
      city,
      country,
      preferred_language,
      notes,
      loyalty_points,
      loyalty_level,
      total_bookings,
      active_bookings,
      completed_bookings,
      cancelled_bookings,
      last_booking_date,
      average_rental_days,
      risk_score,
      late_returns_count,
      damage_incidents_count,
      fraud_flag,
      profile_image
    } = payload;

if (!customer_type) {
return NextResponse.json({ error: getErrorMessage("missingCustomerType", lang) }, { status: 400 });

}

if (!full_name && !first_name) {
  return NextResponse.json({ error: getErrorMessage("missingFirstFull", lang) }, { status: 400 });

}


const rules: Record<string, Array<any>> = {
  customer_type: [
    { required: true, label: { en: "Customer Type", ar: "نوع العميل" }[lang] },
  ],
  full_name: [
    { required: !first_name, label: { en: "Full Name", ar: "الاسم الكامل" }[lang] },
    { maxLength: 200, label: { en: "Full Name", ar: "الاسم الكامل" }[lang] },
  ],
  first_name: [
    { required: !full_name, label: { en: "First Name", ar: "الاسم الأول" }[lang] },
    { maxLength: 100, label: { en: "First Name", ar: "الاسم الأول" }[lang] },
  ],
  last_name: [
    { required: false, label: { en: "Last Name", ar: "اسم العائلة" }[lang] },
    { maxLength: 100, label: { en: "Last Name", ar: "اسم العائلة" }[lang] },
  ],
  email: [
    { required: false, label: { en: "Email", ar: "البريد الإلكتروني" }[lang] },
    { type: "email", label: { en: "Email", ar: "البريد الإلكتروني" }[lang] },
  ],
  password: [
    { required: true, label: { en: "Password", ar: "كلمة السر" }[lang] },
    { minLength: 8, label: { en: "Password", ar: "كلمة السر" }[lang] },
  ],
  phone: [
    { required: false, label: { en: "Phone", ar: "رقم الهاتف" }[lang] },
  ],
  whatsapp: [
    { required: false, label: { en: "WhatsApp", ar: "واتساب" }[lang] },
    { pattern: /^\+?\d{7,15}$/, label: { en: "WhatsApp", ar: "واتساب" }[lang] },
  ],
  nationality: [
    { required: false, label: { en: "Nationality", ar: "الجنسية" }[lang] },
    { maxLength: 100, label: { en: "Nationality", ar: "الجنسية" }[lang] },
  ],
  date_of_birth: [
    { required: false, label: { en: "Date of Birth", ar: "تاريخ الميلاد" }[lang] },
    { type: "date", label: { en: "Date of Birth", ar: "تاريخ الميلاد" }[lang] },
  ],
  gender: [
    { required: false, label: { en: "Gender", ar: "الجنس" }[lang] },
    { enum: ["male","female","other"], label: { en: "Gender", ar: "الجنس" }[lang] },
  ],
  id_type: [
    { required: false, label: { en: "ID Type", ar: "نوع الهوية" }[lang] },
    { enum: ["id_card","passport"], label: { en: "ID Type", ar: "نوع الهوية" }[lang] },
  ],
  id_number: [
    { required: false, label: { en: "ID Number", ar: "رقم الهوية" }[lang] },
    { maxLength: 100, label: { en: "ID Number", ar: "رقم الهوية" }[lang] },
  ],
  driving_license_number: [
    { required: false, label: { en: "Driving License", ar: "رقم رخصة القيادة" }[lang] },
    { maxLength: 100, label: { en: "Driving License", ar: "رقم رخصة القيادة" }[lang] },
  ],
  license_country: [
    { required: false, label: { en: "License Country", ar: "دولة الرخصة" }[lang] },
    { maxLength: 100, label: { en: "License Country", ar: "دولة الرخصة" }[lang] },
  ],
  license_expiry_date: [
    { required: false, label: { en: "License Expiry Date", ar: "تاريخ انتهاء الرخصة" }[lang] },
    { type: "date", label: { en: "License Expiry Date", ar: "تاريخ انتهاء الرخصة" }[lang] },
  ],
  address: [
    { required: false, label: { en: "Address", ar: "العنوان" }[lang] },
  ],
  city: [
    { required: false, label: { en: "City", ar: "المدينة" }[lang] },
    { maxLength: 100, label: { en: "City", ar: "المدينة" }[lang] },
  ],
  country: [
    { required: false, label: { en: "Country", ar: "الدولة" }[lang] },
    { maxLength: 100, label: { en: "Country", ar: "الدولة" }[lang] },
  ],
  preferred_language: [
    { required: false, label: { en: "Preferred Language", ar: "اللغة المفضلة" }[lang] },
    { enum: ["en","ar"], label: { en: "Preferred Language", ar: "اللغة المفضلة" }[lang] },
  ],
  notes: [
    { required: false, label: { en: "Notes", ar: "ملاحظات" }[lang] },
  ],
  loyalty_points: [
    { required: false, label: { en: "Loyalty Points", ar: "نقاط الولاء" }[lang] },
    { type: "number", min: 0, label: { en: "Loyalty Points", ar: "نقاط الولاء" }[lang] },
  ],
  loyalty_level: [
    { required: false, label: { en: "Loyalty Level", ar: "مستوى الولاء" }[lang] },
    { enum: ["bronze","silver","gold","vip"], label: { en: "Loyalty Level", ar: "مستوى الولاء" }[lang] },
  ],
  total_bookings: [
    { required: false, label: { en: "Total Bookings", ar: "إجمالي الحجوزات" }[lang] },
    { type: "number", min: 0, label: { en: "Total Bookings", ar: "إجمالي الحجوزات" }[lang] },
  ],
  active_bookings: [
    { required: false, label: { en: "Active Bookings", ar: "الحجوزات النشطة" }[lang] },
    { type: "number", min: 0, label: { en: "Active Bookings", ar: "الحجوزات النشطة" }[lang] },
  ],
  completed_bookings: [
    { required: false, label: { en: "Completed Bookings", ar: "الحجوزات المكتملة" }[lang] },
    { type: "number", min: 0, label: { en: "Completed Bookings", ar: "الحجوزات المكتملة" }[lang] },
  ],
  cancelled_bookings: [
    { required: false, label: { en: "Cancelled Bookings", ar: "الحجوزات الملغاة" }[lang] },
    { type: "number", min: 0, label: { en: "Cancelled Bookings", ar: "الحجوزات الملغاة" }[lang] },
  ],
  last_booking_date: [
    { required: false, label: { en: "Last Booking Date", ar: "تاريخ آخر حجز" }[lang] },
    { type: "date", label: { en: "Last Booking Date", ar: "تاريخ آخر حجز" }[lang] },
  ],
  average_rental_days: [
    { required: false, label: { en: "Average Rental Days", ar: "متوسط أيام الإيجار" }[lang] },
    { type: "number", min: 0, label: { en: "Average Rental Days", ar: "متوسط أيام الإيجار" }[lang] },
  ],
  risk_score: [
    { required: false, label: { en: "Risk Score", ar: "مستوى المخاطر" }[lang] },
    { type: "number", min: 0, label: { en: "Risk Score", ar: "مستوى المخاطر" }[lang] },
  ],
  late_returns_count: [
    { required: false, label: { en: "Late Returns", ar: "عدد التأخيرات" }[lang] },
    { type: "number", min: 0, label: { en: "Late Returns", ar: "عدد التأخيرات" }[lang] },
  ],
  damage_incidents_count: [
    { required: false, label: { en: "Damage Incidents", ar: "عدد الحوادث" }[lang] },
    { type: "number", min: 0, label: { en: "Damage Incidents", ar: "عدد الحوادث" }[lang] },
  ],
  fraud_flag: [
    { required: false, label: { en: "Fraud Flag", ar: "خطر الاحتيال" }[lang] },
    { type: "boolean", label: { en: "Fraud Flag", ar: "خطر الاحتيال" }[lang] },
  ],
};



    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) return NextResponse.json({ error: errors }, { status: 400 });
 const hashedPassword = await argon2.hash(password);
    // تحقق من وجود البريد مسبقاً
    const [existing] = await pool.query("SELECT * FROM customers WHERE email = ?", [email]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: getErrorMessage("userExists", lang) }, { status: 409 });
    }

   await pool.query(
  `INSERT INTO customers (
      customer_type, status, first_name, last_name, full_name, hashed_password,
      email, phone, whatsapp, nationality, date_of_birth, gender, id_type, id_number,
      driving_license_number, license_country, license_expiry_date, address,
      city, country, preferred_language, notes, loyalty_points, loyalty_level,
      total_bookings, active_bookings, completed_bookings, cancelled_bookings,
      last_booking_date, average_rental_days, risk_score, late_returns_count,
      damage_incidents_count, fraud_flag, profile_image
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
  [
    customer_type,
    status || "active",
    first_name || null,
    last_name || null,
    full_name || `${first_name || ""} ${last_name || ""}`,
    hashedPassword, 
    email || null,
    phone || null,
    whatsapp || null,
    nationality || null,
    date_of_birth || null,
    gender || null,
    id_type || null,
    id_number || null,
    driving_license_number || null,
    license_country || null,
    license_expiry_date || null,
    address || null,
    city || null,
    country || null,
    preferred_language || "en",
    notes || null,
    loyalty_points || 0,
    loyalty_level || "bronze",
    total_bookings || 0,
    active_bookings || 0,
    completed_bookings || 0,
    cancelled_bookings || 0,
    last_booking_date || null,
    average_rental_days || null,
    risk_score || 0,
    late_returns_count || 0,
    damage_incidents_count || 0,
    fraud_flag || 0,
    profile_image || null
  ]
);


    return NextResponse.json({ message: getErrorMessage("success", lang) }, { status: 200 });

  } catch (error) {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    console.error("Create customer error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * GET /api/v1/admin/customers
 *
 * Fetches a paginated list of all customers.
 * Supports search, sorting, and pagination. Customers are not tied to any tenant or branch.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Query Parameters:
 *   - page (number, optional, default 1)       : Page number for pagination
 *   - pageSize (number, optional, default 20)  : Number of records per page
 *   - search (string, optional)                : Search term applied to first_name, last_name, full_name, phone, or email
 *   - sortBy (string, optional, default "created_at") : Column to sort by
 *   - sortOrder (string, optional, default "desc")   : "asc" or "desc"
 *
 * Responses:
 *   - 200: {
 *        count: total number of matching customers,
 *        page: current page number,
 *        pageSize: number of items per page,
 *        totalPages: total pages,
 *        data: array of customer objects
 *     }
 *   - 401: { error: "Unauthorized access." }
 *   - 500: { error: "Internal server error." }
 */
export async function GET(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
     const statusFilter = searchParams.get("status") || "active"; // هنا الفلتر
    let where = "1=1"; 
    const params: any[] = [];

    if (search) {
      where += " AND (first_name LIKE ? OR last_name LIKE ? OR full_name LIKE ? OR phone LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
   // فلترة حسب status
    if (statusFilter) {
      where += " AND status = ?";
      params.push(statusFilter);
    } else {
      // استثناء deleted بشكل افتراضي
      where += " AND status != 'deleted'";
    }
    const [countRows] = await pool.query(`SELECT COUNT(*) as count FROM customers WHERE ${where} AND status!='deleted'`, params);
    const count = (countRows as any)[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    const [customers] = await pool.query(
      `SELECT id, customer_type, first_name, last_name, full_name, email, profile_image, phone, whatsapp, nationality,   
  DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth, gender, id_type, id_number, driving_license_number, license_country,  DATE_FORMAT( license_expiry_date, '%Y-%m-%d') AS license_expiry_date,
              address, city, country, preferred_language, notes, loyalty_points, loyalty_level, status, created_at
       FROM customers
       WHERE ${where} AND status!='deleted'
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ count, page, pageSize, totalPages, data: customers }, { status: 200 });

  } catch (error) {
    console.error("Get customers error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: lang === "ar" ? "خطأ في الخادم الداخلي" : "Internal server error." }, { status: 500 });
  }
}
/**
 * DELETE /api/v1/admin/customers
 *
 * Deletes one or multiple customers by ID.
 * Performs a soft delete by updating the status to "deleted" and setting deleted_at timestamp.
 * Customers are not tied to any tenant or branch.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Request Body (JSON):
 *   - customer_ids (array of numbers, required) : IDs of customers to delete
 *
 * Validation:
 *   ✔ Checks that customer_ids array is provided and contains valid numbers
 *
 * Responses:
 *   - 200: { message: "Deleted X user(s)." }
 *   - 400: { error: "Missing or invalid customer IDs." }
 *   - 401: { error: "Unauthorized access." }
 *   - 404: { error: "No matching active customers found." }
 *   - 500: { error: "Internal server error." }
 */
export async function DELETE(req: NextRequest) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const { customer_ids } = await req.json();

    if (!Array.isArray(customer_ids) || !customer_ids.length) {
      return NextResponse.json({ error: getErrorMessage("missingCustomerIds", lang) }, { status: 400 });
    }

    const normalizedIds = customer_ids.map((id: any) => Number(id)).filter(id => !isNaN(id));
    if (!normalizedIds.length) {
      return NextResponse.json({ error: getErrorMessage("invalidCustomerIds", lang) }, { status: 400 });
    }

    const [targetCustomers] = await pool.query(
      `SELECT id FROM customers WHERE id IN (?) AND status!='deleted'`,
      [normalizedIds]
    );

    const deletableIds = (targetCustomers as any).map((c: any) => c.id);
    if (!deletableIds.length) {
      return NextResponse.json({ error: getErrorMessage("noCustomersFound", lang) }, { status: 404 });
    }

    await pool.query(
      `UPDATE customers SET status='deleted' WHERE id IN (?)`,
      [deletableIds]
    );

    return NextResponse.json({ message: errorMessages[lang].deleted(deletableIds.length) }, { status: 200 });

  } catch (error) {
    console.error("Delete customers error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

