import { describe, it, expect, beforeEach } from "vitest";
import { bookingService } from "../src/services/bookingService";
import { memoryDb, initializeMemoryState } from "../src/services/dataStore";

describe("Agent 3: Payment Idempotency & Ticket Issuance Test", () => {
  beforeEach(() => {
    initializeMemoryState();
  });

  it("should process payment, confirm seats, issue ticket, and reject/safely handle duplicate submissions", async () => {
    const showtime = memoryDb.showtimes[0];
    const targetSeat = memoryDb.seats.find(
      (s) => s.auditoriumId === showtime.auditoriumId && s.rowLabel === "B" && s.seatNumber === 3
    )!;
    const userId = "user-emma-005";

    // 1. Hold seat
    const hold = await bookingService.holdSeats({
      showtimeId: showtime.id,
      seatIds: [targetSeat.id],
      userId,
    });

    const idempotencyKey = `idemp_test_${Date.now()}`;

    // 2. First payment attempt
    const paymentResult1 = await bookingService.confirmPayment({
      bookingId: hold.bookingId,
      idempotencyKey,
      paymentAmountCents: hold.totalCents,
      userId,
    });

    expect(paymentResult1.success).toBe(true);
    expect(paymentResult1.booking?.status).toBe("CONFIRMED");
    expect(paymentResult1.ticket?.status).toBe("VALID");
    expect(paymentResult1.ticket?.ticketCode).toMatch(/^TKT-/);

    // Showtime seat must now be BOOKED
    const stSeat = memoryDb.showtimeSeats.find(
      (sts) => sts.showtimeId === showtime.id && sts.seatId === targetSeat.id
    )!;
    expect(stSeat.status).toBe("BOOKED");

    // 3. Second payment attempt with the identical idempotency key (simulating retry or double-click)
    const paymentResult2 = await bookingService.confirmPayment({
      bookingId: hold.bookingId,
      idempotencyKey,
      paymentAmountCents: hold.totalCents,
      userId,
    });

    expect(paymentResult2.success).toBe(true);
    expect(paymentResult2.isDuplicateSubmission).toBe(true);
    expect(paymentResult2.ticket?.ticketCode).toBe(paymentResult1.ticket?.ticketCode);

    // Verify only ONE payment record exists for this idempotency key
    const matchingPayments = memoryDb.payments.filter((p) => p.idempotencyKey === idempotencyKey);
    expect(matchingPayments.length).toBe(1);
  });

  it("should reject payments with incorrect amounts (server-authoritative pricing validation)", async () => {
    const showtime = memoryDb.showtimes[0];
    const targetSeat = memoryDb.seats.find(
      (s) => s.auditoriumId === showtime.auditoriumId && s.rowLabel === "B" && s.seatNumber === 4
    )!;
    const userId = "user-felix-006";

    const hold = await bookingService.holdSeats({
      showtimeId: showtime.id,
      seatIds: [targetSeat.id],
      userId,
    });

    // Attempt to pay $1.00 (100 cents) instead of the calculated total
    await expect(
      bookingService.confirmPayment({
        bookingId: hold.bookingId,
        idempotencyKey: `idemp_fraud_${Date.now()}`,
        paymentAmountCents: 100,
        userId,
      })
    ).rejects.toThrow(/Invalid payment amount/);
  });
});
