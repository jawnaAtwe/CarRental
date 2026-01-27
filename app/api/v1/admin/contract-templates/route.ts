import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../functions/permissions";
import { validateFields } from "../../functions/validation";

// Error messages
const errorMessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    noTemplatesFound: "No contract templates found.",
    templateNotFound: "Contract template not found.",
    createdSuccess: "Contract template created successfully.",
    updatedSuccess: "Contract template updated successfully.",
    missingTemplateId: "Template ID is missing.",
    missingTenantId: "Tenant ID is missing.",
    missingContent: "Template content is missing.",
    deletedSuccess: (count: number) => `${count} template(s) deleted successfully.`,
  },
  ar: {
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    noTemplatesFound: "لم يتم العثور على أي قوالب عقود.",
    templateNotFound: "القالب غير موجود.",
    createdSuccess: "تم إنشاء قالب العقد بنجاح.",
    updatedSuccess: "تم تعديل قالب العقد بنجاح.",
    missingTemplateId: "معرّف القالب مفقود.",
    missingTenantId: "معرّف المستأجر مفقود.",
    missingContent: "محتوى القالب مفقود.",
    deletedSuccess: (count: number) => `تم حذف ${count} قالب(قوالب) بنجاح.`,
  }
};

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

/**
 * GET /api/v1/admin/contract-templates
 *
 * Fetches contract templates for a tenant, optionally filtered by language.
 *
 * Query Parameters:
 *   - tenant_id (number, optional): Filter templates by tenant. Requires tenant access.
 *   - language (string, optional, default "en"): Filter templates by language.
 *
 * Error Handling:
 *   - 401: Unauthorized access or tenant access denied.
 *   - 404: No templates found matching the filters.
 *   - 500: Server/database errors.
 *
 * Notes:
 *   - Only templates with status != 'deleted' are returned.
 *   - Language defaults to "en" if not specified.
 *   - Can be used to populate dropdowns or lists in the admin dashboard.
 */

export async function GET(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");
    const language = searchParams.get("language") || "en";

    // Access check
    const hasAccess = await hasPermission(user, "view_contract_templates");
    if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

    if (tenant_id) {
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    let where = "1=1";
    const params: any[] = [];
    if (tenant_id) { where += " AND tenant_id = ?"; params.push(tenant_id); }
    if (language) { where += " AND language = ?"; params.push(language); }

    const [templates] = await pool.query(
      `SELECT * FROM contract_templates WHERE ${where} AND status!='deleted' ORDER BY created_at DESC`,
      params
    );

    return NextResponse.json({ data: templates || [] }, { status: 200 });

  } catch (error) {
    console.error("GET contract templates error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/contract-templates
 *
 * Creates a new contract template for a tenant.
 *
 * Request Body:
 *   - tenant_id (number, required): The ID of the tenant the template belongs to.
 *   - language (string, optional, default "en"): The language of the template.
 *   - name (string, optional): A human-readable name for the template.
 *   - content (string, required): The HTML or text content of the contract template.
 *
 * Error Handling:
 *   - 400: Missing tenant_id or content.
 *   - 401: Unauthorized access or tenant access denied.
 *   - 500: Server/database errors.
 */

export async function POST(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const payload = await req.json();
    const { tenant_id, language,name, content } = payload;

    // Validation
    if (!tenant_id) return NextResponse.json({ error: getErrorMessage("missingTenantId", lang) }, { status: 400 });
    if (!content) return NextResponse.json({ error: getErrorMessage("missingContent", lang) }, { status: 400 });

    const hasAccess = await hasPermission(user, "add_contract_templates");
    if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

    // Tenant access
    if (tenant_id) {
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    await pool.query(
      `INSERT INTO contract_templates (tenant_id, language,name, content, created_at, updated_at,status)
       VALUES (?, ?, ?,?, NOW(), NOW(),"active")`,
      [tenant_id, language || "en",name, content]
    );

    return NextResponse.json({ message: getErrorMessage("createdSuccess", lang) }, { status: 201 });

  } catch (error) {
    console.error("POST contract template error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}
/**
 * DELETE /api/v1/admin/contract-templates
 *
 * Deletes a specific contract template for a tenant.
 *
 * Request Body:
 *   - template_ids (number, required): The ID's of the contract template to delete
 *   - tenant_id (number, optional): Tenant ID for access check
 *
 * Response:
 *   - 200: { message } on successful deletion
 *   - 400: { error } if template_id is missing
 *   - 401: { error } if user is unauthorized or has no tenant access
 *   - 404: { error } if template not found
 *   - 500: { error } for server errors
 */
export async function DELETE(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const { template_ids, tenant_id } = await req.json(); // array of IDs

    if (!template_ids || !Array.isArray(template_ids) || !template_ids.length) {
      return NextResponse.json({ error: getErrorMessage("missingTemplateId", lang) }, { status: 400 });
    }

    // Check permissions
    const hasAccess = await hasPermission(user, "delete_contract_templates");
    if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

    // Tenant access check
    if (tenant_id) {
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    // Soft delete for multiple templates
    const [result]: any = await pool.query(
      `UPDATE contract_templates 
       SET status = 'deleted', updated_at = NOW() 
       WHERE id IN (?)`, [template_ids]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: getErrorMessage("templateNotFound", lang) }, { status: 404 });
    }

    return NextResponse.json({ message: getErrorMessage("deletedSuccess", lang) }, { status: 200 });

  } catch (error) {
    console.error("DELETE contract template error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}
