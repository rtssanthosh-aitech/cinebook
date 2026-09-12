"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Ticket, Calendar, Clock, MapPin, CheckCircle2, Printer, ArrowLeft, AlertCircle, RefreshCw, XCircle } from "lucide-react";

interface TicketData {
  booking: {
    id: string;
    bookingReference: string;
    status: string;
    totalCents: number;
    createdAt: string;
  };
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
    endTime: string;
  } | null;
  seats: Array<{
    id: string;
    rowLabel: string;
    seatNumber: number;
    seatType: string;
    priceCents: number;
  }>;
  ticket: {
    ticketCode: string;
    qrPayload: string;
    status: string;
  } | null;
  payment: {
    status: string;
    amountCents: number;
  } | null;
}

export default function DigitalTicketPage({ params }: { params: Promise<{ reference: string }> }) {
  const resolvedParams = use(params);
  const reference = resolvedParams.reference;

  const [data, setData] = useState<TicketData | null>(null);
  const [qrSvg, setQrSvg] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTicket = () => {
    fetch(`/api/bookings/${reference}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load ticket");
        }
        return res.json();
      })
      .then(async (resData) => {
        setData(resData);
        if (resData.ticket?.qrPayload) {
          try {
            const svg = await QRCode.toString(resData.ticket.qrPayload, {
              type: "svg",
              color: { dark: "#000000", light: "#ffffff" },
              margin: 1,
              width: 160,
            });
            setQrSvg(svg);
          } catch (qrErr) {
            console.error("QR render error:", qrErr);
          }
        }
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTicket();
  }, [reference]);

  const handlePrint = () => {
    window.print();
  };

  const handleCancelBooking = async () => {
    if (!data) return;
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking? All seats will be immediately released and your payment refunded."
    );
    if (!confirmed) return;

    setCancelling(true);
    setErrorMessage(null);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/bookings/${data.booking.id}/cancel`, {
        method: "POST",
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to cancel booking");
      }

      setActionMessage("Booking successfully cancelled. Seats released and refund issued.");
      fetchTicket();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="mt-4 text-xs text-zinc-400">Rendering digital boarding pass...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
        <p className="mt-2 text-xs text-zinc-400">{errorMessage}</p>
        <Link href="/bookings" className="mt-4 inline-block text-xs text-amber-400 hover:underline">
          View My Bookings
        </Link>
      </div>
    );
  }

  const showtimeDate = data.showtime ? new Date(data.showtime.startTime) : new Date();
  const hoursUntilShowtime = (showtimeDate.getTime() - Date.now()) / (1000 * 60 * 60);
  const isEligibleForCancellation = data.booking.status === "CONFIRMED" && hoursUntilShowtime > 2;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 pb-28">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>My Bookings</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-zinc-200 hover:border-amber-500 hover:text-amber-400 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Ticket</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Luxury Boarding Pass Ticket Card */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl">
        {/* Ticket Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-6 py-4 flex items-center justify-between text-zinc-950">
          <div className="flex items-center gap-2 font-bold tracking-tight text-lg">
            <Ticket className="h-5 w-5 fill-current" />
            <span>CINEBOOK PREMIER TICKET</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${
                data.booking.status === "CONFIRMED"
                  ? "bg-zinc-950 text-amber-400"
                  : data.booking.status === "CANCELLED"
                  ? "bg-rose-950 text-rose-300"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {data.booking.status}
            </span>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            {/* Left Movie details */}
            <div className="space-y-4 flex-1">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Verified Admission
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                  {data.movie?.title}
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Rated {data.movie?.rating} • {data.movie?.durationMins} Mins •{" "}
                  {data.auditorium?.screenType}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4 text-xs">
                <div>
                  <span className="text-zinc-500 block uppercase text-[10px] font-bold">Theater</span>
                  <span className="text-white font-semibold">{data.cinema?.name}</span>
                  <span className="text-zinc-400 block text-[11px]">{data.cinema?.address}</span>
                </div>

                <div>
                  <span className="text-zinc-500 block uppercase text-[10px] font-bold">Auditorium</span>
                  <span className="text-white font-semibold">{data.auditorium?.name}</span>
                  <span className="text-amber-400 font-bold block text-[11px]">
                    {data.auditorium?.screenType}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-500 block uppercase text-[10px] font-bold">Date & Time</span>
                  <span className="text-white font-semibold">
                    {showtimeDate.toLocaleDateString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-amber-400 font-bold block text-sm">
                    {showtimeDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-500 block uppercase text-[10px] font-bold">
                    Reserved Seats ({data.seats.length})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.seats.map((s) => (
                      <span
                        key={s.id}
                        className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-extrabold text-amber-400"
                      >
                        {s.rowLabel}{s.seatNumber}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right QR Code Box */}
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-xl shrink-0 self-center sm:self-start">
              {qrSvg ? (
                <div
                  className="h-36 w-36"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <div className="h-36 w-36 flex items-center justify-center text-xs text-zinc-400 font-mono">
                  Loading QR...
                </div>
              )}
              <span className="mt-2 text-[10px] font-mono font-bold tracking-widest text-zinc-900 uppercase">
                {data.ticket?.ticketCode || data.booking.bookingReference}
              </span>
            </div>
          </div>

          {/* Ticket perforated tear line */}
          <div className="relative border-t-2 border-dashed border-zinc-800 my-4">
            <div className="absolute -left-10 -top-3 h-6 w-6 rounded-full bg-[#090a0f] border border-zinc-800" />
            <div className="absolute -right-10 -top-3 h-6 w-6 rounded-full bg-[#090a0f] border border-zinc-800" />
          </div>

          {/* Footer stats */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4 pt-2">
            <div>
              <span>Booking Reference: </span>
              <strong className="text-amber-400 font-mono text-sm">
                {data.booking.bookingReference}
              </strong>
            </div>

            <div>
              <span>Total Paid: </span>
              <strong className="text-white font-bold text-sm">
                ${(data.booking.totalCents / 100).toFixed(2)}
              </strong>
              <span className="text-emerald-400 text-[11px] ml-1.5 font-semibold">
                (Verified Succeeded)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation option for eligible bookings */}
      {isEligibleForCancellation && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div>
            <h4 className="text-xs font-bold text-white">Need to cancel this reservation?</h4>
            <p className="text-[11px] text-zinc-400">
              Eligible for 100% full refund up to 2 hours before showtime.
            </p>
          </div>
          <button
            onClick={handleCancelBooking}
            disabled={cancelling}
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50 transition-colors shrink-0"
          >
            {cancelling ? "Cancelling..." : "Cancel Booking & Refund"}
          </button>
        </div>
      )}
    </div>
  );
}
