"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/iranyitopult", icon: "home", label: "Irányítópult" },
  { href: "/etkezes", icon: "restaurant", label: "Étkezés" },
  { href: "/programok", icon: "calendar_month", label: "Programok" },
  { href: "/kamra", icon: "inventory_2", label: "Kamra" },
  { href: "/beallitasok", icon: "settings", label: "Beállítások" },
] as const;

function getActiveHref(pathname: string | null) {
  if (!pathname || pathname === "/") return "/iranyitopult";
  if (pathname.startsWith("/bevasarlas")) return "/etkezes";
  return NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.href ?? "/iranyitopult";
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname);

  return (
    <nav className="fixed inset-x-4 bottom-4 z-50 md:hidden">
      <div className="mx-auto flex max-w-[420px] items-center justify-between rounded-[32px] border border-white/90 bg-[rgba(255,251,244,0.96)] px-2 py-2.5 shadow-[0_28px_52px_-28px_rgba(61,49,34,0.32)] backdrop-blur-[24px]">
        {NAV_ITEMS.map((item) => {
          const active = item.href === activeHref;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[20px] px-2 py-2 text-center transition-all ${
                active
                  ? "bg-[linear-gradient(145deg,rgba(221,230,211,0.98),rgba(246,228,203,0.88))] text-[var(--ff-primary)] shadow-[0_12px_26px_-18px_rgba(61,49,34,0.28)]"
                  : "text-[rgba(31,33,29,0.78)]"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[9px] font-semibold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
