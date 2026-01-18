import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import { validateFields } from "../../functions/validation";
import { hasPermission, getUserData, hasTenantAccess } from "../../functions/permissions";

const errorMessages = {
  en: {
    unauthorized: "Unauthorized access.",
    missingFields: "Required fields are missing.",
    missingVehicleIds: "Vehicle IDs are required.",
    invalidVehicleIds: "Invalid vehicle_ids payload.",
    serverError: "Internal server error.",
    plateExists: "License plate already exists.",
    vinExists: "VIN already exists.",
    success: "Vehicle created successfully.",
    noVehicleFound: "No active vehicles found.",
    missingTenant: "Tenant ID is required.",
    noVehiclesFound: "No active vehicles found.",
    deletedVehicles: (count: number) => `Deleted ${count} vehicle(s).`,
  },
  ar: {
    unauthorized: "دخول غير مصرح به.",
    missingFields: "الحقول المطلوبة مفقودة.",
    serverError: "خطأ في الخادم الداخلي.",
    missingVehicleIds: "معرفات المركبات مطلوبة.",
    invalidVehicleIds: "قائمة المركبات غير صالحة.",
    plateExists: "رقم اللوحة موجود مسبقاً.",
    vinExists: "رقم الهيكل موجود مسبقاً.",
    success: "تم إضافة المركبة بنجاح.",
    noVehicleFound: "لم يتم العثور على أي مركبات.",
    missingTenant: "معرف الشركة مطلوب.",
    noVehiclesFound: "لم يتم العثور على أي مركبات نشطة.",
    deletedVehicles: (count: number) =>
      `تم حذف ${count} مركبة${count === 1 ? "" : "ات"}.`,
  },
};

function getErrorMessage(
  key: keyof typeof errorMessages["en"],
  lang: "en" | "ar" = "en"
) {
  return errorMessages[lang][key] || errorMessages.en[key];
}

// Required field labels
const requiredFieldLabels: Record<
  "tenant_id" | "price_per_day",
  { en: string; ar: string }
> = {
  tenant_id: { en: "Tenant", ar: "المنظمة" },
  price_per_day: { en: "Price Per Day", ar: "سعر اليوم" },
};

/**
 * POST /api/v1/admin/vehicles
 *
 * Creates a new vehicle under a specific tenant.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar" for localized responses
 *
 * Request Body:
 *   - tenant_id (number, required)        : Tenant/organization ID
 *   - branch_id (number, optional)        : Branch ID
 *   - make (string, optional)             : Vehicle manufacturer
 *   - model (string, optional)            : Vehicle model
 *   - year (number, optional)             : Manufacturing year
 *   - trim (string, optional)             : Vehicle trim
 *   - category (string, optional)         : Economy | SUV | Luxury | Convertible | Van
 *   - license_plate (string, optional)    : Vehicle license plate (must be unique)
 *   - vin (string, optional)              : Vehicle VIN (must be unique)
 *   - color (string, optional)            : Vehicle color
 *   - image (string, optional)            : Vehicle image (Base64 or URL)
 *   - fuel_type (string, optional)        : Fuel type
 *   - transmission (string, optional)     : Transmission type
 *   - mileage (number, optional)          : Vehicle mileage
 *   - price_per_day (number, required)    : Daily rental price
 *   - status (string, optional)           : available | rented | maintenance | reserved
 *
 * Responses:
 *   - 201: { message }                     : Vehicle created successfully
 *   - 400: { error }                       : Missing or invalid required fields
 *   - 401: { error }                       : Unauthorized or tenant access denied
 *   - 409: { error }                       : License plate or VIN already exists
 *   - 500: { error }                       : Internal server error
 *
 *
 */

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar")
      ? "ar"
      : "en";

    const user: any = await getUserData(req);

    if (process.env.NODE_ENV === "production") {
      const hasAccess = await hasPermission(user, "add_car");
      if (!hasAccess) {
        return NextResponse.json(
          { error: getErrorMessage("unauthorized", lang) },
          { status: 401 }
        );
      }
    }

    const payload = await req.json();
    const {
      tenant_id,
      branch_id,
      make,
      model,
      year,
      late_fee_day,
      trim,
      category,
      license_plate,
      vin,
      color,
      image,
      fuel_type,
      transmission,
      mileage,
      price_per_day,
      status,
    } = payload;

    if (!tenant_id) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "production") {
      const tenantAccess = await hasTenantAccess(user, tenant_id);
      if (!tenantAccess) {
        return NextResponse.json(
          { error: getErrorMessage("unauthorized", lang) },
          { status: 401 }
        );
      }
    }

    const rules: any = {
      tenant_id: [
        { required: true, label: requiredFieldLabels.tenant_id[lang] },
        { type: "number", label: requiredFieldLabels.tenant_id[lang] },
      ],
      price_per_day: [
        { required: true, label: requiredFieldLabels.price_per_day[lang] },
        { type: "number", label: requiredFieldLabels.price_per_day[lang] },
      ],
    };

    const { valid, errors } = validateFields(payload, rules, lang);
    if (!valid) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const pool = await dbConnection();

    // Check license plate uniqueness
    if (license_plate) {
      const [plateExists] = await pool.query(
        "SELECT id FROM vehicles WHERE license_plate = ? AND status!='deleted'",
        [license_plate]
      );
      if ((plateExists as any[]).length > 0) {
        return NextResponse.json(
          { error: getErrorMessage("plateExists", lang) },
          { status: 409 }
        );
      }
    }

    // Check VIN uniqueness
    if (vin) {
      const [vinExists] = await pool.query(
        "SELECT id FROM vehicles WHERE vin = ? AND status!='deleted'",
        [vin]
      );
      if ((vinExists as any[]).length > 0) {
        return NextResponse.json(
          { error: getErrorMessage("vinExists", lang) },
          { status: 409 }
        );
      }
    }

  await pool.query(
  `INSERT INTO vehicles
  (
    tenant_id,
    branch_id,
    make,
    model,
    year,
    late_fee_day,
    trim,
    category,
    license_plate,
    vin,
    color,
    image,
    fuel_type,
    transmission,
    mileage,
    price_per_day,
    status,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, NOW())`,
  [
    tenant_id,
    branch_id || null,
    make || '',
    model || '',
    year || null,
    late_fee_day || null,
    trim || '',
    category || 'Economy',
    license_plate || '',
    vin || '',
    color || '',
    image || null,      
    fuel_type || '',
    transmission || '',
    mileage || 0,    
    price_per_day,
    status || 'available',
  ]
);


    return NextResponse.json(
      { message: getErrorMessage("success", lang) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create vehicle error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar")
      ? "ar"
      : "en";
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}


/**
 * GET /api/v1/admin/vehicles
 *
 * Fetches a paginated list of all vehicles for a tenant.
 * Supports search, sorting, and pagination.
 *
 * Query Parameters:
 *   - tenant_id (number, required)
 *   - branch_id (number, optional) : filter by branch
 *   - page (number, optional, default 1)
 *   - pageSize (number, optional, default 20)
 *   - search (string, optional) : Applied to make, model, license_plate, vin
 *   - sortBy (string, optional, default "created_at")
 *   - sortOrder (string, optional, default "desc") : "asc" | "desc"
 *
 * Responses:
 *   - 200: { count, page, pageSize, totalPages, data }
 *   - 400: { error } : tenant_id missing
 *   - 500: { error } : Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const user: any = await getUserData(req);

    const pool = await dbConnection();
    const { searchParams } = new URL(req.url);

    const tenantId = searchParams.get("tenant_id");
    if (!tenantId) {
      return NextResponse.json(
        { error: getErrorMessage("missingTenant", lang) },
        { status: 400 }
      );
    }

    const branchId = searchParams.get("branch_id");
    const statusFilter = searchParams.get("status");       
    const categoryFilter = searchParams.get("category");   
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder =
      (searchParams.get("sortOrder") || "desc").toLowerCase() === "asc"
        ? "ASC"
        : "DESC";

    // بناء الـ WHERE ديناميكياً
    let where = "tenant_id = ? AND status != 'deleted'";
    const params: any[] = [tenantId];

    if (branchId) {
      where += " AND branch_id = ?";
      params.push(branchId);
    }

    if (statusFilter) {
      where += " AND status = ?";
      params.push(statusFilter);
    }

    if (categoryFilter) {
      where += " AND category = ?";
      params.push(categoryFilter);
    }

    if (search) {
      where += `
        AND (
          make LIKE ?
          OR model LIKE ?
          OR license_plate LIKE ?
          OR vin LIKE ?
        )
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS count FROM vehicles WHERE ${where}`,
      params
    );
    const count = (countRows as any)[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    if (count === 0) {
      return NextResponse.json(
        { error: getErrorMessage("noVehicleFound", lang) },
        { status: 404 }
      );
    }

    // data
    const [vehicles] = await pool.query(
      `SELECT * FROM vehicles WHERE ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json(
      { count, page, pageSize, totalPages, data: vehicles },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get vehicles error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}
/**
 * DELETE /api/v1/admin/vehicles
 *
 * Soft-deletes multiple vehicles that belong to the provided tenant.
 * Requests in production must pass `delete_vehicle` permission
 * and confirm tenant access.
 *
 * Request Body:
 *   - tenant_id (number, required)         : Tenant whose vehicles are being deleted
 *   - vehicle_ids (number[], required)    : IDs of the vehicles to soft-delete
 *
 * Responses:
 *   - 200: { message }                     : Indicates how many vehicles were deleted
 *   - 400: { error }                       : Missing or invalid payload
 *   - 401: { error }                       : Permission or tenant access denied
 *   - 404: { error }                       : No matching active vehicles were found
 *   - 500: { error }                       : Internal server error
 */

export async function DELETE(req: NextRequest) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const { tenant_id, vehicle_ids } = await req.json();

    if (!tenant_id) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 400 }
      );
    }

    if (!Array.isArray(vehicle_ids) || vehicle_ids.length === 0) {
      return NextResponse.json(
        { error: getErrorMessage("missingVehicleIds", lang) },
        { status: 400 }
      );
    }

    const normalizedIds = vehicle_ids
      .map((id: any) => Number(id))
      .filter((id: number) => !Number.isNaN(id));

    if (!normalizedIds.length) {
      return NextResponse.json(
        { error: getErrorMessage("invalidVehicleIds", lang) },
        { status: 400 }
      );
    }

    const user: any = await getUserData(req);

    if (process.env.NODE_ENV === "production") {
      const hasAccess = await hasPermission(user, "delete_car");
      if (!hasAccess) {
        return NextResponse.json(
          { error: getErrorMessage("unauthorized", lang) },
          { status: 401 }
        );
      }

      const allowed = await hasTenantAccess(user, tenant_id);
      if (!allowed) {
        return NextResponse.json(
          { error: getErrorMessage("unauthorized", lang) },
          { status: 401 }
        );
      }
    }

    // Ensure vehicles exist, belong to tenant, and are not already deleted
    const [targetVehicles] = await pool.query(
      `SELECT id FROM vehicles
       WHERE id IN (?)
       AND tenant_id = ?
       AND status != 'deleted'`,
      [normalizedIds, tenant_id]
    );

    const vehiclesArr = targetVehicles as Array<{ id: number }>;
    if (!vehiclesArr.length) {
      return NextResponse.json(
        { error: getErrorMessage("noVehiclesFound", lang) },
        { status: 404 }
      );
    }

    const deletableIds = vehiclesArr.map(v => v.id);

    await pool.query(
      `UPDATE vehicles
       SET status = 'deleted'
       WHERE id IN (?)
       AND tenant_id = ?`,
      [deletableIds, tenant_id]
    );

    return NextResponse.json(
      { message: errorMessages[lang].deletedVehicles(deletableIds.length) },
      { status: 200 }
    );

  } catch (error) {
    console.error("DELETE vehicles error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}
