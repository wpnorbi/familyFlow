"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface QuickAction {
  href: string;
  icon: string;
  label: string;
}

interface MobileGreetingHeaderProps {
  name?: string;
  title?: string;
  subtitle?: string;
  mode?: "greeting" | "title";
  showNotifications?: boolean;
  showSearch?: boolean;
  showSettings?: boolean;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  notifCount?: number;
  quickActions?: QuickAction[];
}

const NAV_ITEMS = [
  { href: "/iranyitopult", icon: "dashboard", label: "Irányítópult" },
  { href: "/etkezes", icon: "restaurant", label: "Étkezés" },
  { href: "/programok", icon: "calendar_month", label: "Programok" },
  { href: "/kamra", icon: "inventory_2", label: "Kamra" },
] as const;

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { href: "/etkezes", icon: "add_circle", label: "Ebéd hozzáadása" },
  { href: "/programok?view=planner", icon: "event_upcoming", label: "Program hozzáadása" },
  { href: "/kamra", icon: "refresh", label: "Kamra frissítése" },
];

function getActiveHref(pathname: string | null) {
  if (!pathname || pathname === "/") return "/iranyitopult";
  if (pathname.startsWith("/bevasarlas")) return "/etkezes";
  return NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.href ?? "";
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Jó reggelt, ${name}`;
  if (hour < 18) return `Jó napot, ${name}`;
  return `Jó estét, ${name}`;
}

const ICON_BUTTON =
  "relative flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.88)] text-[var(--ff-text-muted)] shadow-[0_12px_24px_-18px_rgba(61,49,34,0.18)] backdrop-blur-[18px] transition-all active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2";

export default function MobileGreetingHeader({
  name = "Norbi",
  title,
  subtitle,
  mode = "greeting",
  showNotifications = true,
  showSearch = false,
  showSettings = true,
  onSearchClick,
  onNotificationClick,
  notifCount = 0,
  quickActions = DEFAULT_QUICK_ACTIONS,
}: MobileGreetingHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeHref = getActiveHref(pathname);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const headerTitle = mode === "title" ? title ?? "Family Flow" : getGreeting(name);
  const headerSubtitle =
    subtitle ?? (mode === "greeting" ? "Családi központ" : "Gyors áttekintés");

  function navigateTo(href: string) {
    setIsDrawerOpen(false);
    router.push(href);
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 -mx-4 mb-4 border-b border-[rgba(170,135,84,0.10)] bg-[rgba(250,244,234,0.84)] px-4 pb-3 backdrop-blur-[18px]"
        style={{ paddingTop: "calc(8px + env(safe-area-inset-top, 0px))" }}
      >
        <div className="mx-auto flex max-w-[430px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Menü megnyitása"
              className={ICON_BUTTON}
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            <div className="min-w-0">
              <p className="truncate text-[19px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">
                {headerTitle}
              </p>
              <p className="truncate text-[12px] text-[var(--ff-text-soft)]">{headerSubtitle}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {showSearch && (
              <button
                type="button"
                aria-label="Keresés"
                onClick={onSearchClick}
                className={ICON_BUTTON}
              >
                <span className="material-symbols-outlined text-[22px]">search</span>
              </button>
            )}

            {showNotifications && (
              <button
                type="button"
                aria-label={notifCount > 0 ? `${notifCount} új értesítés` : "Értesítések"}
                onClick={onNotificationClick}
                className={ICON_BUTTON}
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {notifCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-[var(--ff-caramel)] shadow-[0_0_0_1.5px_rgba(255,251,244,0.95)]" />
                )}
              </button>
            )}

            {showSettings && (
              <Link href="/beallitasok" aria-label="Beállítások" className={ICON_BUTTON}>
                <span className="material-symbols-outlined text-[22px]">settings</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-[90] md:hidden" role="dialog" aria-modal="true" aria-label="Navigációs menü">
          <button
            type="button"
            aria-label="Menü bezárása"
            className="absolute inset-0 bg-[rgba(26,16,6,0.38)] backdrop-blur-[3px]"
            onClick={() => setIsDrawerOpen(false)}
          />

          <aside
            className="relative h-full w-[min(86vw,360px)] overflow-y-auto rounded-r-[34px] border-r border-[rgba(170,135,84,0.14)] bg-[linear-gradient(180deg,rgba(255,252,246,0.98),rgba(246,238,226,0.96))] px-5 pb-6 shadow-[0_28px_70px_-28px_rgba(36,20,6,0.38)]"
            style={{ paddingTop: "calc(14px + env(safe-area-inset-top, 0px))" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[24px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Family Flow</p>
                <p className="mt-1 text-[13px] text-[var(--ff-text-soft)]">Családi központ</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Bezárás"
                className={ICON_BUTTON}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <nav className="mt-6 space-y-2">
              {NAV_ITEMS.map((item) => {
                const active = item.href === activeHref;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigateTo(item.href)}
                    className={`flex w-full items-center gap-3 rounded-[24px] px-4 py-3.5 text-left transition-all ${
                      active
                        ? "bg-[rgba(225,235,210,0.92)] text-[var(--ff-primary)] shadow-[0_12px_28px_-24px_rgba(55,80,45,0.32)]"
                        : "bg-[rgba(255,250,242,0.72)] text-[var(--ff-text)]"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    <span className={`text-[15px] ${active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <section className="mt-7">
              <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--ff-text-soft)]">
                Gyors műveletek
              </p>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={`${action.href}-${action.label}`}
                    type="button"
                    onClick={() => navigateTo(action.href)}
                    className={`flex w-full items-center gap-3 rounded-[22px] px-4 py-3 text-left ${
                      index === 0
                        ? "bg-[linear-gradient(135deg,#eea433,#d6841e)] text-white shadow-[0_16px_28px_-20px_rgba(210,130,33,0.54)]"
                        : "bg-[rgba(255,250,242,0.86)] text-[var(--ff-text)]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{action.icon}</span>
                    <span className="text-[14px] font-semibold">{action.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-7 rounded-[28px] border border-[rgba(170,135,84,0.14)] bg-[linear-gradient(145deg,rgba(255,248,235,0.96),rgba(243,235,221,0.94))] p-5 shadow-[0_18px_38px_-28px_rgba(61,49,34,0.22)]">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[rgba(255,239,212,0.98)] text-[var(--ff-caramel-strong)]">
                  <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Okos kamra</p>
                  <p className="mt-1 text-[13px] leading-5 text-[var(--ff-text-soft)]">Kevesebb felesleg, pontosabb bevásárlás.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateTo("/kamra")}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#eea433,#d6841e)] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_16px_28px_-20px_rgba(210,130,33,0.54)]"
              >
                Megnézem
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </section>
          </aside>
        </div>
      ) : null}
    </>
  );
}
