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
    const { idempotencyKey, paymentAmountCents, paymentMethodId } = await req.json();

    if (!idempotencyKey) {
      return NextResponse.json({ error: "Idempotency key is required for payment" }, { status: 400 });
    }

    if (!paymentAmountCents || paymentAmountCents <= 0) {
      return NextResponse.json({ error: "Valid payment amount is required" }, { status: 400 });
    }

    const result = await bookingService.confirmPayment({
      bookingId,
      idempotencyKey,
      paymentAmountCents,
      paymentMethodId,
      userId: user.userId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const message = error.message || "Payment confirmation failed";
    const status = message.includes("expired")
      ? 410
      : message.includes("Unauthorized")
      ? 403
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
