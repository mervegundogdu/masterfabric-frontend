 "use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    // TODO: Replace with real authentication (e.g., next-auth, custom API)
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/dashboard";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-200 flex items-center justify-center p-4 font-sans selection:bg-purple-500 selection:text-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="relative flex items-center justify-center w-4 h-4">
              <div className="absolute w-full h-full bg-purple-500 rounded-full animate-ping opacity-75" />
              <div className="w-2.5 h-2.5 bg-purple-400 rounded-full shadow-[0_0_12px_#a855f7]" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wider">MASTERMIND</h1>
          </Link>
        </div>

        <div className="bg-[#111622] p-6 rounded-2xl border border-gray-800">
          <h2 className="text-lg font-bold text-white text-center mb-1">Log In</h2>
          <p className="text-xs text-gray-400 text-center mb-5">Welcome back! Sign in to your account.</p>

          {error && (
            <div className="bg-red-950/40 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg bg-[#090d16] border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm p-2.5 rounded-lg bg-[#090d16] border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 p-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:hover:bg-purple-600 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
