"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, Calendar, Clock, MapPin, CheckCircle2, AlertCircle, ArrowRight, XCircle } from "lucide-react";

interface UserBooking {
  id: string;
  bookingReference: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  totalCents: number;
  createdAt: string;
  movie: {
    id: string;
    title: string;
    posterUrl: string;
  } | null;
  cinema: {
    name: string;
  } | null;
  auditorium: {
    name: string;
    screenType: string;
  } | null;
  showtime: {
    startTime: string;
  } | null;
  seats: string[];
  ticket: {
    ticketCode: string;
    status: string;
  } | null;
  isEligibleForCancellation: boolean;
}

export default function BookingsHistoryPage() {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "CONFIRMED" | "CANCELLED">("ALL");

  const fetchBookings = () => {
    fetch("/api/bookings/my-bookings")
      .then((res) => res.json())
      .then((data) => {
        if (data.bookings) setBookings(data.bookings);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === "ALL") return true;
    return b.status === activeFilter;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-28">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
            <Ticket className="h-7 w-7 text-amber-500" />
            <span>My Bookings & Tickets</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            View upcoming movie tickets, access digital QR passes, and manage cancellations.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center rounded-xl bg-zinc-900 p-1 border border-zinc-800 self-start sm:self-center">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeFilter === "ALL"
                ? "bg-amber-500 text-zinc-950 font-bold shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setActiveFilter("CONFIRMED")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeFilter === "CONFIRMED"
                ? "bg-amber-500 text-zinc-950 font-bold shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setActiveFilter("CANCELLED")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeFilter === "CANCELLED"
                ? "bg-amber-500 text-zinc-950 font-bold shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-4">
          <Ticket className="mx-auto h-12 w-12 text-zinc-600" />
          <h3 className="text-base font-bold text-white">No Reservations Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            You don't have any bookings matching this filter. Explore our movies catalog to reserve seats.
          </p>
          <Link
            href="/movies"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors"
          >
            Browse Now Showing Movies
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-md gap-5 transition-all hover:border-zinc-700"
            >
              {/* Movie info */}
              <div className="flex items-center gap-4 min-w-0">
                {b.movie && (
                  <img
                    src={b.movie.posterUrl}
                    alt={b.movie.title}
                    className="h-24 w-16 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : b.status === "CANCELLED"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {b.status}
                    </span>
                    <span className="font-mono text-xs text-zinc-400 font-semibold">
                      {b.bookingReference}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white truncate">{b.movie?.title}</h3>
                  <p className="text-xs text-zinc-400">
                    {b.cinema?.name} • {b.auditorium?.name}
                  </p>

                  {b.showtime && (
                    <p className="text-xs text-amber-400 font-medium">
                      {new Date(b.showtime.startTime).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-xs text-zinc-500">Seats:</span>
                    <span className="text-xs font-bold text-zinc-300">
                      {b.seats.join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0 gap-3">
                <span className="text-base font-extrabold text-white">
                  ${(b.totalCents / 100).toFixed(2)}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/tickets/${b.bookingReference}`}
                    className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 hover:text-zinc-950 transition-colors shrink-0"
                  >
                    <span>View Ticket & QR</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
