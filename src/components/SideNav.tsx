"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/iranyitopult", icon: "dashboard",    label: "Irányítópult" },
  { href: "/etkezes",      icon: "restaurant",   label: "Étkezés"      },
  { href: "/programok",    icon: "event",         label: "Programok"    },
  { href: "/kamra",        icon: "inventory_2",   label: "Kamra"        },
] as const;

export default function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="ff-dock fixed bottom-3 left-3 top-3 z-50 hidden w-52 flex-col rounded-4xl p-4 md:flex">

      {/* ── Brand ────────────────────────────────────────────────────────── */}
      <Link
        href="/iranyitopult"
        className="mb-8 mt-1 flex w-full items-center gap-3 rounded-[20px] px-2 py-2 transition-colors hover:bg-[rgba(255,250,238,0.62)]"
      >
        {/* Icon bubble — premium sage gradient */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-[linear-gradient(148deg,rgba(210,228,188,0.98),rgba(180,208,152,0.90))] shadow-[0_8px_20px_-10px_rgba(55,80,45,0.34),inset_0_0_0_1px_rgba(90,120,65,0.12)]">
          <span
            className="material-symbols-outlined text-[24px] text-[var(--ff-primary-strong)]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            family_home
          </span>
        </div>
        <div className="min-w-0">
          <p className="whitespace-nowrap text-[16px] font-extrabold tracking-[-0.03em] text-[var(--ff-primary-strong)]">
            Family Flow
          </p>
          <p className="text-[10px] font-semibold tracking-wide text-[var(--ff-text-muted)] opacity-80">
            Családi központ
          </p>
        </div>
      </Link>

      {/* ── Main navigation ──────────────────────────────────────────────── */}
      <div className="flex w-full flex-1 flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || (pathname === "/" && item.href === "/iranyitopult");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex w-full items-center gap-3 rounded-[18px] border px-3 py-3.5 text-[13px] font-semibold transition-all duration-150 ${
                isActive
                  ? [
                      "border-[rgba(55,67,50,0.14)]",
                      "bg-[linear-gradient(135deg,rgba(88,110,78,0.22),rgba(204,220,186,0.48))]",
                      "text-[var(--ff-primary-strong)]",
                      "font-extrabold",
                      "shadow-[0_10px_28px_-16px_rgba(55,67,50,0.30),inset_0_1px_0_rgba(255,255,255,0.45)]",
                    ].join(" ")
                  : [
                      "border-transparent",
                      "text-[rgba(50,42,30,0.62)]",
                      "hover:border-[rgba(170,140,90,0.10)]",
                      "hover:bg-[rgba(255,250,238,0.68)]",
                      "hover:text-[var(--ff-primary)]",
                    ].join(" ")
              }`}
            >
              {/* Active left accent bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--ff-primary-soft)]" />
              )}

              <span
                className="material-symbols-outlined text-[20px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* ── Bottom: Okos kamra widget ─────────────────────────────────── */}
        <div className="mt-auto">
          <div className="overflow-hidden rounded-[22px] border border-[rgba(195,148,60,0.26)] bg-[linear-gradient(140deg,rgba(255,228,178,0.99),rgba(246,206,140,0.96))] shadow-[0_16px_40px_-22px_rgba(140,88,20,0.40)]">

            {/* Icon area */}
            <div className="flex items-center justify-center pb-2 pt-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[rgba(255,245,220,0.72)] shadow-[0_6px_16px_-8px_rgba(140,88,20,0.28)]">
                <span
                  className="material-symbols-outlined text-[34px] text-[var(--ff-caramel-strong)]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  inventory_2
                </span>
              </div>
            </div>

            {/* Text */}
            <div className="px-4 pb-1 text-center">
              <p className="text-[13px] font-extrabold tracking-tight text-[rgba(72,44,10,0.92)]">
                Okos kamra
              </p>
              <p className="mt-0.5 text-[10.5px] font-semibold leading-snug text-[rgba(100,62,14,0.72)]">
                Kevesebb felesleg.
              </p>
            </div>

            {/* CTA */}
            <div className="px-3 pb-3.5 pt-2.5">
              <Link
                href="/kamra"
                className="flex items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#d98a28,#c07018)] py-2.5 text-[11px] font-extrabold tracking-tight text-white shadow-[0_10px_24px_-12px_rgba(180,100,16,0.58)] transition-all hover:-translate-y-px hover:shadow-[0_14px_30px_-12px_rgba(180,100,16,0.70)]"
              >
                Megnézem
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
