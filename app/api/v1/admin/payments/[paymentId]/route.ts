import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../../functions/permissions";
import { validateFields } from "../../../functions/validation";

const errorMessages = {
  en: {
    unauthorized: "Unauthorized access.",
    serverError: "Internal server error.",
    invalidStatus: "Invalid payment status",
    notFound: "Payment not found",
    success: "Payment status updated successfully",
  },
  ar: {
    unauthorized: "دخول غير مصرح به.",
    serverError: "خطأ في الخادم الداخلي.",
    invalidStatus: "حالة الدفع غير صالحة",
    notFound: "الدفع غير موجود",
    success: "تم تحديث حالة الدفع بنجاح",
  },
};

function getErrorMessage(
  key: keyof typeof errorMessages["en"],
  lang: "en" | "ar" = "en"
) {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

/**
 * PUT /api/v1/admin/payments/[paymentId]
 *
 * Update payment status only
 *
 * Body:
 * {
 *   status: 'pending' | 'completed' | 'failed' | 'refunded'
 * }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!user) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    const paymentId = Number(params.paymentId);
    if (!paymentId) {
      return NextResponse.json(
        { error: getErrorMessage("notFound", lang) },
        { status: 404 }
      );
    }

    const payload = await req.json();
    const { status } = payload;

    // validation
    const rules:any = {
      status: [
        { required: true, label: lang === "ar" ? "الحالة" : "Status" },
        {
          validator: (value: string) =>
            ["pending", "completed", "failed", "refunded"].includes(value)
              ? true
              : getErrorMessage("invalidStatus", lang),
        },
      ],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

   const [payments] = await pool.query(
  `
  SELECT 
    p.*,
    b.tenant_id
  FROM payments p
  INNER JOIN bookings b ON p.booking_id = b.id
  WHERE p.id = ?
  LIMIT 1
  `,
  [paymentId]
);


    if (!(payments as any[]).length) {
      return NextResponse.json(
        { error: getErrorMessage("notFound", lang) },
        { status: 404 }
      );
    }

    const payment = (payments as any)[0];
    const hasAccess = await hasTenantAccess(user, payment.tenant_id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 403 }
      );
    }

    if (!hasPermission(user, "update_payment_status")) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 403 }
      );
    }

    await pool.query(
      `UPDATE payments 
       SET status = ?
       WHERE id = ?`,
      [status, paymentId]
    );

    return NextResponse.json(
      { message: getErrorMessage("success", lang) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update payment status error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}
