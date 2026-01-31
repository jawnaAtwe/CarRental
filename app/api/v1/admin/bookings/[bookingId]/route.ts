import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { validateFields } from "../../../functions/validation";

const bookingMessages = {
  en: {
    unauthorized: "Unauthorized access.",
    serverError: "Internal server error.",
    noBookingsFound: "Booking not found.",
    missingFields: "Required fields are missing.",
    success: "Booking updated successfully.",
    missingCustomer: "Customer ID is required.",
    missingCar: "Car ID is required.",
    missingStartDate: "Start date is required.",
    missingEndDate: "End date is required.",
    deletedSuccess: "Customer deleted successfully",
  },
  ar: {
    missingCustomer: "معرّف العميل مطلوب.",
    missingCar: "معرّف السيارة مطلوب.",
    missingStartDate: "تاريخ البداية مطلوب.",
    missingEndDate: "تاريخ الانتهاء مطلوب.",
    unauthorized: "دخول غير مصرح به.",
    serverError: "خطأ في الخادم الداخلي.",
    noBookingsFound: "الحجز غير موجود.",
    missingFields: "الحقول المطلوبة مفقودة.",
    success: "تم تعديل الحجز بنجاح.",
    deletedSuccess: "تم حذف بيانات العميل بنجاح"
  },
};

function getBookingMessage(key: keyof typeof bookingMessages["en"], lang: "en" | "ar" = "en") {
  return bookingMessages[lang][key] || bookingMessages["en"][key];
}
/**
 * PUT /api/v1/admin/bookings/[bookingId]
 *
 * Updates a specific booking by its ID.
 * Only fields provided in the request body will be updated.
 * Performs validation on required fields, numeric values, and dates.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Path Parameters:
 *   - bookingId (number, required) : The ID of the booking to update
 *
 * Request Body (JSON):
 *   - customer_id (number, required)          : ID of the customer for the booking
 *   - vehicle_id (number, required)           : ID of the car being booked
 *   - start_date (string, required, YYYY-MM-DD): Booking start date
 *   - end_date (string, required, YYYY-MM-DD)  : Booking end date
 *   - total_amount (number, optional)          : Total amount for the booking
 *   - status (string, optional)                : Booking status ("active", "completed", "cancelled", etc.)
 *   - notes (string, optional)                 : Additional notes about the booking
 *
 * Responses:
 *   - 200: { message: "Booking updated successfully." }
 *   - 400: { error: "Missing or invalid fields." } : For validation errors
 *   - 404: { error: "Booking not found." }         : Booking ID does not exist or is deleted
 *   - 500: { error: "Internal server error." }    : Any unexpected server error
 *
 */

export async function PUT(req: Request, { params }: { params: { bookingId: string } }) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const bookingId = Number(params.bookingId);

    if (isNaN(bookingId)) {
      return NextResponse.json({ error: getBookingMessage("noBookingsFound", lang) }, { status: 404 });
    }

    const payload = await req.json();

  if (!payload.customer_id) {
  return NextResponse.json({ error: getBookingMessage("missingCustomer", lang) }, { status: 400 });
}

if (!payload.vehicle_id) {
  return NextResponse.json({ error: getBookingMessage("missingCar", lang) }, { status: 400 });
}

if (!payload.start_date) {
  return NextResponse.json({ error: getBookingMessage("missingStartDate", lang) }, { status: 400 });
}

if (!payload.end_date) {
  return NextResponse.json({ error: getBookingMessage("missingEndDate", lang) }, { status: 400 });
}


    // Validation rules
    const rules: Record<string, Array<any>> = {
      customer_id: [{ type: "number", required: true, label: { en: "Customer ID", ar: "معرّف العميل" }[lang] }],
      vehicle_id: [{ type: "number", required: true, label: { en: "Car ID", ar: "معرّف السيارة" }[lang] }],
      start_date: [{ type: "date", required: true, label: { en: "Start Date", ar: "تاريخ البداية" }[lang] }],
      end_date: [{ type: "date", required: true, label: { en: "End Date", ar: "تاريخ الانتهاء" }[lang] }],
      total_amount: [{ type: "number", label: { en: "Total Amount", ar: "المبلغ الإجمالي" }[lang] }],
      status: [{ type: "string", label: { en: "Status", ar: "الحالة" }[lang] }],
      notes: [{ type: "string", label: { en: "Notes", ar: "ملاحظات" }[lang] }],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) return NextResponse.json({ error: errors }, { status: 400 });

    const [existingRows] = await pool.query(
      `SELECT * FROM bookings WHERE id = ? AND status != 'deleted'`,
      [bookingId]
    );
    const booking = (existingRows as any)[0];
    if (!booking) {
      return NextResponse.json({ error: getBookingMessage("noBookingsFound", lang) }, { status: 404 });
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (payload.customer_id) { fields.push("customer_id = ?"); values.push(payload.customer_id); }
    if (payload.vehicle_id) { fields.push("vehicle_id = ?"); values.push(payload.vehicle_id); }
    if (payload.start_date) { fields.push("start_date = ?"); values.push(payload.start_date); }
    if (payload.end_date) { fields.push("end_date = ?"); values.push(payload.end_date); }
    if (payload.status) { fields.push("status = ?"); values.push(payload.status); }
    if (payload.total_amount !== undefined) { fields.push("total_amount = ?"); values.push(payload.total_amount); }
    if (payload.notes) { fields.push("notes = ?"); values.push(payload.notes); }

    values.push(booking.id);

    await pool.query(`UPDATE bookings SET ${fields.join(", ")} WHERE id = ?`, values);
   if (payload.status === "confirmed") {
  try {
    const [vehicleRows] = await pool.query(`SELECT currency_code FROM vehicles WHERE id = ?`, [booking.vehicle_id]);
    const vehicle = (vehicleRows as any)[0];
    const currency = vehicle?.currency_code || "";
    const invoice_number = `INV-${Date.now()}`;
    await pool.query(
      `INSERT INTO invoices
        (booking_id, customer_id, invoice_number,invoice_date,total_amount,subtotal,vat_rate, currency_code,vat_amount, is_auto_generated, tenant_id,status, created_at, updated_at)
       VALUES (?, ?,?,  NOW(),?, ?, ?,?, ?,?,?,?, NOW(), NOW())`,
      [
        booking.id,
        booking.customer_id,
        invoice_number,
        payload.total_amount || booking.total_amount,
         payload.total_amount || booking.total_amount,
         0,
        currency,
        0,
        1,
        booking.tenant_id || null,
        'draft'
      ]
    );
  } catch (err) {
    console.error("Error calling invoices API:", err);
  }
}

    return NextResponse.json({ message: getBookingMessage("success", lang) }, { status: 200 });

  } catch (error) {
    console.error("Update booking error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getBookingMessage("serverError", lang) }, { status: 500 });
  }
}
/**
 * GET /api/v1/admin/bookings/[bookingId]
 *
 * Fetches a specific booking by its ID.
 * Returns all booking details if the booking exists and is not soft-deleted.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Path Parameters:
 *   - bookingId (number, required) : The ID of the booking to fetch
 *
 * Responses:
 *   - 200: { booking object } : Returns the booking details
 *   - 401: { error: "Unauthorized access." } : User does not have permission
 *   - 404: { error: "Booking not found." } : No matching active booking
 *   - 500: { error: "Internal server error." } : Server error
 */
export async function GET(req: NextRequest, { params }: any) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const bookingId = Number(params.bookingId);

    if (isNaN(bookingId)) {
      return NextResponse.json({ error: getBookingMessage("noBookingsFound", lang) }, { status: 404 });
    }

   const [rows] = await pool.query(
  `SELECT 
      b.*,
      v.late_fee_day,
      v.late_fee_hour,
      DATE_FORMAT(b.start_date, '%Y-%m-%d %H:%i') AS start_date,
      DATE_FORMAT(b.end_date, '%Y-%m-%d %H:%i') AS end_date,
      c.full_name AS customer_name,
      CONCAT(v.make, ' ', v.model) AS vehicle_name,
      br.name AS branch_name,
      br.name_ar AS branch_name_ar,
      v.currency_code
   FROM bookings b
   LEFT JOIN customers c ON b.customer_id = c.id
   LEFT JOIN vehicles v ON b.vehicle_id = v.id
   LEFT JOIN branches br ON b.branch_id = br.id
   WHERE b.id = ? AND b.status != 'deleted'`,
  [bookingId]
);


    const booking = (rows as any)[0];
    if (!booking) {
      return NextResponse.json({ error: getBookingMessage("noBookingsFound", lang) }, { status: 404 });
    }

    return NextResponse.json(booking, { status: 200 });

  } catch (error) {
    console.error("Get booking by ID error:", error);
    return NextResponse.json({ error: getBookingMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/bookings/[bookingId]
 *
 * Soft-deletes a specific booking by ID.
 * The booking is not removed from the database; its `status` is set to "deleted".
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Path Parameters:
 *   - bookingId (number, required) : The ID of the booking to delete
 *
 * Responses:
 *   - 200: { message: "Booking deleted successfully." } : Successfully soft-deleted the booking
 *   - 401: { error } : Unauthorized access or insufficient permissions
 *   - 404: { error } : Booking not found or already deleted
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
    const bookingId = Number(params.bookingId);

    if (isNaN(bookingId)) {
      return NextResponse.json({ error: getBookingMessage("noBookingsFound", lang) }, { status: 404 });
    }

    const [rows] = await pool.query(
      `SELECT id FROM bookings WHERE id = ? AND status != 'deleted'`,
      [bookingId]
    );

    const booking = (rows as any)[0];
    if (!booking) {
      return NextResponse.json({ error: getBookingMessage("noBookingsFound", lang) }, { status: 404 });
    }

    await pool.query(
      `UPDATE bookings SET status = 'deleted' WHERE id = ?`,
      [bookingId]
    );

    return NextResponse.json({ message: getBookingMessage("deletedSuccess", lang) }, { status: 200 });

  } catch (error) {
    console.error("Delete booking error:", error);
    return NextResponse.json({ error: getBookingMessage("serverError", lang) }, { status: 500 });
  }
}
