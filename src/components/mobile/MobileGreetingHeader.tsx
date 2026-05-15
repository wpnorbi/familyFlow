"use client";

import Link from "next/link";

interface MobileGreetingHeaderProps {
  name?: string;
  showNotifications?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  onAvatarClick?: () => void;
  onSearchClick?: () => void;
  /** Called when the notification bell is tapped */
  onNotificationClick?: () => void;
  /** Badge count shown on the bell */
  notifCount?: number;
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Jó reggelt, ${name}`;
  if (hour < 18) return `Jó napot, ${name}`;
  return `Jó estét, ${name}`;
}

const BTN_BASE =
  "relative flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.88)] text-[var(--ff-text-muted)] shadow-[0_12px_24px_-18px_rgba(61,49,34,0.2)] backdrop-blur-[18px] transition-all active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2";

export default function MobileGreetingHeader({
  name = "Norbi",
  showNotifications = true,
  showSearch = false,
  showSettings = true,
  onAvatarClick,
  onSearchClick,
  onNotificationClick,
  notifCount = 0,
}: MobileGreetingHeaderProps) {
  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onAvatarClick}
        aria-label="Profil és beállítások megnyitása"
        className="flex items-center gap-3 rounded-[20px] px-1 py-1 text-left transition-colors active:bg-[rgba(255,248,232,0.60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
      >
        <div className="overflow-hidden rounded-full border border-white/80 shadow-[0_12px_24px_-16px_rgba(61,49,34,0.24)]">
          <div className="flex h-12 w-12 items-center justify-center bg-[linear-gradient(145deg,rgba(255,241,230,0.98),rgba(220,229,208,0.88))] text-[var(--ff-primary)]">
            <span className="text-sm font-semibold">{name.charAt(0).toUpperCase()}</span>
          </div>
        </div>
        <h1 className="text-[19px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">
          {getGreeting(name)}
        </h1>
      </button>

      <div className="flex items-center gap-2">
        {showSearch && (
          <button
            aria-label="Keresés"
            onClick={onSearchClick}
            className={BTN_BASE}
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>
        )}

        {showNotifications && (
          <button
            aria-label={notifCount > 0 ? `${notifCount} új értesítés` : "Értesítések"}
            onClick={onNotificationClick}
            className={BTN_BASE}
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {notifCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-(--ff-caramel) shadow-[0_0_0_1.5px_rgba(255,251,244,0.95)]" />
            )}
          </button>
        )}

        {showSettings && (
          <Link
            href="/beallitasok"
            aria-label="Beállítások"
            className={BTN_BASE}
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </Link>
        )}
      </div>
    </header>
  );
}
