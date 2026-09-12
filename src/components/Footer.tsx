import Link from "next/link";
import { Film, ShieldCheck, CreditCard, Clock, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-zinc-900 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-zinc-950 font-bold">
                <Film className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Cine<span className="text-amber-400">Book</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Next-generation cinema ticketing system. Experience blockbusters with Dolby Atmos, IMAX Laser, and luxury recliner seating.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Built for High Concurrency on Vercel</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Explore</h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <Link href="/movies" className="hover:text-amber-400 transition-colors">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link href="/movies?status=COMING_SOON" className="hover:text-amber-400 transition-colors">
                  Coming Soon
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-amber-400 transition-colors">
                  Flagship Theaters
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-amber-400 transition-colors">
                  Ticket Retrieval
                </Link>
              </li>
            </ul>
          </div>

          {/* Cinema Formats */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Experiences</h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">IMAX</span>
                <span>Laser 4K Projection</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-sky-400">ATMOS</span>
                <span>Spatial 360 Audio</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">VIP</span>
                <span>Heated Power Recliners</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">DINING</span>
                <span>In-Seat Chef Delivery</span>
              </li>
            </ul>
          </div>

          {/* Guarantees */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Security & Guarantees</h4>
            <ul className="mt-4 space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Zero Duplicate Seat Bookings</span>
              </li>
              <li className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-sky-400" />
                <span>PCI Compliant Test Payments</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>10-Minute Lock Protection</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} CineBook Inc. Production Ready Cinema Ticketing.</p>
          <div className="flex items-center gap-4">
            <span className="text-zinc-600">PostgreSQL (Neon) • Drizzle ORM • Next.js App Router</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
