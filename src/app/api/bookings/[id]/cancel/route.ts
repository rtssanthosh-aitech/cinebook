import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { bookingService } from "@/services/bookingService";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookingId } = await params;
    const result = await bookingService.cancelBooking(bookingId, user.userId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to cancel booking" }, { status: 400 });
  }
}
