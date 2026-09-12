import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { bookingService } from "@/services/bookingService";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to reserve seats" }, { status: 401 });
    }

    const { showtimeId, seatIds } = await req.json();

    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: "showtimeId and non-empty seatIds array are required" }, { status: 400 });
    }

    const result = await bookingService.holdSeats({
      showtimeId,
      seatIds,
      userId: user.userId,
    });

    return NextResponse.json({ success: true, booking: result }, { status: 201 });
  } catch (error: any) {
    const message = error.message || "Failed to hold seats";
    const status = message.includes("no longer available") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
