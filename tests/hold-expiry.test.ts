import { describe, it, expect, beforeEach } from "vitest";
import { bookingService } from "../src/services/bookingService";
import { memoryDb, initializeMemoryState } from "../src/services/dataStore";

describe("Agent 3: Seat Hold Expiration & Automatic Release Test", () => {
  beforeEach(() => {
    initializeMemoryState();
  });

  it("should release expired seat holds and mark pending bookings as expired", async () => {
    const showtime = memoryDb.showtimes[0];
    const targetSeat = memoryDb.seats.find(
      (s) => s.auditoriumId === showtime.auditoriumId && s.rowLabel === "E" && s.seatNumber === 2
    )!;

    const user = "user-charlie-003";

    // 1. Hold the seat
    const holdResult = await bookingService.holdSeats({
      showtimeId: showtime.id,
      seatIds: [targetSeat.id],
      userId: user,
    });

    expect(holdResult.bookingId).toBeDefined();

    // Verify seat is HELD
    const stSeat = memoryDb.showtimeSeats.find(
      (sts) => sts.showtimeId === showtime.id && sts.seatId === targetSeat.id
    )!;
    expect(stSeat.status).toBe("HELD");

    // 2. Simulate expiration by backdating holdExpiresAt and booking.expiresAt by 11 minutes
    const pastTime = new Date(Date.now() - 11 * 60 * 1000);
    stSeat.holdExpiresAt = pastTime;

    const booking = memoryDb.bookings.find((b) => b.id === holdResult.bookingId)!;
    booking.expiresAt = pastTime;

    // 3. Trigger the idempotent cleanup
    const releaseReport = await bookingService.releaseExpiredHolds();

    expect(releaseReport.releasedSeatsCount).toBeGreaterThanOrEqual(1);
    expect(releaseReport.expiredBookingsCount).toBeGreaterThanOrEqual(1);

    // 4. Verify seat has reverted to AVAILABLE and booking status is EXPIRED
    expect(stSeat.status).toBe("AVAILABLE");
    expect(stSeat.holdExpiresAt).toBeNull();
    expect(stSeat.heldByUserId).toBeNull();
    expect(booking.status).toBe("EXPIRED");

    // 5. Verify that another user can now hold that same seat without conflicts
    const newHold = await bookingService.holdSeats({
      showtimeId: showtime.id,
      seatIds: [targetSeat.id],
      userId: "user-david-004",
    });

    expect(newHold.bookingId).toBeDefined();
    expect(stSeat.status).toBe("HELD");
    expect(stSeat.heldByUserId).toBe("user-david-004");
  });
});
