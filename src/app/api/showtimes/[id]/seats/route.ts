import { NextResponse } from "next/server";
import { memoryDb } from "@/services/dataStore";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: showtimeId } = await params;
    const user = await getCurrentUser();
    const now = new Date();

    const showtime = memoryDb.showtimes.find((st) => st.id === showtimeId);
    if (!showtime) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }

    const movie = memoryDb.movies.find((m) => m.id === showtime.movieId);
    const auditorium = memoryDb.auditoriums.find((a) => a.id === showtime.auditoriumId);
    const cinema = auditorium ? memoryDb.cinemas.find((c) => c.id === auditorium.cinemaId) : null;

    // Get all seats for auditorium
    const audSeats = memoryDb.seats.filter((s) => s.auditoriumId === showtime.auditoriumId);

    // Get status for this showtime
    const seatsWithStatus = audSeats.map((s) => {
      let stSeat = memoryDb.showtimeSeats.find(
        (sts) => sts.showtimeId === showtimeId && sts.seatId === s.id
      );

      // If hold has expired, revert status to AVAILABLE
      let effectiveStatus = stSeat?.status || "AVAILABLE";
      let isHeldByCurrentUser = false;

      if (effectiveStatus === "HELD") {
        if (stSeat?.holdExpiresAt && new Date(stSeat.holdExpiresAt) <= now) {
          effectiveStatus = "AVAILABLE";
          if (stSeat) {
            stSeat.status = "AVAILABLE";
            stSeat.holdExpiresAt = null;
            stSeat.heldByUserId = null;
            stSeat.bookingId = null;
          }
        } else if (user && stSeat?.heldByUserId === user.userId) {
          isHeldByCurrentUser = true;
        }
      }

      let priceCents = showtime.priceStandardCents;
      if (s.seatType === "PREMIUM") priceCents = showtime.pricePremiumCents;
      if (s.seatType === "VIP") priceCents = showtime.priceVipCents;

      return {
        id: s.id,
        showtimeSeatId: stSeat?.id,
        rowLabel: s.rowLabel,
        seatNumber: s.seatNumber,
        seatType: s.seatType,
        isAccessible: s.isAccessible,
        status: effectiveStatus,
        isHeldByCurrentUser,
        priceCents,
        holdExpiresAt: stSeat?.holdExpiresAt ? new Date(stSeat.holdExpiresAt).toISOString() : null,
      };
    });

    return NextResponse.json({
      showtime: {
        id: showtime.id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        prices: {
          standardCents: showtime.priceStandardCents,
          premiumCents: showtime.pricePremiumCents,
          vipCents: showtime.priceVipCents,
        },
      },
      movie: movie
        ? {
            id: movie.id,
            title: movie.title,
            posterUrl: movie.posterUrl,
            rating: movie.rating,
            durationMins: movie.durationMins,
          }
        : null,
      auditorium: auditorium
        ? {
            id: auditorium.id,
            name: auditorium.name,
            screenType: auditorium.screenType,
          }
        : null,
      cinema: cinema
        ? {
            id: cinema.id,
            name: cinema.name,
          }
        : null,
      seats: seatsWithStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch seat map" }, { status: 500 });
  }
}
