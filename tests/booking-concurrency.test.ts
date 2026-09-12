import { describe, it, expect, beforeEach } from "vitest";
import { bookingService } from "../src/services/bookingService";
import { memoryDb, initializeMemoryState } from "../src/services/dataStore";

describe("Agent 3: Concurrent Seat Hold Race Condition Test", () => {
  beforeEach(() => {
    initializeMemoryState();
  });

  it("should permit only ONE of two simultaneous requests attempting to hold the exact same seat", async () => {
    const showtime = memoryDb.showtimes[0];
    // Pick an available seat
    const targetSeat = memoryDb.seats.find((s) => s.auditoriumId === showtime.auditoriumId && s.rowLabel === "D" && s.seatNumber === 1);
    expect(targetSeat).toBeDefined();

    const userA = "user-alice-001";
    const userB = "user-bob-002";

    // Launch simultaneous hold attempts for the exact same seat
    const promiseA = bookingService.holdSeats({
      showtimeId: showtime.id,
      seatIds: [targetSeat!.id],
      userId: userA,
    }).then(
      (res) => ({ status: "fulfilled" as const, value: res }),
      (err) => ({ status: "rejected" as const, reason: err })
    );

    const promiseB = bookingService.holdSeats({
      showtimeId: showtime.id,
      seatIds: [targetSeat!.id],
      userId: userB,
    }).then(
      (res) => ({ status: "fulfilled" as const, value: res }),
      (err) => ({ status: "rejected" as const, reason: err })
    );

    const [resA, resB] = await Promise.all([promiseA, promiseB]);

    // Exactly one must succeed, and the other must be rejected due to conflict
    const successCount = [resA, resB].filter((r) => r.status === "fulfilled").length;
    const failureCount = [resA, resB].filter((r) => r.status === "rejected").length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);

    const rejected = resA.status === "rejected" ? resA.reason : resB.status === "rejected" ? resB.reason : null;
    expect(rejected).toBeDefined();
    expect(rejected.message).toMatch(/no longer available/i);

    // Confirm that the seat in the database is currently HELD
    const stSeat = memoryDb.showtimeSeats.find(
      (sts) => sts.showtimeId === showtime.id && sts.seatId === targetSeat!.id
    );
    expect(stSeat?.status).toBe("HELD");
  });
});
