'use server';

import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../../functions/permissions";
import { validateFields } from "../../../functions/validation";
const errormessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    notFound: "Vehicle maintenance record not found.",
    createdSuccess: "Vehicle maintenance record created successfully.",
    updatedSuccess: "Vehicle maintenance record updated successfully.",
    deletedSuccess: "Vehicle maintenance record(s) deleted successfully.",
    invalidMaintenanceId: "Invalid vehicle maintenance record ID.",
    missingMaintenanceIds: "Vehicle maintenance record IDs are missing.",
    noRecordsFound: "No matching vehicle maintenance records found.",
    nothingToUpdate: "Nothing to update.",
  },
  ar: {
    serverError: "خطأ في الخادم.",
    unauthorized: "دخول غير مصرح.",
    notFound: "سجل الصيانة غير موجود.",
    createdSuccess: "تم إنشاء سجل الصيانة بنجاح.",
    updatedSuccess: "تم تحديث سجل الصيانة بنجاح.",
    deletedSuccess: "تم حذف سجل/سجلات الصيانة بنجاح.",
    invalidMaintenanceId: "معرّف سجل الصيانة غير صالح.",
    missingMaintenanceIds: "معرّفات سجلات الصيانة مفقودة.",
    noRecordsFound: "لم يتم العثور على سجلات صيانة مطابقة.",
    nothingToUpdate: "لا يوجد شيء لتحديثه.",
  }
};

function messages(
  key: keyof typeof errormessages["en"],
  lang: "en" | "ar" = "en"
) {
  return errormessages[lang][key] || errormessages["en"][key];
}
/**
 * PUT /api/v1/admin/vehicle-maintenance-records/:vehicleMaintenanceRecordsId
 *
 * Updates an existing vehicle maintenance record.
 * Can also update its attachments.
 *
 * Access control:
 *   - User must have "edit_vehicle_maintenance" permission
 *   - User must have access to the tenant of the record (if tenant_id is changed)
 *
 * Path Parameters:
 *   - vehicleMaintenanceRecordsId (number, required): ID of the maintenance record to update
 *
 * Request Body (all optional, only include fields to update):
 *   - tenant_id (number)           : Tenant/company ID
 *   - vehicle_id (number)          : Vehicle ID
 *   - maintenance_type (string)    : Type of maintenance (scheduled, repair, inspection, accident)
 *   - title (string)               : Short title
 *   - description (string)         : Detailed description
 *   - start_date (string/date)     : Start date
 *   - end_date (string/date)       : End date
 *   - odometer (number)            : Vehicle odometer at maintenance
 *   - cost (number)                : Maintenance cost
 *   - vendor_id (number)           : Vendor performing the maintenance
 *   - branch_id (number)           : Branch related to maintenance
 *   - notes (string)               : Additional notes
 *   - next_due_date (string/date)  : Next scheduled maintenance date
 *   - next_due_mileage (number)    : Next maintenance mileage
 *   - status (string)              : Status of maintenance (planned, in_progress, completed, deleted)
 *   - attachments (array)          : Array of attachment objects [{file_type, file_url}, ...]
 *
 * Behavior:
 *   - Validates the payload fields
 *   - Checks user permissions and tenant access
 *   - Updates the maintenance record with the provided fields
 *   - If `attachments` are provided:
 *       1. Deletes all existing attachments for this record
 *       2. Inserts the new attachments
 *   - Returns the updated maintenance record including its active attachments
 *
 * Response:
 *   - 200: { message: "Maintenance record updated successfully.", data: updatedRecord }
 *   - 400: { error } -> Validation errors or invalid ID
 *   - 401: { error } -> Unauthorized access
 *   - 404: { error } -> Record not found
 *   - 500: { error } -> Internal server error
 */


export async function PUT(
  req: NextRequest,
  { params }: { params: { vehicleMaintenanceRecordsId: string } }
) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!(await hasPermission(user, "edit_vehicle_maintenance"))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    const vehicleMaintenanceId = Number(params.vehicleMaintenanceRecordsId);
    if (isNaN(vehicleMaintenanceId)) {
      return NextResponse.json({ error: messages("invalidMaintenanceId", lang) }, { status: 400 });
    }

    const payload = await req.json();

    const rules: any = {
      tenant_id: [{ required: false, type: "number", label: "Tenant ID" }],
      vehicle_id: [{ required: false, type: "number", label: "Vehicle ID" }],
      maintenance_type: [{ required: false, type: "string", label: "Maintenance Type" }],
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
      status: [{ required: false, type: "string", label: "Status" }],
      attachments: [{ required: false, type: "array", label: "Attachments" }],
      payment_status:[{ required: false, type: "string", label: "payment_status" }]
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const [existingRows] = await pool.query(
      `SELECT * FROM vehicle_maintenance_records WHERE id = ? AND status!='deleted'`,
      [vehicleMaintenanceId]
    );
    const existing = (existingRows as any[])[0];
    if (!existing) {
      return NextResponse.json({ error: messages("notFound", lang) }, { status: 404 });
    }

    if (payload.tenant_id && !(await hasTenantAccess(user, payload.tenant_id))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    for (const key of Object.keys(payload)) {
      if (key === "attachments") continue; 
      fields.push(`${key} = ?`);
      values.push(payload[key]);
    }

    if (fields.length > 0) {
      values.push(vehicleMaintenanceId);
      await pool.query(`UPDATE vehicle_maintenance_records SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    
      await pool.query(`UPDATE maintenance_attachments
      SET status = 'deleted' WHERE maintenance_id = ?`, [vehicleMaintenanceId]);
    
      if (payload.attachments && Array.isArray(payload.attachments)) {
      for (const file of payload.attachments) {
        const { file_type, file_url } = file;
        await pool.query(
          `INSERT INTO maintenance_attachments (maintenance_id, file_type, file_url) VALUES (?, ?, ?)`,
          [vehicleMaintenanceId, file_type, file_url]
        );
      }
    }
    const [updatedRows] = await pool.query(
      `SELECT * FROM vehicle_maintenance_records WHERE id = ?`,
      [vehicleMaintenanceId]
    );
    const updated = (updatedRows as any[])[0];

    const [attachments] = await pool.query(
      `SELECT * FROM maintenance_attachments WHERE maintenance_id = ? AND status='active'`,
      [vehicleMaintenanceId]
    );
    updated.attachments = attachments;

    return NextResponse.json({ message: messages("updatedSuccess", lang), data: updated }, { status: 200 });

  } catch (e) {
    console.error("PUT vehicle maintenance error:", e);
    return NextResponse.json({ error: messages("serverError", "en") }, { status: 500 });
  }
}
/**
 * GET /api/v1/admin/vehicle-maintenance-records/[vehicleMaintenanceRecordsId]
 *
 * Retrieves a single vehicle maintenance record by its ID, including attachments.
 *
 * Access control:
 *   - User must have the "view_vehicle_maintenance" permission.
 *   - User must have access to the tenant of the maintenance record.
 *
 * URL Parameters:
 *   - vehicleMaintenanceRecordsId (number, required): ID of the vehicle maintenance record to fetch.
 *
 * Response:
 *   - 200: { data: record } 
 *       -> Vehicle maintenance record details including `attachments` array
 *   - 401: { error } -> Unauthorized access
 *   - 404: { error } -> Record not found
 *   - 500: { error } -> Internal server error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { vehicleMaintenanceRecordsId: string } }
) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!(await hasPermission(user, "view_vehicle_maintenance"))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    const vehicleMaintenanceId = Number(params.vehicleMaintenanceRecordsId);
    if (isNaN(vehicleMaintenanceId)) {
      return NextResponse.json({ error: messages("invalidMaintenanceId", lang) }, { status: 400 });
    }

    // Fetch the maintenance record
    const [rows] = await pool.query(
      `SELECT m.*, v.plate_number,  v.model, ven.name AS vendor_name, b.name AS branch_name,
      DATE_FORMAT(m.start_date, '%Y-%m-%d') AS start_date, 
      DATE_FORMAT(m.end_date, '%Y-%m-%d') AS end_date,
      DATE_FORMAT(m.next_due_date, '%Y-%m-%d') AS next_due_date
       FROM vehicle_maintenance_records m
       JOIN vehicles v ON v.id = m.vehicle_id
       LEFT JOIN vendors ven ON ven.id = m.vendor_id
       LEFT JOIN branches b ON b.id = m.branch_id
       WHERE m.id = ? AND m.status != 'deleted'`,
      [vehicleMaintenanceId]
    );

    const record = (rows as any[])[0];
    if (!record) {
      return NextResponse.json({ error: messages("notFound", lang) }, { status: 404 });
    }

    if (!(await hasTenantAccess(user, record.tenant_id))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    // Fetch attachments
    const [attachments] = await pool.query(
      `SELECT id, file_type, file_url, status, uploaded_at
       FROM maintenance_attachments
       WHERE maintenance_id = ? AND status = 'active'`,
      [vehicleMaintenanceId]
    );

    record.attachments = attachments;

    return NextResponse.json({ data: record }, { status: 200 });

  } catch (e) {
    console.error("GET vehicle maintenance error:", e);
    return NextResponse.json({ error: messages("serverError", "en") }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/vehicle-maintenance-records/[vehicleMaintenanceRecordsId]
 *
 * Soft-deletes a vehicle maintenance record by its ID.
 *
 * Access control:
 *   - User must have the "delete_vehicle_maintenance" permission.
 *   - User must have access to the tenant of the maintenance record.
 *
 * URL Parameters:
 *   - vehicleMaintenanceRecordsId (number, required): ID of the vehicle maintenance record to delete.
 *
 * Response:
 *   - 200: { message: "Vehicle maintenance record deleted successfully." }
 *   - 401: { error } -> Unauthorized access
 *   - 404: { error } -> Record not found
 *   - 500: { error } -> Internal server error
 */
export async function DELETE(req: NextRequest, { params }: { params: { vehicleMaintenanceRecordsId: string } }) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!(await hasPermission(user, "delete_vehicle_maintenance"))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    const vehicleMaintenanceId = Number(params.vehicleMaintenanceRecordsId);
    if (isNaN(vehicleMaintenanceId)) {
      return NextResponse.json({ error: messages("invalidMaintenanceId", lang) }, { status: 400 });
    }

    const [rows] = await pool.query(
      `SELECT tenant_id FROM vehicle_maintenance_records WHERE id = ? AND status != 'deleted'`,
      [vehicleMaintenanceId]
    );

    const record = (rows as any[])[0];
    if (!record) {
      return NextResponse.json({ error: messages("notFound", lang) }, { status: 404 });
    }

    if (!(await hasTenantAccess(user, record.tenant_id))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    await pool.query(
      `UPDATE vehicle_maintenance_records SET status = 'deleted' WHERE id = ?`,
      [vehicleMaintenanceId]
    );

    return NextResponse.json({ message: messages("deletedSuccess", lang) }, { status: 200 });

  } catch (e) {
    console.error("DELETE vehicle maintenance error:", e);
    return NextResponse.json({ error: messages("serverError", "en") }, { status: 500 });
  }
}
