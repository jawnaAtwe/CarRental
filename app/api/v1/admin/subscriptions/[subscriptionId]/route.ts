import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { hasPermission, getUserData, hasTenantAccess } from "../../../functions/permissions";
import { validateFields } from "../../../functions/validation";

// Error messages
const subscriptionErrorMessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    subscriptionExists: "Active subscription already exists for this tenant & plan.",
    subscriptionNotFound: "Subscription not found.",
    missingTenantId: "Tenant ID is missing.",
    createdSuccess: "Subscription created successfully.",
    updatedSuccess: "Subscription updated successfully.",
    deletedSuccess: (count: number) => `${count} subscription(s) deleted successfully.`,
  },
  ar: {
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    subscriptionExists: "هناك اشتراك نشط مسبقًا لهذا المستأجر والخطة.",
    subscriptionNotFound: "الاشتراك غير موجود.",
    missingTenantId: "معرّف المستأجر مفقود.",
    createdSuccess: "تم إنشاء الاشتراك بنجاح.",
    updatedSuccess: "تم تحديث الاشتراك بنجاح.",
    deletedSuccess: (count: number) => `تم حذف ${count} اشتراك/اشتراكات بنجاح.`,
  },
};

function getSubscriptionErrorMessage(key: keyof typeof subscriptionErrorMessages["en"], lang: "en" | "ar" = "en", count?: number) {
  const msg = subscriptionErrorMessages[lang][key];
  if (typeof msg === "function") return msg(count || 0);
  return msg;
}

/**
 * GET /api/v1/admin/subscriptions/[subscriptionId]
 *
 * Returns a single subscription by ID.
 *
 * Path Parameters:
 *   - subscriptionId (number, required)
 *
 * Query Parameters:
 *   - tenant_id (number, required in production)
 *
 * Responses:
 *   - 200: subscription object
 *   - 400: missing tenant or subscription ID
 *   - 401: unauthorized
 *   - 404: subscription not found
 *   - 500: server error
 */
export async function GET(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const subscriptionId = params.subscriptionId;
    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");

    if (!subscriptionId) return NextResponse.json({ error: getSubscriptionErrorMessage("subscriptionNotFound", lang) }, { status: 400 });
    if (!tenant_id) return NextResponse.json({ error: getSubscriptionErrorMessage("missingTenantId", lang) }, { status: 400 });

    const hasAccess = await hasPermission(user, "view_subscriptions");
    if (!hasAccess) return NextResponse.json({ error: getSubscriptionErrorMessage("unauthorized", lang) }, { status: 401 });

    const tenantAccess = await hasTenantAccess(user, tenant_id);
    if (!tenantAccess) return NextResponse.json({ error: getSubscriptionErrorMessage("unauthorized", lang) }, { status: 401 });

    const [rows] = await pool.query(
      `SELECT s.*, p.name AS plan_name, t.name AS tenant_name
       FROM subscriptions s
       LEFT JOIN plans p ON p.id = s.plan_id
       LEFT JOIN tenants t ON t.id = s.tenant_id
       WHERE s.id = ? AND s.tenant_id = ? AND s.status != 'deleted'
       LIMIT 1`,
      [subscriptionId, tenant_id]
    );

    const subscription = (rows as any[])[0];
    if (!subscription) return NextResponse.json({ error: getSubscriptionErrorMessage("subscriptionNotFound", lang) }, { status: 404 });

    return NextResponse.json(subscription, { status: 200 });
  } catch (error) {
    console.error("GET subscription error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getSubscriptionErrorMessage("serverError", lang) }, { status: 500 });
  }
}

/**
 * PUT /api/v1/admin/subscriptions/[subscriptionId]
 *
 * Updates a subscription by ID.
 *
 * Path Parameters:
 *   - subscriptionId (number, required)
 *
 * Request Body:
 *   - tenant_id (number, required)
 *   - plan_id, start_date, end_date, status, auto_renew (optional)
 *
 * Responses:
 *   - 200: success
 *   - 400: missing required fields
 *   - 401: unauthorized
 *   - 404: subscription not found
 *   - 409: duplicate subscription
 *   - 500: server error
 */
export async function PUT(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const subscriptionId = params.subscriptionId;
    if (!subscriptionId) return NextResponse.json({ error: getSubscriptionErrorMessage("subscriptionNotFound", lang) }, { status: 400 });

    const payload = await req.json();
    const { tenant_id, plan_id, start_date, end_date, status, auto_renew } = payload;

    if (!tenant_id) return NextResponse.json({ error: getSubscriptionErrorMessage("missingTenantId", lang) }, { status: 400 });

    const hasAccess = await hasPermission(user, "edit_subscriptions");
    if (!hasAccess) return NextResponse.json({ error: getSubscriptionErrorMessage("unauthorized", lang) }, { status: 401 });

    const tenantAccess = await hasTenantAccess(user, tenant_id);
    if (!tenantAccess) return NextResponse.json({ error: getSubscriptionErrorMessage("unauthorized", lang) }, { status: 401 });

    const [existing] = await pool.query("SELECT * FROM subscriptions WHERE id = ? AND tenant_id = ? AND status = 'active'", [subscriptionId, tenant_id]);
    if (!(existing as any[]).length) return NextResponse.json({ error: getSubscriptionErrorMessage("subscriptionNotFound", lang) }, { status: 404 });

    // Prevent duplicate active subscription
    if (plan_id) {
      const [conflict] = await pool.query(
        "SELECT * FROM subscriptions WHERE tenant_id = ? AND plan_id = ? AND status = 'active' AND id != ?",
        [tenant_id, plan_id, subscriptionId]
      );
      if ((conflict as any[]).length > 0) return NextResponse.json({ error: getSubscriptionErrorMessage("subscriptionExists", lang) }, { status: 409 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    if (plan_id) { fields.push("plan_id = ?"); values.push(plan_id); }
    if (start_date) { fields.push("start_date = ?"); values.push(start_date); }
    if (end_date) { fields.push("end_date = ?"); values.push(end_date); }
    if (status) { fields.push("status = ?"); values.push(status); }
    if (auto_renew !== undefined) { fields.push("auto_renew = ?"); values.push(!!auto_renew); }

    if (fields.length > 0) {
      await pool.query(`UPDATE subscriptions SET ${fields.join(", ")} WHERE id = ? AND tenant_id = ?`, [...values, subscriptionId, tenant_id]);
    }

    return NextResponse.json({ message: getSubscriptionErrorMessage("updatedSuccess", lang) }, { status: 200 });
  } catch (error) {
    console.error("PUT subscription error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getSubscriptionErrorMessage("serverError", lang) }, { status: 500 });
  }
}
/**
 * DELETE /api/v1/admin/subscriptions/[subscriptionId]
 *
 * Soft-deletes a subscription by ID.
 *
 * Path Parameters:
 *   - subscriptionId (number, required)
 *
 * Request Body:
 *   - tenant_id (number, required)
 *
 * Responses:
 *   - 200: success
 *   - 400: missing tenant or subscription ID
 *   - 401: unauthorized
 *   - 404: subscription not found
 *   - 500: server error
 */
export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const subscriptionId = params.subscriptionId;
    const { tenant_id } = await req.json();

    if (!subscriptionId) return NextResponse.json({ error: getSubscriptionErrorMessage("subscriptionNotFound", lang) }, { status: 400 });
    if (!tenant_id) return NextResponse.json({ error: getSubscriptionErrorMessage("missingTenantId", lang) }, { status: 400 });

    const hasAccess = await hasPermission(user, "delete_subscriptions");
    if (!hasAccess) return NextResponse.json({ error: getSubscriptionErrorMessage("unauthorized", lang) }, { status: 401 });

    const tenantAccess = await hasTenantAccess(user, tenant_id);
    if (!tenantAccess) return NextResponse.json({ error: getSubscriptionErrorMessage("unauthorized", lang) }, { status: 401 });

    const [existing] = await pool.query("SELECT id FROM subscriptions WHERE id = ? AND tenant_id = ? AND status != 'deleted'", [subscriptionId, tenant_id]);
    if (!(existing as any[]).length) return NextResponse.json({ error: getSubscriptionErrorMessage("subscriptionNotFound", lang) }, { status: 404 });

    await pool.query("UPDATE subscriptions SET status = 'deleted' WHERE id = ? AND tenant_id = ?", [subscriptionId, tenant_id]);

    return NextResponse.json({ message: getSubscriptionErrorMessage("deletedSuccess", lang, 1) }, { status: 200 });
  } catch (error) {
    console.error("DELETE subscription error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getSubscriptionErrorMessage("serverError", lang) }, { status: 500 });
  }
}
