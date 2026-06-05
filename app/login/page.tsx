"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/app/i18n-context";

export default function LoginPage() {
  const { t } = useI18n();
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
      setError(t.login.error);
    }
  }

  return (
    <main
      className="flex flex-1 items-center justify-center px-6 py-24"
      style={{ background: "var(--bg)" }}
    >
      <form onSubmit={onSubmit} className="card w-full max-w-sm">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          {t.login.title}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {t.login.subtitle}
        </p>

        <label
          className="mt-6 block text-sm font-medium"
          htmlFor="password"
          style={{ color: "var(--text)" }}
        >
          {t.login.passwordLabel}
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mt-1"
        />

        {error && (
          <p className="mt-3 text-sm font-medium" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || password.length === 0}
          className="btn btn-primary mt-6 w-full"
        >
          {loading ? t.login.submitting : t.login.submit}
        </button>
      </form>
    </main>
  );
}
