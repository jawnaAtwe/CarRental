// app/api/v1/admin/bookings/weekly/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnection } from "../../../functions/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenant_id");

    const pool = await dbConnection();

    const query = `
      SELECT day, count
      FROM (
        SELECT 
          DAYNAME(start_date) AS day,
          COUNT(*) AS count
        FROM bookings
        WHERE status != 'deleted'
          ${tenantId ? "AND tenant_id = ?" : ""}
        GROUP BY DAYNAME(start_date)
      ) t
      ORDER BY FIELD(
        day,
        'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'
      )
    `;

    const [rows] = tenantId 
      ? await pool.query(query, [tenantId])
      : await pool.query(query);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
