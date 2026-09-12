"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Clock, Calendar, MapPin, Ticket, Film, Play, Star, Sparkles, ChevronRight } from "lucide-react";

interface Showtime {
  id: string;
  startTime: string;
  endTime: string;
  priceStandardCents: number;
  pricePremiumCents: number;
  priceVipCents: number;
  status: string;
  auditorium: {
    id: string;
    name: string;
    screenType: string;
  } | null;
  cinema: {
    id: string;
    name: string;
    address: string;
    city: string;
  } | null;
  availableSeatsCount: number;
}

interface MovieDetails {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string | null;
  durationMins: number;
  releaseDate: string;
  rating: string;
  language: string;
  status: string;
  genres: string[];
}

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const movieId = resolvedParams.id;

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/movies/${movieId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.movie) setMovie(data.movie);
        if (data.showtimes) setShowtimes(data.showtimes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [movieId]);

  // Generate 4 consecutive days starting today
  const dates = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" }),
      dateString: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      iso: d.toISOString().split("T")[0],
    };
  });

  // Group showtimes by cinema
  const showtimesByCinema: Record<string, { cinema: Showtime["cinema"]; showtimes: Showtime[] }> = {};
  for (const st of showtimes) {
    if (!st.cinema) continue;
    if (!showtimesByCinema[st.cinema.id]) {
      showtimesByCinema[st.cinema.id] = {
        cinema: st.cinema,
        showtimes: [],
      };
    }
    showtimesByCinema[st.cinema.id].showtimes.push(st);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="mt-4 text-xs text-zinc-400">Loading cinema schedule...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white">Movie Not Found</h2>
        <Link href="/movies" className="mt-4 inline-block text-xs text-amber-400 hover:underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* 1. Backdrop Hero Banner */}
      <div className="relative h-[400px] sm:h-[480px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-transparent to-[#08090d]/80" />
        </div>

        <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-8 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            {/* Poster thumbnail */}
            <div className="hidden sm:block h-60 w-40 shrink-0 overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl">
              <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                  {movie.rating}
                </span>
                <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-300">
                  {movie.language}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  {movie.durationMins} minutes
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl drop-shadow-md">
                {movie.title}
              </h1>

              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-0.5 text-xs font-medium text-zinc-300"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Movie Details & Showtime Selection */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-12">
        {/* Synopsis & Info Bar */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="h-4 w-4 text-amber-500" />
              <span>Synopsis</span>
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">{movie.synopsis}</p>

            {movie.trailerUrl && (
              <div className="pt-2">
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-amber-500 hover:text-amber-400 transition-all"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Watch Official Trailer
                </a>
              </div>
            )}
          </div>

          {/* Quick specs card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Screening Details</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Release Date</span>
                <span className="text-zinc-300 font-medium">{movie.releaseDate}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Age Rating</span>
                <span className="text-amber-400 font-bold">{movie.rating}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Audio Formats</span>
                <span className="text-zinc-300 font-medium">Dolby Atmos, 7.1 Surround</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Visuals</span>
                <span className="text-zinc-300 font-medium">IMAX Laser 4K</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Date Picker & Showtime Selector */}
        <div className="space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Ticket className="h-5 w-5 text-amber-500" />
              <span>Select Date & Showtime</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Choose your preferred theater and time slot to view available seats
            </p>

            {/* Date tabs */}
            <div className="mt-5 flex items-center gap-3 overflow-x-auto pb-2">
              {dates.map((d, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDateIndex(index)}
                  className={`flex flex-col items-center justify-center rounded-2xl border px-5 py-3 transition-all shrink-0 min-w-[100px] ${
                    selectedDateIndex === index
                      ? "border-amber-500 bg-amber-500/10 text-amber-400 shadow-md shadow-amber-500/10"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold">{d.label}</span>
                  <span className="text-[11px] text-zinc-400 mt-0.5">{d.dateString}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Showtimes by Cinema */}
          {Object.keys(showtimesByCinema).length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
              <p className="text-xs text-zinc-400">No scheduled showtimes available for the selected date.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(showtimesByCinema).map(({ cinema, showtimes: cShowtimes }) => (
                <div
                  key={cinema?.id}
                  className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md space-y-4"
                >
                  {/* Cinema Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-400" />
                        <span>{cinema?.name}</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{cinema?.address}</p>
                    </div>

                    <Link
                      href={`/cinemas/${cinema?.id}`}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>Theater amenities</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Showtime Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {cShowtimes.map((st) => {
                      const timeString = new Date(st.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <Link
                          key={st.id}
                          href={`/showtimes/${st.id}/seats`}
                          className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition-all hover:border-amber-500 hover:bg-zinc-900/80"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-extrabold text-white group-hover:text-amber-400 transition-colors">
                              {timeString}
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                                st.auditorium?.screenType === "IMAX"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : st.auditorium?.screenType === "DOLBY_ATMOS"
                                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {st.auditorium?.screenType || "STANDARD"}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-900 pt-2">
                            <span>{st.auditorium?.name}</span>
                            <span className="font-semibold text-emerald-400">
                              {st.availableSeatsCount} seats left
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                            <span>From ${(st.priceStandardCents / 100).toFixed(2)}</span>
                            <span className="text-amber-400 font-bold group-hover:translate-x-1 transition-transform">
                              Select Seats →
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
