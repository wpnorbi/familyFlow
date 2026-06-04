"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MobileGreetingHeader from "@/components/mobile/MobileGreetingHeader";

type PantryStatus = "home" | "low" | "expiring";
type CategoryId =
  | "zoldsegek"
  | "gyumolcsok"
  | "tejtermekek"
  | "szarazaruk"
  | "hus";
type FilterMode = "all" | "low" | "expiring";

interface PantryCategory {
  id: CategoryId;
  label: string;
  icon: string;
}

interface PantryItem {
  id: string;
  name: string;
  amount: string;
  icon: string;
  category: CategoryId;
  status: PantryStatus;
}

interface PantryIdea {
  id: string;
  name: string;
  image: string;
  progress: number;
}

const CATEGORIES: PantryCategory[] = [
  { id: "zoldsegek", label: "Zöldségek", icon: "grocery" },
  { id: "gyumolcsok", label: "Gyümölcsök", icon: "nutrition" },
  { id: "tejtermekek", label: "Tejtermékek", icon: "water_bottle" },
  { id: "szarazaruk", label: "Szárazáruk", icon: "deployed_code" },
  { id: "hus", label: "Hús, hal, tojás", icon: "restaurant" },
];

const PANTRY_ITEMS: PantryItem[] = [
  { id: "1", name: "Paradicsom", amount: "5 db", icon: "nutrition", category: "zoldsegek", status: "home" },
  { id: "2", name: "Tej 2,8%", amount: "1 l", icon: "water_bottle", category: "tejtermekek", status: "home" },
  { id: "3", name: "Tészta", amount: "500 g", icon: "deployed_code", category: "szarazaruk", status: "home" },
  { id: "4", name: "Csirkemell", amount: "2 db", icon: "restaurant", category: "hus", status: "low" },
  { id: "5", name: "Joghurt", amount: "1 db", icon: "water_bottle", category: "tejtermekek", status: "expiring" },
  { id: "6", name: "Paprika", amount: "3 db", icon: "grocery", category: "zoldsegek", status: "home" },
  { id: "7", name: "Alma", amount: "4 db", icon: "nutrition", category: "gyumolcsok", status: "low" },
];

const PANTRY_IDEAS: PantryIdea[] = [
  {
    id: "1",
    name: "Paradicsomos tészta",
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80",
    progress: 90,
  },
  {
    id: "2",
    name: "Tejszínes csirkés tészta",
    image:
      "https://images.unsplash.com/photo-1516100882582-96c3a05fe590?auto=format&fit=crop&w=800&q=80",
    progress: 80,
  },
  {
    id: "3",
    name: "Gyümölcsös joghurt",
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80",
    progress: 70,
  },
];

function Icon({
  name,
  className = "",
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

function StatusPill({ status }: { status: PantryStatus }) {
  if (status === "home") {
    return (
      <span className="inline-flex items-center rounded-full bg-[rgba(225,235,210,0.9)] px-3 py-1 text-[12px] font-semibold text-[var(--ff-primary)]">
        Van otthon
      </span>
    );
  }

  if (status === "low") {
    return (
      <span className="inline-flex items-center rounded-full bg-[rgba(255,240,219,0.95)] px-3 py-1 text-[12px] font-semibold text-[var(--ff-caramel-strong)]">
        Kevés
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-[rgba(255,232,226,0.95)] px-3 py-1 text-[12px] font-semibold text-[#D15F43]">
      Hamarosan elfogy
    </span>
  );
}

export default function KamraMobileView() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryId>("zoldsegek");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [query, setQuery] = useState("");
  const [showTip, setShowTip] = useState(true);

  const visibleItems = useMemo(() => {
    return PANTRY_ITEMS.filter((item) => {
      const byCategory = item.category === activeCategory;
      const byQuery =
        query.trim().length === 0 ||
        item.name.toLowerCase().includes(query.trim().toLowerCase());
      const byMode =
        filterMode === "all" ||
        (filterMode === "low" && item.status === "low") ||
        (filterMode === "expiring" && item.status === "expiring");

      return byCategory && byQuery && byMode;
    });
  }, [activeCategory, filterMode, query]);

  function cycleFilter() {
    setFilterMode((current) =>
      current === "all" ? "low" : current === "low" ? "expiring" : "all",
    );
  }

  const filterLabel =
    filterMode === "all" ? "Szűrők" : filterMode === "low" ? "Kevés" : "Lejáró";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbf7f1_0%,#f7f1e8_100%)] md:hidden">
      <main
        className="px-5"
        style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom, 0px))" }}
      >
        <MobileGreetingHeader mode="title" title="Kamra" subtitle="Alapanyagok és készlet" notifCount={1} />

        <section className="rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,246,0.96)] p-5 shadow-[0_18px_40px_-32px_rgba(61,49,34,0.24)]">
          <h2 className="text-[16px] font-semibold text-[var(--ff-text)]">Kamra állapota</h2>

          <div className="mt-5 flex gap-4">
            <div className="relative flex h-[138px] w-[138px] shrink-0 items-center justify-center">
              <svg className="absolute inset-0" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="44" stroke="#F0E7D8" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  stroke="#FF9800"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * 0.22}`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="text-center">
                <div className="text-[28px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">78%</div>
                <div className="text-[13px] text-[var(--ff-text-muted)]">tele</div>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex items-center justify-between border-b border-[rgba(170,135,84,0.14)] py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(225,235,210,0.9)] text-[var(--ff-primary)]">
                    <Icon name="shopping_basket" className="text-[18px]" />
                  </span>
                  <span className="text-[14px] text-[var(--ff-text-muted)]">Összes hozzávaló</span>
                </div>
                <span className="text-[15px] font-semibold text-[var(--ff-text)]">86 db</span>
              </div>
              <div className="flex items-center justify-between border-b border-[rgba(170,135,84,0.14)] py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,240,219,0.95)] text-[var(--ff-caramel-strong)]">
                    <Icon name="radio_button_unchecked" className="text-[18px]" />
                  </span>
                  <span className="text-[14px] text-[var(--ff-text-muted)]">Kevés</span>
                </div>
                <span className="text-[15px] font-semibold text-[var(--ff-text)]">8 db</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,232,226,0.95)] text-[#D15F43]">
                    <Icon name="calendar_today" className="text-[17px]" />
                  </span>
                  <span className="text-[14px] text-[var(--ff-text-muted)]">Hamarosan lejár</span>
                </div>
                <span className="text-[15px] font-semibold text-[var(--ff-text)]">5 db</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ffb024_0%,#ff9800_100%)] px-5 py-4 text-[18px] font-semibold text-white shadow-[0_16px_28px_-20px_rgba(255,152,0,0.75)]"
          >
            <Icon name="refresh" className="text-[22px]" />
            Kamra frissítése
          </button>
        </section>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-3 text-[14px] font-medium transition-all ${
                activeCategory === category.id
                  ? "border-[rgba(124,145,111,0.22)] bg-[rgba(225,235,210,0.95)] text-[var(--ff-primary)]"
                  : "border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,246,0.92)] text-[var(--ff-text)]"
              }`}
            >
              <Icon name={category.icon} className="text-[19px]" />
              {category.label}
            </button>
          ))}
        </div>

        <section className="mt-4 rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,246,0.96)] p-5 shadow-[0_18px_40px_-32px_rgba(61,49,34,0.22)]">
          <h2 className="text-[16px] font-semibold text-[var(--ff-text)]">Hozzávalók listája</h2>

          <div className="mt-4 flex gap-3">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-[18px] border border-[rgba(170,135,84,0.14)] bg-white/92 px-4 py-3">
              <Icon name="search" className="text-[20px] text-[var(--ff-text-muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Keresés hozzávalók között"
                className="w-full bg-transparent text-[14px] text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-text-muted)]"
              />
            </label>
            <button
              type="button"
              onClick={cycleFilter}
              className="flex shrink-0 items-center gap-2 rounded-[18px] border border-[rgba(170,135,84,0.14)] bg-white/92 px-4 py-3 text-[14px] font-medium text-[var(--ff-text)]"
            >
              <Icon name="tune" className="text-[20px]" />
              {filterLabel}
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-[22px] border border-[rgba(170,135,84,0.1)] bg-white/84">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/kamra?item=${item.id}`)}
                className="flex w-full items-center gap-3 border-b border-[rgba(170,135,84,0.1)] px-4 py-3 text-left last:border-b-0"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(170,135,84,0.12)] bg-[rgba(255,250,243,0.96)] text-[var(--ff-caramel-strong)]">
                  <Icon name={item.icon} className="text-[22px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium text-[var(--ff-text)]">{item.name}</div>
                </div>
                <div className="w-14 shrink-0 text-[15px] font-medium text-[var(--ff-text)]">{item.amount}</div>
                <StatusPill status={item.status} />
                <Icon name="chevron_right" className="text-[22px] text-[var(--ff-text-muted)]" />
              </button>
            ))}
          </div>

          <Link
            href="/kamra?view=all"
            className="mt-4 inline-flex items-center gap-1 text-[15px] font-semibold text-[var(--ff-caramel-strong)]"
          >
            Összes megtekintése
            <Icon name="chevron_right" className="text-[20px]" />
          </Link>
        </section>

        <section className="mt-4 rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,246,0.96)] p-5 shadow-[0_18px_40px_-32px_rgba(61,49,34,0.22)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-semibold text-[var(--ff-text)]">Ötletek a kamrából</h2>
            <Link
              href="/etkezes?view=ideas"
              className="inline-flex items-center gap-1 text-[15px] font-semibold text-[var(--ff-caramel-strong)]"
            >
              Összes
              <Icon name="chevron_right" className="text-[18px]" />
            </Link>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PANTRY_IDEAS.map((idea) => (
              <Link
                key={idea.id}
                href="/etkezes?view=ideas"
                className="w-[186px] shrink-0 overflow-hidden rounded-[22px] border border-[rgba(170,135,84,0.12)] bg-white/92"
              >
                <div
                  className="h-[110px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${idea.image})` }}
                />
                <div className="p-3">
                  <div className="line-clamp-2 text-[14px] font-medium leading-snug text-[var(--ff-text)]">
                    {idea.name}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full bg-[rgba(225,235,210,0.92)] px-2 py-1 text-[12px] font-semibold text-[var(--ff-primary)]">
                      {idea.progress}% kész
                    </span>
                    <div className="h-1.5 flex-1 rounded-full bg-[rgba(225,219,206,0.9)]">
                      <div
                        className="h-1.5 rounded-full bg-[var(--ff-primary)]"
                        style={{ width: `${idea.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {showTip && (
          <section className="mt-4 rounded-[28px] border border-[rgba(233,196,102,0.2)] bg-[linear-gradient(135deg,rgba(255,249,235,0.98),rgba(255,252,246,0.96))] p-5 shadow-[0_18px_40px_-32px_rgba(61,49,34,0.2)]">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[rgba(255,243,206,0.92)] text-[#F0A316]">
                <Icon name="lightbulb" className="text-[28px]" filled />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold text-[var(--ff-text)]">Tipp a tudatos tervezéshez</h3>
                <p className="mt-1 text-[14px] leading-6 text-[var(--ff-text-muted)]">
                  Frissítsd rendszeresen a kamrát, így mindig pontos ötleteket és
                  receptjavaslatokat kaphatsz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTip(false)}
                className="shrink-0 text-[var(--ff-text-muted)]"
                aria-label="Tipp bezárása"
              >
                <Icon name="close" className="text-[22px]" />
              </button>
            </div>
          </section>
        )}
      </main>

    </div>
  );
}
