"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Film, Ticket, MapPin, User, LogOut, Shield, Search, Menu, X } from "lucide-react";

interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/movies?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-zinc-950 shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform duration-300">
            <Film className="h-5 w-5 fill-current" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
              Cine<span className="text-amber-400">Book</span>
            </span>
            <span className="block text-[10px] tracking-widest text-zinc-400 font-mono uppercase">
              Premier Cinema
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link
            href="/movies"
            className={`transition-colors hover:text-amber-400 ${
              pathname.startsWith("/movies") ? "text-amber-400" : "text-zinc-300"
            }`}
          >
            Movies
          </Link>
          <Link
            href="/cinemas"
            className={`transition-colors hover:text-amber-400 ${
              pathname.startsWith("/cinemas") ? "text-amber-400" : "text-zinc-300"
            }`}
          >
            Cinemas
          </Link>
          <Link
            href="/bookings"
            className={`flex items-center gap-1.5 transition-colors hover:text-amber-400 ${
              pathname.startsWith("/bookings") ? "text-amber-400" : "text-zinc-300"
            }`}
          >
            <Ticket className="h-4 w-4" />
            My Bookings
          </Link>
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors ${
                pathname.startsWith("/admin") ? "ring-1 ring-amber-400" : ""
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Search & Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search movies, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 xl:w-60 rounded-full border border-zinc-800 bg-zinc-900/90 px-4 py-1.5 pl-9 text-xs text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
            />
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-zinc-500" />
          </form>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-300">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium truncate max-w-[100px]">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="rounded-full border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-full border border-zinc-700/80 bg-zinc-800/80 px-4 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-zinc-400 hover:text-rose-400"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-zinc-950"
            >
              Login
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950 px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative pb-2">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 pl-9 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          </form>
          <div className="flex flex-col space-y-2 text-sm font-medium">
            <Link
              href="/movies"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-zinc-300 hover:text-amber-400"
            >
              Movies Catalog
            </Link>
            <Link
              href="/cinemas"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-zinc-300 hover:text-amber-400"
            >
              Cinemas & Screens
            </Link>
            <Link
              href="/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-zinc-300 hover:text-amber-400"
            >
              My Bookings & Tickets
            </Link>
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 text-amber-400 font-semibold"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
