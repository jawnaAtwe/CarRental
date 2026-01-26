 import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../../functions/permissions";
import { validateFields } from "../../../functions/validation";

/* ================= Messages ================= */
const errormessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    noDamagesFound: "No matching damage record found.",
    updatedSuccess: "Damage updated successfully.",
    deletedSuccess: "Damage deleted successfully.",
    invalidId: "Invalid damage id.",
  },
  ar: {
    serverError: "خطأ في الخادم.",
    unauthorized: "دخول غير مصرح.",
    noDamagesFound: "لم يتم العثور على سجل الضرر.",
    updatedSuccess: "تم تعديل الضرر بنجاح.",
    deletedSuccess: "تم حذف الضرر بنجاح.",
    invalidId: "معرّف الضرر غير صالح.",
  },
};

function messages(
  key: keyof typeof errormessages["en"],
  lang: "en" | "ar" = "en"
) {
  return errormessages[lang][key] || errormessages.en[key];
}

/**
 * GET /api/v1/admin/inspection-damages/{inspectionDamagesId}
 *
 * Retrieve a single inspection damage record by its ID.
 *
 * Access Control:
 *   - User must have "view_inspection_damages" permission
 *   - User must have access to the tenant related to the inspection's booking
 *
 * Path Parameters:
 *   - inspectionDamagesId (number, required)
 *       The unique ID of the inspection damage record
 *
 * Response:
 *   - 200: { data }
 *       Returns the inspection damage object
 *   - 400: { error }
 *       Invalid damage ID
 *   - 401: { error }
 *       Unauthorized access or tenant not allowed
 *   - 404: { error }
 *       Inspection damage not found or already deleted
 *   - 500: { error }
 *       Internal server error
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { inspectionDamagesId: string } }
) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!(await hasPermission(user, "view_inspection_damages"))) {
      return NextResponse.json(
        { error: messages("unauthorized", lang) },
        { status: 401 }
      );
    }

    const damageId = Number(params.inspectionDamagesId);
    if (isNaN(damageId)) {
      return NextResponse.json(
        { error: messages("invalidId", lang) },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      `SELECT d.*, b.tenant_id
       FROM inspection_damages d
       JOIN inspections i ON i.id = d.inspection_id
       JOIN bookings b ON b.id = i.booking_id
       WHERE d.id = ? AND d.status = 'active'`,
      [damageId]
    );

    if (!(rows as any[]).length) {
      return NextResponse.json(
        { error: messages("noDamagesFound", lang) },
        { status: 404 }
      );
    }

    const damage = (rows as any)[0];

    if (!(await hasTenantAccess(user, damage.tenant_id))) {
      return NextResponse.json(
        { error: messages("unauthorized", lang) },
        { status: 401 }
      );
    }

    delete damage.tenant_id;

    return NextResponse.json({ data: damage }, { status: 200 });
  } catch (e) {
    console.error("GET single inspection-damage error:", e);
    return NextResponse.json(
      { error: messages("serverError", "en") },
      { status: 500 }
    );
  }
}
/**
 * PUT /api/v1/admin/inspection-damages/{inspectionDamagesId}
 *
 * Update an existing inspection damage record by its ID.
 *
 * Access Control:
 *   - User must have "edit_inspection_damages" permission
 *   - User must have access to the tenant related to the inspection's booking
 *
 * Path Parameters:
 *   - inspectionDamagesId (number, required)
 *       The unique ID of the inspection damage record
 *
 * Request Body:
 *   - All fields are optional. Only provided fields will be updated.
 *   - damage_type (string | enum)
 *   - damage_severity (string | enum)
 *   - damage_location (string)
 *   - description (string)
 *   - is_new_damage (boolean)
 *   - estimated_cost (number)
 *   - final_cost (number)
 *   - insurance_required (boolean)
 *   - insurance_provider (string)
 *   - claim_number (string)
 *   - claim_status (string | enum)
 *   - claim_amount (number)
 *
 * Response:
 *   - 200: { message }
 *       Damage updated successfully
 *   - 400: { error }
 *       Validation error or invalid damage ID
 *   - 401: { error }
 *       Unauthorized access or tenant not allowed
 *   - 404: { error }
 *       Inspection damage not found or already deleted
 *   - 500: { error }
 *       Internal server error
 */

export async function PUT(
  req: NextRequest,
  { params }: { params: { inspectionDamagesId: string } }
) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!(await hasPermission(user, "edit_inspection_damages"))) {
      return NextResponse.json(
        { error: messages("unauthorized", lang) },
        { status: 401 }
      );
    }

    const damageId = Number(params.inspectionDamagesId);
    if (isNaN(damageId)) {
      return NextResponse.json(
        { error: messages("invalidId", lang) },
        { status: 400 }
      );
    }

    const payload = await req.json();

    const rules: any = {
      damage_type: [{ required: false, type: "string" }],
      damage_severity: [{ required: false, type: "string" }],
      damage_location: [{ required: false, type: "string" }],
      description: [{ required: false, type: "string" }],
      is_new_damage: [{ required: false, type: "boolean" }],
      estimated_cost: [{ required: false, type: "number" }],
      final_cost: [{ required: false, type: "number" }],
      insurance_required: [{ required: false, type: "boolean" }],
      insurance_provider: [{ required: false, type: "string" }],
      claim_number: [{ required: false, type: "string" }],
      claim_status: [{ required: false, type: "string" }],
      claim_amount: [{ required: false, type: "number" }],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const [existing] = await pool.query(
      `SELECT d.id, b.tenant_id
       FROM inspection_damages d
       JOIN inspections i ON i.id = d.inspection_id
       JOIN bookings b ON b.id = i.booking_id
       WHERE d.id = ? AND d.status = 'active'`,
      [damageId]
    );

    if (!(existing as any[]).length) {
      return NextResponse.json(
        { error: messages("noDamagesFound", lang) },
        { status: 404 }
      );
    }

    const tenant_id = (existing as any)[0].tenant_id;
    if (!(await hasTenantAccess(user, tenant_id))) {
      return NextResponse.json(
        { error: messages("unauthorized", lang) },
        { status: 401 }
      );
    }

    await pool.query(
      `UPDATE inspection_damages SET
        damage_type = COALESCE(?, damage_type),
        damage_severity = COALESCE(?, damage_severity),
        damage_location = ?,
        description = ?,
        is_new_damage = ?,
        estimated_cost = ?,
        final_cost = ?,
        insurance_required = ?,
        insurance_provider = ?,
        claim_number = ?,
        claim_status = ?,
        claim_amount = ?
       WHERE id = ?`,
      [
        payload.damage_type ?? null,
        payload.damage_severity ?? null,
        payload.damage_location ?? null,
        payload.description ?? null,
        payload.is_new_damage !== undefined ? (payload.is_new_damage ? 1 : 0) : null,
        payload.estimated_cost ?? null,
        payload.final_cost ?? null,
        payload.insurance_required !== undefined
          ? payload.insurance_required
            ? 1
            : 0
          : null,
        payload.insurance_provider ?? null,
        payload.claim_number ?? null,
        payload.claim_status ?? null,
        payload.claim_amount ?? null,
        damageId,
      ]
    );

    return NextResponse.json(
      { message: messages("updatedSuccess", lang) },
      { status: 200 }
    );
  } catch (e) {
    console.error("PUT inspection-damage error:", e);
    return NextResponse.json(
      { error: messages("serverError", "en") },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/inspection-damages/{inspectionDamagesId}
 *
 * Soft delete an inspection damage record by its ID.
 *
 * Access Control:
 *   - User must have "delete_inspection_damages" permission
 *   - User must have access to the tenant related to the inspection's booking
 *
 * Path Parameters:
 *   - inspectionDamagesId (number, required)
 *       The unique ID of the inspection damage record
 *
 * Response:
 *   - 200: { message }
 *       Damage deleted successfully
 *   - 400: { error }
 *       Invalid damage ID
 *   - 401: { error }
 *       Unauthorized access or tenant not allowed
 *   - 404: { error }
 *       Inspection damage not found or already deleted
 *   - 500: { error }
 *       Internal server error
 *
 */

export async function DELETE(
  req: NextRequest,
  { params }: { params: { inspectionDamagesId: string } }
) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!(await hasPermission(user, "delete_inspection_damages"))) {
      return NextResponse.json(
        { error: messages("unauthorized", lang) },
        { status: 401 }
      );
    }

    const damageId = Number(params.inspectionDamagesId);
    if (isNaN(damageId)) {
      return NextResponse.json(
        { error: messages("invalidId", lang) },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      `SELECT d.id, b.tenant_id
       FROM inspection_damages d
       JOIN inspections i ON i.id = d.inspection_id
       JOIN bookings b ON b.id = i.booking_id
       WHERE d.id = ? AND d.status = 'active'`,
      [damageId]
    );

    if (!(rows as any[]).length) {
      return NextResponse.json(
        { error: messages("noDamagesFound", lang) },
        { status: 404 }
      );
    }

    const tenant_id = (rows as any)[0].tenant_id;
    if (!(await hasTenantAccess(user, tenant_id))) {
      return NextResponse.json(
        { error: messages("unauthorized", lang) },
        { status: 401 }
      );
    }

    await pool.query(
      `UPDATE inspection_damages
       SET status = 'deleted'
       WHERE id = ?`,
      [damageId]
    );

    return NextResponse.json(
      { message: messages("deletedSuccess", lang) },
      { status: 200 }
    );
  } catch (e) {
    console.error("DELETE inspection-damage error:", e);
    return NextResponse.json(
      { error: messages("serverError", "en") },
      { status: 500 }
    );
  }
}
