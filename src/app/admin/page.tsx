"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, DollarSign, Ticket, Clock, RefreshCw, AlertCircle, CheckCircle2, Film, Users, Database } from "lucide-react";

interface AdminData {
  metrics: {
    totalRevenueCents: number;
    totalBookings: number;
    confirmedBookings: number;
    activeSeatHoldsCount: number;
    totalMovies: number;
    totalCinemas: number;
  };
  recentBookings: Array<{
    id: string;
    bookingReference: string;
    customerName: string;
    customerEmail: string;
    movieTitle: string;
    totalCents: number;
    status: string;
    createdAt: string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    ipAddress: string | null;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMetrics = () => {
    fetch("/api/admin/metrics")
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to fetch admin data");
        }
        return res.json();
      })
      .then((resData) => setData(resData))
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleTriggerReleaseHolds = async () => {
    setReleasing(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/cron/release-holds", {
        method: "POST",
        headers: {
          Authorization: "Bearer cinebook_cron_secret_auth_token_for_maintenance_jobs",
        },
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Release holds failed");

      setStatusMessage(
        `Job succeeded: Released ${resJson.releasedSeatsCount} expired seats and updated ${resJson.expiredBookingsCount} expired bookings.`
      );
      fetchMetrics();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to trigger hold release");
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="mt-4 text-xs text-zinc-400">Loading admin operations & metrics...</p>
      </div>
    );
  }

  if (errorMessage && !data) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
        <Shield className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-zinc-400">{errorMessage}</p>
        <p className="text-xs text-zinc-500">Sign in with an Admin account (e.g. admin@cinebook.com)</p>
        <Link
          href="/auth/login"
          className="inline-block rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-zinc-950"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  const metrics = data?.metrics;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-amber-500" />
            <span>Admin Operations & Telemetry</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Real-time box office revenue, transactional lock monitoring, and system audit logs.
          </p>
        </div>

        {/* Action Button: Trigger Cron Hold Release */}
        <button
          onClick={handleTriggerReleaseHolds}
          disabled={releasing}
          className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors self-start sm:self-center"
        >
          <RefreshCw className={`h-4 w-4 ${releasing ? "animate-spin" : ""}`} />
          <span>{releasing ? "Evaluating Holds..." : "Trigger Expired Hold Release"}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Box Office</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">
            ${((metrics?.totalRevenueCents || 0) / 100).toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-400">Verified payment settlements</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed Tickets</span>
            <Ticket className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{metrics?.confirmedBookings || 0}</p>
          <p className="text-[11px] text-zinc-400">Out of {metrics?.totalBookings || 0} total reservations</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Seat Holds</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{metrics?.activeSeatHoldsCount || 0}</p>
          <p className="text-[11px] text-amber-400">Locked in 10-minute checkout window</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Theaters & Films</span>
            <Film className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">
            {metrics?.totalMovies || 0} Films
          </p>
          <p className="text-[11px] text-zinc-400">{metrics?.totalCinemas || 0} Flagship Multiplexes</p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Ticket className="h-4 w-4 text-amber-400" />
          <span>Recent Customer Bookings</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Movie</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {data?.recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-amber-400">
                    <Link href={`/tickets/${b.bookingReference}`} className="hover:underline">
                      {b.bookingReference}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-zinc-200">
                    <div className="font-medium">{b.customerName}</div>
                    <div className="text-[11px] text-zinc-500">{b.customerEmail}</div>
                  </td>
                  <td className="py-3 px-3 text-zinc-300 font-medium">{b.movieTitle}</td>
                  <td className="py-3 px-3 font-bold text-white">${(b.totalCents / 100).toFixed(2)}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : b.status === "CANCELLED"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-zinc-500">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="h-4 w-4 text-sky-400" />
          <span>Security Audit Trail</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {data?.auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-zinc-200">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">
                    {log.entityType} ({log.entityId || "N/A"})
                  </td>
                  <td className="py-3 px-3 font-mono text-zinc-500 text-[11px]">
                    {log.ipAddress || "127.0.0.1"}
                  </td>
                  <td className="py-3 px-3 text-zinc-500">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
