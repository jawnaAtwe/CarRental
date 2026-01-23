import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { hasPermission, getUserData, hasTenantAccess } from "../../../functions/permissions";
import { isSuperAdmin } from "@/lib/auth";

// Error messages
const errorMessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    planExists: "Plan name already exists.",
    createdSuccess: "Plan created successfully.",
    updatedSuccess: "Plan updated successfully.",
    planNotFound: "Plan not found",
    missingPlanId: "Plan ID is missing",
    deletedSuccess:"Plan deleted successfully"
  },
  ar: {
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    planExists: "اسم الخطة موجود مسبقاً.",
    createdSuccess: "تم إنشاء الخطة بنجاح.",
    updatedSuccess: "تم تحديث بيانات الخطة بنجاح.",
    planNotFound: "الخطة غير موجودة",
    missingPlanId: "معرّف الخطة مفقود",
    deletedSuccess:"تم حذف الخطة بنجاح"
  },
};
function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

/**
 * PUT /api/v1/admin/plans/[planId]
 *
 * Updates an existing plan by its ID. Only supplied fields are updated.
 * Super-admin access is required in production.
 *
 * Path Parameters:
 *   - planId (number, required)  : The ID of the plan to update
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar" for localized messages
 *
 * Request Body (any subset can be supplied):
 *   - name (string, optional)           : Plan name (must be unique)
 *   - description (string, optional)    : Plan description
 *   - price (number, optional)          : Plan price
 *   - currency_code (string, optional)  : Currency code (e.g., USD)
 *   - billing_cycle ("monthly"|"yearly") (optional) : Billing frequency
 *   - max_cars (number, optional)       : Max cars allowed
 *   - max_users (number, optional)      : Max users allowed
 *   - max_bookings (number, optional)   : Max bookings allowed
 *   - status ("active"|"inactive"|"deleted") (optional) : Plan status
 *
 * Responses:
 *   - 200: { message }                : Plan updated successfully
 *   - 400: { error }                  : planId missing
 *   - 401: { error }                  : Unauthorized (not super-admin)
 *   - 404: { error }                  : Plan not found or deleted
 *   - 409: { error }                  : Name conflict with another plan
 *   - 500: { error }                  : Internal server error
 *
 */

export async function PUT(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const planId = params.planId;
    if (!planId) return NextResponse.json({ error: getErrorMessage("missingPlanId", lang) }, { status: 400 });

  
      const hasAccess = await isSuperAdmin(user);
      if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
   

    const payload = await req.json();
    const { name, description, price, currency_code, billing_cycle, max_cars, max_users, max_bookings, status } = payload;

    const [existing] = await pool.query("SELECT * FROM plans WHERE id = ? AND status != 'deleted'", [planId]);
    if (!(existing as any[]).length) return NextResponse.json({ error: getErrorMessage("planNotFound", lang) }, { status: 404 });

    // Check name uniqueness
    if (name) {
      const [conflict] = await pool.query("SELECT * FROM plans WHERE name = ? AND id != ? AND status != 'deleted'", [name, planId]);
      if ((conflict as any[]).length > 0) return NextResponse.json({ error: getErrorMessage("planExists", lang) }, { status: 409 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    if (name) fields.push("name = ?") && values.push(name);
    if (description) fields.push("description = ?") && values.push(description);
    if (price !== undefined) fields.push("price = ?") && values.push(price);
    if (currency_code) fields.push("currency_code = ?") && values.push(currency_code);
    if (billing_cycle) fields.push("billing_cycle = ?") && values.push(billing_cycle);
    if (max_cars !== undefined) fields.push("max_cars = ?") && values.push(max_cars);
    if (max_users !== undefined) fields.push("max_users = ?") && values.push(max_users);
    if (max_bookings !== undefined) fields.push("max_bookings = ?") && values.push(max_bookings);
    if (status) fields.push("status = ?") && values.push(status);

    if (fields.length > 0) {
      await pool.query(`UPDATE plans SET ${fields.join(", ")} WHERE id = ?`, [...values, planId]);
    }

    return NextResponse.json({ message: getErrorMessage("updatedSuccess", lang) }, { status: 200 });
  } catch (error) {
    console.error("PUT plan error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/plans/[planId]
 *
 * Soft-deletes a plan.
 */
export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const planId = params.planId;
    if (!planId) return NextResponse.json({ error: getErrorMessage("missingPlanId", lang) }, { status: 400 });

      const hasAccess = await isSuperAdmin(user);
      if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
   

    const [existing] = await pool.query("SELECT * FROM plans WHERE id = ? AND status != 'deleted'", [planId]);
    if (!(existing as any[]).length) return NextResponse.json({ error: getErrorMessage("planNotFound", lang) }, { status: 404 });

    await pool.query("UPDATE plans SET status = 'deleted' WHERE id = ?", [planId]);

    return NextResponse.json({ message: getErrorMessage("deletedSuccess", lang) }, { status: 200 });
  } catch (error) {
    console.error("DELETE plan error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * GET /api/v1/admin/plans/[planId]
 *
 * Returns a single plan by ID. Production requests must pass `view_plans`.
 *
 * Path Parameters:
 *   - planId (number, required)
 *
 * Responses:
 *   - 200: plan object
 *   - 400: { error } : planId missing
 *   - 401: { error } : Permission denied
 *   - 404: { error } : Plan not found / deleted
 *   - 500: { error } : Internal server error
 */
export async function GET(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const planId = params.planId;
    if (!planId) {
      return NextResponse.json({ error: getErrorMessage("missingPlanId", lang) }, { status: 400 });
    }

         const hasAccess = await hasPermission(user,'view_plans');
      if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
   
    const [rows] = await pool.query(
      `SELECT *
       FROM plans
       WHERE id = ? AND status != 'deleted'
       LIMIT 1`,
      [planId]
    );

    const plan = (rows as any[])[0];
    if (!plan) {
      return NextResponse.json({ error: getErrorMessage("planNotFound", lang) }, { status: 404 });
    }

    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.error("GET plan by ID error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

