import { NextResponse } from "next/server";
import { memoryDb } from "@/services/dataStore";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.toLowerCase() || "";
    const genreSlug = searchParams.get("genre") || "";
    const language = searchParams.get("language") || "";
    const cinemaId = searchParams.get("cinemaId") || "";
    const status = searchParams.get("status") || ""; // NOW_SHOWING | COMING_SOON

    let filtered = memoryDb.movies;

    // Filter by status if requested
    if (status) {
      filtered = filtered.filter((m) => m.status === status);
    }

    // Filter by text search
    if (query) {
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.synopsis.toLowerCase().includes(query)
      );
    }

    // Filter by language
    if (language) {
      filtered = filtered.filter((m) => m.language.toLowerCase() === language.toLowerCase());
    }

    // Filter by genre
    if (genreSlug) {
      const genre = memoryDb.genres.find(
        (g) => g.slug.toLowerCase() === genreSlug.toLowerCase() || g.name.toLowerCase() === genreSlug.toLowerCase()
      );
      if (genre) {
        const movieIdsWithGenre = memoryDb.movieGenres
          .filter((mg) => mg.genreId === genre.id)
          .map((mg) => mg.movieId);
        filtered = filtered.filter((m) => movieIdsWithGenre.includes(m.id));
      }
    }

    // Filter by cinema
    if (cinemaId) {
      const auds = memoryDb.auditoriums.filter((a) => a.cinemaId === cinemaId).map((a) => a.id);
      const movieIdsInCinema = memoryDb.showtimes
        .filter((st) => auds.includes(st.auditoriumId))
        .map((st) => st.movieId);
      filtered = filtered.filter((m) => movieIdsInCinema.includes(m.id));
    }

    // Attach genres & showtimes count to each movie
    const results = filtered.map((m) => {
      const mGenres = memoryDb.movieGenres
        .filter((mg) => mg.movieId === m.id)
        .map((mg) => memoryDb.genres.find((g) => g.id === mg.genreId)?.name)
        .filter(Boolean);

      const mShowtimes = memoryDb.showtimes.filter((st) => st.movieId === m.id);

      return {
        ...m,
        genres: mGenres,
        showtimesCount: mShowtimes.length,
      };
    });

    return NextResponse.json({
      movies: results,
      genres: memoryDb.genres,
      cinemas: memoryDb.cinemas.map((c) => ({ id: c.id, name: c.name, city: c.city })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch movies" }, { status: 500 });
  }
}
