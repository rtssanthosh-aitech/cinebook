"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Filter, Clock, ArrowRight, Sparkles, Film, Calendar, MapPin, X } from "lucide-react";

interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  durationMins: number;
  rating: string;
  language: string;
  status: string;
  genres: string[];
  showtimesCount: number;
}

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface Cinema {
  id: string;
  name: string;
  city: string;
}

export default function MoviesCatalogPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-center text-zinc-500">Loading catalog...</div>}>
      <MoviesCatalogContent />
    </Suspense>
  );
}

function MoviesCatalogContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const initialGenre = searchParams.get("genre") || "";
  const initialStatus = searchParams.get("status") || "";

  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedCinema, setSelectedCinema] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || "ALL");

  useEffect(() => {
    fetchMovies();
  }, [selectedGenre, selectedLanguage, selectedCinema, selectedStatus]);

  const fetchMovies = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (selectedGenre) params.set("genre", selectedGenre);
    if (selectedLanguage) params.set("language", selectedLanguage);
    if (selectedCinema) params.set("cinemaId", selectedCinema);
    if (selectedStatus && selectedStatus !== "ALL") params.set("status", selectedStatus);

    fetch(`/api/movies?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.movies) setMovies(data.movies);
        if (data.genres) setGenres(data.genres);
        if (data.cinemas) setCinemas(data.cinemas);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovies();
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedGenre("");
    setSelectedLanguage("");
    setSelectedCinema("");
    setSelectedStatus("ALL");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedGenre !== "" ||
    selectedLanguage !== "" ||
    selectedCinema !== "" ||
    selectedStatus !== "ALL";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl flex items-center gap-3">
          <Film className="h-8 w-8 text-amber-500" />
          <span>Movie Catalog & Showtimes</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Discover current box-office features, upcoming releases, and reserve seats across premier theaters.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 sm:p-5 backdrop-blur-md space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by movie title or synopsis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 pl-10 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Multi-Filter Controls */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
          {/* Genre Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">
              Genre
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cinema Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">
              Theater / Cinema
            </label>
            <select
              value={selectedCinema}
              onChange={(e) => setSelectedCinema(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="">All Theaters</option>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase tracking-wider">
              Release Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Releases</option>
              <option value="NOW_SHOWING">Now Showing</option>
              <option value="COMING_SOON">Coming Soon</option>
            </select>
          </div>
        </div>

        {/* Active Filters Clear Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
            <span className="text-xs text-zinc-400">
              Showing <strong className="text-white">{movies.length}</strong> matching movies
            </span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/30 py-16 text-center">
          <Film className="h-12 w-12 text-zinc-600 mb-3" />
          <h3 className="text-base font-bold text-white">No Movies Found</h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm">
            Try adjusting your search query, genre, or theater filter to find available screenings.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 rounded-full bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10"
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

                <div className="absolute top-3 left-3 rounded-md bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/30">
                  {movie.rating}
                </div>

                <div className="absolute top-3 right-3 rounded-md bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                  {movie.status === "NOW_SHOWING" ? "Now Showing" : "Coming Soon"}
                </div>

                {movie.showtimesCount > 0 && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-amber-500/90 text-zinc-950 px-2.5 py-0.5 text-[10px] font-bold shadow-md">
                    <Clock className="h-3 w-3" />
                    <span>{movie.showtimesCount} Showtimes</span>
                  </div>
                )}
              </div>

              {/* Info */}
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
                    {movie.genres.map((genre) => (
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
                  <span>Select Showtime</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
