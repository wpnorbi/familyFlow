"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase";

const DAYS_HU = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
const MONTHS_HU = [
  "jan.", "febr.", "már.", "ápr.", "máj.", "jún.",
  "júl.", "aug.", "szept.", "okt.", "nov.", "dec.",
];

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Jó reggelt";
  if (hour >= 12 && hour < 18) return "Jó napot";
  if (hour >= 18 && hour < 22) return "Jó estét";
  return "Jó éjszakát";
}

type WelcomeHeaderProps = {
  name?: string;
  description?: string;
  actions?: ReactNode;
};

function resolveDisplayName(input: {
  email?: string | null;
  userMetadata?: Record<string, unknown> | null;
}) {
  const metadata = input.userMetadata ?? {};
  const candidates = [
    metadata.full_name,
    metadata.display_name,
    metadata.name,
    [metadata.first_name, metadata.last_name]
      .filter((part) => typeof part === "string" && part.trim().length > 0)
      .join(" "),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  if (input.email) {
    return input.email.split("@")[0]?.trim() || "Felhasználó";
  }

  return "Felhasználó";
}

export default function WelcomeHeader({
  name = "Norbi",
  description,
  actions,
}: WelcomeHeaderProps) {
  const [displayName, setDisplayName] = useState(name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUserProfile() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || cancelled) return;

        const metadata = data.user?.user_metadata ?? null;
        const nextName = resolveDisplayName({
          email: data.user?.email,
          userMetadata: metadata,
        });
        const nextAvatar =
          typeof metadata?.avatar_url === "string"
            ? metadata.avatar_url
            : typeof metadata?.picture === "string"
              ? metadata.picture
              : null;

        if (!cancelled) {
          setDisplayName(nextName);
          setAvatarUrl(nextAvatar);
        }
      } catch {
        // Keep fallback data.
      }
    }

    void loadUserProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dayName = DAYS_HU[now.getDay()];
  const month = MONTHS_HU[now.getMonth()];
  const day = now.getDate();
  const subtitle =
    description ??
    `${dayName}, ${month} ${day}. Ma itt látod a család ritmusát, az étkezéseket és a következő lépéseket.`;

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <Link
        href="/beallitasok"
        aria-label="Profil és beállítások"
        className="flex items-center gap-3.5 rounded-[20px] px-1 py-1 transition-colors hover:bg-[rgba(255,248,232,0.60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[rgba(255,246,228,0.9)] bg-[linear-gradient(145deg,rgba(255,241,230,0.98),rgba(220,229,208,0.88))] bg-cover bg-center shadow-[0_10px_24px_-14px_rgba(61,49,34,0.32)]">
          {avatarUrl ? (
            <span
              aria-hidden
              className="block h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${avatarUrl})` }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--ff-primary)]">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-[var(--ff-text)]">
            {greeting}, {displayName}
          </h2>
          <p className="mt-1 text-sm text-[var(--ff-text-muted)]">{subtitle}</p>
        </div>
      </Link>

      {actions ? (
        <div className="hidden md:flex items-center gap-2">{actions}</div>
      ) : (
        <div className="hidden md:flex items-center gap-2">
          <button className="ff-icon-button flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(216,224,203,0.28)] cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
          <ThemeToggle
            iconOnly
            className="ff-icon-button flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(216,224,203,0.28)] cursor-pointer"
          />
          <button className="ff-icon-button flex items-center gap-2 rounded-full px-2.5 py-2 text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(216,224,203,0.28)] cursor-pointer">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ff-primary-glass)] text-[11px] font-bold text-[var(--ff-primary)]">
              FN
            </span>
            <span className="text-sm font-medium text-[var(--ff-text)]">Profil</span>
            <span className="material-symbols-outlined text-[18px] text-[var(--ff-text-soft)]">expand_more</span>
          </button>
        </div>
      )}
    </div>
  );
}
