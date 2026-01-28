import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../functions/permissions";

/* ================= Error Messages ================= */

const errorMessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    noContractsFound: "No rental contracts found.",
    contractNotFound: "Rental contract not found.",
    createdSuccess: "Rental contract created successfully.",
    cancelledSuccess: "Rental contract cancelled successfully.",
    missingTenantId: "Tenant ID is missing.",
    missingRequiredFields: "Required fields are missing.",
  },
  ar: {
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    noContractsFound: "لم يتم العثور على عقود إيجار.",
    contractNotFound: "عقد الإيجار غير موجود.",
    createdSuccess: "تم إنشاء عقد الإيجار بنجاح.",
    cancelledSuccess: "تم إلغاء عقد الإيجار بنجاح.",
    missingTenantId: "معرّف المستأجر مفقود.",
    missingRequiredFields: "بعض الحقول المطلوبة مفقودة.",
  },
};

function getErrorMessage(
  key: keyof typeof errorMessages["en"],
  lang: "en" | "ar"
) {
  return errorMessages[lang][key];
}

/**
 * GET /api/v1/admin/rental-contracts
 *
 * Retrieves rental contracts with optional filters.
 *
 * Query Parameters:
 *   - tenant_id (number, optional): Filter contracts by tenant.
 *   - status (string, optional): Filter by contract status
 *       (draft | signed | cancelled).
 *   - booking_id (number, optional): Filter by related booking ID.
 *
 * Permissions:
 *   - Requires "view_rental_contracts" permission.
 *   - If tenant_id is provided, the user must have access to the tenant.
 *
 * Notes:
 *   - This endpoint does not exclude cancelled contracts by default.
 *   - Pagination can be added later if the dataset grows.
 */

export async function GET(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");
    const status = searchParams.get("status"); 
    const booking_id = searchParams.get("booking_id");

    // Permission
    if (!(await hasPermission(user, "view_rental_contracts"))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    // Tenant access
    if (tenant_id && !(await hasTenantAccess(user, tenant_id))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    let where = "1=1";
    const params: any[] = [];

    if (tenant_id) {
      where += " AND tenant_id = ?";
      params.push(tenant_id);
    }

    if (status) {
      where += " AND status = ?";
      params.push(status);
    }

    if (booking_id) {
      where += " AND booking_id = ?";
      params.push(booking_id);
    }

    const [contracts] = await pool.query(
      `
      SELECT *
      FROM rental_contracts
      WHERE ${where}
      ORDER BY created_at DESC
      `,
      params
    );

    return NextResponse.json({ data: contracts || [] }, { status: 200 });
  } catch (error) {
    console.error("GET rental contracts error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", "en") },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/rental-contracts
 *
 * Creates a new rental contract in "draft" status.
 *
 * Request Body:
 *   - tenant_id (number, required): The tenant ID the contract belongs to.
 *   - booking_id (number, required): Related booking ID.
 *   - customer_id (number, required): Customer ID.
 *   - vehicle_id (number, required): Vehicle ID.
 *   - template_id (number, required): Contract template ID.
 *   - contract_number (string, optional): Unique contract reference number.
 *   - pdf_path (string, required): Path to the generated contract PDF file.
 *
 * Responses:
 *   - 201: { message } Contract created successfully.
 *   - 400: { error } Missing required fields.
 *   - 401: { error } Unauthorized or tenant access denied.
 *   - 500: { error } Internal server error.
 *
 * Notes:
 *   - The PDF file must already be generated and stored before calling this endpoint.
 *   - Signing the contract requires a separate endpoint.
 */

export async function POST(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const payload = await req.json();
    const {
      tenant_id,
      booking_id,
      customer_id,
      vehicle_id,
      template_id,
      contract_number,
      pdf_path,
    } = payload;

    if (
      !tenant_id ||
      !booking_id ||
      !customer_id ||
      !vehicle_id ||
      !template_id ||
      !pdf_path
    ) {
      return NextResponse.json(
        { error: getErrorMessage("missingRequiredFields", lang) },
        { status: 400 }
      );
    }

    // Permission
    if (!(await hasPermission(user, "add_rental_contracts"))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    // Tenant access
    if (!(await hasTenantAccess(user, tenant_id))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    await pool.query(
      `
      INSERT INTO rental_contracts
      (tenant_id, booking_id, customer_id, vehicle_id, template_id, contract_number, pdf_path, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', NOW())
      `,
      [
        tenant_id,
        booking_id,
        customer_id,
        vehicle_id,
        template_id,
        contract_number || null,
        pdf_path,
      ]
    );

    return NextResponse.json(
      { message: getErrorMessage("createdSuccess", lang) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST rental contract error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", "en") },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/rental-contracts
 *
 * Cancels a rental contract by updating its status to "cancelled".
 *
 * Request Body:
 *   - contract_id (number, required): The ID of the rental contract to cancel.
 *   - tenant_id (number, optional): Tenant ID used to validate tenant access.
 *
 * Permissions:
 *   - Requires "cancel_rental_contracts" permission.
 *   - If tenant_id is provided, the user must have access to the tenant.
 *
 * Behavior:
 *   - Performs a soft cancel by setting status = 'cancelled'.
 *   - Does not delete the record from the database.
 *
 * Responses:
 *   - 200: { message } Contract cancelled successfully.
 *   - 400: { error } Missing or invalid contract_id.
 *   - 401: { error } Unauthorized or tenant access denied.
 *   - 404: { error } Contract not found.
 *   - 500: { error } Internal server error.
 *
 * Notes:
 *   - Cancelled contracts remain in the database for audit and history purposes.
 *   - This action is irreversible via this endpoint.
 */

export async function DELETE(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const { contract_id, tenant_id } = await req.json();

    if (!contract_id) {
      return NextResponse.json(
        { error: getErrorMessage("contractNotFound", lang) },
        { status: 400 }
      );
    }

    if (!(await hasPermission(user, "cancel_rental_contracts"))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    if (tenant_id && !(await hasTenantAccess(user, tenant_id))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    const [result]: any = await pool.query(
      `
      UPDATE rental_contracts
      SET status = 'cancelled'
      WHERE id = ?
      `,
      [contract_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: getErrorMessage("contractNotFound", lang) },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: getErrorMessage("cancelledSuccess", lang) },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE rental contract error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", "en") },
      { status: 500 }
    );
  }
}
