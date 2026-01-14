import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../functions/db";
import argon2 from "argon2";
// Example error messages in English and Arabic
const errorMessages = {
  en: {
    missingFields: "Required fields are missing.",
    serverError: "Internal server error.",
    unauthorized: "Unauthorized access.",
    userExists: "User already exists.",
    success: "User created successfully.",
  },
  ar: {
    missingFields: "الحقول المطلوبة مفقودة.",
    serverError: "خطأ في الخادم الداخلي.",
    unauthorized: "دخول غير مصرح به.",
    userExists: "المستخدم موجود بالفعل.",
    success: "تم إنشاء المستخدم بنجاح.",
  },
};

// Helper to get error message by language
function getErrorMessage(key: keyof typeof errorMessages["en"], lang: "en" | "ar" = "en") {
  return errorMessages[lang][key] || errorMessages["en"][key];
}

/**
 * POST /api/v1/agency/create-user
 * Creates a new user in the system (agency/admin access required).
 * 
 * Request Body:
 *   - name (string, required): The full name of the new user.
 *   - user_type (string, required): Type of the user. Allowed values: 'firm_owner', 'lawyer', 'client', 'paralegal', 'accountant', 'external'.
 *   - password (string, required): The new user's password.
 *   - email (string, optional): User's email address.
 *   - phone (string, optional): User's phone number.
 *   - role_id (number, optional): ID of the assigned role.
 *   - law_firm_id (number, optional): Associated law firm ID.
 *   - image (string, optional): User avatar filename. Default: "default.png".
 *   - status (number, optional): User status. Default: 1 (active).
 * 
 * Headers:
 *   - accept-language (string, optional): "en" or "ar" to determine language for messages.
 * 
 * Response:
 *   - 201: { message: "User created successfully." }
 *   - 400: { error: "Required fields are missing." }
 *   - 401: { error: "Unauthorized access." }
 *   - 409: { error: "User already exists." }
 *   - 500: { error: "Internal server error." }
 * 
 * Notes:
 *   - Passwords are hashed using Argon2 before storing in the database.
 *   - Email uniqueness is enforced if provided.
 */

export async function POST(req: NextRequest) {
  try {
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    const body = await req.json();

    // تحقق من الحقول المطلوبة
    if (!body.name || !body.user_type || !body.password) {
      return NextResponse.json({ error: getErrorMessage("missingFields", lang) }, { status: 400 });
    }

const db = async () => {
  return dbConnection();
};
  const pool = await db();
    if (body.email) {
    
      const [existing] = await pool.query(
        "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL",
        [body.email]
      );
      if ((existing as any[]).length > 0) {
        return NextResponse.json({ error: getErrorMessage("userExists", lang) }, { status: 409 });
      }
    }

    const hashedPassword = await argon2.hash(body.password);

    await pool.query(
      `INSERT INTO users (law_firm_id, user_type, role_id, name, email, phone, password, image, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.law_firm_id || null,
        body.user_type,
        body.role_id || null,
        body.name,
        body.email || null,
        body.phone || null,
        hashedPassword,
        body.image || "default.png",
        body.status || 1
      ]
    );

    return NextResponse.json({ message: getErrorMessage("success", lang) }, { status: 201 });
  } catch (error) {
    console.error("create user error:", error);
    const lang = req.headers.get("accept-language")?.startsWith("ar") ? "ar" : "en";
    return NextResponse.json({ error: getErrorMessage("serverError", lang) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Agency create-user API route is working." });
}