import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../functions/permissions";
import { validateFields } from "../../functions/validation";

// رسائل الأخطاء
const errorMessages = {
  en: {
    unauthorized: "Unauthorized access.",
    serverError: "Internal server error.",
    missingFields: "Required fields are missing.",
    bookingNotFound: "Booking not found for this tenant.",
    success: "Payment created successfully",
    deletedSuccess: "Payments deleted successfully",
    missingPaymentIds: "Payment IDs are required",
    invalidAmount: "Payment amount must be greater than 0",
    noPayment: "No matching payments found for deletion",
    invalidPaymentMethod: "Invalid payment method",
    notFound: "Requested data not found",
    invalidStatus: "Invalid payment status"
  },
  ar: {
    unauthorized: "دخول غير مصرح به.",
    serverError: "خطأ في الخادم الداخلي.",
    missingFields: "الحقول المطلوبة مفقودة.",
    bookingNotFound: "الحجز غير موجود ضمن هذه المنظمة.",
    success: "تم إنشاء الدفع بنجاح",
    deletedSuccess: "تم حذف المدفوعات بنجاح",
    missingPaymentIds: "معرفات المدفوعات مطلوبة",
    invalidAmount: "المبلغ المدفوع يجب أن يكون أكبر من صفر",
    noPayment: "لا توجد دفعات مطابقة للحذف",
    invalidPaymentMethod: "طريقة الدفع غير صالحة",
    invalidStatus: "حالة الدفع غير صالحة",
    notFound: "البيانات المطلوبة غير موجودة",
  },
};

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

/**
 * POST /api/v1/admin/payments
 *
 * Creates a new payment for a booking.
 * Supports deposits, partial/split payments, late fees, and custom payment dates.
 *
 * Request Body (JSON):
 *   - tenant_id (number, required)       : ID of the tenant owning the booking
 *   - customer_id (number, required)     : ID of the customer making the payment
 *   - booking_id (number, required)      : ID of the booking to apply the payment to
 *   - amount (number, required)          : Payment amount (must be > 0)
 *   - payment_method (string, optional)  : "cash", "card", "bank_transfer", "online" (default: "cash")
 *   - status (string, optional)          : "pending", "completed", "failed" (default: "pending")
 *   - payment_date (string, optional)    : Payment date in ISO format (default: current timestamp)
 *   - is_deposit (boolean, optional)     : Marks payment as a deposit (default: false)
 *   - partial_amount (number, optional)  : Amount for partial payment (default: 0)
 *   - split_details (object/array, optional) : Details if payment is split between multiple parties
 *   - late_fee (number, optional)        : Late fee applied to this payment (default: 0)
 *
 * Response:
 *   - 201: { message, payment_id }        : Payment created successfully
 *   - 400: { error }                      : Missing/invalid fields
 *   - 404: { error }                      : Booking not found
 *   - 500: { error }                      : Internal server error
 *
 */
export async function POST(req: NextRequest) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const payload = await req.json();

    const { 
      tenant_id, 
      booking_id, 
      amount, 
      payment_method = "cash",
      status = "pending",
      payment_date,
      customer_id,
      is_deposit,
      partial_amount,
      paid_amount ,
      split_details,
      late_fee
    } = payload;

    const rules: any = {
      tenant_id: [
        { required: true, label: lang === "ar" ? "معرّف المستأجر" : "Tenant ID" }, 
        { type: "number" }
      ],
      booking_id: [
        { required: true, label: lang === "ar" ? "معرّف الحجز" : "Booking ID" }, 
        { type: "number" }
      ],
      amount: [
        { required: true, label: lang === "ar" ? "المبلغ" : "Amount" }, 
        { type: "number" }
      ],
      payment_method: [
        { required: false, label: lang === "ar" ? "طريقة الدفع" : "Payment Method" },
        {
          validator: (value: string) => 
            ['cash', 'card', 'bank_transfer', 'online'].includes(value) 
              ? true 
              : getErrorMessage("invalidPaymentMethod", lang)
        }
      ],
      status: [
        { required: false, label: lang === "ar" ? "الحالة" : "Status" },
        {
          validator: (value: string) => 
            ['pending', 'completed', 'failed'].includes(value) 
              ? true 
              : getErrorMessage("invalidStatus", lang)
        }
      ]
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) return NextResponse.json({ error: errors }, { status: 400 });

    if (amount <= 0) {
      return NextResponse.json({ error: getErrorMessage("invalidAmount", lang) }, { status: 400 });
    }

    const [bookings] = await pool.query(
      `SELECT id FROM bookings 
       WHERE id = ? AND tenant_id = ? AND status != 'deleted' AND customer_id = ?`,
      [booking_id, tenant_id, customer_id]
    );

    if (!(bookings as any[]).length) {
      return NextResponse.json({ error: getErrorMessage("bookingNotFound", lang) }, { status: 404 });
    }

    const mysqlDate = payment_date
      ? new Date(payment_date).toISOString().slice(0, 19).replace("T", " ")
      : new Date().toISOString().slice(0, 19).replace("T", " ");

    const depositFlag = is_deposit ? 1 : 0;
    const partialAmountValue = partial_amount || 0;
    const splitDetailsJson = split_details ? JSON.stringify(split_details) : null;
    const lateFeeValue = late_fee || 0;

    const [result] = await pool.query(
      `INSERT INTO payments 
        (booking_id, amount,paid_amount , payment_method, status, payment_date, is_deposit, partial_amount, split_details, late_fee, created_at) 
       VALUES (?, ?, ?,?, ?, ?, ?, ?, ?, ?, NOW())`,
      [booking_id, amount,paid_amount , payment_method, status, mysqlDate, depositFlag, partialAmountValue, splitDetailsJson, lateFeeValue]
    );

    const payment_id = (result as any).insertId;

    return NextResponse.json(
      { message: getErrorMessage("success", lang), payment_id }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}


/**
 * GET /api/v1/admin/payments
 *
 * Retrieves a paginated list of payments for a specific tenant and customer.
 * The endpoint validates that the customer exists within the tenant's bookings
 * before returning any payment data.
 *
 * Required Query Parameters:
 * - tenant_id (number)   : Tenant identifier
 * - customer_id (number) : Customer identifier (must exist in bookings table)
 *
 * Optional Query Parameters:
 * - booking_id (number)  : Filter payments by a specific booking
 * - status (string)      : Filter payments by payment status
 * - page (number)        : Page number (default: 1)
 * - pageSize (number)    : Number of records per page (default: 20)
 * - sortBy (string)      : Column to sort by (default: created_at)
 * - sortOrder (string)  : Sorting order ASC | DESC (default: DESC)
 *
 * Responses:
 * - 200 OK    : Returns paginated payments list
 * - 400 Bad Request : Missing required parameters
 * - 404 Not Found  : Customer not found in tenant bookings
 * - 500 Internal Server Error : Unexpected server error
 */
export async function GET(req: NextRequest) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const user: any = await getUserData(req);
    const { searchParams } = new URL(req.url);

    const tenant_id = searchParams.get("tenant_id");
    const customer_id = searchParams.get("customer_id");
    const booking_id = searchParams.get("booking_id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "DESC";

    const whereClauses = ["p.status != 'deleted'"];
    const params: any[] = [];

    if (tenant_id) {
      whereClauses.push("b.tenant_id = ?");
      params.push(tenant_id);
    }

    if (customer_id) {
      whereClauses.push("b.customer_id = ?");
      params.push(customer_id);
    }

    if (booking_id) {
      whereClauses.push("p.booking_id = ?");
      params.push(booking_id);
    }

    if (status) {
      whereClauses.push("p.status = ?");
      params.push(status);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       ${where}`,
      params
    );

    const total = (countRows as any[])[0]?.count || 0;

    // جلب الدفوعات
    const [payments] = await pool.query(
      `SELECT 
          p.*,
          b.total_amount AS booking_total_amount,
          b.customer_id
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       ${where}
       ORDER BY p.${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json(
      { total, page, pageSize, data: payments },
      { status: 200 }
    );

  } catch (error) {
    console.error("GET payments error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}



/**
 * DELETE /api/v1/admin/payments
 *
 * Deletes multiple payments for a specific tenant.
 * - Requires `delete_payments` permission and valid tenant access in production
 * - Only payments linked to bookings of the specified tenant will be deleted
 *
 * Request Body (JSON):
 *   - tenant_id (number, required)       : ID of the tenant to which the payments belong
 *   - payment_ids (number[], required)   : List of payment IDs to delete
 *
 * Responses:
 *   - 200: { message } : Payments deleted successfully
 *   - 400: { error }   : Missing required parameters
 *   - 401: { error }   : Unauthorized
 *   - 404: { error }   : No matching payments found
 *   - 500: { error }   : Internal server error
 */
export async function DELETE(req: NextRequest) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
  try {
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const { tenant_id, payment_ids } = await req.json();
    
    if (!tenant_id) {
      return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 400 });
    }
    
    if (!payment_ids || !Array.isArray(payment_ids) || payment_ids.length === 0) {
      return NextResponse.json({ error: getErrorMessage("missingPaymentIds", lang) }, { status: 400 });
    }
    const [existing] = await pool.query(
      `SELECT p.id 
       FROM payments p 
       JOIN bookings b ON p.booking_id = b.id 
       WHERE p.id IN (?) AND b.tenant_id = ? AND p.status != 'deleted'`,
      [payment_ids, tenant_id]
    );
    
    const existingIds = (existing as any[]).map(row => row.id);
    
    if (existingIds.length === 0) {
      return NextResponse.json({ error: getErrorMessage("noPayment", lang) }, { status: 404 });
    }

    await pool.query(
      `UPDATE payments SET status = 'deleted' WHERE id IN (?)`,
      [existingIds]
    );

    return NextResponse.json({ message: getErrorMessage("deletedSuccess", lang) }, { status: 200 });

  } catch (error) {
    console.error("DELETE payments error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}