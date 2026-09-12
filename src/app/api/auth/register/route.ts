import { NextResponse } from "next/server";
import { memoryDb } from "@/services/dataStore";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = memoryDb.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const userId = `u-${nanoid(12)}`;
    const now = new Date();

    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: "USER" as const,
      createdAt: now,
      updatedAt: now,
    };

    memoryDb.users.push(newUser);

    // Audit log
    memoryDb.auditLogs.push({
      id: `log-${nanoid(12)}`,
      userId,
      action: "USER_REGISTERED",
      entityType: "USER",
      entityId: userId,
      details: { email: cleanEmail },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      createdAt: now,
    });

    const token = await createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
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
    return NextResponse.json({ error: error.message || "Failed to register" }, { status: 500 });
  }
}
