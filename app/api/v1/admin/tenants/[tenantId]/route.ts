



import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { validateFields } from "../../../functions/validation";
import argon2 from "argon2";
import { hasPermission, getUserData, hasTenantAccess } from "../../../functions/permissions";
import { isSuperAdmin } from "@/lib/auth";
const errorMessages = {
   en: {
    missingtenant: "Tenant ID is required.",
    tenantNotFound: "Tenant not found.",
    serverError: "Internal server error.",
    fetched: "Tenant fetched successfully.",
    noTenantFound: "No active tenant found.",
    missingFields: "Missing required fields.",
    tenantUpdated: "Tenant updated successfully.",
    tenantDeleted: "Tenant deleted successfully.",
    unauthorized: "You are not authorized to perform this action.",
    forbidden: "You do not have permission to access this resource.",
  },
  ar: {
    missingtenant: "معرف الشركة مطلوب.",
    tenantNotFound: "الشركة غير موجودة.",
    serverError: "خطأ في الخادم الداخلي.",
    fetched: "تم جلب بيانات الشركة بنجاح.",
    noTenantFound: "لم يتم العثور على أي منظمة.",
    missingFields: "الرجاء ملء جميع الحقول المطلوبة.",
    tenantUpdated: "تم تحديث المنظمة بنجاح.",
    tenantDeleted: "تم حذف المنظمة بنجاح.",
    unauthorized: "غير مسموح لك بالقيام بهذا الإجراء.",
    forbidden: "ليس لديك إذن للوصول إلى هذا المورد.",
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
        updated_at,
        currency,
        currency_code
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


/**
 * PUT /api/v1/admin/tenants/[tenantId]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const tenantId = params.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: getErrorMessage("noTenantFound", lang) },
        { status: 400 }
      );
    }

    const user: any = await getUserData(req);
    const hasAccess = await isSuperAdmin(user);
    if (!hasAccess) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
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
      currency,
      currency_code,
    } = body;

    // Required minimal fields check
    if (!name || !email) {
      return NextResponse.json(
        { error: getErrorMessage("missingFields", lang) },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE tenants
       SET 
         name = ?,
         legal_name = ?,
         email = ?,
         phone = ?,
         website = ?,
         logo_url = ?,
         primary_color = ?,
         secondary_color = ?,
         invoice_footer = ?,
         subdomain = ?,
         subscription_plan = ?,
         plan_expires_at = ?,
         max_branches = ?,
         max_cars = ?,
         max_users = ?,
         currency = ?,
         currency_code = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        legal_name || null,
        email,
        phone || null,
        website || null,
        logo_url || null,
        primary_color || null,
        secondary_color || null,
        invoice_footer || null,
        subdomain || null,
        subscription_plan || null,
        plan_expires_at || null,
        max_branches || 1,
        max_cars || 50,
        max_users || 5,
        currency || "Shekel",
        currency_code || "ILS",
        tenantId,
      ]
    );

    return NextResponse.json(
      { message: getErrorMessage("tenantUpdated", lang) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update tenant error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/tenants/[tenantId]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const tenantId = params.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: getErrorMessage("noTenantFound", lang) },
        { status: 400 }
      );
    }

    const user: any = await getUserData(req);
    const hasAccess = await isSuperAdmin(user);
    if (!hasAccess) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    // Soft delete: تغيير الحالة إلى 'deleted'
    await pool.query(
      `UPDATE tenants SET status = 'deleted' WHERE id = ?`,
      [tenantId]
    );

    return NextResponse.json(
      { message: getErrorMessage("tenantDeleted", lang) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete tenant error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}