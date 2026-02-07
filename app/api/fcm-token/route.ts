// /api/fcm-token/route.ts
import { NextResponse } from "next/server";
import { dbConnection } from "../v1/functions/db";

export async function POST(req: Request) {
  try {
    const { user_id, fcm_token } = await req.json();

    // ✅ التحقق من البيانات
    if (!user_id || !fcm_token) {
      console.error("❌ بيانات ناقصة:", { user_id, fcm_token: !!fcm_token });
      return NextResponse.json(
        { error: "user_id و fcm_token مطلوبان" },
        { status: 400 }
      );
    }

    console.log(`💾 حفظ FCM token لـ user_id: ${user_id}`);
    console.log(`   Token: ${fcm_token.substring(0, 30)}...`);

    const pool = await dbConnection();

    // ✅ 1️⃣ مسح هذا الـ Token من أي مستخدم آخر (لأنه Token واحد = جهاز واحد)
    const [deleteResult]: any = await pool.query(
      `UPDATE users 
       SET fcm_token = NULL 
       WHERE fcm_token = ? AND id != ?`,
      [fcm_token, user_id]
    );

    if (deleteResult.affectedRows > 0) {
      console.log(`♻️ تم مسح Token من ${deleteResult.affectedRows} مستخدم آخر`);
    }

    // ✅ 2️⃣ حفظ Token للمستخدم الحالي
    const [updateResult]: any = await pool.query(
      `UPDATE users 
       SET fcm_token = ?
       WHERE id = ?`,
      [fcm_token, user_id]
    );

    if (updateResult.affectedRows === 0) {
      console.error(`❌ لم يتم العثور على user_id: ${user_id}`);
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    // ✅ 3️⃣ التحقق من الحفظ
    const [verification]: any = await pool.query(
      `SELECT id, full_name, tenant_id, fcm_token 
       FROM users 
       WHERE id = ?`,
      [user_id]
    );

    console.log("✅ Token محفوظ بنجاح:");
    console.log(`   User: ${verification[0].full_name} (ID: ${verification[0].id})`);
    console.log(`   Tenant: ${verification[0].tenant_id}`);
    console.log(`   Token: ${verification[0].fcm_token?.substring(0, 30)}...`);

    return NextResponse.json({ 
      success: true,
      user_id: user_id,
      tenant_id: verification[0].tenant_id
    });

  } catch (error) {
    console.error("❌ خطأ في حفظ FCM token:", error);
    return NextResponse.json(
      { error: "خطأ في الخادم" },
      { status: 500 }
    );
  }
}