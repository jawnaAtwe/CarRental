import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../functions/permissions";
import { validateFields } from "../../functions/validation";
// Error messages
const errorMessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    subscriptionExists: "Subscription already exists for this tenant ",
    createdSuccess: "Subscription created successfully.",
    updatedSuccess: "Subscription updated successfully.",
    deletedSuccess: (count: number) => `${count} subscription(s) deleted successfully.`,
    missingSubscriptionIds: "Subscription IDs are missing.",
    invalidSubscriptionIds: "Subscription IDs are invalid.",
    noSubscriptionsFound: "No matching subscriptions found.",
    subscriptionNotFound: "Subscription not found.",
    missingPlanId: "Plan ID is missing.",
    missingTenantId: "Tenant ID is missing."
  },
  ar: {
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    subscriptionExists: "الاشتراك موجود بالفعل لهذا المستأجر .",
    createdSuccess: "تم إنشاء الاشتراك بنجاح.",
    updatedSuccess: "تم تعديل الاشتراك بنجاح.",
    deletedSuccess: (count: number) => `تم حذف ${count} اشتراك(ات) بنجاح.`,
    missingSubscriptionIds: "معرّفات الاشتراكات مفقودة.",
    invalidSubscriptionIds: "معرّفات الاشتراكات غير صالحة.",
    noSubscriptionsFound: "لم يتم العثور على أي اشتراكات مطابقة.",
    subscriptionNotFound: "الاشتراك غير موجود.",
    missingPlanId: "معرّف الخطة مفقود.",
    missingTenantId: "معرّف المستأجر مفقود."
  }
};

function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

/**
 * GET /api/v1/admin/subscriptions
 *
 * List subscriptions with optional tenant filter, pagination, and search.
 * Production: requires super-admin or view permission + tenant access.
 *
 * Query Parameters:
 *   - tenant_id (number, optional) : filter by tenant
 *   - plan_id (number, optional)   : filter by plan
 *   - page (number, default = 1)
 *   - pageSize (number, default = 20)
 *   - status (optional)            : filter by status
 *
 * Response:
 *   - 200: { count, page, pageSize, totalPages, data }
 *   - 401 / 500 on error
 */
export async function GET(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");
    const plan_id = searchParams.get("plan_id");
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 20);

    // Access checks
    const hasAccess = await hasPermission(user, "view_subscriptions");
    if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

    if (tenant_id) {
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    }

    // Build WHERE clause
    let where = "s.status != 'deleted'";
    const params: any[] = [];

    if (tenant_id) { where += " AND s.tenant_id = ?"; params.push(tenant_id); }
    if (plan_id) { where += " AND s.plan_id = ?"; params.push(plan_id); }
    if (status && status !== "all") { where += " AND s.status = ?"; params.push(status); }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as count FROM subscriptions s WHERE ${where}`,
      params
    );
    const count = (countRows as any[])[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    // Fetch subscriptions
    const [subscriptions] = await pool.query(
      `SELECT s.*, t.name AS tenant_name, p.name AS plan_name
       FROM subscriptions s
       LEFT JOIN tenants t ON t.id = s.tenant_id
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE ${where}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json({ count, page, pageSize, totalPages, data: subscriptions }, { status: 200 });

  } catch (error) {
    console.error("GET subscriptions error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/subscriptions
 *
 * Creates a new subscription for a tenant and plan.
 * Validates required fields with multilingual messages, checks user permissions,
 * prevents duplicate active subscriptions, and inserts the subscription into the database.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Request Body:
 *   - tenant_id (number, required)   : ID of the tenant
 *   - plan_id (number, required)     : ID of the plan
 *   - start_date (string, required)  : Subscription start date (YYYY-MM-DD)
 *   - end_date (string, required)    : Subscription end date (YYYY-MM-DD)
 *   - status (string, optional)      : Subscription status ("active" by default)
 *   - auto_renew (boolean, optional) : Whether the subscription auto-renews (default: true)
 *
 * Responses:
 *   - 201: { message }                     : Subscription created successfully
 *   - 400: { error }                       : Validation failed or missing required fields
 *   - 401: { error }                       : Unauthorized or tenant access denied
 *   - 409: { error }                       : Duplicate active subscription exists
 *   - 500: { error }                       : Internal server error
 */

export async function POST(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const payload = await req.json();
    const { tenant_id, plan_id, start_date, end_date, status, auto_renew } = payload;

   // Labels للحقول
const requiredFieldLabels: Record<"tenant_id" | "plan_id" | "start_date" | "end_date", { en: string; ar: string }> = {
  tenant_id: { en: "Tenant ID", ar: "معرّف المستأجر" },
  plan_id: { en: "Plan ID", ar: "معرّف الخطة" },
  start_date: { en: "Start Date", ar: "تاريخ البداية" },
  end_date: { en: "End Date", ar: "تاريخ الانتهاء" },
};

// Rules للتحقق
const rules: any = {
  tenant_id: [
    { required: true, label: requiredFieldLabels.tenant_id[lang] },
    { type: "number", label: requiredFieldLabels.tenant_id[lang] },
  ],
  plan_id: [
    { required: true, label: requiredFieldLabels.plan_id[lang] },
    { type: "number", label: requiredFieldLabels.plan_id[lang] },
  ],
  start_date: [
    { required: true, label: requiredFieldLabels.start_date[lang] },
    { type: "date", label: requiredFieldLabels.start_date[lang] },
  ],
  end_date: [
    { required: true, label: requiredFieldLabels.end_date[lang] },
    { type: "date", label: requiredFieldLabels.end_date[lang] },
  ],
};


    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }


    // Check permissions
    const hasAccess = await hasPermission(user, "add_subscriptions");
    if (!hasAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });

    // Check tenant access
 
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    

    // Prevent duplicate active subscription for same tenant & plan
    const [existing] = await pool.query(
      "SELECT * FROM subscriptions WHERE tenant_id = ? AND status = 'active'",
      [tenant_id, plan_id]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: getErrorMessage("subscriptionExists", lang) }, { status: 409 });
    }

    // Insert subscription
    await pool.query(
      `INSERT INTO subscriptions (tenant_id, plan_id, start_date, end_date, status, auto_renew)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenant_id, plan_id, start_date, end_date, status || "active", auto_renew !== undefined ? !!auto_renew : true]
    );

    return NextResponse.json({ message: getErrorMessage("createdSuccess", lang) }, { status: 201 });

  } catch (error) {
    console.error("POST subscription error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/admin/subscriptions
 *
 * Soft-deletes multiple subscriptions that belong to a tenant. Requests in production
 * must pass `delete_subscriptions` permission and confirm tenant access.
 *
 * Request Body:
 *   - tenant_id (number, required)          : Tenant whose subscriptions are being deleted
 *   - subscription_ids (number[], required) : IDs of the subscriptions to soft-delete
 *
 * Responses:
 *   - 200: { message }                       : Indicates how many subscriptions were deleted
 *   - 400: { error }                         : Missing or invalid payload
 *   - 401: { error }                         : Permission or tenant access denied
 *   - 404: { error }                         : No matching active subscriptions were found
 *   - 500: { error }                         : Internal server error
 */
export async function DELETE(req: NextRequest) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const { tenant_id, subscription_ids } = await req.json();

    // Validation
    if (!tenant_id) {
      return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 400 });
    }
    if (!Array.isArray(subscription_ids) || subscription_ids.length === 0) {
      return NextResponse.json({ error: getErrorMessage("missingSubscriptionIds", lang) }, { status: 400 });
    }

    const normalizedIds = subscription_ids
      .map((id: any) => Number(id))
      .filter((id: number) => !Number.isNaN(id));

    if (!normalizedIds.length) {
      return NextResponse.json({ error: getErrorMessage("invalidSubscriptionIds", lang) }, { status: 400 });
    }

    const user: any = await getUserData(req);

    // Permission check
      const hasAccess = await hasPermission(user, "delete_subscriptions");
      if (!hasAccess) {
        return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
      }
      const allowed = await hasTenantAccess(user, tenant_id);
      if (!allowed) {
        return NextResponse.json({ error: getErrorMessage("unauthorized", lang) }, { status: 401 });
    
    }

    // Ensure target subscriptions exist and belong to tenant AND not already deleted
    const [targetSubscriptions] = await pool.query(
      `SELECT id FROM subscriptions 
       WHERE id IN (?) 
       AND tenant_id = ? 
       AND status != 'deleted'`,
      [normalizedIds, tenant_id]
    );

    const subsArr = targetSubscriptions as Array<{ id: number }>;
    if (!subsArr.length) {
      return NextResponse.json({ error: getErrorMessage("noSubscriptionsFound", lang) }, { status: 404 });
    }

    const deletableIds = subsArr.map(s => s.id);

    // Soft delete
    await pool.query(
      `UPDATE subscriptions SET status = 'deleted'
       WHERE id IN (?) AND tenant_id = ?`,
      [deletableIds, tenant_id]
    );

    return NextResponse.json(
      { message: errorMessages[lang].deletedSuccess(deletableIds.length) },
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE subscriptions error:", error);
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}
