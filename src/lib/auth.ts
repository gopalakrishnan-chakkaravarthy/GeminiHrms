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

import crypto from "crypto";

const ENCRYPTION_KEY_STRING = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "absence-ace-secret-key-32-chars!!";
const ENCRYPTION_KEY = crypto.scryptSync(ENCRYPTION_KEY_STRING, "salt", 32);

/**
 * Encrypt a plain text password using AES-256-GCM
 */
export function encryptPassword(text: string): string {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `enc:${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return text;
  }
}

/**
 * Decrypt an encrypted password string using AES-256-GCM
 */
export function decryptPassword(encryptedText: string): string {
  if (!encryptedText) return "";
  if (!encryptedText.startsWith("enc:")) {
    return encryptedText;
  }
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 4) return "";
    const iv = Buffer.from(parts[1], "hex");
    const authTag = Buffer.from(parts[2], "hex");
    const encrypted = parts[3];

    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    return "";
  }
}

/**
 * Encrypt/hash password for DB storage
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return "";
  return encryptPassword(password);
}

/**
 * Verify password against encrypted string, bcrypt hash, or plain text
 */
export async function verifyPassword(password: string, hashOrEncrypted: string): Promise<boolean> {
  if (!hashOrEncrypted) return false;

  // 1. If stored as encrypted format `enc:...`, decrypt and compare
  if (hashOrEncrypted.startsWith("enc:")) {
    const decrypted = decryptPassword(hashOrEncrypted);
    return password === decrypted;
  }

  // 2. If stored as bcrypt hash
  if (hashOrEncrypted.startsWith("$2a$") || hashOrEncrypted.startsWith("$2b$") || hashOrEncrypted.startsWith("$2y$")) {
    return await bcrypt.compare(password, hashOrEncrypted);
  }

  // 3. Fallback plain text comparison
  return password === hashOrEncrypted;
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

let passwordColumnInitialized = false;

/**
 * Ensures the password column exists in the PostgreSQL employees table
 */
export async function ensurePasswordColumnExists() {
  if (!db || passwordColumnInitialized) return;
  try {
    await db.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `);
    passwordColumnInitialized = true;
  } catch (err) {
    console.warn("Could not alter table employees to add password column:", err);
  }
}
