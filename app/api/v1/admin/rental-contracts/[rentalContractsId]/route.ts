import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";
import { getUserData, hasPermission, hasTenantAccess } from "../../../functions/permissions";
import puppeteer from "puppeteer";

const errorMessages = {
  en: {
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    missingContractId: "Rental contract ID is missing.",
    contractNotFound: "Rental contract not found.",
    noFieldsToUpdate: "No fields provided to update.",
    updatedSuccess: "Rental contract updated successfully.",
    cancelledSuccess: "Rental contract cancelled successfully.",
    pdfGenerationFailed:"Failed to generate contract PDF.",
    pdfNotGenerated:"Contract PDF was not generated."
  },
  ar: {
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    missingContractId: "معرّف عقد الإيجار مفقود.",
    contractNotFound: "عقد الإيجار غير موجود.",
    noFieldsToUpdate: "لم يتم تقديم أي حقول للتحديث.",
    updatedSuccess: "تم تعديل عقد الإيجار بنجاح.",
    cancelledSuccess: "تم إلغاء عقد الإيجار بنجاح.",
    pdfGenerationFailed:"فشل في إنشاء ملف PDF للعقد.  ",
    pdfNotGenerated:"لم يتم إنشاء ملف PDF للعقد."
  },
};

function getErrorMessage(
  key: keyof typeof errorMessages["en"],
  lang: "en" | "ar" = "en"
) {
  return errorMessages[lang][key] || errorMessages.en[key];
}
/**
 * GET /api/v1/admin/rental-contracts/[rentalContractsId]
 *
 * Retrieves a single rental contract by its ID.
 *
 * Path Parameters:
 *   - rentalContractsId (number, required): ID of the rental contract to retrieve.
 *
 * Query Parameters (optional):
 *   - tenant_id (number): Used to validate tenant access.
 *
 * Responses:
 *   - 200: { data } Rental contract object.
 *   - 400: { error } Missing or invalid rental contract ID.
 *   - 401: { error } Unauthorized access or tenant access denied.
 *   - 404: { error } Rental contract not found.
 *   - 500: { error } Internal server error.
 *
 * Notes:
 *   - The returned object includes all contract fields
 *     (tenant_id, booking_id, customer_id, vehicle_id, template_id,
 *      contract_number, status, pdf_path, created_at).
 */

// export async function GET(
//   req: NextRequest,
//   { params }: { params: { rentalContractsId: string } }
// ) {
//   try {
//     const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
//     const pool = await dbConnection();
//     const user: any = await getUserData(req);

//     const contractId = Number(params.rentalContractsId);
//     if (isNaN(contractId)) {
//       return NextResponse.json(
//         { error: getErrorMessage("missingContractId", lang) },
//         { status: 400 }
//       );
//     }

//     if (!(await hasPermission(user, "view_rental_contracts"))) {
//       return NextResponse.json(
//         { error: getErrorMessage("unauthorized", lang) },
//         { status: 401 }
//       );
//     }

//     const { searchParams } = new URL(req.url);
//     const tenant_id = searchParams.get("tenant_id");

//     if (tenant_id && !(await hasTenantAccess(user, tenant_id))) {
//       return NextResponse.json(
//         { error: getErrorMessage("unauthorized", lang) },
//         { status: 401 }
//       );
//     }

//     const [rows] = await pool.query(
//       `SELECT * FROM rental_contracts 
//        WHERE id = ? ${tenant_id ? "AND tenant_id = ?" : ""}
//        LIMIT 1`,
//       tenant_id ? [contractId, tenant_id] : [contractId]
//     );

//     const contract = (rows as any[])[0];
//     if (!contract) {
//       return NextResponse.json(
//         { error: getErrorMessage("contractNotFound", lang) },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ data: contract }, { status: 200 });
//   } catch (error) {
//     console.error("GET rental contract error:", error);
//     return NextResponse.json(
//       { error: getErrorMessage("serverError", "en") },
//       { status: 500 }
//     );
//   }
// }
export async function GET(
  req: NextRequest,
  { params }: { params: { rentalContractsId: string } }
) {
  try {
    const lang: "ar" | "en" =
      req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";

    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const contractId = Number(params.rentalContractsId);
    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: getErrorMessage("missingContractId", lang) },
        { status: 400 }
      );
    }

    if (!(await hasPermission(user, "view_rental_contracts"))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");

    if (tenant_id && !(await hasTenantAccess(user, tenant_id))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

const [rows] = await pool.query(
  `
  SELECT 
    rc.id,
    c.full_name        AS customer_name,
    b.start_date,
    b.end_date,
    ct.name            AS template_title,
    ct.content         AS template_content

  FROM rental_contracts rc
  JOIN bookings b 
    ON b.id = rc.booking_id
  JOIN customers c 
    ON c.id = b.customer_id
  JOIN contract_templates ct
    ON ct.tenant_id = rc.tenant_id
   AND ct.status = 'active'

  WHERE rc.id = ?
  ${tenant_id ? "AND rc.tenant_id = ?" : ""}
  ORDER BY (ct.language = ?) DESC
  LIMIT 1
  `,
  tenant_id
    ? [contractId, tenant_id, lang]
    : [contractId, lang]
);


    const contract = (rows as any[])[0];
    if (!contract) {
      return NextResponse.json(
        { error: getErrorMessage("contractNotFound", lang) },
        { status: 404 }
      );
    }

    // Generate HTML
    const html = generateContractHTML(contract, lang);

    // Generate PDF
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

  return new NextResponse(
  new Uint8Array(pdfBuffer),
  {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="contract_${contractId}.pdf"`,
    },
  }
);

  } catch (error) {
    console.error("GET contract PDF error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", "en") },
      { status: 500 }
    );
  }
}

/* ---------------- HTML TEMPLATE ---------------- */

function generateContractHTML(contract: any, lang: "ar" | "en") {
  const isAr = lang === "ar";
 let content = contract.template_content
  return `
<!DOCTYPE html>
<html lang="${lang}" dir="${isAr ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      line-height: 1.6;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
    }
    .row {
      margin-bottom: 12px;
    }
    .label {
      font-weight: bold;
    }
  </style>
</head>
<h1>${contract.template_title }</h1>

  ${content}
<body>
  <div class="row">
    <span class="label">${isAr ? "رقم العقد" : "Contract ID"}:</span>
    ${contract.id}
  </div>

 <div class="row">
  <span class="label">${isAr ? "اسم العميل" : "Customer Name"}:</span>
  ${contract.customer_name}
</div>

<div class="row">
  <span class="label">${isAr ? "تاريخ البدء" : "Start Date"}:</span>
  ${new Date(contract.start_date).toLocaleDateString()}
</div>

<div class="row">
  <span class="label">${isAr ? "تاريخ الانتهاء" : "End Date"}:</span>
  ${new Date(contract.end_date).toLocaleDateString()}
</div>

</body>
</html>
`;
}
/**
 * PUT /api/v1/admin/rental-contracts/[rentalContractsId]
 *
 * Updates an existing rental contract.
 *
 * Path Parameters:
 *   - rentalContractsId (number, required): ID of the rental contract to update.
 *
 * Request Body (any of the following fields can be provided):
 *   - tenant_id (number, optional): Tenant ID (requires tenant access validation).
 *   - contract_number (string, optional): Unique contract reference number.
 *   - status (string, optional): Contract status
 *       (draft | signed | cancelled).
 *   - pdf_path (string, optional): Path to the updated contract PDF file.
 *
 *   - 200: { message } Rental contract updated successfully.
 *   - 400: { error } Missing contract ID or no fields to update.
 *   - 401: { error } Unauthorized access or tenant access denied.
 *   - 404: { error } Rental contract not found.
 *   - 500: { error } Internal server error.
 *
 * Notes:
 *   - Status transitions should be validated at the business-logic level if needed.
 *   - Contract number must remain unique if updated.
 */

export async function PUT(
  req: NextRequest,
  { params }: { params: { rentalContractsId: string } }
) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const contractId = Number(params.rentalContractsId);
    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: getErrorMessage("missingContractId", lang) },
        { status: 400 }
      );
    }

    if (!(await hasPermission(user, "edit_rental_contracts"))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    const payload = await req.json();
    const {
      tenant_id,
      contract_number,
      status,
      pdf_path,
    } = payload;

    if (tenant_id && !(await hasTenantAccess(user, tenant_id))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (contract_number) { fields.push("contract_number = ?"); values.push(contract_number); }
    if (status) { fields.push("status = ?"); values.push(status); }
    if (pdf_path) { fields.push("pdf_path = ?"); values.push(pdf_path); }
    if (tenant_id) { fields.push("tenant_id = ?"); values.push(tenant_id); }

    if (!fields.length) {
      return NextResponse.json(
        { error: getErrorMessage("noFieldsToUpdate", lang) },
        { status: 400 }
      );
    }

    values.push(contractId);

    const [result]: any = await pool.query(
      `UPDATE rental_contracts 
       SET ${fields.join(", ")}
       WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: getErrorMessage("contractNotFound", lang) },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: getErrorMessage("updatedSuccess", lang) },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT rental contract error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", "en") },
      { status: 500 }
    );
  }
}
/**
 * DELETE /api/v1/admin/rental-contracts/[rentalContractsId]
 *
 * Cancels a rental contract by setting its status to "cancelled".
 *
 * Path Parameters:
 *   - rentalContractsId (number, required): ID of the rental contract to cancel.
 *
 * Query Parameters (optional):
 *   - tenant_id (number): Used to validate tenant access.
 *
 * Responses:
 *   - 200: { message } Rental contract cancelled successfully.
 *   - 400: { error } Missing or invalid rental contract ID.
 *   - 401: { error } Unauthorized access or tenant access denied.
 *   - 404: { error } Rental contract not found.
 *   - 500: { error } Internal server error.
 *
 * Notes:
 *   - This action does not permanently delete the contract.
 *   - Cancelled contracts cannot be reactivated via this endpoint.
 */

export async function DELETE(
  req: NextRequest,
  { params }: { params: { rentalContractsId: string } }
) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const pool = await dbConnection();
    const user: any = await getUserData(req);

    const contractId = Number(params.rentalContractsId);
    if (isNaN(contractId)) {
      return NextResponse.json(
        { error: getErrorMessage("missingContractId", lang) },
        { status: 400 }
      );
    }

    if (!(await hasPermission(user, "cancel_rental_contracts"))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenant_id = searchParams.get("tenant_id");

    if (tenant_id && !(await hasTenantAccess(user, tenant_id))) {
      return NextResponse.json(
        { error: getErrorMessage("unauthorized", lang) },
        { status: 401 }
      );
    }

    const [result]: any = await pool.query(
      `UPDATE rental_contracts 
       SET status = 'cancelled'
       WHERE id = ?`,
      [contractId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: getErrorMessage("contractNotFound", lang) },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: getErrorMessage("cancelledSuccess", lang) },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE rental contract error:", error);
    return NextResponse.json(
      { error: getErrorMessage("serverError", "en") },
      { status: 500 }
    );
  }
}
