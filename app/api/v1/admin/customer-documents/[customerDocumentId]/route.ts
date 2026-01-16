import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { validateFields } from "../../../functions/validation";
import path from "path";
import fsPromises from "fs/promises";
import { createReadStream } from "fs";
import mime from "mime-types";

const errorMessages = {
  en: {
    unauthorized: "Unauthorized access.",
    serverError: "Internal server error.",
    noDocumentsFound: "Document not found.",
    missingFields: "Required fields are missing.",
    success: "Document updated successfully.",
    notFound: "Document not found.",
    deletedSuccess: "Document deleted successfully.",
    invalidCustomerId: "Invalid customer ID.",
    invalidDocumentId: "Invalid document ID."
  },
  ar: {
    unauthorized: "دخول غير مصرح به.",
    serverError: "خطأ في الخادم الداخلي.",
    noDocumentsFound: "الوثيقة غير موجودة.",
    missingFields: "الحقول المطلوبة مفقودة.",
    success: "تم تعديل الوثيقة بنجاح.",
    notFound: "الملف غير موجود.",
    deletedSuccess: "تم حذف الملف بنجاح.",
    invalidDocumentId: "رقم الملف غير صالح.",
    invalidCustomerId: "معرّف العميل غير صالح.",
  },
};

function getErrorMessage(
  key: keyof typeof errorMessages["en"],
  lang: "en" | "ar" = "en"
) {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

/**
 * DELETE API Handler for Customer Documents
 * Performs a "Soft Delete" by updating the status to 'deleted'
 */

export async function DELETE(req: NextRequest, { params }: any) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

  try {
    const pool = await dbConnection();
    const documentId = Number(params.customerDocumentId);

    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: getErrorMessage("notFound", lang) },
        { status: 404 }
      );
    }

    const [rows] = await pool.query(
      `SELECT id FROM customer_documents WHERE id = ? AND status!='deleted'`,
      [documentId]
    );

    const document = (rows as any)[0];
    if (!document) {
      return NextResponse.json(
        { error: getErrorMessage("notFound", lang) },
        { status: 404 }
      );
    }

    await pool.query(
      `
      UPDATE customer_documents
      SET 
        status='deleted',
        verified = 0,
        verified_at = NULL
      WHERE id = ?
      `,
      [documentId]
    );

    return NextResponse.json(
      { message: getErrorMessage("deletedSuccess", lang) },
      { status: 200 }
    );

  } catch (error) {
    console.error("Delete customer document error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/admin/customer-documents/[customerDocumentId]
 * * Purpose: Downloads a specific customer document file from the server's filesystem.
 * This endpoint fetches the file record from the database, checks its existence on disk,
 * and streams the file back to the client as an attachment.
 *
 * Request Headers:
 * - accept-language (optional): "en" | "ar" - Used for localized error messages.
 *
 * Path Parameters:
 * - customerDocumentId (number, required): The unique ID of the document record.
 *
 * Responses:
 * - 200: Binary Stream - Returns the file as a downloadable attachment.
 * - 400: { error: "Invalid document ID." } - ID is missing or not a number.
 * - 404: { error: "Document not found." } - No active record found in the database.
 * - 404: { error: "File not found on server." } - Record exists but the physical file is missing.
 * - 500: { error: "Internal server error." } - Database or unexpected server issues.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ customerDocumentId: string }> }
) {
  const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
  try {
    const params = await context.params;
    const idString = params.customerDocumentId;

    if (!idString) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const documentId = parseInt(idString, 10);
    if (!documentId || isNaN(documentId)) {
      return NextResponse.json(
        { error: getErrorMessage("invalidDocumentId", lang) },
        { status: 400 }
      );
    }

    const pool = await dbConnection();
    const [rows]: any = await pool.query(
      "SELECT file_url FROM customer_documents WHERE id = ? AND status != 'deleted'",
      [documentId]
    );
    const document = rows[0];

    if (!document) {
      return NextResponse.json(
        { error: getErrorMessage("notFound", lang) },
        { status: 404 }
      );
    }
    let filePath: string;
    
    if (path.isAbsolute(document.file_url)) {
      filePath = document.file_url;
    } else {
      filePath = path.join(process.cwd(), "uploads", document.file_url);
    }
    
    try {
      const stats = await fsPromises.stat(filePath);
      const fileName = path.basename(filePath);
      const contentType = mime.lookup(filePath) || "application/octet-stream";
      const fileBuffer = await fsPromises.readFile(filePath);
      const uint8Array = new Uint8Array(fileBuffer);
      
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          "Content-Length": stats.size.toString(),
          "Cache-Control": "no-cache",
        },
      });

    } catch (fsError: any) {
      return NextResponse.json(
        { error: getErrorMessage("noDocumentsFound", lang) },
        { status: 404 }
      );
    }

  } catch (err) {
    return NextResponse.json(
      { error: getErrorMessage("serverError", lang) },
      { status: 500 }
    );
  }
}