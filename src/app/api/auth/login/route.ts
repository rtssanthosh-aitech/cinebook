import { NextResponse } from "next/server";
import { memoryDb } from "@/services/dataStore";
import { verifyPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = memoryDb.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const now = new Date();
    // Audit log
    memoryDb.auditLogs.push({
      id: `log-${nanoid(12)}`,
      userId: user.id,
      action: "USER_LOGGED_IN",
      entityType: "USER",
      entityId: user.id,
      details: { email: cleanEmail },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      createdAt: now,
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "USER" | "ADMIN",
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
