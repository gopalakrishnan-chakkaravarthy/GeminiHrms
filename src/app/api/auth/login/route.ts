import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensurePasswordColumnExists, hashPassword, signJwt, verifyPassword } from "@/lib/auth";
import * as mock from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.emailOrId || body.email || body.username || "").toString().trim();
    const password = (body.password || "").toString().trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Email / User ID and Password are required." },
        { status: 400 }
      );
    }

    let employeeUser: {
      id: string;
      name: string;
      email: string;
      roleId?: string | null;
      roleName?: string | null;
      passwordHash?: string | null;
    } | null = null;

    if (db) {
      await ensurePasswordColumnExists();

      const queryRes = await db.query(
        `
        SELECT 
          e.id, 
          e.name, 
          e.email, 
          e.password,
          e.role_id AS "roleId", 
          COALESCE(r.name, 'Employee') AS "roleName"
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.id
        WHERE LOWER(e.email) = LOWER($1) 
           OR e.id = $1 
           OR e.employee_id = $1
        LIMIT 1
        `,
        [identifier]
      );

      if (queryRes.rows.length > 0) {
        const row = queryRes.rows[0];
        employeeUser = {
          id: row.id,
          name: row.name,
          email: row.email,
          roleId: row.roleId,
          roleName: row.roleName,
          passwordHash: row.password,
        };
      }
    } else {
      // Fallback mock check
      const foundMock = mock.allEmployees.find(
        (e) =>
          e.email.toLowerCase() === identifier.toLowerCase() ||
          e.id === identifier ||
          e.employeeId === identifier
      ) || (identifier ? mock.currentUser : null);

      if (foundMock) {
        employeeUser = {
          id: foundMock.id,
          name: foundMock.name,
          email: foundMock.email,
          roleId: foundMock.roleId,
          roleName: foundMock.roleName,
          passwordHash: null,
        };
      }
    }

    if (!employeeUser) {
      return NextResponse.json(
        { success: false, message: "Invalid email/user ID or password." },
        { status: 401 }
      );
    }

    // Password validation logic
    let isPasswordValid = false;
    if (employeeUser.passwordHash) {
      isPasswordValid = await verifyPassword(password, employeeUser.passwordHash);
    } else {
      // First time login or empty password in DB: set password to whatever user logged in with (hashed)
      isPasswordValid = true;
      if (db) {
        const newHash = await hashPassword(password);
        await db.query(`UPDATE employees SET password = $1 WHERE id = $2`, [newHash, employeeUser.id]);
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email/user ID or password." },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = await signJwt({
      userId: employeeUser.id,
      email: employeeUser.email,
      name: employeeUser.name,
      roleId: employeeUser.roleId,
      roleName: employeeUser.roleName,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: employeeUser.id,
        name: employeeUser.name,
        email: employeeUser.email,
        roleName: employeeUser.roleName,
      },
    });

    // Set auth cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error during login." },
      { status: 500 }
    );
  }
}
