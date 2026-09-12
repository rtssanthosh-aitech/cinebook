import { NextResponse } from "next/server";
import { memoryDb } from "@/services/dataStore";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const movie = memoryDb.movies.find((m) => m.id === id || m.slug === id);

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const movieGenreNames = memoryDb.movieGenres
      .filter((mg) => mg.movieId === movie.id)
      .map((mg) => memoryDb.genres.find((g) => g.id === mg.genreId)?.name)
      .filter(Boolean);

    // Get showtimes for this movie
    const showtimes = memoryDb.showtimes
      .filter((st) => st.movieId === movie.id)
      .map((st) => {
        const auditorium = memoryDb.auditoriums.find((a) => a.id === st.auditoriumId);
        const cinema = auditorium ? memoryDb.cinemas.find((c) => c.id === auditorium.cinemaId) : null;
        const availableSeatsCount = memoryDb.showtimeSeats.filter(
          (sts) => sts.showtimeId === st.id && sts.status === "AVAILABLE"
        ).length;

        return {
          id: st.id,
          startTime: st.startTime,
          endTime: st.endTime,
          priceStandardCents: st.priceStandardCents,
          pricePremiumCents: st.pricePremiumCents,
          priceVipCents: st.priceVipCents,
          status: st.status,
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
                address: cinema.address,
                city: cinema.city,
              }
            : null,
          availableSeatsCount,
        };
      });

    return NextResponse.json({
      movie: {
        ...movie,
        genres: movieGenreNames,
      },
      showtimes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch movie details" }, { status: 500 });
  }
}
