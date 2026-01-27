import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { hasPermission, getUserData, hasTenantAccess } from "../../../functions/permissions";
import { validateFields } from "../../../functions/validation";
import { sendEmail } from "../../../functions/email";
// Error messages
const invoiceErrorMessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    invoiceNotFound: "Invoice not found.",
    deletedSuccess: (count: number) => `${count} invoice(s) deleted successfully.`,
    updatedSuccess: "Invoice updated successfully.",
  },
  ar: {
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    invoiceNotFound: "الفاتورة غير موجودة.",
    deletedSuccess: (count: number) => `تم حذف ${count} فاتورة(ات) بنجاح.`,
    updatedSuccess: "تم تعديل الفاتورة بنجاح.",
  },
};

function getInvoiceErrorMessage(key: keyof typeof invoiceErrorMessages["en"], lang: "en" | "ar" = "en", count?: number) {
  const msg = invoiceErrorMessages[lang][key];
  if (typeof msg === "function") return msg(count || 0);
  return msg;
}
/**
 * GET /api/v1/admin/invoices/[invoiceId]
 *
 * Fetch a single invoice by its ID.
 * Returns invoice details along with related booking, customer, and vehicle info.
 *
 * Path Parameters:
 *   - invoiceId (number, required): The ID of the invoice to fetch
 *
 * Query Parameters:
 *   - tenant_id (number, required): Tenant ID for access control
 *
 * Access Control:
 *   - User must have 'view_invoices' permission
 *   - If tenant_id is provided, user must have access to that tenant
 *
 * Responses:
 *   - 200: Returns the invoice object with fields:
 *       - invoice fields (i.*)
 *       - booking_id, booking_status
 *       - customer_name
 *       - vehicle_name
 *   - 400: Missing invoiceId or tenant_id
 *   - 401: Unauthorized access
 *   - 404: Invoice not found or cancelled
 *   - 500: Internal server error
 *
 * Notes:
 *   - Only invoices with status != 'cancelled' are returned
 *   - Left joins are used to fetch booking, customer, and vehicle details
 *   - tenant_id is mandatory for permission checks
 */
export async function GET(req: NextRequest, { params }: any) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
  const invoiceId = params.invoiceId;
  const { searchParams } = new URL(req.url);
  const tenant_id = searchParams.get("tenant_id");

  try {
    if (!invoiceId) return NextResponse.json({ error: getInvoiceErrorMessage("invoiceNotFound", lang) }, { status: 400 });
     if (!tenant_id) return NextResponse.json({ error: getInvoiceErrorMessage("unauthorized", lang) }, { status: 400 });

    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const hasAccess = await hasPermission(user, "view_invoices");
    if (!hasAccess) return NextResponse.json({ error: getInvoiceErrorMessage("unauthorized", lang) }, { status: 401 });

    const tenantAccess = await hasTenantAccess(user, tenant_id);
    if (!tenantAccess) return NextResponse.json({ error: getInvoiceErrorMessage("unauthorized", lang) }, { status: 401 });

    const [rows] = await pool.query(
      `SELECT i.*, b.id AS booking_id, b.status AS booking_status,
              c.full_name AS customer_name, v.make AS vehicle_name
       FROM invoices i
       LEFT JOIN bookings b ON b.id = i.booking_id
       LEFT JOIN customers c ON c.id = b.customer_id
       LEFT JOIN vehicles v ON v.id = b.vehicle_id
       WHERE i.id = ? AND i.tenant_id = ? AND i.status != 'cancelled'
       LIMIT 1`,
      [invoiceId, tenant_id]
    );

    const invoice = (rows as any[])[0];
    if (!invoice) return NextResponse.json({ error: getInvoiceErrorMessage("invoiceNotFound", lang) }, { status: 404 });

    return NextResponse.json(invoice, { status: 200 });
  } catch (error) {
    console.error("GET invoice error:", error);
    return NextResponse.json({ error: getInvoiceErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * PUT /api/v1/admin/invoices/[invoiceId]
 *
 * Updates a single invoice by its ID.
 * Only invoices with status 'draft' can be updated.
 * Automatically recalculates VAT and total_amount if subtotal or vat_rate are updated.
 *
 * Path Parameters:
 *   - invoiceId (number, required): The ID of the invoice to update
 *
 * Request Body:
 *   - tenant_id (number, required): Tenant ID for access control
 *   - subtotal (number, optional): New subtotal amount
 *   - vat_rate (number, optional): New VAT rate
 *   - currency_code (string, optional): New currency code
 *   - notes (string, optional): Notes or comments for the invoice
 *
 * Access Control:
 *   - User must have 'edit_invoices' permission
 *   - If tenant_id is provided, user must have access to that tenant
 *
 * Responses:
 *   - 200: Success message indicating invoice updated
 *   - 400: Missing invoiceId or tenant_id
 *   - 401: Unauthorized access
 *   - 404: Invoice not found or not draft
 *   - 500: Internal server error
 *
 * Notes:
 *   - Only updates provided fields; fields not included remain unchanged
 *   - VAT amount and total amount are recalculated if subtotal or vat_rate change
 *   - updated_at timestamp is updated automatically
 */
export async function PUT(req: NextRequest, { params }: any) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
  const invoiceId = params.invoiceId;

  try {
    const pool = await dbConnection();
    const user: any = await getUserData(req);
    const payload = await req.json();
    const { subtotal, vat_rate, currency_code, notes, tenant_id ,status} = payload;

    if (!invoiceId) return NextResponse.json({ error: getInvoiceErrorMessage("invoiceNotFound", lang) }, { status: 400 });
    if (!tenant_id) return NextResponse.json({ error: getInvoiceErrorMessage("unauthorized", lang) }, { status: 400 });

    const hasAccess = await hasPermission(user, "edit_invoices");
    if (!hasAccess) return NextResponse.json({ error: getInvoiceErrorMessage("unauthorized", lang) }, { status: 401 });

    const tenantAccess = await hasTenantAccess(user, tenant_id);
    if (!tenantAccess) return NextResponse.json({ error: getInvoiceErrorMessage("unauthorized", lang) }, { status: 401 });

    const [existingRows] = await pool.query("SELECT * FROM invoices WHERE id = ? AND tenant_id = ? AND status = 'draft'", [invoiceId, tenant_id]);
    const invoice = (existingRows as any[])[0];
    if (!invoice) return NextResponse.json({ error: getInvoiceErrorMessage("invoiceNotFound", lang) }, { status: 404 });

    const newSubtotal = subtotal !== undefined ? subtotal : invoice.subtotal;
    const newVatRate = vat_rate !== undefined ? vat_rate : invoice.vat_rate;
    const vat_amount = parseFloat(((newSubtotal * newVatRate) / 100).toFixed(2));
    const total_amount = parseFloat((newSubtotal + vat_amount).toFixed(2));

    const fields: string[] = [];
    const values: any[] = [];

    fields.push("subtotal = ?", "vat_rate = ?", "vat_amount = ?", "total_amount = ?");
    values.push(newSubtotal, newVatRate, vat_amount, total_amount);

    if (currency_code) { fields.push("currency_code = ?"); values.push(currency_code); }
    if (notes) { fields.push("notes = ?"); values.push(notes); }
      if (status) { fields.push("status = ?"); values.push(status); }

    await pool.query(`UPDATE invoices SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ? AND tenant_id = ?`, [...values, invoiceId, tenant_id]);
    // إرسال إيميل إذا تغيرت الحالة من draft إلى issued
    if (status === "issued") {
      const [customerRows] = await pool.query("SELECT email, full_name FROM customers WHERE id = ?", [invoice.customer_id]);
      const customer = (customerRows as any[])[0];
      if (customer?.email) {
        await sendEmail({
          to: customer.email,
          subject: lang === "ar" ? "تم إصدار فاتورتك" : "Your Invoice Has Been Issued",
       text: lang === "ar"
  ? `مرحباً ${customer.full_name}،\nتم إصدار فاتورتك رقم ${invoice.invoice_number}.\nالمبلغ الإجمالي: ${total_amount} ${currency_code} (شامل الضريبة بنسبة ${vat_rate}%)`
  : `Hello ${customer.full_name},\nYour invoice ${invoice.invoice_number} has been issued.\nTotal amount: ${total_amount} ${currency_code} (including VAT at ${vat_rate}%)`
 });
      }
    }
    return NextResponse.json({ message: getInvoiceErrorMessage("updatedSuccess", lang) }, { status: 200 });
  } catch (error) {
    console.error("PUT invoice error:", error);
    return NextResponse.json({ error: getInvoiceErrorMessage("serverError", lang) }, { status: 500 });
  }
}
/**
 * DELETE /api/v1/admin/invoices/[invoiceId]
 *
 * Soft-deletes a single invoice by its ID.
 * Only invoices with status 'draft' can be cancelled.
 *
 * Path Parameters:
 *   - invoiceId (number, required): The ID of the invoice to delete
 *
 * Request Body:
 *   - tenant_id (number, required): Tenant ID for access control
 *
 * Access Control:
 *   - User must have 'delete_invoices' permission
 *   - User must have access to the provided tenant_id
 *
 * Responses:
 *   - 200: Success message indicating invoice was cancelled
 *   - 400: Missing invoiceId or tenant_id
 *   - 401: Unauthorized access
 *   - 404: Invoice not found or not draft
 *   - 500: Internal server error
 *
 * Notes:
 *   - Performs a soft delete by setting status = 'cancelled'
 *   - Only affects invoices with status 'draft'
 *   - updated_at timestamp is updated automatically
 */
export async function DELETE(req: NextRequest, { params }: any) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
  const invoiceId = params.invoiceId;

  try {
    const pool = await dbConnection();
    const user: any = await getUserData(req);
    const { tenant_id } = await req.json();

    if (!invoiceId) return NextResponse.json({ error: getInvoiceErrorMessage("invoiceNotFound", lang) }, { status: 400 });
    if (!tenant_id) return NextResponse.json({ error: getInvoiceErrorMessage("unauthorized", lang) }, { status: 400 });

    const hasAccess = await hasPermission(user, "delete_invoices");
    if (!hasAccess) return NextResponse.json({ error: getInvoiceErrorMessage("unauthorized", lang) }, { status: 401 });

    const tenantAccess = await hasTenantAccess(user, tenant_id);
    if (!tenantAccess) return NextResponse.json({ error: getInvoiceErrorMessage("unauthorized", lang) }, { status: 401 });

    const [existingRows] = await pool.query("SELECT id FROM invoices WHERE id = ? AND tenant_id = ? AND status = 'draft'", [invoiceId, tenant_id]);
    if (!(existingRows as any[]).length) return NextResponse.json({ error: getInvoiceErrorMessage("invoiceNotFound", lang) }, { status: 404 });

    await pool.query("UPDATE invoices SET status = 'cancelled', updated_at = NOW() WHERE id = ? AND tenant_id = ?", [invoiceId, tenant_id]);

    return NextResponse.json({ message: getInvoiceErrorMessage("deletedSuccess", lang, 1) }, { status: 200 });
  } catch (error) {
    console.error("DELETE invoice error:", error);
    return NextResponse.json({ error: getInvoiceErrorMessage("serverError", lang) }, { status: 500 });
  }
}
