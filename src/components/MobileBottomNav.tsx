"use client";

import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/iranyitopult", icon: "home",         label: "Irányítópult" },
  { href: "/etkezes",      icon: "restaurant",   label: "Étkezés"      },
  { href: "/programok",    icon: "calendar_month", label: "Programok"  },
  { href: "/kamra",        icon: "inventory_2",  label: "Kamra"        },
] as const;

function getActiveHref(pathname: string | null) {
  if (!pathname || pathname === "/") return "/iranyitopult";
  if (pathname.startsWith("/bevasarlas")) return "/etkezes";
  return NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.href ?? "/iranyitopult";
}

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname);

  return (
    <nav
      className="fixed inset-x-3 z-50 md:hidden"
      style={{ bottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto flex max-w-[430px] items-center justify-between rounded-[32px] border border-[rgba(122,94,58,0.16)] bg-[linear-gradient(180deg,rgba(255,252,246,0.98),rgba(248,240,226,0.96))] px-2 py-2 shadow-[0_28px_56px_-24px_rgba(50,34,14,0.42),0_10px_24px_-18px_rgba(122,94,58,0.24)] backdrop-blur-[28px]">
        {NAV_ITEMS.map((item) => {
          const active = item.href === activeHref;

          return (
            <button
              type="button"
              key={item.href}
              onClick={() => {
                if (item.href !== activeHref) router.push(item.href);
              }}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[22px] px-1.5 py-2.5 text-center transition-all duration-150 ${
                active
                  ? "bg-[linear-gradient(135deg,rgba(88,110,78,0.96),rgba(55,80,45,0.90))] text-(--ff-text-inverse) shadow-[0_10px_24px_-10px_rgba(55,67,50,0.38)]"
                  : "text-[rgba(80,68,50,0.72)]"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className={`text-[9px] leading-none ${active ? "font-extrabold tracking-wide" : "font-semibold"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
