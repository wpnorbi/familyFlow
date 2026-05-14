"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/iranyitopult", icon: "dashboard", label: "Irányítópult", fillActive: true },
  { href: "/etkezes", icon: "restaurant", label: "Étkezés", fillActive: false },
  { href: "/programok", icon: "event", label: "Programok", fillActive: false },
  { href: "/kamra", icon: "inventory_2", label: "Kamra", fillActive: false },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="ff-dock fixed left-0 top-0 z-50 hidden h-full w-52 flex-col rounded-r-[24px] p-4 md:flex">
      <Link
        href="/iranyitopult"
        className="mb-7 mt-1 flex w-full items-center gap-2.5 rounded-[20px] px-1.5 py-2 text-left transition-colors hover:bg-[rgba(255,252,244,0.58)]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--ff-primary-glass)] text-[var(--ff-primary)] shadow-[var(--ff-shadow-soft)]">
          <span
            className="material-symbols-outlined text-[25px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            family_home
          </span>
        </div>
        <p className="whitespace-nowrap text-[17px] font-extrabold tracking-[-0.03em] text-[var(--ff-primary)]">Family Flow</p>
      </Link>

      <div className="flex w-full flex-grow flex-col gap-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/iranyitopult");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex w-full items-center gap-3 rounded-[17px] px-3 py-3.5 text-[13px] font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-[rgba(221,219,198,0.66)] text-[var(--ff-primary)] shadow-[0_14px_26px_-22px_rgba(61,49,34,0.3)]"
                  : "text-[var(--ff-text)] hover:bg-[rgba(255,252,244,0.66)] hover:text-[var(--ff-primary)]"
              }`}
            >
              <span
                className="material-symbols-outlined text-[21px]"
                style={
                  isActive && item.fillActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="mt-auto flex w-full flex-col gap-4">
          <Link
            href="/beallitasok"
            className={`flex w-full items-center gap-3 rounded-[17px] px-3 py-3.5 text-[13px] font-semibold transition-all duration-200 ${
              pathname === "/beallitasok"
                ? "bg-[rgba(221,219,198,0.66)] text-[var(--ff-primary)] shadow-[0_14px_26px_-22px_rgba(61,49,34,0.3)]"
                : "text-[var(--ff-text)] hover:bg-[rgba(255,252,244,0.66)] hover:text-[var(--ff-primary)]"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Beállítások</span>
          </Link>

          <div className="overflow-hidden rounded-[20px] bg-[rgba(255,246,231,0.82)] px-4 pb-4 pt-3.5 shadow-[0_18px_40px_-32px_rgba(61,49,34,0.25)]">
            <p className="max-w-[150px] text-[12px] font-extrabold leading-tight text-[var(--ff-text)]">
              Tarts rendet a kamrában
            </p>
            <p className="mt-2 max-w-[150px] text-[10px] font-semibold leading-snug text-[var(--ff-text-muted)]">
              Olvasd be, követhető legyen minden.
            </p>
            <div className="my-3 flex h-[76px] items-center justify-center rounded-[16px] bg-[rgba(255,250,241,0.58)] text-[var(--ff-caramel-strong)]">
              <span className="material-symbols-outlined text-[48px]">inventory_2</span>
            </div>
            <Link
              href="/kamra"
              className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,252,244,0.82)] px-3.5 py-2 text-[10px] font-extrabold text-[var(--ff-text)]"
            >
              Megnézem
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
