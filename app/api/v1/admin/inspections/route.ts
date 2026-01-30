import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../functions/permissions";
import { validateFields } from "../../functions/validation";

/* ================= Messages ================= */
const errormessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    created: "Inspection created successfully.",
    notFound: "Inspection not found.",
    bookingNotFound: "Booking not found.",
    invalidInspectionIds: "Inspection IDs are invalid.",
    noInspectionsFound: "No matching inspections found.",
    missingInspectionIds: "Inspection IDs are missing.",
    createdSuccess: "Inspection created successfully.",
    deletedSuccess: "inspection(s) deleted successfully.",
  },
  ar: {
    serverError: "خطأ في الخادم.",
    unauthorized: "دخول غير مصرح.",
    created: "تم إنشاء الفحص بنجاح.",
    bookingNotFound: "الحجز غير موجود.",
    invalidInspectionIds: "معرّفات الفحوصات غير صالحة.",
    noInspectionsFound: "لم يتم العثور على أي فحوصات مطابقة.",
    notFound: "الفحص غير موجود.",
    missingInspectionIds: "معرّفات الفحوصات مفقودة.",
    createdSuccess: "تم إنشاء الفحص بنجاح.",
    deletedSuccess: "تم حذف الفحص/الفحوصات بنجاح."

  }
};

function messages(key: keyof typeof errormessages["en"], lang: "en" | "ar" = "en") {
  return errormessages[lang][key] || errormessages["en"][key];
}
/**
 * GET /api/v1/admin/inspections
 *
 * Retrieves a paginated list of vehicle inspections.
 * Supports optional filtering by tenant, booking, status, and search term.
 *
 * Query Parameters:
 *   - tenant_id (optional): Filter inspections for a specific tenant/company.
 *   - booking_id (optional): Filter inspections for a specific booking.
 *   - status (optional, "pending" or "completed"): Filter inspections by status.
 *   - search (optional): Search term applied to vehicle make or inspection type.
 *   - page (optional, default = 1): Page number for pagination.
 *   - pageSize (optional, default = 20): Number of records per page.
 *
 * Response:
 *   - 200: {
 *       count: total number of matching inspections,
 *       page: current page number,
 *       pageSize: number of records per page,
 *       totalPages: total pages,
 *       data: array of inspections with fields:
 *         - inspected_by_name / inspected_by_name_ar
 *         - vehicle_name
 *         - vehicle_id
 *         - inspection_date (YYYY-MM-DD)
 *         - booking_id
 *         - other inspection fields
 *     }
 *   - 401: Unauthorized access (no permission or tenant access denied)
 *   - 500: Internal server error
 *
 * Notes:
 *   - Inspections with status 'deleted' are excluded.
 *   - Pagination and filtering are applied at the database query level.
 */
export async function GET(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    // صلاحيات
    if (process.env.NODE_ENV === "production") {
      const canView = await hasPermission(user, "view_inspections");
      if (!canView) {
        return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");
    const booking_id = searchParams.get("booking_id");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 20);

    // تحقق من صلاحية tenant
    if (process.env.NODE_ENV === "production" && tenant_id) {
      const allowed = await hasTenantAccess(user, tenant_id);
      if (!allowed) {
        return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
      }
    }

    /* ================= WHERE ================= */
    let where = "i.status != 'deleted'";
    const params: any[] = [];

    if (booking_id) {
      where += " AND i.booking_id = ?";
      params.push(booking_id);
    }

    if (tenant_id) {
      // tenant من السيارة إذا ما في booking
      where += " AND (v.tenant_id = ?)";
      params.push(tenant_id);
    }

    if (status && ["pending", "completed"].includes(status)) {
      where += " AND i.status = ?";
      params.push(status);
    }

    if (search) {
      where += " AND (v.make LIKE ? OR i.inspection_type LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term);
    }

    /* ================= COUNT ================= */
    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM inspections i
      JOIN vehicles v ON v.id = i.vehicle_id
      LEFT JOIN bookings b ON b.id = i.booking_id
      WHERE ${where}
      `,
      params
    );

    const count = (countRows as any[])[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    /* ================= FETCH ================= */
    const [rows] = await pool.query(
      `
      SELECT 
        i.*,
        u.full_name AS inspected_by_name,
        u.full_name_ar AS inspected_by_name_ar,
        v.make AS vehicle_name,
        v.id AS vehicle_id,
        v.tenant_id AS vehicle_tenant_id,
        DATE_FORMAT(i.inspection_date, '%Y-%m-%d') AS inspection_date,
        b.id AS booking_id
      FROM inspections i
      JOIN vehicles v ON v.id = i.vehicle_id
      LEFT JOIN bookings b ON b.id = i.booking_id
      LEFT JOIN users u ON u.id = i.inspected_by
      WHERE ${where}
      ORDER BY i.inspection_date DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ count, page, pageSize, totalPages, data: rows }, { status: 200 });

  } catch (e) {
    console.error("GET inspections error:", e);
    return NextResponse.json({ error: messages("serverError", "en") }, { status: 500 });
  }
}



/* =========================================================
   POST /api/v1/admin/inspections
   ---------------------------------------------------------
   Creates a new vehicle inspection for a booking.

   Request Body:
     - booking_id (number, required)       : ID of the booking
     - vehicle_id (number, required)       : ID of the vehicle
     - inspection_type (string, required)  : 'pre_rental' or 'post_rental'
     - inspection_date (datetime, optional): Date of the inspection (defaults to now)
     - odometer (number, optional)         : Odometer reading at inspection
     - fuel_level (number, optional)       : Fuel level at inspection (percentage)
     - checklist_results (object, optional): JSON object with checklist results
     - notes (string, optional)            : Additional notes

   Response:
     - 201: { message: "Inspection created successfully." }
     - 400: { error }  -> Validation failed
     - 401: { error }  -> Unauthorized access
     - 404: { error }  -> Booking not found
     - 500: { error }  -> Internal server error
========================================================= */

export async function POST(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!(await hasPermission(user, "add_inspections"))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    const payload = await req.json();
    const rules: any = {
      booking_id: [{ required: false, type: "number", label: "Booking ID" }],
      vehicle_id: [{ required: true, type: "number", label: "Vehicle ID" }],
      inspection_type: [{ required: true, type: "string", label: "Inspection Type" }],
      odometer: [{ required: false, type: "number", label: "Odometer" }],
      fuel_level: [{ required: false, type: "number", label: "Fuel Level" }],
      checklist_results: [{ required: false, type: "object", label: "Checklist Results" }],
      notes: [{ required: false, type: "string", label: "Notes" }],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) return NextResponse.json({ error: errors }, { status: 400 });
    if(payload.booking_id){const [booking] = await pool.query(`SELECT tenant_id FROM bookings WHERE id = ?`, [payload.booking_id]);
    if (!(booking as any[]).length) {
      return NextResponse.json({ error: messages("bookingNotFound", lang) }, { status: 404 });
    }
      const tenant_id = (booking as any)[0].tenant_id;
    if (!(await hasTenantAccess(user, tenant_id))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

  }
  
    await pool.query(
      `INSERT INTO inspections
       (booking_id, vehicle_id, inspection_type, inspection_date, odometer, fuel_level, checklist_results, notes, inspected_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.booking_id||null,
        payload.vehicle_id,
        payload.inspection_type,
        payload.inspection_date || new Date(),
        payload.odometer || null,
        payload.fuel_level || null,
        payload.checklist_results ? JSON.stringify(payload.checklist_results) : null,
        payload.notes || null,
        user.id,
      ]
    );

    return NextResponse.json({ message: messages("createdSuccess", lang) }, { status: 201 });

  } catch (e) {
    console.error("POST inspections error:", e);
    return NextResponse.json({ error: messages("serverError", "en") }, { status: 500 });
  }
}
/**
 * DELETE /api/v1/admin/inspections
 *
 * Soft-deletes multiple inspections by IDs.
 *
 * Access control:
 *   - User must have "delete_inspections" permission
 *   - User must have access to the tenant of each inspection's booking
 *
 * Request Body:
 *   - inspection_ids (number[], required): Array of inspection IDs to delete
 *
 * Response:
 *   - 200: { message } : Number of inspections deleted successfully
 *   - 400: { error }   : Missing or invalid IDs
 *   - 401: { error }   : Unauthorized access or tenant not allowed
 *   - 404: { error }   : No matching inspections found
 *   - 500: { error }   : Internal server error
 */
export async function DELETE(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!(await hasPermission(user, "delete_inspections"))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    const { inspection_ids } = await req.json();
    if (!Array.isArray(inspection_ids) || !inspection_ids.length) {
      return NextResponse.json({ error: messages("missingInspectionIds", lang) }, { status: 400 });
    }

    const normalizedIds = inspection_ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
    if (!normalizedIds.length) {
      return NextResponse.json({ error: messages("invalidInspectionIds", lang) }, { status: 400 });
    }

    // جلب tenant_id من booking أو vehicle
    const [existing] = await pool.query(
      `SELECT 
         i.id, 
         COALESCE(b.tenant_id, v.tenant_id) AS tenant_id
       FROM inspections i
       LEFT JOIN bookings b ON b.id = i.booking_id
       LEFT JOIN vehicles v ON v.id = i.vehicle_id
       WHERE i.id IN (?) AND i.status != 'deleted'`,
      [normalizedIds]
    );

    const existingArr = existing as Array<{ id: number; tenant_id: number }>;
    if (!existingArr.length) {
      return NextResponse.json({ error: messages("noInspectionsFound", lang) }, { status: 404 });
    }

    // تحقق من صلاحية المستخدم على كل tenant
    for (const inspection of existingArr) {
      if (!(await hasTenantAccess(user, inspection.tenant_id))) {
        return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
      }
    }

    const deletableIds = existingArr.map((i) => i.id);

    // Soft delete
    await pool.query(`UPDATE inspections SET status='deleted' WHERE id IN (?)`, [deletableIds]);

    return NextResponse.json({ message: messages("deletedSuccess", lang) }, { status: 200 });

  } catch (e) {
    console.error("DELETE inspections error:", e);
    return NextResponse.json({ error: messages("serverError", "en") }, { status: 500 });
  }
}


