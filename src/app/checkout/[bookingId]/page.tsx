"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, ShieldCheck, CreditCard, Lock, AlertCircle, ArrowLeft, CheckCircle2, Ticket } from "lucide-react";

interface BookingDetail {
  id: string;
  bookingReference: string;
  status: string;
  subtotalCents: number;
  serviceFeeCents: number;
  taxCents: number;
  totalCents: number;
  expiresAt: string;
}

interface CheckoutData {
  booking: BookingDetail;
  movie: {
    title: string;
    posterUrl: string;
    rating: string;
    durationMins: number;
  } | null;
  cinema: {
    name: string;
    address: string;
  } | null;
  auditorium: {
    name: string;
    screenType: string;
  } | null;
  showtime: {
    id: string;
    startTime: string;
  } | null;
  seats: Array<{
    id: string;
    rowLabel: string;
    seatNumber: number;
    seatType: string;
    priceCents: number;
  }>;
}

export default function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.bookingId;
  const router = useRouter();

  const [data, setData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");

  // Client-side generated idempotency key per checkout session
  const [idempotencyKey] = useState(() => `idemp_${Math.random().toString(36).substring(2)}_${Date.now()}`);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load booking");
        }
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        if (resData.booking.status === "CONFIRMED") {
          router.push(`/tickets/${resData.booking.bookingReference}`);
          return;
        }

        const expiryDate = new Date(resData.booking.expiresAt).getTime();
        const diffSeconds = Math.max(0, Math.floor((expiryDate - Date.now()) / 1000));
        setSecondsRemaining(diffSeconds);
      })
      .catch((err) => {
        setErrorMessage(err.message);
      })
      .finally(() => setLoading(false));
  }, [bookingId, router]);

  // Countdown clock effect
  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    if (secondsRemaining <= 0) {
      setErrorMessage("Your seat hold has expired. Please select your seats again.");
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          paymentAmountCents: data.booking.totalCents,
          paymentMethodId: "pm_card_visa_test",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Payment confirmation failed");
      }

      // Route directly to Digital Ticket
      router.push(`/tickets/${data.booking.bookingReference}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Payment processing error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="mt-4 text-xs text-zinc-400">Verifying seat hold and preparing checkout...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
        <p className="mt-2 text-xs text-zinc-400">{errorMessage}</p>
        <Link href="/movies" className="mt-4 inline-block text-xs text-amber-400 hover:underline">
          Return to Movies
        </Link>
      </div>
    );
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-28">
      {/* Back button */}
      <div>
        <Link
          href={`/showtimes/${data.showtime?.id}/seats`}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Seat Map</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl mt-2 flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-amber-500" />
          <span>Checkout & Secure Payment</span>
        </h1>
      </div>

      {/* Hold Countdown Banner */}
      <div
        className={`flex items-center justify-between rounded-2xl border p-4 backdrop-blur-md transition-colors ${
          secondsRemaining < 120
            ? "border-rose-500/50 bg-rose-500/10 text-rose-300"
            : "border-amber-500/40 bg-amber-500/10 text-amber-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 animate-pulse" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Seats Locked Exclusively For You</p>
            <p className="text-[11px] opacity-80">
              Complete your payment before time expires to secure your seats.
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-950/80 px-4 py-2 text-center font-mono text-lg font-extrabold shadow-inner border border-zinc-800">
          {timeFormatted}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
        {/* Left: Payment Form */}
        <div className="md:col-span-3 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>Payment Details (Test Gateway)</span>
            </h2>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              TEST MODE
            </span>
          </div>

          <form onSubmit={handlePayNow} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Cardholder Name</label>
              <input
                type="text"
                defaultValue="Alex Johnson"
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Card Number (Simulated)</label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 pl-10 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                />
                <CreditCard className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Expiration</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-mono text-white focus:border-amber-500 focus:outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">CVC</label>
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-mono text-white focus:border-amber-500 focus:outline-none text-center"
                />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Idempotency Key Protected</span>
              </div>
              <p>Key: <span className="font-mono text-zinc-500">{idempotencyKey.substring(0, 24)}...</span></p>
              <p>Duplicate clicks or network retries will safely return your ticket without double charging.</p>
            </div>

            <button
              type="submit"
              disabled={processing || secondsRemaining <= 0}
              className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-extrabold text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {processing
                ? "Processing Payment..."
                : `Pay $${(data.booking.totalCents / 100).toFixed(2)} & Generate Ticket`}
            </button>
          </form>
        </div>

        {/* Right: Booking Summary Order Review */}
        <div className="md:col-span-2 rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-md space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Order Summary</h3>

            {/* Movie item preview */}
            <div className="flex gap-3 border-b border-zinc-800 pb-4">
              {data.movie && (
                <img
                  src={data.movie.posterUrl}
                  alt={data.movie.title}
                  className="h-20 w-14 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white line-clamp-1">{data.movie?.title}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">{data.cinema?.name}</p>
                <p className="text-xs text-zinc-500">{data.auditorium?.name} ({data.auditorium?.screenType})</p>
                {data.showtime && (
                  <p className="text-xs text-amber-400 font-medium mt-1">
                    {new Date(data.showtime.startTime).toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Reserved Seats List */}
            <div>
              <span className="block text-xs text-zinc-400 mb-1.5 font-medium">
                Seats ({data.seats.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.seats.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-200"
                  >
                    {s.rowLabel}{s.seatNumber} ({s.seatType})
                  </span>
                ))}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 border-t border-zinc-800 pt-3 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Seats Subtotal</span>
                <span className="text-white font-medium">${(data.booking.subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Service Fee</span>
                <span className="text-white font-medium">${(data.booking.serviceFeeCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Sales Tax (8%)</span>
                <span className="text-white font-medium">${(data.booking.taxCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-3 text-sm font-extrabold">
                <span className="text-white">Total Amount</span>
                <span className="text-amber-400 text-lg">${(data.booking.totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-zinc-500 text-center font-mono">
            Booking Ref: {data.booking.bookingReference}
          </div>
        </div>
      </div>
    </div>
  );
}
