import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { validateFields } from "../../functions/validation";
import {getUserData, hasPermission } from "../../functions/permissions";
import { isSuperAdmin } from "@/lib/auth";

const errorMessages = {
  en: {
    missingFields: "Required fields are missing.",
    unauthorized: "Unauthorized access.",
    planExists: "Plan name already exists.",
    serverError: "Internal server error.",
    success: "Plan created successfully.",
       missingPlanId: "Plan ID is required.",
    noPlansFound: "No active plans found.",
    deleted: (count: number) => `Deleted ${count} plan(s).`,
  },
  ar: {
    missingFields: "الحقول المطلوبة مفقودة.",
    unauthorized: "دخول غير مصرح به.",
    planExists: "اسم الخطة موجود مسبقاً.",
    serverError: "خطأ في الخادم الداخلي.",
    success: "تم إنشاء الخطة بنجاح.",
     missingPlanId: "معرف الخطة مطلوب.",
    noPlansFound: "لم يتم العثور على أي خطة نشطة.",
    deleted: (count: number) => `تم حذف ${count} خطة${count === 1 ? "" : "ات"}.`,
  },
};

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

const requiredFieldLabels: Record<"name" | "price" | "currency_code" | "billing_cycle",
  { en: string; ar: string }> = {
  name: { en: "Plan Name", ar: "اسم الخطة" },
  price: { en: "Price", ar: "السعر" },
  currency_code: { en: "Currency", ar: "رمز العملة" },
  billing_cycle: { en: "Billing Cycle", ar: "دورة الفوترة" },
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const user: any = await getUserData(req);

      const hasAccess = await isSuperAdmin(user);
      if (!hasAccess) {
        return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
      }
   

    const payload = await req.json();
    const { name, description, price, currency_code, billing_cycle, max_cars, max_users, max_bookings } = payload;

    const rules: any = {
      name: [{ required: true, label: requiredFieldLabels.name[lang] }],
      price: [{ required: true, label: requiredFieldLabels.price[lang] }],
      currency_code: [{ required: true, label: requiredFieldLabels.currency_code[lang] }],
      billing_cycle: [{ required: true, label: requiredFieldLabels.billing_cycle[lang] }],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const pool = await dbConnection();

    const [existing] = await pool.query("SELECT * FROM plans WHERE name = ?", [name]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: getErrorMessage("planExists", lang) }, { status: 409 });
    }

    const [result]: any = await pool.query(
      `INSERT INTO plans 
      (name, description, price, currency_code, billing_cycle, max_cars, max_users, max_bookings, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [
        name,
        description || null,
        price,
        currency_code || "USD",
        billing_cycle || "monthly",
        max_cars || 0,
        max_users || 0,
        max_bookings || 0,
      ]
    );

    return NextResponse.json({ message: getErrorMessage("success", lang) }, { status: 201 });
  } catch (error) {
    console.error("Create plan error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}


/**
 * GET /api/v1/admin/plans
 *
 * Lists plans with pagination, search, optional status filter, and sorting.
 * Production requests must pass `view_plans`.
 *
 * Query Parameters:
 *   - page (number, default = 1)
 *   - pageSize (number, default = 20)
 *   - search (string, optional)         : matches plan name or description
 *   - status (enum, optional)           : active / inactive / all
 *   - sortBy (string, default = created_at)
 *   - sortOrder ("asc" | "desc", default = "desc")
 *
 * Responses:
 *   - 200: { count, page, pageSize, totalPages, data }
 *   - 401: { error }
 *   - 500: { error }
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
    const sortOrder = (searchParams.get("sortOrder") || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
    const status = searchParams.get("status") || "active";

    const user: any = await getUserData(req);
      const hasAccess = await hasPermission(user,'view_plans');
      if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    

    let where = "status != 'deleted'";
    const params: any[] = [];

    if (search) {
      where += " AND (name LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status && status !== "all") {
      where += " AND status = ?";
      params.push(status);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) AS count FROM plans WHERE ${where}`, params);
    const count = (countRows as Array<{ count: number }>)[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    const [plans] = await pool.query(
      `SELECT id, name, description, price, currency_code, billing_cycle,
              max_cars, max_users, max_bookings, status, created_at, updated_at
       FROM plans
       WHERE ${where}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ count, page, pageSize, totalPages, data: plans }, { status: 200 });
  } catch (error) {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    console.error("GET plans error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/plans
 *
 * Soft-deletes multiple plans.
 *
 * Request Body:
 *   - plan_ids (number[], required)
 *
 * Responses:
 *   - 200: { message }
 *   - 400: { error }
 *   - 404: { error }
 *   - 401: { error }
 *   - 500: { error }
 */
export async function DELETE(req: NextRequest) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const { plan_ids } = await req.json();

    if (!Array.isArray(plan_ids) || plan_ids.length === 0) {
      return NextResponse.json({ error: getErrorMessage("missingPlanId", lang) }, { status: 400 });
    }

    const normalizedIds = plan_ids
      .map((id: any) => Number(id))
      .filter((id: number) => !Number.isNaN(id));

    if (!normalizedIds.length) {
      return NextResponse.json({ error: getErrorMessage("missingPlanId", lang) }, { status: 400 });
    }

    const user: any = await getUserData(req);
      const hasAccess = await isSuperAdmin(user);
      if (!hasAccess) {
        return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
      }

    const [targetPlans] = await pool.query(
      `SELECT id FROM plans WHERE id IN (?) AND status != 'deleted'`,
      [normalizedIds]
    );

    const plansArr = targetPlans as Array<{ id: number }>;
    if (!plansArr.length) {
      return NextResponse.json({ error: getErrorMessage("noPlansFound", lang) }, { status: 404 });
    }

    const deletableIds = plansArr.map(p => p.id);

    await pool.query(
      `UPDATE plans SET status = 'deleted' WHERE id IN (?)`,
      [deletableIds]
    );

    return NextResponse.json(
      { message: errorMessages[lang].deleted(deletableIds.length) },
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE plans error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}