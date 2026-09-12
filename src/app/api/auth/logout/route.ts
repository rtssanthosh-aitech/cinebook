import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getCurrentUser } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
  return response;
}
