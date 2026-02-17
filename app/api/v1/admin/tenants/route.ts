

import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { validateFields } from "../../functions/validation";
import argon2 from "argon2";
import { hasPermission, getUserData, hasTenantAccess } from "../../functions/permissions";
import { isSuperAdmin } from "@/lib/auth";
const errorMessages = {
  en: {
    serverError: "Internal server error.",
    noTenantFound: "No active tenant found.",
    missingFields: "Missing required fields.",
    tenantDeleted: "Tenant deleted successfully.",
    tenantCreated: "Tenant created successfully.",
     unauthorized: "You are not authorized to perform this action.",
  },
  ar: {
  
    serverError: "خطأ في الخادم الداخلي.",
    noTenantFound: "لم يتم العثور على أي منظمة .",
      missingFields: "الرجاء ملء جميع الحقول المطلوبة.",
    tenantDeleted: "تم حذف المنظمة بنجاح.",
    tenantCreated: "تم إنشاء المنظمة بنجاح.",
     unauthorized: "غير مسموح لك بالقيام بهذا الإجراء.",
  },
};

// Helper to get error message by language

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}



/**
 * GET /api/v1/admin/tenants
 *
 * Fetches a paginated list of all tenants.
 * Supports search, sorting, and pagination.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Query Parameters:
 *   - page (number, optional, default 1)
 *   - pageSize (number, optional, default 20)
 *   - search (string, optional) : Applied to name, legal_name, email, phone, subdomain
 *   - sortBy (string, optional, default "created_at")
 *   - sortOrder (string, optional, default "desc") : "asc" | "desc"
 *
 * Responses:
 *   - 200: {
 *        count,
 *        page,
 *        pageSize,
 *        totalPages,
 *        data
 *     }
 *   - 401
 *   - 500
 */
export async function GET(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder =
      (searchParams.get("sortOrder") || "desc").toLowerCase() === "asc"
        ? "ASC"
        : "DESC";

    let where = "1=1";
    const params: any[] = [];

    if (search) {
      where += `
        AND (
          name LIKE ?
          OR legal_name LIKE ?
          OR email LIKE ?
          OR phone LIKE ?
          OR subdomain LIKE ?
        )
      `;
      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    // count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM tenants
       WHERE ${where} AND status != 'deleted'`,
      params
    );

    const count = (countRows as any)[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    // data
    const [tenants] = await pool.query(
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
      WHERE ${where} AND status != 'deleted'
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json(
      {
        count,
        page,
        pageSize,
        totalPages,
        data: tenants,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get tenants error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const body = await req.json();
    const user: any = await getUserData(req);
     const hasAccess = await isSuperAdmin(user);
          if (!hasAccess) {
            return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
          }
     
    const requiredFields:any = ["name", "legal_name", "email", "subdomain"];
    if (!validateFields(body, requiredFields)) {
      return NextResponse.json(
        { error: getErrorMessage("missingFields", lang) },
        { status: 400 }
      );
    }

    const { name, legal_name, email, phone, website, subdomain } = body;

    await pool.query(
      `INSERT INTO tenants (name, legal_name, email, phone, website, subdomain, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [name, legal_name, email, phone || null, website || null, subdomain]
    );

    return NextResponse.json(
      { message: getErrorMessage("tenantCreated", lang) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create tenant error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/tenants?id=<tenantId>
 * Soft-delete a tenant
 */
export async function DELETE(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("id");

    if (!tenantId) {
      return NextResponse.json(
        { error: getErrorMessage("noTenantFound", lang) },
        { status: 400 }
      );
    }
   const user: any = await getUserData(req);
     const hasAccess = await isSuperAdmin(user);
          if (!hasAccess) {
            return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
          }
     
    // Soft delete
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