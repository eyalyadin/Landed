"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "התחברות נכשלה / login failed");
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-6 py-24">
      <form onSubmit={onSubmit} className="pixel-card w-full max-w-sm">
        <h1 className="text-lg font-semibold">כניסת בעל הבית</h1>
        <p className="mt-1 text-xs text-muted">Landlord login</p>

        <label className="mt-6 block text-sm font-semibold" htmlFor="password">
          סיסמה
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pixel-input mt-1"
        />

        {error && (
          <p className="mt-3 text-sm font-medium" style={{ color: "#DC2626" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || password.length === 0}
          className="pixel-btn pixel-btn-ink mt-6 w-full"
        >
          {loading ? "מתחבר…" : "כניסה"}
        </button>
      </form>
    </main>
  );
}
