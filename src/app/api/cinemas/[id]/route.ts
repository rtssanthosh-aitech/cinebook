import { NextResponse } from "next/server";
import { memoryDb } from "@/services/dataStore";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cinema = memoryDb.cinemas.find((c) => c.id === id || c.slug === id);

    if (!cinema) {
      return NextResponse.json({ error: "Cinema not found" }, { status: 404 });
    }

    const auditoriums = memoryDb.auditoriums.filter((a) => a.cinemaId === cinema.id);
    const audIds = auditoriums.map((a) => a.id);

    // Get showtimes at this cinema
    const showtimes = memoryDb.showtimes
      .filter((st) => audIds.includes(st.auditoriumId))
      .map((st) => {
        const movie = memoryDb.movies.find((m) => m.id === st.movieId);
        const aud = auditoriums.find((a) => a.id === st.auditoriumId);
        return {
          id: st.id,
          startTime: st.startTime,
          endTime: st.endTime,
          priceStandardCents: st.priceStandardCents,
          pricePremiumCents: st.pricePremiumCents,
          priceVipCents: st.priceVipCents,
          movie: movie
            ? {
                id: movie.id,
                title: movie.title,
                posterUrl: movie.posterUrl,
                rating: movie.rating,
                durationMins: movie.durationMins,
              }
            : null,
          auditorium: aud
            ? {
                id: aud.id,
                name: aud.name,
                screenType: aud.screenType,
              }
            : null,
        };
      });

    return NextResponse.json({
      cinema,
      auditoriums,
      showtimes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch cinema" }, { status: 500 });
  }
}
