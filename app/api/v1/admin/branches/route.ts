import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { validateFields } from "../../functions/validation";
import argon2 from "argon2";
import { hasPermission, getUserData, hasTenantAccess } from "../../functions/permissions";
const errorMessages = {
  en: {
    namemissingRequiredFields: "name is required .",
    unauthorized: "Unauthorized access.",
    serverError: "Internal server error.",
    success: "Branch created successfully.",
    branchExists: "Branch already exists.",
    missingTenantId: "Tenant ID is missing.",
    missingBranchIds: "Branch IDs are missing.",
    invalidBranchIds: "Invalid branch IDs provided.",
    noBranchesFound: "No matching branches found.",
    deleted: (count: number) => `${count} branch(es) deleted successfully.`
  },
  ar: {
    namemissingRequiredFields: "   الاسم مطلوب.",
    unauthorized: "دخول غير مصرح به.",
    serverError: "خطأ في الخادم الداخلي.",
    success: "تم إنشاء الفرع بنجاح.",
    branchExists: "الفرع موجود مسبقاً.",
    missingTenantId: "معرّف المنظمة مفقود.",
    missingBranchIds: "معرّفات الفروع مفقودة.",
    invalidBranchIds: "معرّفات الفروع غير صالحة.",
    noBranchesFound: "لم يتم العثور على أي فرع مطابق.",
    deleted: (count: number) => `تم حذف ${count} فرع/فروع بنجاح.`
  }
};


function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}
const branchRequiredLabels: Record<
  "tenant_id" | "name" | "name_ar" | "address" | "address_ar" | "latitude" | "longitude",
  { en: string; ar: string }
> = {
  tenant_id: { en: "Tenant", ar: "المنظمة" },
  name: { en: "Branch Name", ar: "اسم الفرع" },
  name_ar: { en: "Arabic Branch Name", ar: "اسم الفرع بالعربي" },
  address: { en: "Address", ar: "العنوان" },
  address_ar: { en: "Arabic Address", ar: "العنوان بالعربي" },
  latitude: { en: "Latitude", ar: "خط العرض" },
  longitude: { en: "Longitude", ar: "خط الطول" },
};
/**
 * POST /api/v1/admin/branches
 *
 * Creates a new branch for a tenant.
 *
 * Requirements:
 * - Must include tenant_id and name.
 * - If running in production, user must have `create_branch` permission
 *   and must have access to the provided tenant.
 *
 * Validations:
 * - name: required, length 3–200
 * - name_ar: optional, length 3–200
 * - tenant_id: required, number
 * - address, address_ar: optional, length 3–255
 * - latitude, longitude: optional, decimal
 *
 * Behavior:
 * - Ensures branch name is unique per tenant.
 * - Inserts the new branch with default status = "active".
 *
 * Responses:
 * - 201: { message }                   // Successfully created
 * - 400: { error }                     // Missing fields or validation errors
 * - 401: { error }                     // Unauthorized (permissions or tenant access)
 * - 409: { error }                     // Branch already exists
 * - 500: { error }                     // Server error
 */


export async function POST(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const body = await req.json();

    const { tenant_id, name, name_ar, address, address_ar, latitude, longitude } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 400 });
    }

    // Required fields validation
    if (!name) {
      return NextResponse.json(
        { error: getErrorMessage("namemissingRequiredFields", lang) },
        { status: 400 }
      );
    }

    // Auth user
    const user: any = await getUserData(req);

    // Permission checking (production only)
    if (process.env.NODE_ENV === "production") {
      const hasAccess = await hasPermission(user, "create_branch");
      if (!hasAccess)
        return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

      const allowed = await hasTenantAccess(user, tenant_id);
      if (!allowed)
        return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }
    // Validation rules for branches
    const rules: any = {
      name: [
        { required: true, label: branchRequiredLabels.name[lang] },
        { minLength: 3, label: branchRequiredLabels.name[lang] },
        { maxLength: 200, label: branchRequiredLabels.name[lang] },
      ],

      name_ar: [
        { required: false, label: branchRequiredLabels.name_ar[lang] },
        { minLength: 3, label: branchRequiredLabels.name_ar[lang] },
        { maxLength: 200, label: branchRequiredLabels.name_ar[lang] },
      ],

      tenant_id: [
        { required: true, label: branchRequiredLabels.tenant_id[lang] },
        { type: "number", label: branchRequiredLabels.tenant_id[lang] },
      ],

      address: [
        { required: false, label: branchRequiredLabels.address[lang] },
        { minLength: 3, label: branchRequiredLabels.address[lang] },
        { maxLength: 255, label: branchRequiredLabels.address[lang] },
      ],

      address_ar: [
        { required: false, label: branchRequiredLabels.address_ar[lang] },
        { minLength: 3, label: branchRequiredLabels.address_ar[lang] },
        { maxLength: 255, label: branchRequiredLabels.address_ar[lang] },
      ],

      latitude: [
        { required: false, label: branchRequiredLabels.latitude[lang] },
        { type: "decimal", label: branchRequiredLabels.latitude[lang] },
      ],

      longitude: [
        { required: false, label: branchRequiredLabels.longitude[lang] },
        { type: "decimal", label: branchRequiredLabels.longitude[lang] },
      ],
    };

    const { valid, errors } = validateFields(body, rules, lang);
    if (!valid) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    const [existing] = await pool.query(
      "SELECT * FROM branches WHERE name = ? AND tenant_id = ? AND status!='deleted'",
      [name, tenant_id]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: getErrorMessage("branchExists", lang) }, { status: 409 });
    }

    // Insert new branch
    await pool.query(
      `INSERT INTO branches (tenant_id, name, name_ar, address, address_ar, latitude, longitude,status)
       VALUES (?, ?, ?, ?, ?, ?, ?,?)`,
      [tenant_id, name, name_ar || null, address || null, address_ar || null, latitude || null, longitude || null,"active"]
    );

    return NextResponse.json(
      { message: getErrorMessage("success", lang) },
      { status: 201 }
    );

  } catch (error) {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}
/**
 * GET /api/v1/admin/branches
 *
 * Lists branches for a tenant with pagination, search, optional filters,
 * and configurable sorting. Production requests must pass `view_branches` 
 * plus tenant access checks.
 *
 * Query Parameters:
 *   - tenant_id (number, required)      : Tenant whose branches should be returned
 *   - page (number, default = 1)        : 1-based page index
 *   - pageSize (number, default = 20)   : Items per page
 *   - search (string, optional)         : Matches name, name_ar, address, address_ar
 *   - sortBy (string, default = created_at)
 *   - sortOrder ("asc" | "desc", default = "desc")
 *
 * Responses:
 *   - 200: { count, page, pageSize, totalPages, data }
 *   - 401: { error }                      : Permission or tenant access denied
 *   - 500: { error }                      : Failed to fetch branches
 */
export async function GET(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();

    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = (searchParams.get("sortOrder") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

    if (!tenant_id) {
      return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 400 });
    }

    const user: any = await getUserData(req);
    if (process.env.NODE_ENV === "production") {
      const hasAccess = await hasPermission(user, "view_branches");
      if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    // Build WHERE clause
    let where = "tenant_id = ?";
    const params: any[] = [tenant_id];

    if (search) {
      where += " AND (name LIKE ? OR name_ar LIKE ? OR address LIKE ? OR address_ar LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count
    const [countRows] = await pool.query(`SELECT COUNT(*) as count FROM branches WHERE ${where} AND status != 'deleted'`, params);
    const count = (countRows as Array<{ count: number }>)[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    // Get paginated data
    const [branches] = await pool.query(
      `SELECT id, tenant_id, name, name_ar, address, address_ar, latitude, longitude, created_at,status
       FROM branches
       WHERE ${where} AND status != 'deleted'
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ count, page, pageSize, totalPages, data: branches }, { status: 200 });

  } catch (error) {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    console.error("GET branches error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}


/**
 * DELETE /api/v1/admin/branches
 *
 * deletes multiple branches that belong to the provided tenant. Requests in production
 * must pass `delete_branch` and confirm tenant access.
 *
 * Request Body:
 *   - tenant_id (number, required)        : Tenant whose branches are being deleted
 *   - branch_ids (number[], required)     : IDs of the branches to delete
 *
 * Responses:
 *   - 200: { message }                     : Indicates how many branches were deleted
 *   - 400: { error }                       : Missing or invalid payload
 *   - 401: { error }                       : Permission or tenant access denied
 *   - 404: { error }                       : No matching branches were found
 *   - 500: { error }                       : Internal server error
 */
export async function DELETE(req: NextRequest) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const { tenant_id, branch_ids } = await req.json();

    if (!tenant_id) {
      return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 400 });
    }
    if (!Array.isArray(branch_ids) || branch_ids.length === 0) {
      return NextResponse.json({ error: getErrorMessage("missingBranchIds", lang) }, { status: 400 });
    }

    const normalizedIds = branch_ids.map((id: any) => Number(id)).filter((id: number) => !Number.isNaN(id));
    if (!normalizedIds.length) {
      return NextResponse.json({ error: getErrorMessage("invalidBranchIds", lang) }, { status: 400 });
    }

    const user: any = await getUserData(req);
    if (process.env.NODE_ENV === "production") {
      const hasAccess = await hasPermission(user, "delete_branch");
      if (!hasAccess) {
        return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
      }
      const allowed = await hasTenantAccess(user, tenant_id);
      if (!allowed) {
        return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
      }
    }

    const [targetBranches] = await pool.query(
      `SELECT id FROM branches WHERE id IN (?) AND tenant_id = ? AND status != 'deleted'`,
      [normalizedIds, tenant_id]
    );
    const branchesArr = targetBranches as Array<{ id: number }>;
    if (!branchesArr.length) {
      return NextResponse.json({ error: getErrorMessage("noBranchesFound", lang) }, { status: 404 });
    }

    const deletableIds = branchesArr.map(b => b.id);

 await pool.query(
      `UPDATE branches SET status = 'deleted'
       WHERE id IN (?) AND tenant_id = ?`,
      [deletableIds, tenant_id]
    );
    return NextResponse.json(
      { message: errorMessages[lang].deleted(deletableIds.length) },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}