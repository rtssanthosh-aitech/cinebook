"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, ShieldCheck, Ticket, ArrowLeft, AlertCircle, Info, Sparkles } from "lucide-react";

interface Seat {
  id: string;
  showtimeSeatId?: string;
  rowLabel: string;
  seatNumber: number;
  seatType: "STANDARD" | "PREMIUM" | "VIP";
  isAccessible: boolean;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
  isHeldByCurrentUser: boolean;
  priceCents: number;
  holdExpiresAt: string | null;
}

interface ShowtimeSeatsData {
  showtime: {
    id: string;
    startTime: string;
    endTime: string;
    prices: {
      standardCents: number;
      premiumCents: number;
      vipCents: number;
    };
  };
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
  cinema: {
    id: string;
    name: string;
  } | null;
  seats: Seat[];
}

export default function SeatSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const showtimeId = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<ShowtimeSeatsData | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSeats = () => {
    fetch(`/api/showtimes/${showtimeId}/seats`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.seats) {
          setData(resData);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSeats();
    const interval = setInterval(fetchSeats, 10000); // Poll for live seat availability every 10s
    return () => clearInterval(interval);
  }, [showtimeId]);

  const toggleSeat = (seat: Seat) => {
    if (seat.status !== "AVAILABLE" && !seat.isHeldByCurrentUser) {
      return;
    }

    setErrorMessage(null);
    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 8) {
        setErrorMessage("Maximum 8 seats can be reserved per transaction");
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  const handleProceedToHold = async () => {
    if (selectedSeatIds.length === 0) {
      setErrorMessage("Please select at least one seat");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId,
          seatIds: selectedSeatIds,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/login?redirect=/showtimes/${showtimeId}/seats`);
          return;
        }
        setErrorMessage(json.error || "Unable to reserve chosen seats. Please refresh.");
        fetchSeats(); // Reload seats
        return;
      }

      // Success! Proceed to checkout
      router.push(`/checkout/${json.booking.bookingId}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="mt-4 text-xs text-zinc-400">Loading auditorium seating layout...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white">Showtime Not Found</h2>
        <Link href="/movies" className="mt-4 inline-block text-xs text-amber-400 hover:underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  // Calculate pricing breakdown
  const selectedSeatObjects = data.seats.filter((s) => selectedSeatIds.includes(s.id));
  const subtotalCents = selectedSeatObjects.reduce((sum, s) => sum + s.priceCents, 0);
  const serviceFeeCents = selectedSeatObjects.length > 0 ? 150 : 0;
  const taxCents = Math.round(subtotalCents * 0.08);
  const totalCents = subtotalCents + serviceFeeCents + taxCents;

  // Group seats by row
  const rowsMap: Record<string, Seat[]> = {};
  for (const seat of data.seats) {
    if (!rowsMap[seat.rowLabel]) rowsMap[seat.rowLabel] = [];
    rowsMap[seat.rowLabel].push(seat);
  }
  const sortedRowKeys = Object.keys(rowsMap).sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8 pb-32">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <Link
            href={`/movies/${data.movie?.id || ""}`}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Movie</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{data.movie?.title}</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {data.cinema?.name} • {data.auditorium?.name} ({data.auditorium?.screenType}) •{" "}
            {new Date(data.showtime.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 self-start sm:self-center">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>ACID Row Lock Active</span>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Seating Workspace */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Seat Map Column */}
        <div className="lg:col-span-2 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md flex flex-col items-center">
          {/* Cinema Screen Curve */}
          <div className="w-full max-w-lg text-center mb-10">
            <div className="cinema-screen h-5 w-full rounded-t-[100%] border-t-2 border-amber-500/60 shadow-lg shadow-amber-500/20" />
            <p className="mt-2 text-[10px] tracking-widest text-zinc-500 uppercase font-mono">
              CURVED CINEMA SCREEN
            </p>
          </div>

          {/* Seat Grid */}
          <div className="space-y-3 w-full max-w-lg overflow-x-auto py-2">
            {sortedRowKeys.map((rowLabel) => {
              const rowSeats = rowsMap[rowLabel].sort((a, b) => a.seatNumber - b.seatNumber);
              return (
                <div key={rowLabel} className="flex items-center justify-center gap-2 sm:gap-3 min-w-[340px]">
                  {/* Row Letter Left */}
                  <span className="w-4 text-xs font-bold text-zinc-500 text-center font-mono">
                    {rowLabel}
                  </span>

                  {/* Seat buttons */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id);
                      const isHeld = seat.status === "HELD" && !seat.isHeldByCurrentUser;
                      const isBooked = seat.status === "BOOKED";
                      const isBlocked = seat.status === "BLOCKED";
                      const isUnavailable = isHeld || isBooked || isBlocked;

                      let colorClasses = "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-amber-400";
                      if (seat.seatType === "PREMIUM") {
                        colorClasses = "bg-sky-950/40 border-sky-600/50 text-sky-200 hover:border-amber-400";
                      } else if (seat.seatType === "VIP") {
                        colorClasses = "bg-purple-950/40 border-purple-600/50 text-purple-200 hover:border-amber-400";
                      }

                      if (isSelected) {
                        colorClasses = "bg-amber-500 border-amber-400 text-zinc-950 font-bold scale-110 shadow-lg shadow-amber-500/30";
                      } else if (isHeld) {
                        colorClasses = "bg-orange-500/20 border-orange-500/40 text-orange-400 cursor-not-allowed opacity-60";
                      } else if (isBooked || isBlocked) {
                        colorClasses = "bg-zinc-950 border-zinc-800 text-zinc-700 cursor-not-allowed opacity-40";
                      }

                      return (
                        <button
                          key={seat.id}
                          disabled={isUnavailable}
                          onClick={() => toggleSeat(seat)}
                          title={`Seat ${seat.rowLabel}${seat.seatNumber} (${seat.seatType}) - $${(
                            seat.priceCents / 100
                          ).toFixed(2)}${isUnavailable ? ` [${seat.status}]` : ""}`}
                          className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-t-lg rounded-b-md border text-[11px] font-medium transition-all ${colorClasses}`}
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* Row Letter Right */}
                  <span className="w-4 text-xs font-bold text-zinc-500 text-center font-mono">
                    {rowLabel}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Map Legend */}
          <div className="mt-8 border-t border-zinc-800 pt-5 w-full max-w-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-t-sm border border-zinc-700 bg-zinc-800" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-t-sm border border-amber-400 bg-amber-500" />
              <span className="text-amber-400 font-semibold">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-t-sm border border-orange-500/40 bg-orange-500/20" />
              <span className="text-orange-400">Held (10m)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-t-sm border border-zinc-800 bg-zinc-950 opacity-50" />
              <span>Booked</span>
            </div>
          </div>
        </div>

        {/* Order Summary & Hold Action Sidebar */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-md space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Ticket className="h-4 w-4 text-amber-500" />
              <span>Reservation Summary</span>
            </h3>

            {/* Selected Seats Tags */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Selected Seats ({selectedSeatObjects.length})
              </label>
              {selectedSeatObjects.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No seats selected yet. Click on the map to choose.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeatObjects.map((seat) => (
                    <span
                      key={seat.id}
                      className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400"
                    >
                      <span>
                        {seat.rowLabel}
                        {seat.seatNumber}
                      </span>
                      <span className="text-[10px] text-zinc-400">(${ (seat.priceCents / 100).toFixed(2) })</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-2 border-t border-zinc-800 pt-4 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Seats Subtotal</span>
                <span className="text-white font-medium">${(subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Booking Service Fee</span>
                <span className="text-white font-medium">${(serviceFeeCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Estimated Sales Tax (8%)</span>
                <span className="text-white font-medium">${(taxCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-3 text-sm font-bold">
                <span className="text-white">Estimated Total</span>
                <span className="text-amber-400 text-lg">${(totalCents / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-950/80 p-3 text-[11px] text-zinc-400 space-y-1 border border-zinc-800">
              <p className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Clock className="h-3.5 w-3.5" />
                <span>10-Minute Hold Guarantee</span>
              </p>
              <p>When you proceed, seats are locked exclusively for 10 minutes while you complete checkout.</p>
            </div>
          </div>

          <button
            disabled={selectedSeatObjects.length === 0 || submitting}
            onClick={handleProceedToHold}
            className="w-full rounded-2xl bg-amber-500 py-3.5 text-xs font-extrabold text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
          >
            {submitting ? "Locking Seats..." : `Reserve ${selectedSeatObjects.length} Seat(s) & Checkout`}
          </button>
        </div>
      </div>
    </div>
  );
}
