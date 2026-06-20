"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Login failed");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-charcoal/10 bg-white p-8 shadow-sm">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-navy">Admin Login</h1>
        <p className="mt-1 text-sm text-charcoal/70">Manage products, photos, and details</p>
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-charcoal/20 px-4 py-3 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-navy px-4 py-3 text-sm uppercase tracking-widest text-white disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
