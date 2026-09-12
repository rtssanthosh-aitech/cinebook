import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { memoryDb } from "@/services/dataStore";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bookingId } = await params;
    const booking = memoryDb.bookings.find(
      (b) => b.id === bookingId || b.bookingReference === bookingId
    );

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // IDOR protection: only owner or admin can view
    if (booking.userId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You do not have access to this booking" }, { status: 403 });
    }

    const showtime = memoryDb.showtimes.find((st) => st.id === booking.showtimeId);
    const movie = showtime ? memoryDb.movies.find((m) => m.id === showtime.movieId) : null;
    const auditorium = showtime ? memoryDb.auditoriums.find((a) => a.id === showtime.auditoriumId) : null;
    const cinema = auditorium ? memoryDb.cinemas.find((c) => c.id === auditorium.cinemaId) : null;

    const items = memoryDb.bookingItems.filter((bi) => bi.bookingId === booking.id);
    const seats = items.map((item) => {
      const s = memoryDb.seats.find((seat) => seat.id === item.seatId);
      return {
        id: item.seatId,
        rowLabel: s?.rowLabel || "",
        seatNumber: s?.seatNumber || 0,
        seatType: item.seatType,
        priceCents: item.priceCents,
      };
    });

    const ticket = memoryDb.tickets.find((t) => t.bookingId === booking.id);
    const payment = memoryDb.payments.find((p) => p.bookingId === booking.id);

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        subtotalCents: booking.subtotalCents,
        serviceFeeCents: booking.serviceFeeCents,
        taxCents: booking.taxCents,
        totalCents: booking.totalCents,
        expiresAt: new Date(booking.expiresAt).toISOString(),
        createdAt: new Date(booking.createdAt).toISOString(),
      },
      movie: movie
        ? {
            id: movie.id,
            title: movie.title,
            posterUrl: movie.posterUrl,
            backdropUrl: movie.backdropUrl,
            durationMins: movie.durationMins,
            rating: movie.rating,
          }
        : null,
      cinema: cinema ? { id: cinema.id, name: cinema.name, address: cinema.address } : null,
      auditorium: auditorium ? { id: auditorium.id, name: auditorium.name, screenType: auditorium.screenType } : null,
      showtime: showtime ? { id: showtime.id, startTime: showtime.startTime, endTime: showtime.endTime } : null,
      seats,
      ticket: ticket ? { ticketCode: ticket.ticketCode, qrPayload: ticket.qrPayload, status: ticket.status } : null,
      payment: payment ? { status: payment.status, amountCents: payment.amountCents } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch booking" }, { status: 500 });
  }
}
