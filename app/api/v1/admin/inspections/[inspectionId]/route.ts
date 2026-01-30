import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { hasPermission, getUserData, hasTenantAccess } from "../../../functions/permissions";
import { validateFields } from "../../../functions/validation";

/* ================= Messages ================= */
const errorMessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    inspectionNotFound: "Inspection not found.",
    deletedSuccess: "Inspection deleted successfully.",
    updatedSuccess: "Inspection updated successfully.",
    missingInspectionId: "Inspection ID is missing.",
    missingTenantId: "tenant_id is required.",
  },
  ar: {
    serverError: "خطأ في الخادم.",
    unauthorized: "دخول غير مصرح.",
    inspectionNotFound: "الفحص غير موجود.",
    deletedSuccess: "تم حذف الفحص بنجاح.",
    updatedSuccess: "تم تحديث الفحص بنجاح.",
    missingInspectionId: "معرّف الفحص مفقود.",
    missingTenantId: "معرّف الشركة مطلوب.",
  }
};

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

/**
 * GET /api/v1/admin/inspections/[inspectionId]
 *
 * Retrieves a single vehicle inspection by its ID.
 * Requires tenant access verification and permission checks in production.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar" for localized responses
 *
 * Path Parameters:
 *   - inspectionId (number, required): ID of the inspection to fetch
 *
 * Query Parameters:
 *   - tenant_id (number, required in production): Used to verify tenant access
 *
 * Responses:
 *   - 200: { data }                   : Inspection object including inspected_by_name
 *   - 400: { error }                  : Missing inspectionId or tenant_id
 *   - 401: { error }                  : Unauthorized (permission or tenant access denied)
 *   - 404: { error }                  : Inspection not found
 *   - 500: { error }                  : Internal server error
 *
 * Notes:
 *   - In production, requires `view_inspections` permission.
 *   - Soft-deleted inspections (status='deleted') are not returned.
 */

export async function GET(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const user: any = await getUserData(req);
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");

    if (!tenant_id) {
      return NextResponse.json(
        { error: getErrorMessage("missingTenantId", lang) },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "production") {
      const canView = await hasPermission(user, "view_inspections");
      if (!canView) {
        return NextResponse.json(
          { error: getErrorMessage("unauthorized", lang) },
          { status: 401 }
        );
      }

      const allowed = await hasTenantAccess(user, tenant_id);
      if (!allowed) {
        return NextResponse.json(
          { error: getErrorMessage("unauthorized", lang) },
          { status: 401 }
        );
      }
    }

    const inspectionId = params.inspectionId;
    if (!inspectionId) {
      return NextResponse.json(
        { error: getErrorMessage("missingInspectionId", lang) },
        { status: 400 }
      );
    }

    const pool = await dbConnection();

    const [rows] = await pool.query(
      `
      SELECT 
        i.*, 
        u.full_name AS inspected_by_name,
        u.full_name_ar AS inspected_by_name_ar, 
        b.id AS booking_id,
        b.tenant_id,
        c.id AS customer_id,
        c.full_name AS customer_name,
        DATE_FORMAT(i.inspection_date, '%Y-%m-%d') AS inspection_date
      FROM inspections i
      LEFT JOIN bookings b ON b.id = i.booking_id
      LEFT JOIN customers c ON c.id = b.customer_id
      LEFT JOIN users u ON u.id = i.inspected_by
      WHERE i.id = ?
        AND i.status != 'deleted'
        AND (b.tenant_id = ? OR i.booking_id IS NULL)
      `,
      [inspectionId, tenant_id]
    );

    const inspection = (rows as any[])[0];
    if (!inspection) {
      return NextResponse.json(
        { error: getErrorMessage("inspectionNotFound", lang) },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: inspection }, { status: 200 });

  } catch (error) {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    console.error("GET inspection error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}


/**
 * PUT /api/v1/admin/inspections/[inspectionId]
 *
 * Updates a specific vehicle inspection by its ID.
 * Requires tenant access verification and `edit_inspections` permission.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar" for localized responses
 *
 * Path Parameters:
 *   - inspectionId (number, required): ID of the inspection to update
 *
 * Request Body (all optional except ID):
 *   - inspection_date (datetime)      : Date of the inspection
 *   - odometer (number)               : Odometer reading
 *   - fuel_level (number)             : Fuel level percentage
 *   - checklist_results (object)      : JSON object with checklist results
 *   - notes (string)                  : Additional notes
 *
 * Responses:
 *   - 200: { message }                : Inspection updated successfully
 *   - 400: { error }                  : Validation failed or missing inspectionId
 *   - 401: { error }                  : Unauthorized (permission or tenant access denied)
 *   - 404: { error }                  : Inspection not found
 *   - 500: { error }                  : Internal server error
 *
 * Notes:
 *   - Soft-deleted inspections (status='deleted') cannot be updated.
 *   - Only fields provided in the request body will be updated.
 */


export async function PUT(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const user: any = await getUserData(req);
    const inspectionId = params.inspectionId;

    if (!inspectionId) {
      return NextResponse.json({ error: getErrorMessage("missingInspectionId", lang) }, { status: 400 });
    }

    if (!(await hasPermission(user, "edit_inspections"))) {
      return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    const payload = await req.json();
    const { inspection_date, odometer, fuel_level, checklist_results, notes } = payload;

    const rules: any = {
      inspection_date: [{ required: false }],
      odometer: [{ required: false, type: "number" }],
      fuel_level: [{ required: false, type: "number" }],
      checklist_results: [{ required: false, type: "object" }],
      notes: [{ required: false, type: "string" }],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) return NextResponse.json({ error: errors }, { status: 400 });

    const pool = await dbConnection();
    const [rows] = await pool.query(
      `SELECT i.*, COALESCE(b.tenant_id, v.tenant_id) AS tenant_id
       FROM inspections i
       LEFT JOIN bookings b ON b.id = i.booking_id
       LEFT JOIN vehicles v ON v.id = i.vehicle_id
       WHERE i.id = ? AND i.status != 'deleted'`,
      [inspectionId]
    );

    const inspection = (rows as any[])[0];
    if (!inspection) return NextResponse.json({ error: getErrorMessage("inspectionNotFound", lang) }, { status: 404 });

    if (!(await hasTenantAccess(user, inspection.tenant_id))) {
      return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (inspection_date) {
      const mysqlDate = inspection_date.split('T')[0];
      fields.push("inspection_date = ?");
      values.push(mysqlDate);
    }

    if (odometer !== undefined) { fields.push("odometer = ?"); values.push(odometer); }
    if (fuel_level !== undefined) { fields.push("fuel_level = ?"); values.push(fuel_level); }
    if (checklist_results) { fields.push("checklist_results = ?"); values.push(JSON.stringify(checklist_results)); }
    if (notes !== undefined) { fields.push("notes = ?"); values.push(notes); }

    if (fields.length > 0) {
      await pool.query(`UPDATE inspections SET ${fields.join(", ")} WHERE id = ?`, [...values, inspectionId]);
    }

    return NextResponse.json({ message: getErrorMessage("updatedSuccess", lang) }, { status: 200 });
  } catch (error) {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    console.error("PUT inspection error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/inspections/[inspectionId]
 *
 * Soft-deletes a specific vehicle inspection by its ID.
 * Requires tenant access verification and `delete_inspections` permission.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar" for localized responses
 *
 * Path Parameters:
 *   - inspectionId (number, required): ID of the inspection to delete
 *
 * Responses:
 *   - 200: { message }                : Inspection deleted successfully
 *   - 400: { error }                  : Missing inspectionId
 *   - 401: { error }                  : Unauthorized (permission or tenant access denied)
 *   - 404: { error }                  : Inspection not found
 *   - 500: { error }                  : Internal server error
 *
 * Notes:
 *   - Performs a soft delete by setting status='deleted'.
 *   - Deleted inspections cannot be updated or deleted again.
 */

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);
    const inspectionId = params.inspectionId;

    if (!inspectionId) {
      return NextResponse.json({ error: getErrorMessage("missingInspectionId", lang) }, { status: 400 });
    }

    if (!(await hasPermission(user, "delete_inspections"))) {
      return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    const [rows] = await pool.query(
      `SELECT i.*, COALESCE(b.tenant_id, v.tenant_id) AS tenant_id
       FROM inspections i
       LEFT JOIN bookings b ON b.id = i.booking_id
       LEFT JOIN vehicles v ON v.id = i.vehicle_id
       WHERE i.id = ? AND i.status != 'deleted'`,
      [inspectionId]
    );

    const inspection = (rows as any[])[0];
    if (!inspection) {
      return NextResponse.json({ error: getErrorMessage("inspectionNotFound", lang) }, { status: 404 });
    }

    if (!(await hasTenantAccess(user, inspection.tenant_id))) {
      return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    // Soft delete
    await pool.query(`UPDATE inspections SET status = 'deleted' WHERE id = ?`, [inspectionId]);

    return NextResponse.json({ message: getErrorMessage("deletedSuccess", lang) }, { status: 200 });
  } catch (error) {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    console.error("DELETE inspection error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

