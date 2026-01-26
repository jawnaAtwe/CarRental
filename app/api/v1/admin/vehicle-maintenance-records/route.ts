import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../functions/permissions";
import { validateFields } from "../../functions/validation";

/* ================= Messages ================= */
const errormessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    createdSuccess: "Maintenance record created successfully.",
    deletedSuccess: "Maintenance record(s) deleted successfully.",
    missingMaintenanceIds: "Maintenance IDs are missing.",
    invalidMaintenanceIds: "Maintenance IDs are invalid.",
    noMaintenanceFound: "No matching maintenance records found.",
    notFound: "Maintenance record not found.",
  },
  ar: {
    serverError: "خطأ في الخادم.",
    unauthorized: "دخول غير مصرح.",
    createdSuccess: "تم إنشاء سجل الصيانة بنجاح.",
    deletedSuccess: "تم حذف سجلات الصيانة بنجاح.",
    missingMaintenanceIds: "معرّفات الصيانة مفقودة.",
    invalidMaintenanceIds: "معرّفات الصيانة غير صالحة.",
    noMaintenanceFound: "لم يتم العثور على سجلات صيانة مطابقة.",
    notFound: "سجل الصيانة غير موجود.",
  },
};


function messages(
  key: keyof typeof errormessages["en"],
  lang: "en" | "ar" = "en"
) {
  return errormessages[lang][key] || errormessages["en"][key];
}
/**
 * GET /api/v1/admin/vehicle-maintenance-records
 *
 * Retrieves a paginated list of vehicle maintenance records.
 *
 * Access control:
 *   - User must have "view_vehicle_maintenance" permission
 *   - User must have access to the tenant if tenant_id is provided (in production)
 *
 * Query Parameters (all optional except pagination):
 *   - tenant_id (number)           : Filter by tenant/company ID
 *   - vehicle_id (number)          : Filter by vehicle ID
 *   - maintenance_type (string)    : Filter by type (scheduled, repair, inspection, accident)
 *   - status (string)              : Filter by status (planned, in_progress, completed, deleted)
 *   - search (string)              : Search term applied to title or description
 *   - page (number, default=1)     : Page number for pagination
 *   - pageSize (number, default=20): Number of records per page
 *
 * Response:
 *   - 200: {
 *       count: total number of matching records,
 *       page: current page number,
 *       pageSize: number of records per page,
 *       totalPages: total number of pages,
 *       data: array of maintenance records with fields:
 *         - id
 *         - tenant_id
 *         - vehicle_id
 *         - branch_id
 *         - vendor_id
 *         - maintenance_type
 *         - title
 *         - description
 *         - status
 *         - start_date
 *         - end_date
 *         - odometer
 *         - cost
 *         - next_due_date
 *         - next_due_mileage
 *         - notes
 *         - created_at
 *         - updated_at
 *         - plate_number
 *         - model
 *         - vendor_name
 *         - branch_name
 *     }
 *   - 401: Unauthorized access (permission denied or tenant access denied)
 *   - 500: Internal server error
 */

export async function GET(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (process.env.NODE_ENV === "production") {
      const canView = await hasPermission(user, "view_vehicle_maintenance");
      if (!canView) {
        return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");
    const vehicle_id = searchParams.get("vehicle_id");
    const maintenance_type = searchParams.get("maintenance_type");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 20);

    if (tenant_id && process.env.NODE_ENV === "production") {
      const allowed = await hasTenantAccess(user, tenant_id);
      if (!allowed) {
        return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
      }
    }

    /* ---------------- WHERE ---------------- */
    let where = "m.status != 'deleted'";
    const params: any[] = [];

    if (tenant_id) { where += " AND m.tenant_id = ?"; params.push(tenant_id); }
    if (vehicle_id) { where += " AND m.vehicle_id = ?"; params.push(vehicle_id); }
    if (maintenance_type) { where += " AND m.maintenance_type = ?"; params.push(maintenance_type); }
    if (status) { where += " AND m.status = ?"; params.push(status); }
    if (search) { where += " AND (m.title LIKE ? OR m.description LIKE ?)"; const term = `%${search}%`; params.push(term, term); }

    /* ---------------- COUNT ---------------- */
    const [countRows] = await pool.query(`SELECT COUNT(*) AS count FROM vehicle_maintenance_records m WHERE ${where}`, params);
    const count = (countRows as any[])[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    /* ---------------- FETCH ---------------- */
    const [rows] = await pool.query(
      `
      SELECT
        m.*,
        v.model,
        ven.name AS vendor_name,
        DATE_FORMAT(m.start_date, '%Y-%m-%d') AS start_date, 
        DATE_FORMAT(m.end_date, '%Y-%m-%d') AS end_date, 
        DATE_FORMAT(m.next_due_date, '%Y-%m-%d') AS next_due_date, 
        b.name AS branch_name
      FROM vehicle_maintenance_records m
      JOIN vehicles v ON v.id = m.vehicle_id
      LEFT JOIN vendors ven ON ven.id = m.vendor_id
      LEFT JOIN branches b ON b.id = m.branch_id
      WHERE ${where}
      ORDER BY m.start_date DESC, m.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, (page - 1) * pageSize]
    );

    const maintenanceRows = rows as any[];

    // ---------------- FETCH ATTACHMENTS ----------------
    if (maintenanceRows.length) {
      const ids = maintenanceRows.map(r => r.id);
      const [attachments] = await pool.query(
        `SELECT * FROM maintenance_attachments WHERE maintenance_id IN (?) AND status='active'`,
        [ids]
      );

      const attachmentsArr = attachments as any[];
      const attachmentsMap: Record<number, any[]> = {};

      attachmentsArr.forEach(att => {
        if (!attachmentsMap[att.maintenance_id]) attachmentsMap[att.maintenance_id] = [];
        attachmentsMap[att.maintenance_id].push(att);
      });

      maintenanceRows.forEach(row => {
        row.attachments = attachmentsMap[row.id] || [];
      });
    }

    return NextResponse.json(
      { count, page, pageSize, totalPages, data: maintenanceRows },
      { status: 200 }
    );

  } catch (e) {
    console.error("GET vehicle maintenance error:", e);
    return NextResponse.json({ error: messages("serverError", "en") }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/vehicle-maintenance-records
 *
 * Creates a new vehicle maintenance record.
 *
 * Access control:
 *   - User must have "add_vehicle_maintenance" permission
 *   - User must have access to the tenant of the vehicle
 *
 * Request Body:
 *   - tenant_id (number, required)           : ID of the tenant/company
 *   - vehicle_id (number, required)          : ID of the vehicle
 *   - maintenance_type (string, required)    : Type of maintenance (scheduled, repair, inspection, accident)
 *   - title (string, optional)               : Short title for the maintenance
 *   - description (string, optional)         : Detailed description
 *   - start_date (string/date, optional)     : Maintenance start date
 *   - end_date (string/date, optional)       : Maintenance end date
 *   - odometer (number, optional)            : Vehicle odometer at maintenance
 *   - cost (number, optional)                : Cost of maintenance
 *   - vendor_id (number, optional)           : Vendor performing the maintenance
 *   - branch_id (number, optional)           : Branch related to the maintenance
 *   - notes (string, optional)               : Additional notes
 *   - next_due_date (string/date, optional)  : Next scheduled maintenance date
 *   - next_due_mileage (number, optional)    : Next maintenance mileage
 *
 * Response:
 *   - 201: { message: "Maintenance record created successfully." }
 *   - 400: { error }  -> Validation failed or missing fields
 *   - 401: { error }  -> Unauthorized access or tenant not allowed
 *   - 500: { error }  -> Internal server error
 *
 */

export async function POST(req: NextRequest) {
  try {
    const lang = req.headers
      .get("accept-language")
      ?.startsWith("ar")
      ? "ar"
      : "en";

    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!(await hasPermission(user, "add_vehicle_maintenance"))) {
      return NextResponse.json(
        { error: messages("unauthorized", lang) },
        { status: 401 }
      );
    }

    const payload = await req.json();

    const rules: any = {
      tenant_id: [{ required: true, type: "number", label: "Tenant ID" }],
      vehicle_id: [{ required: true, type: "number", label: "Vehicle ID" }],
      maintenance_type: [{ required: true, type: "string", label: "Maintenance Type" }],
      title: [{ required: false, type: "string", label: "Title" }],
      description: [{ required: false, type: "string", label: "Description" }],
      start_date: [{ required: false, type: "string", label: "Start Date" }],
      end_date: [{ required: false, type: "string", label: "End Date" }],
      odometer: [{ required: false, type: "number", label: "Odometer" }],
      cost: [{ required: false, type: "number", label: "Cost" }],
      vendor_id: [{ required: false, type: "number", label: "Vendor" }],
      branch_id: [{ required: false, type: "number", label: "Branch" }],
      notes: [{ required: false, type: "string", label: "Notes" }],
      next_due_date: [{ required: false, type: "string", label: "Next Due Date" }],
      next_due_mileage: [{ required: false, type: "number", label: "Next Due Mileage" }],
      attachments: [{ required: false, type: "array", label: "Attachments" }],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    if (!(await hasTenantAccess(user, payload.tenant_id))) {
      return NextResponse.json(
        { error: messages("unauthorized", lang) },
        { status: 401 }
      );
    }

   const [result] = await pool.query(
      `
      INSERT INTO vehicle_maintenance_records
      (
        tenant_id,
        vehicle_id,
        branch_id,
        vendor_id,
        maintenance_type,
        title,
        description,
        start_date,
        end_date,
        odometer,
        cost,
        next_due_date,
        next_due_mileage,
        notes,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
      `,
      [
        payload.tenant_id,
        payload.vehicle_id,
        payload.branch_id || null,
        payload.vendor_id || null,
        payload.maintenance_type,
        payload.title || null,
        payload.description || null,
        payload.start_date || null,
        payload.end_date || null,
        payload.odometer || null,
        payload.cost || 0,
        payload.next_due_date || null,
        payload.next_due_mileage || null,
        payload.notes || null,
        "planned"
      ]
    );
   const maintenanceId = (result as any).insertId;

    if (payload.attachments && Array.isArray(payload.attachments)) {
      for (const file of payload.attachments) {
        const { file_type, file_url } = file;
        await pool.query(
          `INSERT INTO maintenance_attachments (maintenance_id, file_type, file_url) VALUES (?, ?, ?)`,
          [maintenanceId, file_type, file_url]
        );
      }
    }
    return NextResponse.json(
      { message: messages("createdSuccess", lang) },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST vehicle maintenance error:", e);
    return NextResponse.json(
      { error: messages("serverError", "en") },
      { status: 500 }
    );
  }
}
/**
 * DELETE /api/v1/admin/vehicle-maintenance-records
 *
 * Soft-deletes multiple vehicle maintenance records by IDs.
 *
 * Access control:
 *   - User must have "delete_vehicle_maintenance" permission
 *   - User must have access to the tenant of each maintenance record
 *
 * Request Body:
 *   - maintenance_ids (number[], required): Array of maintenance record IDs to delete
 *
 * Response:
 *   - 200: { message }
 *   - 400: { error } : Missing or invalid IDs
 *   - 401: { error } : Unauthorized access
 *   - 404: { error } : No matching maintenance records found
 *   - 500: { error } : Internal server error
 */

export async function DELETE(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    // Permission
    if (!(await hasPermission(user, "delete_vehicle_maintenance"))) {
      return NextResponse.json(
        { error: messages("unauthorized", lang) },
        { status: 401 }
      );
    }

    const { maintenance_ids } = await req.json();

    if (!Array.isArray(maintenance_ids) || !maintenance_ids.length) {
      return NextResponse.json(
        { error: messages("missingMaintenanceIds", lang) },
        { status: 400 }
      );
    }

    const normalizedIds = maintenance_ids
      .map((id: any) => Number(id))
      .filter((id: number) => !isNaN(id));

    if (!normalizedIds.length) {
      return NextResponse.json(
        { error: messages("invalidMaintenanceIds", lang) },
        { status: 400 }
      );
    }

    // Fetch existing records + tenant check
    const [existing] = await pool.query(
      `
      SELECT id, tenant_id
      FROM vehicle_maintenance_records
      WHERE id IN (?) AND status != 'deleted'
      `,
      [normalizedIds]
    );

    const existingArr = existing as Array<{ id: number; tenant_id: number }>;

    if (!existingArr.length) {
      return NextResponse.json(
        { error: messages("noMaintenanceFound", lang) },
        { status: 404 }
      );
    }

    for (const record of existingArr) {
      if (!(await hasTenantAccess(user, record.tenant_id))) {
        return NextResponse.json(
          { error: messages("unauthorized", lang) },
          { status: 401 }
        );
      }
    }

    const deletableIds = existingArr.map((r) => r.id);

    await pool.query(
      `
      UPDATE vehicle_maintenance_records
      SET status = 'deleted'
      WHERE id IN (?)
      `,
      [deletableIds]
    );

    return NextResponse.json(
      { message: messages("deletedSuccess", lang) },
      { status: 200 }
    );
  } catch (e) {
    console.error("DELETE vehicle maintenance error:", e);
    return NextResponse.json(
      { error: messages("serverError", "en") },
      { status: 500 }
    );
  }
}
