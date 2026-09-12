import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { memoryDb } from "@/services/dataStore";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const now = new Date();
    const confirmedBookings = memoryDb.bookings.filter((b) => b.status === "CONFIRMED");
    const totalRevenueCents = confirmedBookings.reduce((sum, b) => sum + b.totalCents, 0);

    const activeHolds = memoryDb.showtimeSeats.filter(
      (sts) => sts.status === "HELD" && sts.holdExpiresAt && new Date(sts.holdExpiresAt) > now
    );

    const recentBookings = memoryDb.bookings
      .slice(-15)
      .reverse()
      .map((b) => {
        const u = memoryDb.users.find((user) => user.id === b.userId);
        const st = memoryDb.showtimes.find((s) => s.id === b.showtimeId);
        const m = st ? memoryDb.movies.find((movie) => movie.id === st.movieId) : null;
        return {
          id: b.id,
          bookingReference: b.bookingReference,
          customerName: u?.name || "Customer",
          customerEmail: u?.email || "",
          movieTitle: m?.title || "Movie",
          totalCents: b.totalCents,
          status: b.status,
          createdAt: b.createdAt,
        };
      });

    const recentLogs = memoryDb.auditLogs.slice(-20).reverse();

    return NextResponse.json({
      metrics: {
        totalRevenueCents,
        totalBookings: memoryDb.bookings.length,
        confirmedBookings: confirmedBookings.length,
        activeSeatHoldsCount: activeHolds.length,
        totalMovies: memoryDb.movies.length,
        totalCinemas: memoryDb.cinemas.length,
      },
      recentBookings,
      auditLogs: recentLogs,
      movies: memoryDb.movies,
      cinemas: memoryDb.cinemas,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch admin metrics" }, { status: 500 });
  }
}
