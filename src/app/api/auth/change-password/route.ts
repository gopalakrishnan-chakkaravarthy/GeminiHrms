import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUserId, verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const currentPassword = (body.currentPassword || "").toString().trim();
    const newPassword = (body.newPassword || "").toString().trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database connection unavailable." },
        { status: 500 }
      );
    }

    const queryRes = await db.query(
      `SELECT id, password FROM employees WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (queryRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Employee not found." },
        { status: 404 }
      );
    }

    const employee = queryRes.rows[0];
    const storedPassword = employee.password;

    if (!storedPassword) {
      // No password set yet — treat as first-time; accept any current password
      // and set the new one
    } else {
      const isValid = await verifyPassword(currentPassword, storedPassword);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: "Current password is incorrect." },
          { status: 400 }
        );
      }
    }

    const newHash = await hashPassword(newPassword);
    await db.query(`UPDATE employees SET password = $1 WHERE id = $2`, [newHash, userId]);

    return NextResponse.json({ success: true, message: "Password changed successfully." });
  } catch (error: any) {
    console.error("Change Password API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
