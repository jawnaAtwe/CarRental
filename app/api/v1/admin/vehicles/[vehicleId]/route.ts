import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { hasPermission, getUserData, hasTenantAccess } from "../../../functions/permissions";
import { validateFields } from "../../../functions/validation";

// Error messages
const errorMessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    updatedSuccess: "Vehicle updated successfully.",
    vehicleNotFound: "Vehicle not found",
    missingVehicleId: "Vehicle ID is missing",
    deletedSuccess: "Vehicle deleted successfully",
    missingTenant: "Tenant ID is required.",
  },
  ar: {
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    updatedSuccess: "تم تحديث بيانات المركبة بنجاح.",
    vehicleNotFound: "المركبة غير موجودة",
    missingVehicleId: "معرّف المركبة مفقود",
    deletedSuccess: "تم حذف المركبة بنجاح",
      missingTenant: "معرف الشركة مطلوب.",
  },
};

function getErrorMessage(
  key: keyof typeof errorMessages["en"],
  lang: "en" | "ar" = "en"
) {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

/**
 * PUT /api/v1/admin/vehicles/[vehicleId]
 *
 * Updates an existing vehicle for a specific tenant.
 * Only provided fields will be updated (partial update).
 * In production, the user must have `edit_vehicle` permission
 * and valid tenant access.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Path Parameters:
 *   - vehicleId (number, required)        : ID of the vehicle to update
 *
 * Request Body:
 *   - tenant_id (number, required)        : Tenant/organization ID
 *   - branch_id (number, optional)
 *   - make (string, optional)
 *   - model (string, optional)
 *   - year (number, optional)
 *   - trim (string, optional)
 *   - category (string, optional)
 *   - license_plate (string, optional)
 *   - vin (string, optional)
 *   - color (string, optional)
 *   - fuel_type (string, optional)
 *   - transmission (string, optional)
 *   - mileage (number, optional)
 *   - price_per_day (number, required)
 *   - status (string, optional)
 *   - image (string | null, optional)
 *
 * Validation:
 *   - tenant_id must be a number
 *   - price_per_day must be a number
 *
 * Responses:
 *   - 200: { message }                    : Vehicle updated successfully
 *   - 400: { error }                      : Validation or missing vehicleId
 *   - 401: { error }                      : Unauthorized or no tenant access
 *   - 404: { error }                      : Vehicle not found or deleted
 *   - 500: { error }                      : Internal server error
 *
 */

export async function PUT(req: NextRequest, { params }: any): Promise<NextResponse> {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const user: any = await getUserData(req);

    const vehicleId = params.vehicleId;
    if (!vehicleId) {
      return NextResponse.json(
        { error: getErrorMessage("missingVehicleId", lang) },
        { status: 400 }
      );
    }

    const payload = await req.json();
    const {
      tenant_id,
      branch_id,
      make,
      model,
      year,
      late_fee_day,
      price_per_week,
      price_per_month,
      price_per_year,
      currency_code,
      currency,
      trim,
      category,
      license_plate,
      vin,
      color,
      fuel_type,
      transmission,
      mileage,
      price_per_day,
      status,
      image,
    } = payload;

    if (!tenant_id) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "production") {
      const hasAccess = await hasPermission(user, "edit_car");
      if (!hasAccess)
        return NextResponse.json(
          { error: getErrorMessage("unauthorized", lang) },
          { status: 401 }
        );

      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess)
        return NextResponse.json(
          { error: getErrorMessage("unauthorized", lang) },
          { status: 401 }
        );
    }

    // Validation
    const rules: any = {
      tenant_id: [{ required: true, type: "number" }],
      price_per_day: [{ required: true, type: "number" }],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const pool = await dbConnection();

    // Check vehicle exists
    const [existing] = await pool.query(
      `SELECT id FROM vehicles
       WHERE id = ? AND tenant_id = ? AND status != 'deleted'`,
      [vehicleId, tenant_id]
    );

    if (!(existing as any[]).length) {
      return NextResponse.json(
        { error: getErrorMessage("vehicleNotFound", lang) },
        { status: 404 }
      );
    }

    // Build dynamic update
    const fields: string[] = [];
    const values: any[] = [];

    const map: Record<string, any> = {
      branch_id,
      make,
      model,
      year,
      late_fee_day,
      price_per_week,
      price_per_month,
      price_per_year,
      currency_code,
      currency,
      trim,
      category,
      license_plate,
      vin,
      color,
      fuel_type,
      transmission,
      mileage,
      price_per_day,
      image,
    };

    for (const key in map) {
      if (map[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(map[key]);
      }
    }

    if (typeof status === "string") {
      fields.push("status = ?");
      values.push(status);
    }

    if (fields.length) {
      await pool.query(
        `UPDATE vehicles
         SET ${fields.join(", ")}
         WHERE id = ? AND tenant_id = ? AND status != 'deleted'`,
        [...values, vehicleId, tenant_id]
      );
    }

    return NextResponse.json(
      { message: getErrorMessage("updatedSuccess", lang) },
      { status: 200 }
    );
  } catch (error) {
    console.error("edit vehicle error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}
/**
 * GET /api/v1/admin/vehicles/[vehicleId]
 *
 * Returns a single non-deleted vehicle for a tenant.
 *
 * Path Parameters:
 *   - vehicleId (number, required)
 *
 * Query Parameters:
 *   - tenant_id (number, required)
 *
 * Responses:
 *   - 200: vehicle object
 *   - 400: { error } : vehicleId or tenant_id missing
 *   - 404: { error } : Vehicle not found / deleted
 *   - 500: { error } : Internal server error
 */
export async function GET(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const user: any = await getUserData(req);

    const vehicleId = params.vehicleId;
    if (!vehicleId) {
      return NextResponse.json({ error: getErrorMessage("vehicleNotFound", lang) }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenant_id");
    if (!tenantId) {
      return NextResponse.json({ error: getErrorMessage("missingTenant", lang) }, { status: 400 });
    }

    const pool = await dbConnection();

    const [rows] = await pool.query(
      `SELECT *
       FROM vehicles
       WHERE id = ?
         AND tenant_id = ?
         AND status != 'deleted'
       LIMIT 1`,
      [vehicleId, tenantId]
    );

    const vehicle = (rows as any[])[0];
    if (!vehicle) {
      return NextResponse.json({ error: getErrorMessage("vehicleNotFound", lang) }, { status: 404 });
    }

    return NextResponse.json(vehicle, { status: 200 });
  } catch (error) {
    console.error("GET vehicle by ID error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/vehicles/[vehicleId]
 *
 * Soft-deletes a single vehicle by setting its status to "deleted".
 * Production requests must pass the `delete_vehicle` permission
 * and confirm tenant access.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Path Parameters:
 *   - vehicleId (number, required)        : ID of the vehicle to delete
 *
 * Request Body:
 *   - tenant_id (number, required)        : Tenant/organization ID
 *
 * Responses:
 *   - 200: { message }                    : Vehicle deleted successfully
 *   - 400: { error }                      : Missing tenant_id or vehicleId
 *   - 401: { error }                      : Permission or tenant access denied
 *   - 404: { error }                      : Vehicle not found or already deleted
 *   - 500: { error }                      : Internal server error
 *
 */

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const { tenant_id } = await req.json();
    const vehicle_id = params.vehicleId;

    if (!tenant_id || !vehicle_id) {
      return NextResponse.json(
        { error: getErrorMessage("missingVehicleId", lang) },
        { status: 400 }
      );
    }

    const user: any = await getUserData(req);

    if (process.env.NODE_ENV === "production") {
      const hasAccess = await hasPermission(user, "delete_car");
      if (!hasAccess)
        return NextResponse.json(
          { error: getErrorMessage("unauthorized", lang) },
          { status: 401 }
        );

      const allowed = await hasTenantAccess(user, tenant_id);
      if (!allowed)
        return NextResponse.json(
          { error: getErrorMessage("unauthorized", lang) },
          { status: 401 }
        );
    }

    const [rows] = await pool.query(
      `SELECT id FROM vehicles
       WHERE id = ? AND tenant_id = ? AND status != 'deleted'
       LIMIT 1`,
      [vehicle_id, tenant_id]
    );

    if (!(rows as any[]).length) {
      return NextResponse.json(
        { error: getErrorMessage("vehicleNotFound", lang) },
        { status: 404 }
      );
    }

    await pool.query(
      `UPDATE vehicles
       SET status = 'deleted'
       WHERE id = ? AND tenant_id = ?`,
      [vehicle_id, tenant_id]
    );

    return NextResponse.json(
      { message: getErrorMessage("deletedSuccess", lang) },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE vehicle error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}