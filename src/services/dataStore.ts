import { db, isLiveDatabaseConfigured } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, inArray, lte, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// In-Memory Seed & State Store for zero-config preview, CI, and fallback
export interface MemoryState {
  users: Array<typeof schema.users.$inferSelect>;
  movies: Array<typeof schema.movies.$inferSelect>;
  genres: Array<typeof schema.genres.$inferSelect>;
  movieGenres: Array<{ movieId: string; genreId: string }>;
  cinemas: Array<typeof schema.cinemas.$inferSelect>;
  auditoriums: Array<typeof schema.auditoriums.$inferSelect>;
  seats: Array<typeof schema.seats.$inferSelect>;
  showtimes: Array<typeof schema.showtimes.$inferSelect>;
  showtimeSeats: Array<typeof schema.showtimeSeats.$inferSelect>;
  bookings: Array<typeof schema.bookings.$inferSelect>;
  bookingItems: Array<typeof schema.bookingItems.$inferSelect>;
  payments: Array<typeof schema.payments.$inferSelect>;
  tickets: Array<typeof schema.tickets.$inferSelect>;
  auditLogs: Array<typeof schema.auditLogs.$inferSelect>;
}

// Global singleton memory state across hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __cinebook_memory_state: MemoryState | undefined;
}

export function initializeMemoryState(): MemoryState {
  if (global.__cinebook_memory_state) {
    return global.__cinebook_memory_state;
  }

  const defaultPasswordHash = bcrypt.hashSync("CineBook2026!", 10);
  const now = new Date();

  // 1. Users
  const userList: Array<typeof schema.users.$inferSelect> = [
    {
      id: "a0000000-0000-0000-0000-000000000001",
      name: "CineBook Admin",
      email: "admin@cinebook.com",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "a0000000-0000-0000-0000-000000000002",
      name: "Alex Johnson",
      email: "alex@cinebook.com",
      passwordHash: defaultPasswordHash,
      role: "USER",
      createdAt: now,
      updatedAt: now,
    },
  ];

  // 2. Genres
  const genreList: Array<typeof schema.genres.$inferSelect> = [
    { id: "g0000000-0000-0000-0000-000000000001", name: "Action", slug: "action" },
    { id: "g0000000-0000-0000-0000-000000000002", name: "Sci-Fi", slug: "sci-fi" },
    { id: "g0000000-0000-0000-0000-000000000003", name: "Drama", slug: "drama" },
    { id: "g0000000-0000-0000-0000-000000000004", name: "Adventure", slug: "adventure" },
    { id: "g0000000-0000-0000-0000-000000000005", name: "Thriller", slug: "thriller" },
    { id: "g0000000-0000-0000-0000-000000000006", name: "Animation", slug: "animation" },
  ];

  // 3. Movies
  const movieList: Array<typeof schema.movies.$inferSelect> = [
    {
      id: "m0000000-0000-0000-0000-000000000001",
      title: "Interstellar Odyssey",
      slug: "interstellar-odyssey",
      synopsis: "A team of explorers travel through a newly discovered cosmic wormhole to surpass the limitations on human space travel and ensure survival on a dying Earth.",
      posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
      backdropUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop",
      trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
      durationMins: 165,
      releaseDate: "2026-03-15",
      rating: "PG-13",
      language: "English",
      status: "NOW_SHOWING",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "m0000000-0000-0000-0000-000000000002",
      title: "Neon Horizon: 2099",
      slug: "neon-horizon-2099",
      synopsis: "In a cyber-dystopian metropolis illuminated by holographic spires, an augmented detective uncovers an artificial intelligence consciousness conspiracy that threatens human sovereignty.",
      posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop",
      backdropUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop",
      trailerUrl: "https://www.youtube.com/watch?v=d9MyW72ELq0",
      durationMins: 142,
      releaseDate: "2026-04-02",
      rating: "R",
      language: "English",
      status: "NOW_SHOWING",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "m0000000-0000-0000-0000-000000000003",
      title: "Shadows of the Crown",
      slug: "shadows-of-the-crown",
      synopsis: "A gripping historical drama detailing the clandestine espionage network during the Renaissance royal court where power, betrayal, and romance intertwine.",
      posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
      backdropUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1600&auto=format&fit=crop",
      trailerUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0",
      durationMins: 130,
      releaseDate: "2026-02-20",
      rating: "PG-13",
      language: "English",
      status: "NOW_SHOWING",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "m0000000-0000-0000-0000-000000000004",
      title: "The Quantum Realm",
      slug: "the-quantum-realm",
      synopsis: "Theoretical physicists breach parallel dimensions, discovering an echo of earth where physics operates on musical harmonic resonance instead of gravity.",
      posterUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
      backdropUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
      trailerUrl: "https://www.youtube.com/watch?v=1g3_CFmnU7k",
      durationMins: 124,
      releaseDate: "2026-05-10",
      rating: "PG-13",
      language: "English",
      status: "COMING_SOON",
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Movie Genres relations
  const movieGenreList = [
    { movieId: movieList[0].id, genreId: genreList[1].id },
    { movieId: movieList[0].id, genreId: genreList[3].id },
    { movieId: movieList[1].id, genreId: genreList[0].id },
    { movieId: movieList[1].id, genreId: genreList[1].id },
    { movieId: movieList[2].id, genreId: genreList[2].id },
    { movieId: movieList[2].id, genreId: genreList[4].id },
    { movieId: movieList[3].id, genreId: genreList[1].id },
  ];

  // 4. Cinemas
  const cinemaList: Array<typeof schema.cinemas.$inferSelect> = [
    {
      id: "c0000000-0000-0000-0000-000000000001",
      name: "Grand Metropolis IMAX & Luxe",
      slug: "grand-metropolis-imax-luxe",
      address: "100 Grand Avenue, Financial District",
      city: "New York",
      state: "NY",
      postalCode: "10005",
      phone: "+1 (212) 555-0199",
      amenities: ["IMAX Laser", "Dolby Atmos", "VIP Recliners", "In-Seat Dining", "Full Bar"],
      createdAt: now,
    },
    {
      id: "c0000000-0000-0000-0000-000000000002",
      name: "Starlight Cinema Palace",
      slug: "starlight-cinema-palace",
      address: "450 Sunset Boulevard",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90028",
      phone: "+1 (310) 555-0142",
      amenities: ["Dolby Cinema", "Heated Recliners", "Cocktail Lounge", "Laser Projection"],
      createdAt: now,
    },
  ];

  // 5. Auditoriums
  const auditoriumList: Array<typeof schema.auditoriums.$inferSelect> = [
    {
      id: "aud00000-0000-0000-0000-000000000001",
      cinemaId: cinemaList[0].id,
      name: "Auditorium 1 - IMAX Laser",
      screenType: "IMAX",
      totalSeats: 48,
      createdAt: now,
    },
    {
      id: "aud00000-0000-0000-0000-000000000002",
      cinemaId: cinemaList[0].id,
      name: "Auditorium 2 - Dolby Atmos",
      screenType: "DOLBY_ATMOS",
      totalSeats: 48,
      createdAt: now,
    },
    {
      id: "aud00000-0000-0000-0000-000000000003",
      cinemaId: cinemaList[1].id,
      name: "Auditorium A - VIP Lounge",
      screenType: "VIP",
      totalSeats: 36,
      createdAt: now,
    },
  ];

  // 6. Seats for each auditorium (A through F, 1 through 8 = 48 seats)
  const seatList: Array<typeof schema.seats.$inferSelect> = [];
  for (const aud of auditoriumList) {
    const rows = ["A", "B", "C", "D", "E", "F"];
    const seatsPerRow = aud.screenType === "VIP" ? 6 : 8;
    for (const row of rows) {
      for (let num = 1; num <= seatsPerRow; num++) {
        let seatType: "STANDARD" | "PREMIUM" | "VIP" = "STANDARD";
        if (aud.screenType === "VIP" || row === "F") {
          seatType = "VIP";
        } else if (row === "D" || row === "E") {
          seatType = "PREMIUM";
        }

        seatList.push({
          id: `s-${aud.id.substring(0, 8)}-${row}${num}`,
          auditoriumId: aud.id,
          rowLabel: row,
          seatNumber: num,
          seatType,
          isAccessible: row === "A" && (num === 1 || num === seatsPerRow),
          createdAt: now,
        });
      }
    }
  }

  // 7. Showtimes
  const showtimeList: Array<typeof schema.showtimes.$inferSelect> = [];
  const today = new Date();
  today.setHours(14, 0, 0, 0);

  const eveningTime = new Date();
  eveningTime.setHours(19, 30, 0, 0);

  const nightTime = new Date();
  nightTime.setHours(22, 15, 0, 0);

  // Add showtimes for now showing movies
  showtimeList.push(
    {
      id: "st000000-0000-0000-0000-000000000001",
      movieId: movieList[0].id,
      auditoriumId: auditoriumList[0].id,
      startTime: today,
      endTime: new Date(today.getTime() + 165 * 60000),
      priceStandardCents: 1600, // $16.00
      pricePremiumCents: 2100, // $21.00
      priceVipCents: 2600, // $26.00
      status: "SCHEDULED",
      createdAt: now,
    },
    {
      id: "st000000-0000-0000-0000-000000000002",
      movieId: movieList[0].id,
      auditoriumId: auditoriumList[0].id,
      startTime: eveningTime,
      endTime: new Date(eveningTime.getTime() + 165 * 60000),
      priceStandardCents: 1800,
      pricePremiumCents: 2300,
      priceVipCents: 2900,
      status: "SCHEDULED",
      createdAt: now,
    },
    {
      id: "st000000-0000-0000-0000-000000000003",
      movieId: movieList[1].id,
      auditoriumId: auditoriumList[1].id,
      startTime: eveningTime,
      endTime: new Date(eveningTime.getTime() + 142 * 60000),
      priceStandardCents: 1500,
      pricePremiumCents: 1950,
      priceVipCents: 2500,
      status: "SCHEDULED",
      createdAt: now,
    },
    {
      id: "st000000-0000-0000-0000-000000000004",
      movieId: movieList[2].id,
      auditoriumId: auditoriumList[2].id,
      startTime: nightTime,
      endTime: new Date(nightTime.getTime() + 130 * 60000),
      priceStandardCents: 1700,
      pricePremiumCents: 2200,
      priceVipCents: 2800,
      status: "SCHEDULED",
      createdAt: now,
    }
  );

  // 8. Showtime Seats
  const showtimeSeatList: Array<typeof schema.showtimeSeats.$inferSelect> = [];
  for (const st of showtimeList) {
    const audSeats = seatList.filter((s) => s.auditoriumId === st.auditoriumId);
    for (const s of audSeats) {
      // Reserve a couple of sample booked seats so the map shows real booked seats
      const isPreBooked = (s.rowLabel === "C" && (s.seatNumber === 4 || s.seatNumber === 5));
      showtimeSeatList.push({
        id: `sts-${st.id.substring(0, 6)}-${s.id}`,
        showtimeId: st.id,
        seatId: s.id,
        status: isPreBooked ? "BOOKED" : "AVAILABLE",
        holdExpiresAt: null,
        heldByUserId: null,
        bookingId: null,
        updatedAt: now,
      });
    }
  }

  const state: MemoryState = {
    users: userList,
    movies: movieList,
    genres: genreList,
    movieGenres: movieGenreList,
    cinemas: cinemaList,
    auditoriums: auditoriumList,
    seats: seatList,
    showtimes: showtimeList,
    showtimeSeats: showtimeSeatList,
    bookings: [],
    bookingItems: [],
    payments: [],
    tickets: [],
    auditLogs: [],
  };

  global.__cinebook_memory_state = state;
  return state;
}

export const memoryDb = initializeMemoryState();
