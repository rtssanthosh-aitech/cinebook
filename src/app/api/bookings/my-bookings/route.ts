import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { memoryDb } from "@/services/dataStore";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto release expired holds
    const now = new Date();
    for (const b of memoryDb.bookings) {
      if (b.status === "PENDING" && new Date(b.expiresAt) <= now) {
        b.status = "EXPIRED";
      }
    }

    const userBookings = memoryDb.bookings
      .filter((b) => b.userId === user.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const enriched = userBookings.map((b) => {
      const showtime = memoryDb.showtimes.find((st) => st.id === b.showtimeId);
      const movie = showtime ? memoryDb.movies.find((m) => m.id === showtime.movieId) : null;
      const auditorium = showtime ? memoryDb.auditoriums.find((a) => a.id === showtime.auditoriumId) : null;
      const cinema = auditorium ? memoryDb.cinemas.find((c) => c.id === auditorium.cinemaId) : null;

      const items = memoryDb.bookingItems.filter((item) => item.bookingId === b.id);
      const seats = items.map((item) => {
        const s = memoryDb.seats.find((seat) => seat.id === item.seatId);
        return s ? `${s.rowLabel}${s.seatNumber}` : "";
      });

      const ticket = memoryDb.tickets.find((t) => t.bookingId === b.id);

      // Check cancellation eligibility: CONFIRMED and > 2 hours before showtime
      let isEligibleForCancellation = false;
      if (b.status === "CONFIRMED" && showtime) {
        const hours = (new Date(showtime.startTime).getTime() - now.getTime()) / (1000 * 60 * 60);
        isEligibleForCancellation = hours > 2;
      }

      return {
        id: b.id,
        bookingReference: b.bookingReference,
        status: b.status,
        totalCents: b.totalCents,
        createdAt: b.createdAt,
        movie: movie ? { id: movie.id, title: movie.title, posterUrl: movie.posterUrl } : null,
        cinema: cinema ? { name: cinema.name } : null,
        auditorium: auditorium ? { name: auditorium.name, screenType: auditorium.screenType } : null,
        showtime: showtime ? { startTime: showtime.startTime } : null,
        seats,
        ticket: ticket ? { ticketCode: ticket.ticketCode, status: ticket.status } : null,
        isEligibleForCancellation,
      };
    });

    return NextResponse.json({ bookings: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch bookings" }, { status: 500 });
  }
}
