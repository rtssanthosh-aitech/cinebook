"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Calendar, Clock, Star, MapPin, Sparkles, ArrowRight, ShieldCheck, Ticket } from "lucide-react";

interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  durationMins: number;
  rating: string;
  language: string;
  status: string;
  genres: string[];
  showtimesCount: number;
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "NOW_SHOWING" | "COMING_SOON">("NOW_SHOWING");
  const [featuredIndex, setFeaturedIndex] = useState(0);

  useEffect(() => {
    fetch("/api/movies")
      .then((res) => res.json())
      .then((data) => {
        if (data.movies) {
          setMovies(data.movies);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredMovies = movies.filter((m) => {
    if (activeTab === "ALL") return true;
    return m.status === activeTab;
  });

  const featuredMovie = movies.length > 0 ? movies[featuredIndex % movies.length] : null;

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Cinematic Hero Section */}
      {featuredMovie && (
        <section className="relative h-[550px] sm:h-[620px] lg:h-[700px] w-full overflow-hidden">
          {/* Backdrop Image with gradient overlays */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
            style={{ backgroundImage: `url(${featuredMovie.backdropUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-transparent to-zinc-950/60" />
            <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-xs font-bold text-amber-400 uppercase tracking-wide">
                  Featured Premiere
                </span>
                <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-semibold text-zinc-300">
                  {featuredMovie.rating}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  {featuredMovie.durationMins} mins
                </span>
                <span className="text-xs text-zinc-400">• {featuredMovie.language}</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-md">
                {featuredMovie.title}
              </h1>

              <div className="flex flex-wrap gap-2 pt-1">
                {featuredMovie.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-0.5 text-[11px] font-medium text-zinc-300"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <p className="line-clamp-3 text-sm sm:text-base text-zinc-300/90 leading-relaxed max-w-xl">
                {featuredMovie.synopsis}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href={`/movies/${featuredMovie.id}`}
                  className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/30 hover:bg-amber-400 hover:scale-105 transition-all duration-200"
                >
                  <Ticket className="h-4 w-4 fill-current" />
                  Book Tickets
                </Link>

                <a
                  href="#movies-catalog"
                  className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 transition-all"
                >
                  Explore All Movies
                </a>
              </div>
            </div>

            {/* Quick Hero Carousel Indicators */}
            {movies.length > 1 && (
              <div className="mt-8 flex items-center gap-2">
                {movies.slice(0, 4).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setFeaturedIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      featuredIndex === idx ? "w-8 bg-amber-400" : "w-2 bg-zinc-700 hover:bg-zinc-500"
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. Format Badges Bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 border-amber-500/20">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-extrabold text-sm">
              IMAX
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">IMAX with Laser</h4>
              <p className="text-[11px] text-zinc-400">Next-gen crystal sharp projection</p>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 border-sky-500/20">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 font-extrabold text-sm">
              ATMOS
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Dolby Atmos</h4>
              <p className="text-[11px] text-zinc-400">360-degree spatial acoustic precision</p>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 border-rose-500/20">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 font-extrabold text-sm">
              VIP
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Luxury Recliners</h4>
              <p className="text-[11px] text-zinc-400">Heated power seats with dining</p>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-4 flex items-center gap-3.5 border-emerald-500/20">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-extrabold text-sm">
              LOCK
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Zero Double-Booking</h4>
              <p className="text-[11px] text-zinc-400">Transactional row-level seat locking</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Movie Showcase Grid */}
      <section id="movies-catalog" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2">
              <span>Experience The Big Screen</span>
              <Sparkles className="h-5 w-5 text-amber-400" />
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Select a film to view real-time showtimes and reserve your seats
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center rounded-xl bg-zinc-900/90 p-1 border border-zinc-800">
            <button
              onClick={() => setActiveTab("NOW_SHOWING")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "NOW_SHOWING"
                  ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Now Showing
            </button>
            <button
              onClick={() => setActiveTab("COMING_SOON")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "COMING_SOON"
                  ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Coming Soon
            </button>
            <button
              onClick={() => setActiveTab("ALL")}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "ALL"
                  ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All Films
            </button>
          </div>
        </div>

        {/* Movies List */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10"
              >
                {/* Poster Box */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

                  {/* Rating Tag */}
                  <div className="absolute top-3 left-3 rounded-md bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/30">
                    {movie.rating}
                  </div>

                  {/* Status Tag */}
                  <div className="absolute top-3 right-3 rounded-md bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                    {movie.status === "NOW_SHOWING" ? "Now Showing" : "Coming Soon"}
                  </div>

                  {/* Showtimes Pill */}
                  {movie.showtimesCount > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-amber-500/90 text-zinc-950 px-2.5 py-0.5 text-[10px] font-bold shadow-md">
                      <Clock className="h-3 w-3" />
                      <span>{movie.showtimesCount} Showtimes Today</span>
                    </div>
                  )}
                </div>

                {/* Details Box */}
                <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {movie.title}
                    </h3>

                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                      <span>{movie.durationMins}m</span>
                      <span>•</span>
                      <span>{movie.language}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {movie.genres.slice(0, 2).map((genre) => (
                        <span
                          key={genre}
                          className="rounded bg-zinc-800/90 px-2 py-0.5 text-[10px] text-zinc-300 font-medium"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/movies/${movie.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-2.5 text-xs font-bold text-white transition-all group-hover:bg-amber-500 group-hover:text-zinc-950"
                  >
                    <span>View Showtimes</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Luxury Cinema Locator Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/70 to-zinc-950 p-8 sm:p-12">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-400">
              Flagship Theaters
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Architectural Luxury Meets Cinema Engineering
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Explore our luxury auditoriums featuring dual 4K laser projection, private VIP lounges, heated full recliners, and in-seat beverage service.
            </p>
            <div className="pt-2">
              <Link
                href="/cinemas"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-6 py-3 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Find Theaters & Screen Formats
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
