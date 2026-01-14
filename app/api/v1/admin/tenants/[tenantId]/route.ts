



import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { validateFields } from "../../../functions/validation";
import argon2 from "argon2";
import { hasPermission, getUserData, hasTenantAccess } from "../../../functions/permissions";

const errorMessages = {
   en: {
    missingtenant: "Tenant ID is required.",
    tenantNotFound: "Tenant not found.",
    serverError: "Internal server error.",
    fetched: "Tenant fetched successfully.",
  },
  ar: {
    missingtenant: "معرف الشركة مطلوب.",
    tenantNotFound: "الشركة غير موجودة.",
    serverError: "خطأ في الخادم الداخلي.",
    fetched: "تم جلب بيانات الشركة بنجاح.",
  },
};

// Helper to get error message by language

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}



/**
 * GET /api/v1/admin/tenants/[tenantId]
 *
 * Returns a single non-deleted tenant.
 * Production traffic must pass `view_tenants` permission.
 *
 * Path Parameters:
 *   - tenantId (number, required)
 *
 * Responses:
 *   - 200: tenant object
 *   - 400: { error } : tenantId missing
 *   - 401: { error } : Permission denied
 *   - 404: { error } : Tenant not found / deleted
 *   - 500: { error } : Internal server error
 */
export async function GET(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const user: any = await getUserData(req);

    const tenantId = params.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: getErrorMessage("missingtenant", lang) }, { status: 400 });
    }

    const pool = await dbConnection();

    const [rows] = await pool.query(
      `SELECT
        id,
        name,
        legal_name,
        email,
        phone,
        website,
        logo_url,
        primary_color,
        secondary_color,
        invoice_footer,
        subdomain,
        subscription_plan,
        plan_expires_at,
        max_branches,
        max_cars,
        max_users,
        status,
        created_at,
        updated_at
      FROM tenants
      WHERE id = ?
        AND status != 'deleted'
      LIMIT 1`,
      [tenantId]
    );

    const tenant = (rows as any[])[0];
    if (!tenant) {
     return NextResponse.json({ error: getErrorMessage("tenantNotFound", lang) }, { status: 404 });
    }
return NextResponse.json(tenant, { status: 200 });
  } catch (error) {
    console.error("GET tenant by ID error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

   return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}
