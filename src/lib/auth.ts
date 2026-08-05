import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "absence-ace-jwt-secret-key-2026";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const AUTH_PROVIDER = (
  process.env.NEXT_PUBLIC_AUTH_PROVIDER ||
  process.env.AUTH_PROVIDER ||
  "custom"
).toLowerCase();

export interface JwtPayload {
  userId: string;
  email: string;
  roleId?: string | null;
  roleName?: string | null;
  name?: string;
  [key: string]: unknown;
}

/**
 * Sign a JWT token using jose
 */
export async function signJwt(payload: JwtPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT token
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify password against hash or fallback plain text
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  // Support legacy or plain text comparison if password wasn't hashed yet
  if (!hash.startsWith("$2a$") && !hash.startsWith("$2b$") && !hash.startsWith("$2y$")) {
    return password === hash;
  }
  return await bcrypt.compare(password, hash);
}

/**
 * Get current authenticated userId from custom JWT cookie or Clerk
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  // 1. Try Custom Auth JWT token first
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      const payload = await verifyJwt(token);
      if (payload?.userId) {
        return payload.userId;
      }
    }
  } catch {
    // Ignore cookie read error
  }

  // 2. If Clerk provider enabled or fallback, check Clerk
  if (AUTH_PROVIDER === "clerk") {
    try {
      const { auth } = await import("@clerk/nextjs/server");
      const authObj = await auth();
      if (authObj?.userId) {
        return authObj.userId;
      }
    } catch {
      // Ignore Clerk auth error
    }
  }

  return null;
}

/**
 * Ensures the password column exists in the PostgreSQL employees table
 */
export async function ensurePasswordColumnExists() {
  if (!db) return;
  try {
    await db.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `);
  } catch (err) {
    console.warn("Could not alter table employees to add password column:", err);
  }
}
