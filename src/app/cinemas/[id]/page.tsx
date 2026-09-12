"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { MapPin, Phone, CheckCircle2, Clock, Ticket, ArrowLeft, Film } from "lucide-react";

interface CinemaDetail {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  amenities: string[];
}

interface Showtime {
  id: string;
  startTime: string;
  endTime: string;
  priceStandardCents: number;
  movie: {
    id: string;
    title: string;
    posterUrl: string;
    rating: string;
    durationMins: number;
  } | null;
  auditorium: {
    id: string;
    name: string;
    screenType: string;
  } | null;
}

export default function CinemaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const cinemaId = resolvedParams.id;

  const [cinema, setCinema] = useState<CinemaDetail | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cinemas/${cinemaId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.cinema) setCinema(data.cinema);
        if (data.showtimes) setShowtimes(data.showtimes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [cinemaId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="mt-4 text-xs text-zinc-400">Loading cinema schedule...</p>
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white">Cinema Not Found</h2>
        <Link href="/cinemas" className="mt-4 inline-block text-xs text-amber-400 hover:underline">
          Return to Cinemas
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      <Link
        href="/cinemas"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Theaters</span>
      </Link>

      {/* Cinema Header Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white">{cinema.name}</h1>
            <p className="text-sm text-zinc-400 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>
                {cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}
              </span>
            </p>
            {cinema.phone && (
              <p className="text-xs text-zinc-500 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{cinema.phone}</span>
              </p>
            )}
          </div>

          <div className="border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Theater Features</h4>
            <div className="flex flex-wrap gap-2">
              {cinema.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs text-zinc-300 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Screenings Scheduled */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Film className="h-5 w-5 text-amber-500" />
          <span>Scheduled Screenings Today</span>
        </h2>

        {showtimes.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center text-zinc-400 text-xs">
            No scheduled screenings for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showtimes.map((st) => {
              const timeString = new Date(st.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={st.id}
                  className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-amber-500/40 transition-colors"
                >
                  {st.movie && (
                    <img
                      src={st.movie.posterUrl}
                      alt={st.movie.title}
                      className="h-24 w-16 rounded-xl object-cover shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{st.movie?.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                        {st.auditorium?.screenType}
                      </span>
                      <span>{st.auditorium?.name}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-base font-extrabold text-amber-400">{timeString}</span>
                      <Link
                        href={`/showtimes/${st.id}/seats`}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors"
                      >
                        Book Seats
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
