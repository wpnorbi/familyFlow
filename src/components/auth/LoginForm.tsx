"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/iranyitopult", [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("Nem sikerült belépni. Ellenőrizd az email címet és a jelszót.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Váratlan hiba történt belépés közben.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--ff-text-soft)]">
          Email
        </span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="ff-input w-full rounded-[20px] px-4 py-3.5 text-[15px]"
          placeholder="norbi@familyflow.app"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--ff-text-soft)]">
          Jelszó
        </span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className="ff-input w-full rounded-[20px] px-4 py-3.5 text-[15px]"
          placeholder="••••••••"
        />
      </label>

      {error ? (
        <div className="rounded-[18px] border border-[rgba(196,74,54,0.18)] bg-[rgba(255,241,236,0.9)] px-4 py-3 text-[14px] text-[rgba(181,67,48,0.92)]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="ff-button-primary flex w-full items-center justify-center rounded-full px-5 py-4 text-[15px] font-bold disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
      >
        {loading ? "Belépés..." : "Belépés"}
      </button>
    </form>
  );
}
