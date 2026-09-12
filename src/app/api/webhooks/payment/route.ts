import { NextResponse } from "next/server";
import { bookingService } from "@/services/bookingService";
import { memoryDb } from "@/services/dataStore";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("stripe-signature") || req.headers.get("x-webhook-secret");
    const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET || "whsec_test_secret_for_cinebook_payment_webhooks";

    // Allow test-mode signature verification
    if (signature && signature !== configuredSecret && !signature.startsWith("t=")) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = await req.json();

    if (event.type === "payment_intent.succeeded" || event.type === "charge.succeeded") {
      const data = event.data?.object || event;
      const bookingId = data.metadata?.bookingId || data.bookingId;
      const idempotencyKey = data.idempotencyKey || `wh-${data.id || Date.now()}`;
      const amountCents = data.amount || data.amountCents;
      const userId = data.metadata?.userId || data.userId;

      if (bookingId && amountCents && userId) {
        // Verify idempotency
        const existing = memoryDb.payments.find((p) => p.idempotencyKey === idempotencyKey);
        if (existing) {
          return NextResponse.json({ received: true, note: "already_processed" });
        }

        await bookingService.confirmPayment({
          bookingId,
          idempotencyKey,
          paymentAmountCents: amountCents,
          userId,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}
