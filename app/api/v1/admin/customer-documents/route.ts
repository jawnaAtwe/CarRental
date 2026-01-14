
import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import fs from 'fs/promises';
import path from 'path';
export const runtime = 'nodejs'; 


export const config = {
  api: {
    bodyParser: false, 
  },
};

const errorMessages = {
  en: {
    missingFields: "Required fields are missing.",
    serverError: "Internal server error.",
    success: "Customer document uploaded successfully.",
    invalidDocumentType: "Invalid document type.",
    customerRequired: "Customer ID is required.",
    tenantRequired: "Tenant ID is required.",
    fileRequired: "File URL is required.",
    deleted: (count: number) => `Deleted ${count} record(s).`,
    missingDocumentIds: "Missing document IDs.",
    invalidDocumentIds: "Invalid document IDs.",
    noDocumentsFound: "No matching active documents found.",
 
  },
  ar: {
    missingFields: "الحقول المطلوبة مفقودة.",
    serverError: "خطأ في الخادم الداخلي.",
    success: "تم رفع مستند العميل بنجاح.",
    invalidDocumentType: "نوع المستند غير صالح.",
    customerRequired: "رقم العميل مطلوب.",
    tenantRequired: "رقم المنظمة مطلوب.",
    fileRequired: "ملف المستند مطلوب.",
    deleted: (count: number) => `تم حذف ${count} عنصر`,
    missingDocumentIds: "معرّفات الوثائق مطلوبة",
    invalidDocumentIds: "معرّفات الوثائق غير صالحة",
    noDocumentsFound: "لم يتم العثور على وثائق نشطة",
  },
};

function getErrorMessage(
  key: keyof typeof errorMessages["en"],
  lang: "en" | "ar" = "en"
) {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

/**
 * POST /api/v1/admin/customer-documents
 *
 * Body:
 * {
 *   customer_id: number (required)
 *   tenant_id: number (required)
 *   document_type: "id_card" | "passport" | "license" (required)
 *   file_url: string (required)
 *   expiry_date?: string (YYYY-MM-DD)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customer_id = formData.get("customer_id") as string | null;
    const tenant_id_str = formData.get("tenant_id") as string | null;
    const tenant_id = tenant_id_str ? parseInt(tenant_id_str) : null;
    if (!tenant_id) return NextResponse.json({ error: "Tenant is required" }, { status: 400 });

    const document_type = formData.get("document_type") as string | null;
    const expiry_date = formData.get("expiry_date") as string | null;

    if (!customer_id || !tenant_id || !document_type || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // --- Upload File ---
    const uploadDir = path.join(process.cwd(), 'uploads', customer_id);
    await fs.mkdir(uploadDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const filePath = path.join(uploadDir, file.name);
    await fs.writeFile(filePath, uint8Array);

    // --- Insert to DB ---
    const pool = await dbConnection();

    await pool.query(
      `
      INSERT INTO customer_documents (
        customer_id,
        tenant_id,
        document_type,
        file_url,
        expiry_date,
        verified,
        verified_at,
        status
      ) VALUES (?, ?, ?, ?, ?, 0, NULL, ?)
      `,
      [
        customer_id,
        tenant_id,
        document_type,
        filePath,         
        expiry_date || null,
        'active'           
      ]
    );

    return NextResponse.json({ message: "Document uploaded and saved successfully", file_path: filePath });
  } catch (err) {
    console.error("Error uploading document:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * GET /api/v1/admin/customer-documents
 *
 * Fetches a paginated list of customer documents.
 * Supports search, sorting, filtering, and pagination.
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Query Parameters:
 *   - page (number, optional, default 1)
 *   - pageSize (number, optional, default 20)
 *   - search (string, optional) : applied to file_url
 *   - customer_id (number, optional)
 *   - document_type (string, optional): id_card | passport | license
 *   - verified (0 | 1, optional)
 *   - sortBy (string, optional, default "uploaded_at")
 *   - sortOrder (string, optional, default "desc")
 *
 * Responses:
 *   - 200: {
 *        count,
 *        page,
 *        pageSize,
 *        totalPages,
 *        data
 *     }
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
    const sortBy = searchParams.get("sortBy") || "uploaded_at";
    const sortOrder =
      (searchParams.get("sortOrder") || "desc").toLowerCase() === "asc"
        ? "ASC"
        : "DESC";

    const customerId = searchParams.get("customer_id");
    const tenantId = searchParams.get("tenant_id");
    const documentType = searchParams.get("document_type");
    const verified = searchParams.get("verified");

    let where = "1=1";
    const params: any[] = [];

    // Filter by search
    if (search) {
      where += " AND cd.file_url LIKE ?";
      params.push(`%${search}%`);
    }

    // Filter by customer
    if (customerId) {
      where += " AND cd.customer_id = ?";
      params.push(Number(customerId));
    }

    // Filter by tenant
    if (tenantId) {
      where += " AND cd.tenant_id = ?";
      params.push(Number(tenantId));
    }

    // Filter by document type
    if (documentType) {
      where += " AND cd.document_type = ?";
      params.push(documentType);
    }

    // Filter by verification
    if (verified !== null && verified !== undefined) {
      where += " AND cd.verified = ?";
      params.push(Number(verified));
    }

    // Count total rows
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as count FROM customer_documents cd WHERE ${where}`,
      params
    );
    const count = (countRows as any)[0]?.count || 0;
    const totalPages = Math.ceil(count / pageSize);

    // Fetch data
    const [documents] = await pool.query(
      `
      SELECT 
        cd.id,
        cd.customer_id,
        c.full_name,
        cd.tenant_id,
        cd.document_type,
        cd.file_url,
        DATE_FORMAT(cd.expiry_date, '%Y-%m-%d') AS expiry_date,
        cd.verified,
        cd.verified_at,
        cd.uploaded_at
      FROM customer_documents cd
      JOIN customers c ON c.id = cd.customer_id
      WHERE ${where} AND cd.status != 'deleted'
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, (page - 1) * pageSize]
    );

    return NextResponse.json(
      { count, page, pageSize, totalPages, data: documents },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get customer documents error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}


/**
 * DELETE /api/v1/admin/customer-documents
 *
 * Deletes one or multiple customer documents by ID.
 * Performs a soft delete by updating the status to "deleted".
 *
 * Request Headers:
 *   - accept-language (optional): "en" | "ar"
 *
 * Request Body (JSON):
 *   - document_ids (array of numbers, required) : IDs of documents to delete
 *
 * Validation:
 *   ✔ Checks that document_ids array is provided and contains valid numbers
 *
 * Responses:
 *   - 200: { message: "Deleted X document(s)." }
 *   - 400: { error: "Missing or invalid document IDs." }
 *   - 404: { error: "No matching active documents found." }
 *   - 500: { error: "Internal server error." }
 */
export async function DELETE(req: NextRequest) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const { document_ids } = await req.json();

    if (!Array.isArray(document_ids) || !document_ids.length) {
      return NextResponse.json(
        { error: getErrorMessage("missingDocumentIds", lang) },
        { status: 400 }
      );
    }

    const normalizedIds = document_ids
      .map((id: any) => Number(id))
      .filter((id) => !isNaN(id));

    if (!normalizedIds.length) {
      return NextResponse.json(
        { error: getErrorMessage("invalidDocumentIds", lang) },
        { status: 400 }
      );
    }

    const [targetDocs] = await pool.query(
      `SELECT id FROM customer_documents WHERE id IN (?) AND status!='deleted'`,
      [normalizedIds]
    );

    const deletableIds = (targetDocs as any[]).map((d) => d.id);

    if (!deletableIds.length) {
      return NextResponse.json(
        { error: getErrorMessage("noDocumentsFound", lang) },
        { status: 404 }
      );
    }

    await pool.query(
      `UPDATE customer_documents SET status='deleted' WHERE id IN (?)`,
      [deletableIds]
    );

    return NextResponse.json(
      { message: errorMessages[lang].deleted(deletableIds.length) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete customer documents error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}
