import { db, isLiveDatabaseConfigured } from "@/db";
import * as schema from "@/db/schema";
import { memoryDb } from "./dataStore";
import { eq, and, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface HoldSeatsInput {
  showtimeId: string;
  seatIds: string[];
  userId: string;
}

export interface HoldSeatsResult {
  bookingId: string;
  bookingReference: string;
  expiresAt: string;
  subtotalCents: number;
  serviceFeeCents: number;
  taxCents: number;
  totalCents: number;
  seats: Array<{
    seatId: string;
    rowLabel: string;
    seatNumber: number;
    seatType: string;
    priceCents: number;
  }>;
}

export interface ConfirmPaymentInput {
  bookingId: string;
  idempotencyKey: string;
  paymentMethodId?: string;
  paymentAmountCents: number;
  userId: string;
}

// In-memory Mutex to guarantee serialized transactional concurrency when running without external distributed lock
let inMemoryLockPromise = Promise.resolve();
async function acquireLock<T>(fn: () => Promise<T>): Promise<T> {
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const currentLock = inMemoryLockPromise;
  inMemoryLockPromise = (async () => {
    await currentLock;
    await nextLock;
  })();

  await currentLock;
  try {
    return await fn();
  } finally {
    release!();
  }
}

export const bookingService = {
  /**
   * 1. Transactional Seat Hold
   * - Locks requested seats (FOR UPDATE)
   * - Confirms every requested seat is AVAILABLE (or has expired hold)
   * - Creates temporary hold with 10-minute expiry
   * - Computes server-authoritative pricing in cents
   * - Creates PENDING booking
   */
  async holdSeats(input: HoldSeatsInput): Promise<HoldSeatsResult> {
    const { showtimeId, seatIds, userId } = input;

    if (!seatIds || seatIds.length === 0) {
      throw new Error("No seats selected");
    }

    const holdDurationMinutes = 10;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + holdDurationMinutes * 60 * 1000);

    // If live Neon DB is connected
    if (isLiveDatabaseConfigured && db) {
      return await db.transaction(async (tx) => {
        // First, auto-release any expired holds for this showtime
        await tx
          .update(schema.showtimeSeats)
          .set({
            status: "AVAILABLE",
            holdExpiresAt: null,
            heldByUserId: null,
            bookingId: null,
            updatedAt: now,
          })
          .where(
            and(
              eq(schema.showtimeSeats.showtimeId, showtimeId),
              eq(schema.showtimeSeats.status, "HELD"),
              sql`${schema.showtimeSeats.holdExpiresAt} <= ${now}`
            )
          );

        // Fetch and lock showtime seats FOR UPDATE
        const seatsToLock = await tx
          .select({
            id: schema.showtimeSeats.id,
            seatId: schema.showtimeSeats.seatId,
            status: schema.showtimeSeats.status,
            holdExpiresAt: schema.showtimeSeats.holdExpiresAt,
            heldByUserId: schema.showtimeSeats.heldByUserId,
            seatNumber: schema.seats.seatNumber,
            rowLabel: schema.seats.rowLabel,
            seatType: schema.seats.seatType,
          })
          .from(schema.showtimeSeats)
          .innerJoin(schema.seats, eq(schema.showtimeSeats.seatId, schema.seats.id))
          .where(
            and(
              eq(schema.showtimeSeats.showtimeId, showtimeId),
              inArray(schema.showtimeSeats.seatId, seatIds)
            )
          )
          .for("update");

        if (seatsToLock.length !== seatIds.length) {
          throw new Error("One or more selected seats could not be found for this showtime");
        }

        // Verify all seats are AVAILABLE (or held by the same user with active session)
        for (const seat of seatsToLock) {
          const isExpired = seat.holdExpiresAt && seat.holdExpiresAt <= now;
          const isHeldByMe = seat.status === "HELD" && seat.heldByUserId === userId;
          const isAvailable = seat.status === "AVAILABLE" || isExpired || isHeldByMe;

          if (!isAvailable) {
            throw new Error(`Seat ${seat.rowLabel}${seat.seatNumber} is no longer available`);
          }
        }

        // Fetch showtime base prices
        const [showtime] = await tx
          .select()
          .from(schema.showtimes)
          .where(eq(schema.showtimes.id, showtimeId));

        if (!showtime) {
          throw new Error("Showtime not found");
        }

        // Calculate authoritative price on the server
        let subtotalCents = 0;
        const seatItems = seatsToLock.map((s) => {
          let priceCents = showtime.priceStandardCents;
          if (s.seatType === "PREMIUM") priceCents = showtime.pricePremiumCents;
          if (s.seatType === "VIP") priceCents = showtime.priceVipCents;
          subtotalCents += priceCents;
          return {
            showtimeSeatId: s.id,
            seatId: s.seatId,
            rowLabel: s.rowLabel,
            seatNumber: s.seatNumber,
            seatType: s.seatType,
            priceCents,
          };
        });

        const serviceFeeCents = 150; // $1.50 flat processing fee
        const taxCents = Math.round(subtotalCents * 0.08); // 8% sales tax in cents
        const totalCents = subtotalCents + serviceFeeCents + taxCents;

        const bookingReference = `CB-${nanoid(6).toUpperCase()}`;

        // Create pending booking
        const [newBooking] = await tx
          .insert(schema.bookings)
          .values({
            bookingReference,
            userId,
            showtimeId,
            status: "PENDING",
            subtotalCents,
            serviceFeeCents,
            taxCents,
            totalCents,
            expiresAt,
          })
          .returning();

        // Update showtime seats to HELD
        for (const s of seatsToLock) {
          await tx
            .update(schema.showtimeSeats)
            .set({
              status: "HELD",
              holdExpiresAt: expiresAt,
              heldByUserId: userId,
              bookingId: newBooking.id,
              updatedAt: now,
            })
            .where(eq(schema.showtimeSeats.id, s.id));

          // Insert booking item
          await tx.insert(schema.bookingItems).values({
            bookingId: newBooking.id,
            showtimeSeatId: s.id,
            seatId: s.seatId,
            priceCents: s.seatType === "VIP" ? showtime.priceVipCents : s.seatType === "PREMIUM" ? showtime.pricePremiumCents : showtime.priceStandardCents,
            seatType: s.seatType,
          });
        }

        return {
          bookingId: newBooking.id,
          bookingReference,
          expiresAt: expiresAt.toISOString(),
          subtotalCents,
          serviceFeeCents,
          taxCents,
          totalCents,
          seats: seatItems.map((s) => ({
            seatId: s.seatId,
            rowLabel: s.rowLabel,
            seatNumber: s.seatNumber,
            seatType: s.seatType,
            priceCents: s.priceCents,
          })),
        };
      });
    }

    // In-memory fallback with atomic lock
    return await acquireLock(async () => {
      // 1. Release expired holds
      for (const sts of memoryDb.showtimeSeats) {
        if (sts.status === "HELD" && sts.holdExpiresAt && new Date(sts.holdExpiresAt) <= now) {
          sts.status = "AVAILABLE";
          sts.holdExpiresAt = null;
          sts.heldByUserId = null;
          sts.bookingId = null;
          sts.updatedAt = now;
        }
      }

      // 2. Lock & inspect requested seats
      const showtime = memoryDb.showtimes.find((st) => st.id === showtimeId);
      if (!showtime) throw new Error("Showtime not found");

      const targetStSeats = memoryDb.showtimeSeats.filter(
        (sts) => sts.showtimeId === showtimeId && seatIds.includes(sts.seatId)
      );

      if (targetStSeats.length !== seatIds.length) {
        throw new Error("One or more selected seats do not exist for this showtime");
      }

      for (const sts of targetStSeats) {
        const isExpired = sts.holdExpiresAt && new Date(sts.holdExpiresAt) <= now;
        const isHeldByMe = sts.status === "HELD" && sts.heldByUserId === userId;
        const isAvailable = sts.status === "AVAILABLE" || isExpired || isHeldByMe;

        if (!isAvailable) {
          const seatObj = memoryDb.seats.find((s) => s.id === sts.seatId);
          const seatLabel = seatObj ? `${seatObj.rowLabel}${seatObj.seatNumber}` : sts.seatId;
          throw new Error(`Seat ${seatLabel} is no longer available`);
        }
      }

      // 3. Compute price
      let subtotalCents = 0;
      const seatItems = targetStSeats.map((sts) => {
        const s = memoryDb.seats.find((seat) => seat.id === sts.seatId)!;
        let priceCents = showtime.priceStandardCents;
        if (s.seatType === "PREMIUM") priceCents = showtime.pricePremiumCents;
        if (s.seatType === "VIP") priceCents = showtime.priceVipCents;
        subtotalCents += priceCents;
        return {
          showtimeSeatId: sts.id,
          seatId: s.id,
          rowLabel: s.rowLabel,
          seatNumber: s.seatNumber,
          seatType: s.seatType,
          priceCents,
        };
      });

      const serviceFeeCents = 150;
      const taxCents = Math.round(subtotalCents * 0.08);
      const totalCents = subtotalCents + serviceFeeCents + taxCents;

      const bookingId = `b0000000-${nanoid(8)}-${nanoid(8)}`;
      const bookingReference = `CB-${nanoid(6).toUpperCase()}`;

      // 4. Create booking
      const newBooking: typeof schema.bookings.$inferSelect = {
        id: bookingId,
        bookingReference,
        userId,
        showtimeId,
        status: "PENDING",
        subtotalCents,
        serviceFeeCents,
        taxCents,
        totalCents,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };
      memoryDb.bookings.push(newBooking);

      // 5. Update showtime seats to HELD
      for (const sts of targetStSeats) {
        sts.status = "HELD";
        sts.holdExpiresAt = expiresAt;
        sts.heldByUserId = userId;
        sts.bookingId = bookingId;
        sts.updatedAt = now;

        const seat = memoryDb.seats.find((s) => s.id === sts.seatId)!;
        memoryDb.bookingItems.push({
          id: `bi-${nanoid(12)}`,
          bookingId,
          showtimeSeatId: sts.id,
          seatId: seat.id,
          priceCents: seat.seatType === "VIP" ? showtime.priceVipCents : showtime.priceStandardCents,
          seatType: seat.seatType,
        });
      }

      return {
        bookingId,
        bookingReference,
        expiresAt: expiresAt.toISOString(),
        subtotalCents,
        serviceFeeCents,
        taxCents,
        totalCents,
        seats: seatItems.map((s) => ({
          seatId: s.seatId,
          rowLabel: s.rowLabel,
          seatNumber: s.seatNumber,
          seatType: s.seatType,
          priceCents: s.priceCents,
        })),
      };
    });
  },

  /**
   * 2. Confirm Booking after Payment
   * - Uses payment idempotency keys
   * - Rejects if hold has expired
   * - Marks showtime seats as BOOKED
   * - Updates booking status to CONFIRMED
   * - Generates digital tickets with QR payload
   */
  async confirmPayment(input: ConfirmPaymentInput) {
    const { bookingId, idempotencyKey, paymentAmountCents, userId } = input;
    const now = new Date();

    return await acquireLock(async () => {
      // Check idempotency first: if this key was already processed, return existing ticket
      const existingPayment = memoryDb.payments.find((p) => p.idempotencyKey === idempotencyKey);
      if (existingPayment) {
        const existingBooking = memoryDb.bookings.find((b) => b.id === existingPayment.bookingId);
        const existingTicket = memoryDb.tickets.find((t) => t.bookingId === existingPayment.bookingId);
        return {
          success: true,
          booking: existingBooking,
          payment: existingPayment,
          ticket: existingTicket,
          isDuplicateSubmission: true,
        };
      }

      const booking = memoryDb.bookings.find((b) => b.id === bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.userId !== userId) {
        throw new Error("Unauthorized: Booking does not belong to this user");
      }

      if (booking.status === "CONFIRMED") {
        const ticket = memoryDb.tickets.find((t) => t.bookingId === bookingId);
        return { success: true, booking, ticket, isAlreadyConfirmed: true };
      }

      if (booking.status === "EXPIRED" || new Date(booking.expiresAt) <= now) {
        booking.status = "EXPIRED";
        throw new Error("Seat hold has expired. Please select your seats again.");
      }

      if (booking.status !== "PENDING") {
        throw new Error(`Cannot pay for booking with status: ${booking.status}`);
      }

      if (paymentAmountCents !== booking.totalCents) {
        throw new Error(`Invalid payment amount: expected ${booking.totalCents} cents, got ${paymentAmountCents}`);
      }

      // Record Payment
      const paymentId = `pay-${nanoid(12)}`;
      const paymentIntentId = `pi_test_${nanoid(16)}`;
      const newPayment: typeof schema.payments.$inferSelect = {
        id: paymentId,
        bookingId,
        idempotencyKey,
        paymentIntentId,
        provider: "STRIPE_TEST",
        amountCents: paymentAmountCents,
        currency: "USD",
        status: "SUCCEEDED",
        metadata: { processedAt: now.toISOString() },
        createdAt: now,
      };
      memoryDb.payments.push(newPayment);

      // Confirm Seats
      const linkedSeats = memoryDb.showtimeSeats.filter((sts) => sts.bookingId === bookingId);
      for (const sts of linkedSeats) {
        sts.status = "BOOKED";
        sts.holdExpiresAt = null;
        sts.updatedAt = now;
      }

      // Update Booking
      booking.status = "CONFIRMED";
      booking.updatedAt = now;

      // Generate Ticket
      const ticketCode = `TKT-${nanoid(8).toUpperCase()}`;
      const showtime = memoryDb.showtimes.find((st) => st.id === booking.showtimeId);
      const movie = showtime ? memoryDb.movies.find((m) => m.id === showtime.movieId) : null;
      const auditorium = showtime ? memoryDb.auditoriums.find((a) => a.id === showtime.auditoriumId) : null;
      const cinema = auditorium ? memoryDb.cinemas.find((c) => c.id === auditorium.cinemaId) : null;

      const items = memoryDb.bookingItems.filter((item) => item.bookingId === bookingId);
      const seatLabels = items.map((item) => {
        const s = memoryDb.seats.find((seat) => seat.id === item.seatId);
        return s ? `${s.rowLabel}${s.seatNumber}` : "";
      });

      const qrPayload = JSON.stringify({
        ticketCode,
        bookingRef: booking.bookingReference,
        movieTitle: movie?.title,
        cinemaName: cinema?.name,
        auditorium: auditorium?.name,
        seats: seatLabels,
        showtime: showtime?.startTime,
        totalCents: booking.totalCents,
        verified: true,
      });

      const newTicket: typeof schema.tickets.$inferSelect = {
        id: `tkt-${nanoid(12)}`,
        bookingId,
        ticketCode,
        qrPayload,
        status: "VALID",
        issuedAt: now,
      };
      memoryDb.tickets.push(newTicket);

      // Audit Log
      memoryDb.auditLogs.push({
        id: `log-${nanoid(12)}`,
        userId,
        action: "BOOKING_CONFIRMED",
        entityType: "BOOKING",
        entityId: bookingId,
        details: { reference: booking.bookingReference, totalCents: booking.totalCents, seats: seatLabels },
        ipAddress: "127.0.0.1",
        createdAt: now,
      });

      return {
        success: true,
        booking,
        payment: newPayment,
        ticket: newTicket,
      };
    });
  },

  /**
   * 3. Idempotent Hold Release Cron/Worker
   * - Finds all HELD showtime_seats whose holdExpiresAt <= now
   * - Resets them to AVAILABLE
   * - Marks any PENDING bookings past their expiresAt as EXPIRED
   */
  async releaseExpiredHolds(): Promise<{ releasedSeatsCount: number; expiredBookingsCount: number }> {
    const now = new Date();

    return await acquireLock(async () => {
      let releasedSeatsCount = 0;
      let expiredBookingsCount = 0;

      // 1. Release expired showtime seats
      for (const sts of memoryDb.showtimeSeats) {
        if (sts.status === "HELD" && sts.holdExpiresAt && new Date(sts.holdExpiresAt) <= now) {
          sts.status = "AVAILABLE";
          sts.holdExpiresAt = null;
          sts.heldByUserId = null;
          sts.bookingId = null;
          sts.updatedAt = now;
          releasedSeatsCount++;
        }
      }

      // 2. Mark pending bookings as expired
      for (const b of memoryDb.bookings) {
        if (b.status === "PENDING" && new Date(b.expiresAt) <= now) {
          b.status = "EXPIRED";
          b.updatedAt = now;
          expiredBookingsCount++;
        }
      }

      return { releasedSeatsCount, expiredBookingsCount };
    });
  },

  /**
   * 4. Cancel Booking
   * - Only allowed if booking is CONFIRMED and showtime start is > 2 hours away
   */
  async cancelBooking(bookingId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const now = new Date();

    return await acquireLock(async () => {
      const booking = memoryDb.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");

      if (booking.userId !== userId) {
        throw new Error("Unauthorized to cancel this booking");
      }

      if (booking.status !== "CONFIRMED") {
        throw new Error(`Only confirmed bookings can be cancelled (current status: ${booking.status})`);
      }

      const showtime = memoryDb.showtimes.find((st) => st.id === booking.showtimeId);
      if (!showtime) throw new Error("Showtime not found");

      const hoursUntilShowtime = (new Date(showtime.startTime).getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilShowtime < 2) {
        throw new Error("Bookings can only be cancelled up to 2 hours before the showtime");
      }

      // Mark booking cancelled
      booking.status = "CANCELLED";
      booking.updatedAt = now;

      // Release seats back to AVAILABLE
      const seats = memoryDb.showtimeSeats.filter((sts) => sts.bookingId === bookingId);
      for (const sts of seats) {
        sts.status = "AVAILABLE";
        sts.holdExpiresAt = null;
        sts.heldByUserId = null;
        sts.bookingId = null;
        sts.updatedAt = now;
      }

      // Mark tickets cancelled
      const ticket = memoryDb.tickets.find((t) => t.bookingId === bookingId);
      if (ticket) {
        ticket.status = "CANCELLED";
      }

      // Mark payment refunded
      const payment = memoryDb.payments.find((p) => p.bookingId === bookingId);
      if (payment) {
        payment.status = "REFUNDED";
      }

      // Audit Log
      memoryDb.auditLogs.push({
        id: `log-${nanoid(12)}`,
        userId,
        action: "BOOKING_CANCELLED",
        entityType: "BOOKING",
        entityId: bookingId,
        details: { refundedAmountCents: booking.totalCents },
        ipAddress: "127.0.0.1",
        createdAt: now,
      });

      return {
        success: true,
        message: "Booking successfully cancelled and refund initiated",
      };
    });
  },
};
