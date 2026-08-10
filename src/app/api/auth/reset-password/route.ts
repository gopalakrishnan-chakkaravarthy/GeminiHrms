import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensurePasswordColumnExists, hashPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toString().trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { success: false, message: "Database connection unavailable." },
        { status: 500 }
      );
    }

    await ensurePasswordColumnExists();

    const queryRes = await db.query(
      `SELECT id, name, email FROM employees WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );

    if (queryRes.rows.length === 0) {
      // Return clear response
      return NextResponse.json(
        {
          success: false,
          message: "No employee account was found matching that email address.",
        },
        { status: 404 }
      );
    }

    const employee = queryRes.rows[0];
    const temporaryPassword = `Temp#${Math.random().toString(36).substring(2, 8)}`;
    const hashedPassword = await hashPassword(temporaryPassword);

    await db.query(`UPDATE employees SET password = $1 WHERE id = $2`, [
      hashedPassword,
      employee.id,
    ]);

    // Send email with temporary password
    try {
      await sendPasswordResetEmail({
        name: employee.name,
        email: employee.email,
        newPassword: temporaryPassword,
      });
    } catch (e) {
      console.error("Failed to send password reset email:", e);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset instructions and temporary password have been sent to ${employee.email}.`,
      temporaryPassword, // Sent back so UI can display it directly in case email environment is simulated
    });
  } catch (error: any) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}
