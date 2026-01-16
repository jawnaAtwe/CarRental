// app/api/v1/admin/bookings.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { validateFields } from "../../functions/validation";

const errorMessages = {
  en: {
    missingFields: "Required fields are missing.",
    serverError: "Internal server error.",
    success: "Booking created successfully.",
    missingTenant:"Tenant Id is required",
    startDate:"Start date is required.",
    endDate:"End date is required.",
    deleted: (count: number) => `Deleted ${count} user(s).`,
     missingBookingIds: "Booking IDs are required.",
      invalidBookingIds: "Invalid booking IDs.",
  },
  ar: {
    missingFields: "الحقول المطلوبة مفقودة.",
    serverError: "خطأ في الخادم الداخلي.",
    success: "تم إنشاء الحجز بنجاح.",
    missingTenant:"مطلوب رقم المنظمة",
    startDate:"تاريخ بداية الحجز مطلوب.",
    endDate:"تاريخ نهاية الحجز مطلوب ",
    deleted: (count: number) => `تم حذف ${count} مستخدم${count === 1 ? "" : "ين"}.`,
      missingBookingIds: "يجب تزويد أرقام الحجوزات.",
      invalidBookingIds: "أرقام الحجوزات غير صالحة.",
  },
};

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}
/**
 * POST /api/v1/admin/bookings
 *
 * إنشاء حجز جديد في جدول `bookings`.
 *
 * الهيدر:
 *   - accept-language (اختياري): "en" أو "ar" لتحديد لغة الرسائل
 *
 * جسم الطلب (JSON):
 *   - tenant_id (bigint, required)      : رقم المستأجر / المنظمة
 *   - branch_id (bigint, optional)      : رقم الفرع
 *   - vehicle_id (bigint, optional)     : رقم السيارة
 *   - customer_id (bigint, optional)    : رقم العميل
 *   - start_date (datetime, required)   : تاريخ بداية الحجز
 *   - end_date (datetime, required)     : تاريخ نهاية الحجز
 *   - status (enum, optional)           : حالة الحجز ["pending","confirmed","active","completed","deleted"]، افتراضي "pending"
 *   - total_amount (decimal, optional)  : المبلغ الإجمالي، افتراضي 0
 *   - notes (text, optional)            : ملاحظات
 *
 * الردود:
 *   - 200: { message: "Booking created successfully." }
 *   - 400: { error: "Required fields are missing or invalid." }
 *   - 500: { error: "Internal server error." }
 */

export async function POST(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const payload = await req.json();

    const {
      tenant_id,
      branch_id,
      vehicle_id,
      customer_id,
      start_date,
      end_date,
      status,
      total_amount,
      notes
    } = payload;

// تحقق من tenant_id
if (!tenant_id) {
 return NextResponse.json({ error: getErrorMessage("missingTenant", lang) }, { status: 400 });

}

// تحقق من start_date
if (!start_date) {
  return NextResponse.json({ error: getErrorMessage("startDate", lang) }, { status: 400 });

}

// تحقق من end_date
if (!end_date) {
 return NextResponse.json({ error: getErrorMessage("endDate", lang) }, { status: 400 });
}

    const rules: Record<string, Array<any>> = {
      tenant_id: [{ required: true, label: { en: "Tenant ID", ar: "رقم المستأجر" }[lang] }],
      start_date: [{ required: true, type: "date", label: { en: "Start Date", ar: "تاريخ البداية" }[lang] }],
      end_date: [{ required: true, type: "date", label: { en: "End Date", ar: "تاريخ النهاية" }[lang] }],
      status: [{ enum: ["pending","confirmed","active","completed","deleted"], label: { en: "Status", ar: "الحالة" }[lang] }],
      total_amount: [{ type: "number", min: 0, label: { en: "Total Amount", ar: "المبلغ الإجمالي" }[lang] }],
      notes: [{ required: false, label: { en: "Notes", ar: "ملاحظات" }[lang] }],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) return NextResponse.json({ error: errors }, { status: 400 });

    await pool.query(
      `INSERT INTO bookings (
        tenant_id, branch_id, vehicle_id, customer_id,
        start_date, end_date, status, total_amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenant_id,
        branch_id || null,
        vehicle_id || null,
        customer_id || null,
        start_date,
        end_date,
        status || "pending",
        total_amount || 0,
        notes || null
      ]
    );

    return NextResponse.json({ message: getErrorMessage("success", lang) }, { status: 200 });

  } catch (error) {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    console.error("Create booking error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}


/**
 * GET /api/v1/admin/bookings
 *
 * Fetches a paginated list of all bookings.
 * Supports search, sorting, and pagination. Bookings can be filtered by tenant, branch, vehicle, or customer.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Query Parameters:
 *   - page (number, optional, default 1)           : Page number for pagination
 *   - pageSize (number, optional, default 20)     : Number of records per page
 *   - search (string, optional)                   : Search term applied to notes or status
 *   - tenant_id (number, optional)                : Filter by tenant
 *   - branch_id (number, optional)                : Filter by branch
 *   - vehicle_id (number, optional)               : Filter by vehicle
 *   - customer_id (number, optional)              : Filter by customer
 *   - sortBy (string, optional, default "created_at") : Column to sort by
 *   - sortOrder (string, optional, default "desc")    : "asc" or "desc"
 *
 * Responses:
 *   - 200: {
 *        count: total number of matching bookings,
 *        page: current page number,
 *        pageSize: number of items per page,
 *        totalPages: total pages,
 *        data: array of booking objects
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
    const tenant_id = searchParams.get("tenant_id");
    const branch_id = searchParams.get("branch_id");
    const vehicle_id = searchParams.get("vehicle_id");
    const customer_id = searchParams.get("customer_id");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

    let where = "1=1 AND b.status!='deleted'";
    const params: any[] = [];

    if (search) {
      where += " AND (b.notes LIKE ? OR b.status LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (tenant_id) {
      where += " AND b.tenant_id = ?";
      params.push(tenant_id);
    }
    if (branch_id) {
      where += " AND b.branch_id = ?";
      params.push(branch_id);
    }
    if (vehicle_id) {
      where += " AND b.vehicle_id = ?";
      params.push(vehicle_id);
    }
    if (customer_id) {
      where += " AND b.customer_id = ?";
      params.push(customer_id);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) as count FROM bookings b WHERE ${where}`, params);
    const count = (countRows as any)[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    const [bookings] = await pool.query(
      `SELECT 
        b.id,
        b.tenant_id,
        t.name AS tenant_name,
        b.branch_id,
        br.name AS branch_name,
        br.name_ar AS branch_name_ar,
        b.vehicle_id,
        b.customer_id,
        b.start_date,
        b.end_date,
        b.status,
        b.total_amount,
        b.notes,
        b.created_at,
        b.updated_at
      FROM bookings b
      LEFT JOIN tenants t ON b.tenant_id = t.id
      LEFT JOIN branches br ON b.branch_id = br.id
      WHERE ${where}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );



    return NextResponse.json({ count, page, pageSize, totalPages, data: bookings }, { status: 200 });

  } catch (error) {
    console.error("Get bookings error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
   return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });  }
}
/**
 * DELETE /api/v1/admin/bookings
 *
 * Deletes one or multiple bookings by ID.
 * Performs a soft delete by updating the status to "deleted" and setting deleted_at timestamp.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Request Body (JSON):
 *   - booking_ids (array of numbers, required) : IDs of bookings to delete
 *
 * Validation:
 *   ✔ Checks that booking_ids array is provided and contains valid numbers
 *
 * Responses:
 *   - 200: { message: "Deleted X booking(s)." }
 *   - 400: { error: "Missing or invalid booking IDs." }
 *   - 404: { error: "No matching active bookings found." }
 *   - 500: { error: "Internal server error." }
 */
export async function DELETE(req: NextRequest) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const { booking_ids } = await req.json();

    if (!Array.isArray(booking_ids) || !booking_ids.length) {
      return NextResponse.json({ error: getErrorMessage("missingBookingIds", lang) }, { status: 400 }); 
    
    }

    const normalizedIds = booking_ids.map((id: any) => Number(id)).filter(id => !isNaN(id));
    if (!normalizedIds.length) {
    return NextResponse.json({ error: getErrorMessage("invalidBookingIds", lang) }, { status: 400 });  
  
    }

    const [targetBookings] = await pool.query(
      `SELECT id FROM bookings WHERE id IN (?) AND status!='deleted'`,
      [normalizedIds]
    );

    const deletableIds = (targetBookings as any).map((b: any) => b.id);
    if (!deletableIds.length) {
    return NextResponse.json({ error: getErrorMessage("missingBookingIds", lang) }, { status: 404 }); 
    }

    await pool.query(
      `UPDATE bookings SET status='deleted' WHERE id IN (?)`,
      [deletableIds]
    );

   return NextResponse.json({ message: errorMessages[lang].deleted(deletableIds.length) }, { status: 200 });
 
  } catch (error) {
    console.error("Delete bookings error:", error);
  return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });  
  }
}
