"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function OnboardingForm() {
  const [goal, setGoal] = useState("");
  const [niche, setNiche] = useState("Other");
  const [loading, setLoading] = useState(false);

  const niches = ["Education", "Finance", "Technology", "Lifestyle", "Fitness", "Other"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Save preferences to cookie to read after OAuth redirect
    document.cookie = `onboarding_goal=${encodeURIComponent(goal)}; path=/; max-age=3600`;
    document.cookie = `onboarding_niche=${encodeURIComponent(niche)}; path=/; max-age=3600`;

    // Trigger NextAuth login, redirecting back to our processing page
    await signIn("facebook", { callbackUrl: "/process-auth" });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="goal" className="text-sm font-medium text-zinc-300">
          What is your primary goal?
        </label>
        <input
          id="goal"
          type="text"
          required
          placeholder="e.g. Build an audience, Sell my course..."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="niche" className="text-sm font-medium text-zinc-300">
          What niche do you operate in?
        </label>
        <div className="relative">
          <select
            id="niche"
            required
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {niches.map((n) => (
              <option key={n} value={n} className="bg-zinc-900">
                {n}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-400">
            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !goal}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
      >
        {loading ? (
          <span className="animate-pulse">Connecting...</span>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            Connect Instagram
          </>
        )}
      </button>
    </form>
  );
}
