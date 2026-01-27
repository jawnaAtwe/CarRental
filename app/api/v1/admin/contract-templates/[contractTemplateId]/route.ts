import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../../functions/permissions";
import { validateFields } from "../../../functions/validation";

const errorMessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    missingTemplateId: "Contract template ID is missing.",
    templateNotFound: "Contract template not found.",
    noFieldsToUpdate: "No fields provided to update.",
    updatedSuccess: "Contract template updated successfully.",
     deletedSuccess: "Contract template deleted successfully.",
  },
  ar: {
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    missingTemplateId: "معرّف قالب العقد مفقود.",
    templateNotFound: "قالب العقد غير موجود.",
    noFieldsToUpdate: "لم يتم تقديم أي حقول للتحديث.",
    deletedSuccess: "تم حذف نموذج العقد بنجاح.",
    updatedSuccess: "تم تعديل قالب العقد بنجاح."
  }
};

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}



/**
 * PUT /api/v1/admin/[contractTemplateId]
 *
 * Updates an existing contract template.
 *
 * URL Parameters:
 *   - contractTemplateId: ID of the contract template to update (required)
 *
 * Request Body (any of these fields can be provided):
 *   - tenant_id (number, optional) : The tenant this template belongs to
 *   - language (string, optional) : Language of the template (e.g., "en", "ar")
 *   - name (string, optional) : Name/title of the template
 *   - content (string, optional) : The body/content of the contract template
 *   - status (string, optional) : Status of the template ("active", "inactive", etc.)
 *
 * Responses:
 *   - 200: { message } -> Template updated successfully
 *   - 400: { error } -> Missing template ID or no fields to update
 *   - 401: { error } -> Unauthorized access or tenant access denied
 *   - 404: { error } -> Template not found (either doesn't exist or marked as deleted)
 *   - 500: { error } -> Internal server error
 *
 */

export async function PUT(req: NextRequest, { params }: { params: { contractTemplateId: string } }) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const templateId = Number(params.contractTemplateId);
    if (isNaN(templateId)) {
      return NextResponse.json({ error: getErrorMessage("missingTemplateId", lang) }, { status: 400 });
    }

    const payload = await req.json();
    const { tenant_id, language, name, content, status } = payload;

    // Permissions check
    const hasAccess = await hasPermission(user, "edit_contract_templates");
    if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

    // Tenant access check
    if (tenant_id) {
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }
    const fields: string[] = [];
    const values: any[] = [];

    if (language) { fields.push("language = ?"); values.push(language); }
    if (name) { fields.push("name = ?"); values.push(name); }
    if (content) { fields.push("content = ?"); values.push(content); }
    if (status) { fields.push("status = ?"); values.push(status); }
    if (tenant_id) { fields.push("tenant_id = ?"); values.push(tenant_id); }

    if (!fields.length) {
      return NextResponse.json({ error: getErrorMessage("noFieldsToUpdate", lang) }, { status: 400 });
    }

    values.push(templateId);

    const [result]: any = await pool.query(
      `UPDATE contract_templates SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ? AND status!='deleted'`,
      values
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: getErrorMessage("templateNotFound", lang) }, { status: 404 });
    }

    return NextResponse.json({ message: getErrorMessage("updatedSuccess", lang) }, { status: 200 });

  } catch (error) {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    console.error("PUT contract template error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}
/**
 * GET /api/v1/admin/contract-templates/[contractTemplateId]
 *
 * Fetches a single contract template by its ID.
 *
 * Path Parameters:
 *   - contractTemplateId (number, required): ID of the template to fetch
 *
 * Query Parameters (optional):
 *   - tenant_id (number, optional): Filter template by tenant and check access
 *
 * Responses:
 *   - 200: { data } -> The contract template object
 *   - 400: { error } -> Missing or invalid template ID
 *   - 401: { error } -> Unauthorized access or tenant access denied
 *   - 404: { error } -> Template not found
 *   - 500: { error } -> Internal server error
 *
 * Notes:
 *   - Uses getErrorMessage(key, lang) for localized messages
 *   - Template object includes: id, tenant_id, language, name, content, status, created_at, updated_at
 */

export async function GET(req: NextRequest, { params }: { params: { contractTemplateId: string } }) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const templateId = Number(params.contractTemplateId);
    if (isNaN(templateId)) {
      return NextResponse.json({ error: getErrorMessage("missingTemplateId", lang) }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");

    const hasAccess = await hasPermission(user, "view_contract_templates");
    if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

    if (tenant_id) {
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    const [rows] = await pool.query(
      `SELECT * FROM contract_templates WHERE id = ? AND status != 'deleted' ${tenant_id ? "AND tenant_id = ?" : ""} LIMIT 1`,
      tenant_id ? [templateId, tenant_id] : [templateId]
    );

    const template = (rows as any[])[0];
    if (!template) {
      return NextResponse.json({ error: getErrorMessage("templateNotFound", lang) }, { status: 404 });
    }

    return NextResponse.json({ data: template }, { status: 200 });

  } catch (error) {
    console.error("GET contract template error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}
/**
 * DELETE /api/v1/admin/contract-templates/:contractTemplateId
 *
 * Deletes a specific contract template by its ID (contractTemplateId) and optional tenant_id.
 *
 * Permissions:
 * - User must have "delete_contract_templates" permission.
 *
 * Query Parameters (optional):
 * - tenant_id: Checks access for the tenant if provided.
 *
 * Responses:
 * - 200: { message: "Contract template deleted successfully" }
 * - 400: { error: "Template ID is missing" }
 * - 401: { error: "Unauthorized access" }
 * - 404: { error: "Contract template not found" }
 * - 500: { error: "Internal server error" }
 */


export async function DELETE(req: NextRequest, { params }: { params: { contractTemplateId: string } }) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const templateId = Number(params.contractTemplateId);
    if (isNaN(templateId)) {
      return NextResponse.json({ error: getErrorMessage("missingTemplateId", lang) }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");

    const hasAccess = await hasPermission(user, "delete_contract_templates");
    if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

    if (tenant_id) {
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    const [result]: any = await pool.query(
      `UPDATE contract_templates 
       SET status = 'deleted', updated_at = NOW() 
       WHERE id = ?`, [ templateId]
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