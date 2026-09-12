"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Film, Lock, Mail, User, AlertCircle, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Registration failed");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20">
            <Film className="h-6 w-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create an Account</h1>
          <p className="text-xs text-zinc-400">Join CineBook to reserve movie tickets with instant seat locking</p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 pl-10 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
              <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 pl-10 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 pl-10 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-amber-500 py-3 text-xs font-extrabold text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Creating Account..." : "Create Account"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-amber-400 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
