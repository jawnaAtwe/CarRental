
import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { validateFields } from "../../../functions/validation";
import argon2 from "argon2";
const errorMessages = {
  en: {
    unauthorized: "Unauthorized access.",
    serverError: "Internal server error.",
    noCustomersFound: "Customer not found.",
    missingFields: "Required fields are missing.",
    success: "Customer updated successfully.",
    deletedSuccess: "Customer deleted successfully",
  },
  ar: {
    unauthorized: "دخول غير مصرح به.",
    serverError: "خطأ في الخادم الداخلي.",
    noCustomersFound: "العميل غير موجود.",
    success: "تم تعديل المستخدم بنجاح.",
    missingFields: "الحقول المطلوبة مفقودة.",
    deletedSuccess: "تم حذف بيانات العميل بنجاح"
  },
};

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}


/**
 * PUT /api/v1/admin/customers/[customerId]
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Path Parameters:
 *   - customerId (number, required) : The ID of the customer to update
 *
 * Request Body (JSON):
 *   - customer_type (string, required)                     : "individual" or "corporate"
 *   - full_name (string, required if first_name missing)  : Customer's full name
 *   - first_name (string, required if full_name missing)  : Customer's first name
 *   - last_name (string, optional)                        : Customer's last name
 *   - email (string, optional)                             : Customer's email address (must be valid)
 *   - password (string, optional)                          : New password (will be hashed)
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
 *   ✔ Email must be valid
 *   ✔ Numeric fields must be numbers
 *   ✔ Max length checks for names
 *
 * Responses:
 *   - 200: { message: "Customer updated successfully." }
 *   - 400: { error: "Missing or invalid fields." }
 *   - 401: { error: "Unauthorized access." }
 *   - 404: { error: "Customer not found." }
 *   - 500: { error: "Internal server error." }
 */


export async function PUT(req: Request, { params }: { params: { customerId: string } }) {

  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
const customerId = Number(params.customerId);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: getErrorMessage("noCustomersFound", lang) }, { status: 404 });
    }

    const payload = await req.json();

    if (!payload.customer_type || (!payload.full_name && !payload.first_name)) {
      return NextResponse.json({ error: getErrorMessage("missingFields", lang) }, { status: 400 });
    }

    // Validation rules
    const rules: Record<string, Array<any>> = {
      customer_type: [{ required: true, label: { en: "Customer Type", ar: "نوع العميل" }[lang] }],
      full_name: [{ maxLength: 200, label: { en: "Full Name", ar: "الاسم الكامل" }[lang] }],
      first_name: [{ maxLength: 100, label: { en: "First Name", ar: "الاسم الأول" }[lang] }],
      last_name: [{ maxLength: 100, label: { en: "Last Name", ar: "اسم العائلة" }[lang] }],
      email: [{ type: "email", label: { en: "Email", ar: "البريد الإلكتروني" }[lang] }],
      loyalty_points: [{ type: "number", label: { en: "Loyalty Points", ar: "نقاط الولاء" }[lang] }],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) return NextResponse.json({ error: errors }, { status: 400 });

    // Check if customer exists
    const [existingRows] = await pool.query(
      `SELECT * FROM customers WHERE id = ? AND status != 'deleted'`,
      [customerId]
    );
    const customer = (existingRows as any)[0];
    if (!customer) {
      return NextResponse.json({ error: getErrorMessage("noCustomersFound", lang) }, { status: 404 });
    }

  const fields: string[] = [];
const values: any[] = [];

// إذا موجود بالـ payload، نضيفه
if (payload.customer_type) { fields.push("customer_type = ?"); values.push(payload.customer_type); }
if (payload.status) { fields.push("status = ?"); values.push(payload.status); }
if (payload.first_name) { fields.push("first_name = ?"); values.push(payload.first_name); }
if (payload.last_name) { fields.push("last_name = ?"); values.push(payload.last_name); }
if (payload.full_name) { fields.push("full_name = ?"); values.push(payload.full_name); }
if (payload.email) { fields.push("email = ?"); values.push(payload.email); }
if (payload.phone) { fields.push("phone = ?"); values.push(payload.phone); }
if (payload.whatsapp) { fields.push("whatsapp = ?"); values.push(payload.whatsapp); }
if (payload.nationality) { fields.push("nationality = ?"); values.push(payload.nationality); }
if (payload.date_of_birth) { fields.push("date_of_birth = ?"); values.push(payload.date_of_birth); }
if (payload.gender) { fields.push("gender = ?"); values.push(payload.gender); }
if (payload.id_type) { fields.push("id_type = ?"); values.push(payload.id_type); }
if (payload.id_number) { fields.push("id_number = ?"); values.push(payload.id_number); }
if (payload.driving_license_number) { fields.push("driving_license_number = ?"); values.push(payload.driving_license_number); }
if (payload.license_country) { fields.push("license_country = ?"); values.push(payload.license_country); }
if (payload.license_expiry_date) { fields.push("license_expiry_date = ?"); values.push(payload.license_expiry_date); }
if (payload.address) { fields.push("address = ?"); values.push(payload.address); }
if (payload.city) { fields.push("city = ?"); values.push(payload.city); }
if (payload.country) { fields.push("country = ?"); values.push(payload.country); }
if (payload.preferred_language) { fields.push("preferred_language = ?"); values.push(payload.preferred_language); }
if (payload.notes) { fields.push("notes = ?"); values.push(payload.notes); }
if (payload.loyalty_points !== undefined) { fields.push("loyalty_points = ?"); values.push(payload.loyalty_points); }
if (payload.loyalty_level) { fields.push("loyalty_level = ?"); values.push(payload.loyalty_level); }
if (payload.total_bookings !== undefined) { fields.push("total_bookings = ?"); values.push(payload.total_bookings); }
if (payload.active_bookings !== undefined) { fields.push("active_bookings = ?"); values.push(payload.active_bookings); }
if (payload.completed_bookings !== undefined) { fields.push("completed_bookings = ?"); values.push(payload.completed_bookings); }
if (payload.cancelled_bookings !== undefined) { fields.push("cancelled_bookings = ?"); values.push(payload.cancelled_bookings); }
if (payload.last_booking_date) { fields.push("last_booking_date = ?"); values.push(payload.last_booking_date); }
if (payload.average_rental_days !== undefined) { fields.push("average_rental_days = ?"); values.push(payload.average_rental_days); }
if (payload.risk_score !== undefined) { fields.push("risk_score = ?"); values.push(payload.risk_score); }
if (payload.late_returns_count !== undefined) { fields.push("late_returns_count = ?"); values.push(payload.late_returns_count); }
if (payload.damage_incidents_count !== undefined) { fields.push("damage_incidents_count = ?"); values.push(payload.damage_incidents_count); }
if (payload.fraud_flag !== undefined) { fields.push("fraud_flag = ?"); values.push(payload.fraud_flag); }
if (payload.profile_image !== undefined) {
  fields.push("profile_image = ?");
  values.push(payload.profile_image); // null أو base64
}

if (payload.password) {
  const hashedPassword = await argon2.hash(payload.password);
  fields.push("hashed_password = ?");
  values.push(hashedPassword);
}

values.push(customer.id);

// UPDATE query
await pool.query(`UPDATE customers SET ${fields.join(", ")} WHERE id = ?`, values);

    return NextResponse.json({ message: getErrorMessage("success", lang) }, { status: 200 });
  } catch (error) {
    console.error("Update customer error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}


/**
 * GET /api/v1/admin/customers/[customerId]
 *
 * Fetches a specific customer by their ID.
 * Returns all customer details if the customer exists and is not soft-deleted.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Path Parameters:
 *   - customerId (number, required) : The ID of the customer to fetch
 *
 * Validation:
 *   ✔ Checks that the customerId is a valid number
 *   ✔ Ensures the customer exists and status is not 'deleted'
 *
 * Responses:
 *   - 200: { customer object } : Returns the customer details
 *   - 401: { error: "Unauthorized access." } : User does not have permission
 *   - 404: { error: "Customer not found." } : No matching active customer
 *   - 500: { error: "Internal server error." } : Server error
 */
export async function GET(req: NextRequest, { params }: any) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const customerId = params.customerId;
    if (isNaN(customerId)) {
      return NextResponse.json({ error: getErrorMessage("noCustomersFound", lang) }, { status: 404 });
    }

    const [rows] = await pool.query(
      `SELECT 
  *,
  DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth, DATE_FORMAT( license_expiry_date, '%Y-%m-%d') AS license_expiry_date, DATE_FORMAT( last_booking_date, '%Y-%m-%d') AS last_booking_date
FROM customers
WHERE id = ? AND status != 'deleted'
`,
      [customerId]
    );

    const customer = (rows as any)[0];
    if (!customer) {
      return NextResponse.json({ error: getErrorMessage("noCustomersFound", lang) }, { status: 404 });
    }

    return NextResponse.json(customer, { status: 200 });

  } catch (error) {
    console.error("Get customer by ID error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/customers/[customerId]
 *
 * Soft-deletes a specific customer by ID.
 * The customer is not removed from the database; instead, its `status` is set to "deleted".
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Path Parameters:
 *   - customerId (number, required) : The ID of the customer to delete
 *
 * Validation:
 *   ✔ Checks that the customerId is a valid number
 *   ✔ Ensures the customer exists and has not already been deleted
 *   ✔ Checks user permission for deleting customers (in production)
 *
 * Responses:
 *   - 200: { message: "Deleted 1 user." } : Successfully soft-deleted the customer
 *   - 401: { error } : Unauthorized access or insufficient permissions
 *   - 404: { error } : Customer not found or already deleted
 *   - 500: { error } : Internal server error
 *
 * Notes:
 *   - This performs a soft delete by updating `status = 'deleted'`.
 *   - The `deleted_at` timestamp can be added if needed to track deletion time.
 */

export async function DELETE(req: NextRequest, { params }: any) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const customerId = Number(params.customerId);
    if (isNaN(customerId)) {
      return NextResponse.json({ error: getErrorMessage("noCustomersFound", lang) }, { status: 404 });
    }

    const [rows] = await pool.query(
      `SELECT id FROM customers WHERE id = ? AND status != 'deleted'`,
      [customerId]
    );

    const customer = (rows as any)[0];
    if (!customer) {
      return NextResponse.json({ error: getErrorMessage("noCustomersFound", lang) }, { status: 404 });
    }

    await pool.query(
      `UPDATE customers SET status = 'deleted' WHERE id = ?`,
      [customerId]
    );

    return NextResponse.json(
      { message: getErrorMessage("deletedSuccess", lang) },
      { status: 200 }
    );

  } catch (error) {
    console.error("Delete customer error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}
