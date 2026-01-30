import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../functions/permissions";
import { validateFields } from "../../functions/validation";

/* ================= Messages ================= */
const errormessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    createdSuccess: "Damage record created successfully.",
    deletedSuccess: "Damage record(s) deleted successfully.",
    missingDamageIds: "Damage IDs are missing.",
    invalidDamageIds: "Damage IDs are invalid.",
    noDamagesFound: "No matching damage records found.",
  },
  ar: {
    serverError: "خطأ في الخادم.",
    unauthorized: "دخول غير مصرح.",
    createdSuccess: "تم إنشاء سجل الضرر بنجاح.",
    deletedSuccess: "تم حذف سجل/سجلات الضرر بنجاح.",
    missingDamageIds: "معرّفات الضرر مفقودة.",
    invalidDamageIds: "معرّفات الضرر غير صالحة.",
    noDamagesFound: "لم يتم العثور على أي سجلات ضرر مطابقة.",
  }
};

function messages(key: keyof typeof errormessages["en"], lang: "en" | "ar" = "en") {
  return errormessages[lang][key] || errormessages["en"][key];
}

/**
 * GET /api/v1/admin/inspection-damages
 *
 * Retrieves a paginated list of inspection damages, optionally filtered by inspection or tenant.
 *
 * Access control:
 *   - User must have "view_inspection_damages" permission
 *   - User must have access to the tenant of the damages
 *
 * Query Parameters:
 *   - inspection_id (number, optional) : Filter by specific inspection ID
 *   - tenant_id (number, optional)     : Filter by tenant ID
 *   - page (number, optional)          : Page number for pagination (default: 1)
 *   - pageSize (number, optional)      : Number of items per page (default: 20)
 *
 * Response:
 *   - 200: { count, page, pageSize, totalPages, data } : Paginated list of inspection damages
 *   - 401: { error }   : Unauthorized access or tenant not allowed
 *   - 500: { error }   : Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!(await hasPermission(user, "view_inspection_damages"))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const inspection_id = searchParams.get("inspection_id");
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 20);
    const tenant_id = searchParams.get("tenant_id");

    // الشرط للتحقق من صلاحية التينانت
    if (tenant_id) {
      const allowed = await hasTenantAccess(user, tenant_id);
      if (!allowed) {
        return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
      }
    }

    // شروط البحث
    let where = "d.status != 'deleted'";
    const params: any[] = [];

    if (inspection_id) {
      where += " AND d.inspection_id = ?";
      params.push(inspection_id);
    }

    if (tenant_id) {
      // tenant ممكن يجي من الـ vehicle
      where += " AND (v.tenant_id = ? OR i.vehicle_id IS NULL)";
      params.push(tenant_id);
    }

    // العدد الكلي
    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM inspection_damages d
      JOIN inspections i ON i.id = d.inspection_id
      LEFT JOIN vehicles v ON v.id = i.vehicle_id
      WHERE ${where}
      `,
      params
    );

    const count = (countRows as any[])[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    // جلب البيانات
    const [rows] = await pool.query(
      `
      SELECT 
        d.*,
        i.booking_id,
        i.vehicle_id,
        v.tenant_id
      FROM inspection_damages d
      JOIN inspections i ON i.id = d.inspection_id
      LEFT JOIN vehicles v ON v.id = i.vehicle_id
      WHERE ${where}
      ORDER BY d.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json(
      { count, page, pageSize, totalPages, data: rows },
      { status: 200 }
    );

  } catch (e) {
    console.error("GET inspection-damages error:", e);
    return NextResponse.json({ error: messages("serverError", "en") }, { status: 500 });
  }
}



/**
 * POST /api/v1/admin/inspection-damages
 *
 * Creates a new inspection damage record.
 *
 * Access control:
 *   - User must have "add_inspection_damages" permission
 *   - User must have access to the tenant of the related inspection's booking
 *
 * Request Body:
 *   - inspection_id (number, required)       : ID of the inspection
 *   - damage_type (string, required)         : Type of damage
 *   - damage_severity (string, required)     : Severity of damage
 *   - damage_location (string, optional)     : Location of the damage
 *   - description (string, optional)         : Description of the damage
 *   - estimated_cost (number, optional)      : Estimated cost of repair
 *   - final_cost (number, optional)          : Final cost after assessment
 *   - insurance_required (boolean, optional) : Whether insurance is required
 *   - insurance_provider (string, optional)  : Insurance provider name
 *   - claim_number (string, optional)        : Insurance claim number
 *   - claim_status (string, optional)        : Status of the claim (default: 'not_submitted')
 *
 * Response:
 *   - 201: { message } : Damage created successfully
 *   - 400: { error }   : Validation errors or missing fields
 *   - 401: { error }   : Unauthorized access or tenant not allowed
 *   - 404: { error }   : Related inspection not found
 *   - 500: { error }   : Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    // تحقق من صلاحية إضافة أضرار الفحص
    if (!(await hasPermission(user, "add_inspection_damages"))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    const payload = await req.json();

    // قواعد التحقق من الحقول
    const rules: any = {
      inspection_id: [{ required: true, type: "number", label: { en: "Inspection ID", ar: "رقم التفتيش" } }],
      damage_type: [{ required: true, type: "string", label: { en: "Damage Type", ar: "نوع الضرر" } }],
      damage_severity: [{ required: true, type: "string", label: { en: "Damage Severity", ar: "شدة الضرر" } }],
      damage_location: [{ required: false, type: "string", label: { en: "Damage Location", ar: "موقع الضرر" } }],
      description: [{ required: false, type: "string", label: { en: "Description", ar: "الوصف" } }],
      estimated_cost: [{ required: false, type: "number", label: { en: "Estimated Cost", ar: "التكلفة المقدرة" } }],
      final_cost: [{ required: false, type: "number", label: { en: "Final Cost", ar: "التكلفة النهائية" } }],
      insurance_required: [{ required: false, type: "boolean", label: { en: "Insurance Required", ar: "هل التأمين مطلوب" } }],
      insurance_provider: [{ required: false, type: "string", label: { en: "Insurance Provider", ar: "مزود التأمين" } }],
      claim_number: [{ required: false, type: "string", label: { en: "Claim Number", ar: "رقم المطالبة" } }],
      claim_amount: [{ required: false, type: "number", label: { en: "Claim Amount", ar: "مبلغ المطالبة" } }],
      claim_status: [{ required: false, type: "string", label: { en: "Claim Status", ar: "حالة المطالبة" } }],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) return NextResponse.json({ error: errors }, { status: 400 });

    // جلب tenant_id من جدول vehicles المرتبط بالinspection
    const [inspectionRows] = await pool.query(
      `SELECT v.tenant_id
       FROM inspections i
       JOIN vehicles v ON v.id = i.vehicle_id
       WHERE i.id = ?`,
      [payload.inspection_id]
    );

    if (!(inspectionRows as any[]).length) {
      return NextResponse.json({ error: messages("noDamagesFound", lang) }, { status: 404 });
    }

    const tenant_id = (inspectionRows as any)[0].tenant_id;

    // تحقق من صلاحية الـ tenant
    if (!(await hasTenantAccess(user, tenant_id))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    // إدراج بيانات الضرر في قاعدة البيانات
    await pool.query(
      `INSERT INTO inspection_damages
       (inspection_id, damage_type, damage_severity, damage_location, description,
        estimated_cost, final_cost, insurance_required, insurance_provider,
        claim_number, claim_amount, claim_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.inspection_id,
        payload.damage_type,
        payload.damage_severity,
        payload.damage_location || null,
        payload.description || null,
        payload.estimated_cost || null,
        payload.final_cost || null,
        payload.insurance_required ? 1 : 0,
        payload.insurance_provider || null,
        payload.claim_number || null,
        payload.claim_amount || null,
        payload.claim_status || "not_submitted",
      ]
    );

    return NextResponse.json({ message: messages("createdSuccess", lang) }, { status: 201 });

  } catch (e) {
    console.error("POST inspection-damages error:", e);
    return NextResponse.json({ error: messages("serverError", "en") }, { status: 500 });
  }}

/**
 * DELETE /api/v1/admin/inspection-damages
 *
 * Deletes multiple inspection damages by IDs.
 *
 * Access control:
 *   - User must have "delete_inspection_damages" permission
 *   - User must have access to the tenant of each damage's related booking
 *
 * Request Body:
 *   - damage_ids (number[], required): Array of damage IDs to delete
 *
 * Response:
 *   - 200: { message } : Number of damages deleted successfully
 *   - 400: { error }   : Missing or invalid IDs
 *   - 401: { error }   : Unauthorized access or tenant not allowed
 *   - 404: { error }   : No matching damages found
 *   - 500: { error }   : Internal server error
 */

export async function DELETE(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    if (!(await hasPermission(user, "delete_inspection_damages"))) {
      return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
    }

    const { damage_ids } = await req.json();
    if (!Array.isArray(damage_ids) || !damage_ids.length) {
      return NextResponse.json({ error: messages("missingDamageIds", lang) }, { status: 400 });
    }

    const normalizedIds = damage_ids
      .map((id: any) => Number(id))
      .filter((id: number) => !isNaN(id));
    if (!normalizedIds.length) {
      return NextResponse.json({ error: messages("invalidDamageIds", lang) }, { status: 400 });
    }

    // جلب tenant_id من booking أو vehicle
    const [existing] = await pool.query(
      `SELECT 
         d.id, 
         COALESCE(b.tenant_id, v.tenant_id) AS tenant_id
       FROM inspection_damages d
       JOIN inspections i ON i.id = d.inspection_id
       LEFT JOIN bookings b ON b.id = i.booking_id
       LEFT JOIN vehicles v ON v.id = i.vehicle_id
       WHERE d.id IN (?)`,
      [normalizedIds]
    );

    const existingArr = existing as Array<{ id: number; tenant_id: number }>;
    if (!existingArr.length) {
      return NextResponse.json({ error: messages("noDamagesFound", lang) }, { status: 404 });
    }

    // تحقق من صلاحية المستخدم على كل tenant
    for (const damage of existingArr) {
      if (!(await hasTenantAccess(user, damage.tenant_id))) {
        return NextResponse.json({ error: messages("unauthorized", lang) }, { status: 401 });
      }
    }

    const deletableIds = existingArr.map((d) => d.id);

    // Soft delete
    await pool.query(`UPDATE inspection_damages SET status='deleted' WHERE id IN (?)`, [deletableIds]);

    return NextResponse.json({ message: messages("deletedSuccess", lang) }, { status: 200 });

  } catch (e) {
    console.error("DELETE inspection-damages error:", e);
    return NextResponse.json({ error: messages("serverError", "en") }, { status: 500 });
  }
}

