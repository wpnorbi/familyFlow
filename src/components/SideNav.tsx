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
    <nav className="ff-dock fixed left-0 top-0 z-50 hidden h-full w-24 flex-col items-center rounded-r-[var(--ff-radius-xl)] p-3 md:flex">
      <Link
        href="/iranyitopult"
        className="ff-glass-card mt-3 mb-7 flex w-full flex-col items-center gap-2 rounded-[24px] px-2 py-3 text-center transition-colors hover:bg-[rgba(255,252,244,0.92)]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--ff-radius-md)] bg-[var(--ff-primary-glass)] text-[var(--ff-primary)] shadow-[var(--ff-shadow-soft)]">
          <span
            className="material-symbols-outlined text-[28px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            family_home
          </span>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ff-text-soft)]">Family</p>
          <p className="text-[12px] font-semibold text-[var(--ff-primary)]">Flow</p>
        </div>
      </Link>

      <div className="flex w-full flex-grow flex-col items-center gap-2.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/iranyitopult");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-[22px] px-2 py-3 text-[11px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[var(--ff-primary)] text-[var(--ff-text-inverse)] shadow-[var(--ff-shadow-button)]"
                  : "text-[var(--ff-text-muted)] hover:bg-[rgba(255,252,244,0.86)] hover:text-[var(--ff-primary)]"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
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

        <div className="mt-auto flex w-full flex-col items-center gap-2 border-t border-[var(--ff-card-border)] pt-3">
          <Link
            href="/beallitasok"
            className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-[20px] py-3 text-[11px] font-medium transition-all duration-200 ${
              pathname === "/beallitasok"
                ? "bg-[var(--ff-primary)] text-[var(--ff-text-inverse)] shadow-[var(--ff-shadow-button)]"
                : "text-[var(--ff-text-muted)] hover:bg-[rgba(255,252,244,0.86)] hover:text-[var(--ff-primary)]"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Beállítások</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
