import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../functions/permissions";
import { validateFields } from "../../functions/validation";

// Error messages
const errorMessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    invoiceExists: "Invoice already exists for this booking.",
    createdSuccess: "Invoice created successfully.",
    updatedSuccess: "Invoice updated successfully.",
    deletedSuccess: (count: number) => `${count} invoice(s) deleted successfully.`,
    missingInvoiceIds: "Invoice IDs are missing.",
    invalidInvoiceIds: "Invoice IDs are invalid.",
    noInvoicesFound: "No matching invoices found.",
    invoiceNotFound: "Invoice not found.",
    missingBookingId: "Booking ID is missing.",
    missingCustomerId: "Customer ID is missing."
  },
  ar: {
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    invoiceExists: "الفاتورة موجودة بالفعل لهذا الحجز.",
    createdSuccess: "تم إنشاء الفاتورة بنجاح.",
    updatedSuccess: "تم تعديل الفاتورة بنجاح.",
    deletedSuccess: (count: number) => `تم حذف ${count} فاتورة(ات) بنجاح.`,
    missingInvoiceIds: "معرّفات الفواتير مفقودة.",
    invalidInvoiceIds: "معرّفات الفواتير غير صالحة.",
    noInvoicesFound: "لم يتم العثور على أي فواتير مطابقة.",
    invoiceNotFound: "الفاتورة غير موجودة.",
    missingBookingId: "معرّف الحجز مفقود.",
    missingCustomerId: "معرّف العميل مفقود."
  }
};

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

/**
 * GET /api/v1/admin/invoices
 *
 * Fetch a paginated list of invoices with optional filters.
 * Includes invoice details along with related booking, customer, and vehicle info.
 *
 * Query Parameters:
 *   - booking_id (optional): Filter invoices by specific booking
 *   - customer_id (optional): Filter invoices by customer
 *   - tenant_id (optional): Filter invoices by tenant (permission check)
 *   - status (optional, default all): Filter by invoice status (draft, issued, paid, etc.)
 *   - page (optional, default 1): Pagination page number
 *   - pageSize (optional, default 20): Number of invoices per page
 *
 * Response:
 *   - count: total invoices matching filters
 *   - page: current page
 *   - pageSize: number of invoices per page
 *   - totalPages: total number of pages
 *   - data: array of invoice objects, each containing:
 *       - invoice fields (i.*)
 *       - booking_id, booking_status
 *       - customer_name
 *       - vehicle_name
 *
 * Notes:
 *   - Only users with 'view_invoices' permission can access
 *   - If tenant_id is provided, user must have access to that tenant
 *   - Invoices with status 'cancelled' are excluded
 *   - Pagination applied using LIMIT and OFFSET
 *   - Left joins with bookings, customers, and vehicles to enrich invoice data
 */
export async function GET(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const { searchParams } = new URL(req.url);
    const booking_id = searchParams.get("booking_id");
    const customer_id = searchParams.get("customer_id");
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 20);
    const tenant_id = searchParams.get("tenant_id");
    // Access checks
    const hasAccess = await hasPermission(user, "view_invoices");
    if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
  if (tenant_id) {
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }
    let where = "i.status != 'cancelled'";
    const params: any[] = [];

    if (booking_id) { where += " AND i.booking_id = ?"; params.push(booking_id); }
    if (customer_id) { where += " AND i.customer_id = ?"; params.push(customer_id); }
    if (status && status !== "all") { where += " AND i.status = ?"; params.push(status); }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as count FROM invoices i WHERE ${where}`,
      params
    );
    const count = (countRows as any[])[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

   const [invoices] = await pool.query(
  `SELECT 
      i.*, 
      b.id AS booking_id, 
      b.status AS booking_status,
      c.full_name AS customer_name,       -- اسم الزبون
      v.make AS vehicle_name              -- اسم السيارة
   FROM invoices i
   LEFT JOIN bookings b ON b.id = i.booking_id
   LEFT JOIN customers c ON c.id = b.customer_id
   LEFT JOIN vehicles v ON v.id = b.vehicle_id
   WHERE ${where}
   ORDER BY i.created_at DESC
   LIMIT ? OFFSET ?`,
  [...params, pageSize, (page - 1) * pageSize]
);

    return NextResponse.json({ count, page, pageSize, totalPages, data: invoices }, { status: 200 });

  } catch (error) {
    console.error("GET invoices error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/invoices
 *
 * Creates a new invoice for a booking.
 * Automatically calculates VAT and total amount.
 * Default status is 'draft', can be extended to 'issued' later.
 *
 * Request Body:
 *   - booking_id (number, required)
 *   - customer_id (number, required)
 *   - subtotal (number, required)
 *   - vat_rate (number, required)
 *   - currency_code (string, required)
 *   - notes (string, optional)
 *   - tenant_id (number, optional, permission checked)
 *
 * Response:
 *   - 201: { message }
 *   - 400 / 401 / 500 on error
 */
export async function POST(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const payload = await req.json();
    const { booking_id, customer_id, subtotal, vat_rate, currency_code, notes, tenant_id } = payload;

    // Validation
    const rules: any = {
      booking_id: [{ type: "number", required: true, label: { en: "Booking ID", ar: "معرّف الحجز" }[lang] }],
      customer_id: [{ type: "number", required: true, label: { en: "Customer ID", ar: "معرّف العميل" }[lang] }],
      subtotal: [{ type: "number", required: true, label: { en: "Subtotal", ar: "المبلغ الأساسي" }[lang] }],
      vat_rate: [{ type: "number", required: true, label: { en: "VAT Rate", ar: "نسبة الضريبة" }[lang] }],
      currency_code: [{ type: "string", required: true, label: { en: "Currency", ar: "العملة" }[lang] }],
    };
    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) return NextResponse.json({ error: errors }, { status: 400 });

    // Permissions
    const hasAccess = await hasPermission(user, "add_invoices");
    if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

    // Tenant access check (optional)
    if (tenant_id) {
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    // Calculate VAT and total
    const vat_amount = parseFloat(((subtotal * vat_rate) / 100).toFixed(2));
    const total_amount = parseFloat((subtotal + vat_amount).toFixed(2));

    // Insert invoice
    const invoice_number = `INV-${Date.now()}`;
    const status = "draft";
    const invoice_date = new Date(); 
    const is_auto_generated = 1;

    await pool.query(
      `INSERT INTO invoices
        (booking_id, customer_id, invoice_number, status, invoice_date, subtotal, vat_rate, vat_amount, total_amount, currency_code, notes, is_auto_generated, tenant_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        booking_id,
        customer_id,
        invoice_number,
        status,
        invoice_date,
        subtotal,
        vat_rate,
        vat_amount,
        total_amount,
        currency_code,
        notes || null,
        is_auto_generated,
        tenant_id || null,
      ]
    );

    return NextResponse.json({ message: getErrorMessage("createdSuccess", lang) }, { status: 201 });

  } catch (error) {
    console.error("POST invoices error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  }}

/**
 * DELETE /api/v1/admin/invoices
 *
 * Soft-deletes multiple invoices by marking them as 'cancelled'.
 * Only invoices with status 'draft' can be deleted.
 *
 * Request Body:
 *   - invoice_ids (number[], required) : Array of invoice IDs to delete
 *   - tenant_id (number, optional)     : Tenant ID for access check
 *
 * Response:
 *   - 200: { message }                     : Indicates how many invoices were cancelled
 *   - 400: { error }                       : Validation failed (missing or invalid IDs)
 *   - 401: { error }                       : Unauthorized access or tenant restriction
 *   - 404: { error }                       : No draft invoices found for deletion
 *   - 500: { error }                       : Internal server error
 *
 */
export async function DELETE(req: NextRequest) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const { invoice_ids, tenant_id } = await req.json();

    // Validation
    if (!Array.isArray(invoice_ids) || invoice_ids.length === 0) {
      return NextResponse.json({ error: getErrorMessage("missingInvoiceIds", lang) }, { status: 400 });
    }

    const normalizedIds = invoice_ids.map((id: any) => Number(id)).filter(id => !Number.isNaN(id));
    if (!normalizedIds.length) {
      return NextResponse.json({ error: getErrorMessage("invalidInvoiceIds", lang) }, { status: 400 });
    }

    const user: any = await getUserData(req);

    // Permission check
    const hasAccess = await hasPermission(user, "delete_invoices");
    if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

    // Tenant access check
    if (tenant_id) {
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    // Only draft invoices can be deleted
    const [rows] = await pool.query(
      `SELECT id FROM invoices WHERE id IN (?) AND status != 'cancelled'`,
      [normalizedIds]
    );
    const deletable = (rows as any[]).map(r => r.id);

    if (!deletable.length) {
      return NextResponse.json({ error: getErrorMessage("noInvoicesFound", lang) }, { status: 404 });
    }

    // Soft delete (mark as cancelled)
    await pool.query(
      `UPDATE invoices SET status = 'cancelled', updated_at = NOW() WHERE id IN (?)`,
      [deletable]
    );

    return NextResponse.json({ message: errorMessages[lang].deletedSuccess(deletable.length) }, { status: 200 });

  } catch (error) {
    console.error("DELETE invoices error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}
