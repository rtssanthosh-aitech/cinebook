"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Phone, Sparkles, CheckCircle2, ChevronRight, Film } from "lucide-react";

interface Cinema {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  amenities: string[];
  auditoriumsCount: number;
  screenTypes: string[];
}

export default function CinemasDirectoryPage() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cinemas")
      .then((res) => res.json())
      .then((data) => {
        if (data.cinemas) setCinemas(data.cinemas);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl flex items-center gap-3">
          <MapPin className="h-8 w-8 text-amber-500" />
          <span>Our Premier Theaters</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Find luxury multiplex locations equipped with IMAX Laser, Dolby Atmos, and in-seat dining.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="flex flex-col justify-between rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md transition-all hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">{cinema.name}</h2>
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>
                        {cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}
                      </span>
                    </p>
                    {cinema.phone && (
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{cinema.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Formats badges */}
                <div className="flex flex-wrap gap-1.5">
                  {cinema.screenTypes.map((st) => (
                    <span
                      key={st}
                      className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-bold text-amber-400"
                    >
                      {st}
                    </span>
                  ))}
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                    {cinema.auditoriumsCount} Auditoriums
                  </span>
                </div>

                {/* Amenities checklist */}
                <div className="border-t border-zinc-800 pt-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Amenities
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                    {cinema.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <Link
                  href={`/cinemas/${cinema.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <span>View Theater Schedule</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>

                <Link
                  href={`/movies?cinemaId=${cinema.id}`}
                  className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 hover:text-zinc-950 transition-colors"
                >
                  Browse Movies Here
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
