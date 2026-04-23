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
    <nav className="fixed left-0 top-0 h-full flex-col p-4 z-50 bg-white/80 backdrop-blur-xl w-28 rounded-r-[32px] border-r border-stone-100 shadow-[20px_0_60px_-15px_rgba(74,93,78,0.1)] hidden md:flex items-center">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10 w-full mt-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm">
          <span
            className="material-symbols-outlined text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            family_home
          </span>
        </div>
      </div>

      {/* Nav linkek */}
      <div className="flex flex-col gap-3 flex-grow w-full items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/iranyitopult");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1.5 w-full py-4 rounded-2xl text-[11px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary-container text-on-primary-container shadow-lg"
                  : "text-stone-500 hover:text-primary-container hover:bg-stone-50"
              }`}
            >
              <span
                className="material-symbols-outlined"
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

        {/* Alsó szekció */}
        <div className="mt-auto w-full flex flex-col items-center gap-2 border-t border-stone-200/60 pt-3">
          <Link
            href="/beallitasok"
            className={`flex flex-col items-center justify-center gap-1.5 w-full py-3 rounded-2xl text-[11px] font-medium transition-all duration-200 ${
              pathname === "/beallitasok"
                ? "bg-primary-container text-on-primary-container"
                : "text-stone-500 hover:text-primary-container hover:bg-stone-50"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Beállítások</span>
          </Link>

          {/* Gyors hozzáadás — kisebb, integrált */}
          <button className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-200 mb-2 cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
