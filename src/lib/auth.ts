import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { memoryDb } from "@/services/dataStore";
import bcrypt from "bcryptjs";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "cinebook_super_secret_jwt_key_development_32chars_min!";
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export interface TokenPayload {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
  name: string;
}

export const AUTH_COOKIE_NAME = "cinebook_auth_token";

export async function createSessionToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as "USER" | "ADMIN",
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hashed);
}
