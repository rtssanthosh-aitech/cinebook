import { NextResponse } from "next/server";
import { bookingService } from "@/services/bookingService";

export async function GET(req: Request) {
  return handleRelease(req);
}

export async function POST(req: Request) {
  return handleRelease(req);
}

async function handleRelease(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const querySecret = searchParams.get("secret");

    const configuredSecret = process.env.CRON_SECRET || "cinebook_cron_secret_auth_token_for_maintenance_jobs";

    const isBearerValid = authHeader === `Bearer ${configuredSecret}`;
    const isQueryValid = querySecret === configuredSecret;

    if (!isBearerValid && !isQueryValid) {
      return NextResponse.json({ error: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
    }

    const result = await bookingService.releaseExpiredHolds();

    return NextResponse.json({
      success: true,
      message: "Expired seat holds and bookings evaluated successfully",
      releasedSeatsCount: result.releasedSeatsCount,
      expiredBookingsCount: result.expiredBookingsCount,
      processedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to release holds" }, { status: 500 });
  }
}
