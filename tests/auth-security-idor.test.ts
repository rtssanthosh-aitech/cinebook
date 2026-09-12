import { describe, it, expect, beforeEach } from "vitest";
import { bookingService } from "../src/services/bookingService";
import { memoryDb, initializeMemoryState } from "../src/services/dataStore";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "../src/lib/auth";

describe("Agent 3: Auth, Security, IDOR Protection & Cancellation", () => {
  beforeEach(() => {
    initializeMemoryState();
  });

  it("should securely hash passwords and verify JWT session tokens", async () => {
    const rawPassword = "SecureCinemaPassword2026!";
    const hashed = await hashPassword(rawPassword);

    expect(hashed).not.toBe(rawPassword);
    expect(await verifyPassword(rawPassword, hashed)).toBe(true);
    expect(await verifyPassword("WrongPassword", hashed)).toBe(false);

    const token = await createSessionToken({
      userId: "u-test-999",
      email: "tester@cinebook.com",
      role: "USER",
      name: "Tester",
    });

    const verified = await verifySessionToken(token);
    expect(verified?.userId).toBe("u-test-999");
    expect(verified?.role).toBe("USER");
  });

  it("should prevent User B from confirming or cancelling User A's booking (IDOR protection)", async () => {
    const showtime = memoryDb.showtimes[0];
    showtime.startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours in the future

    const seat = memoryDb.seats.find(
      (s) => s.auditoriumId === showtime.auditoriumId && s.rowLabel === "A" && s.seatNumber === 2
    )!;

    const userAlice = "user-alice-owner";
    const userBob = "user-bob-attacker";

    // Alice reserves the seat
    const hold = await bookingService.holdSeats({
      showtimeId: showtime.id,
      seatIds: [seat.id],
      userId: userAlice,
    });

    // Bob tries to pay/confirm Alice's booking
    await expect(
      bookingService.confirmPayment({
        bookingId: hold.bookingId,
        idempotencyKey: `idemp_attack_${Date.now()}`,
        paymentAmountCents: hold.totalCents,
        userId: userBob,
      })
    ).rejects.toThrow(/Unauthorized/);

    // Alice legitimately pays for her booking
    await bookingService.confirmPayment({
      bookingId: hold.bookingId,
      idempotencyKey: `idemp_alice_${Date.now()}`,
      paymentAmountCents: hold.totalCents,
      userId: userAlice,
    });

    // Bob tries to cancel Alice's booking
    await expect(
      bookingService.cancelBooking(hold.bookingId, userBob)
    ).rejects.toThrow(/Unauthorized/);

    // Alice cancels her booking (> 2 hours prior to showtime)
    const cancelRes = await bookingService.cancelBooking(hold.bookingId, userAlice);
    expect(cancelRes.success).toBe(true);

    const bookingInDb = memoryDb.bookings.find((b) => b.id === hold.bookingId);
    expect(bookingInDb?.status).toBe("CANCELLED");

    const stSeat = memoryDb.showtimeSeats.find(
      (sts) => sts.showtimeId === showtime.id && sts.seatId === seat.id
    );
    expect(stSeat?.status).toBe("AVAILABLE");
  });
});
