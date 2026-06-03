"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import { useMealData } from "@/hooks/useMealData";

// ─── Data ─────────────────────────────────────────────────────────────────────

type ItemStatus = "ok" | "low" | "out";

interface IngredientItem {
  name: string;
  amount: string;
  location: string;
  emoji: string;
  status: ItemStatus;
  category?: string;
  expires?: string;
  note?: string;
}

interface RecipeIdea {
  title: string;
  badge: string;
  time: string;
  image: string;
  available: number;
  coverage: number;
}

const CATEGORY_CARDS = [
  {
    title: "Összes",
    count: 86,
    icon: "grid_view",
  },
  {
    title: "Zöldségek",
    count: 12,
    icon: "eco",
  },
  {
    title: "Gyümölcsök",
    count: 9,
    icon: "nutrition",
  },
  {
    title: "Tejtermékek",
    count: 8,
    icon: "local_drink",
  },
  {
    title: "Szárazáruk",
    count: 28,
    icon: "inventory_2",
  },
  {
    title: "Hús, hal, tojás",
    count: 7,
    icon: "set_meal",
  },
  {
    title: "Fagyasztott",
    count: 6,
    icon: "ac_unit",
  },
  {
    title: "Egyéb",
    count: 16,
    icon: "more_horiz",
  },
] as const;

const INGREDIENT_ITEMS: IngredientItem[] = [
  { name: "Paradicsom", amount: "6 db", location: "Hűtő", emoji: "🍅", status: "ok", category: "Zöldségek", expires: "jún. 4.", note: "Hűtő" },
  { name: "Tej 2,8%", amount: "1 l", location: "Hűtő", emoji: "🥛", status: "low", category: "Tejtermékek", expires: "máj. 29.", note: "Hűtő" },
  { name: "Tészta", amount: "500 g", location: "Kamra", emoji: "🍝", status: "ok", category: "Szárazáruk", expires: "júl. 12.", note: "Kamra" },
  { name: "Csirkemell", amount: "1 kg", location: "Hűtő", emoji: "🍗", status: "out", category: "Hús, hal, tojás", expires: "máj. 26.", note: "Hűtő" },
  { name: "Görög joghurt", amount: "450 g", location: "Hűtő", emoji: "🥣", status: "ok", category: "Tejtermékek", expires: "jún. 3.", note: "Hűtő" },
];

const RECIPE_IDEAS: RecipeIdea[] = [
  {
    title: "Krémes gombás tészta",
    badge: "Gyors",
    time: "25 perc",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80",
    available: 7,
    coverage: 87,
  },
  {
    title: "Zöldséges rakottas",
    badge: "Közepes",
    time: "45 perc",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    available: 6,
    coverage: 75,
  },
  {
    title: "Csirkés tészta salátával",
    badge: "Gyors",
    time: "20 perc",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    available: 6,
    coverage: 75,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ItemStatus }) {
  if (status === "ok") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#E8F0E0] px-3 py-1.5 text-[12px] font-semibold text-[#3B5C33]">
        van otthon
      </span>
    );
  }
  if (status === "low") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#FFF3E0] px-3 py-1.5 text-[12px] font-semibold text-[#B87040]">
        kevés
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#FDE8E8] px-3 py-1.5 text-[12px] font-semibold text-[#C0392B]">
      elfogyott
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function KamraDesktopView() {
  const router = useRouter();
  const { pantryItems, shoppingItems, hydrated } = useMealData();
  const [activeFilter, setActiveFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilterIndex, setStatusFilterIndex] = useState(0);
  const [categoryFilterIndex, setCategoryFilterIndex] = useState(0);
  const [sortByExpiry, setSortByExpiry] = useState(true);
  const [savedRecipeTitles, setSavedRecipeTitles] = useState<string[]>([]);

  const pantryCount = hydrated && pantryItems.length ? pantryItems.length : 86;
  const lowStockCount = hydrated && shoppingItems.length ? shoppingItems.length : 8;
  const totalCount = 132;
  const expiringCount = 5;
  const healthPercent = 78;
  const statusFilterLabels = ["Minden státusz", "Van otthon", "Kevés / elfogyott"] as const;
  const categoryFilterLabels = ["Minden kategória", ...CATEGORY_CARDS.map((item) => item.title)] as const;
  const filteredIngredients = INGREDIENT_ITEMS
    .filter((item) => {
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        [item.name, item.category, item.amount, item.note, item.location]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase());
      const matchesStatus =
        statusFilterIndex === 0 ||
        (statusFilterIndex === 1 && item.status === "ok") ||
        (statusFilterIndex === 2 && item.status !== "ok");
      const categoryLabel = categoryFilterLabels[categoryFilterIndex];
      const matchesCategory =
        categoryFilterIndex === 0 ||
        item.category === categoryLabel ||
        (categoryLabel === "Összes" && !!item.category);
      const matchesActiveCard =
        activeFilter === 0 ||
        item.category === CATEGORY_CARDS[activeFilter]?.title ||
        CATEGORY_CARDS[activeFilter]?.title === "Összes";
      return matchesSearch && matchesStatus && matchesCategory && matchesActiveCard;
    })
    .sort((a, b) => {
      if (!sortByExpiry) return a.name.localeCompare(b.name, "hu");
      return String(a.expires).localeCompare(String(b.expires), "hu");
    });

  return (
    <div className="mx-auto hidden w-full max-w-[1600px] flex-col gap-5 px-4 py-4 md:flex md:px-6 md:py-5 lg:px-8">
      <WelcomeHeader
        description="Tartsuk naprakészen a kamrát, hogy mindig könnyű legyen tervezni."
        actions={
          <>
            <button
              onClick={() => router.push("/etkezes")}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[rgba(74,67,54,0.10)] bg-[rgba(255,251,244,0.94)] px-5 text-[15px] font-semibold text-[var(--ff-text)] shadow-[0_16px_34px_-26px_rgba(61,49,34,0.26)] transition-colors hover:bg-white"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              Receptek
            </button>
            <button
              onClick={() => router.push("/beallitasok")}
              aria-label="Értesítések"
              className="ff-icon-button relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(216,224,203,0.28)]"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#e8821e] shadow-[0_0_0_1.5px_rgba(248,239,224,0.95)]" />
            </button>
            <button
              onClick={() => router.push("/beallitasok")}
              aria-label="Beállítások"
              className="ff-icon-button flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(216,224,203,0.28)]"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          </>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)_460px] gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="ff-glass-card rounded-[34px] p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-[30px] font-semibold tracking-[-0.05em] text-[var(--ff-text)]">Kamra állapota</h1>
                <div className="mt-2 flex items-center gap-3 text-[17px] text-[var(--ff-text-muted)]">
                  <span>Utolsó frissítés: ma, 07:45</span>
                  <span className="material-symbols-outlined text-[20px]">autorenew</span>
                </div>
              </div>
              <button
                onClick={() => router.refresh()}
                className="inline-flex h-12 items-center gap-3 rounded-full bg-[linear-gradient(135deg,#e89222,#d47c15)] px-8 text-[16px] font-bold text-white shadow-[0_20px_36px_-22px_rgba(212,124,21,0.58)] transition-transform hover:-translate-y-0.5"
              >
                Kamra frissítése
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>

            <div className="mt-8 grid grid-cols-[260px_repeat(4,minmax(0,1fr))] gap-6">
              <div className="flex flex-col items-center justify-center rounded-[28px] bg-[rgba(255,252,244,0.72)] px-4 py-4">
                <div
                  className="relative flex h-[180px] w-[180px] items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#6f9a63 0 ${healthPercent}%, rgba(111,154,99,0.14) ${healthPercent}% 100%)`,
                  }}
                >
                  <div className="flex h-[144px] w-[144px] flex-col items-center justify-center rounded-full bg-[rgba(255,251,244,0.98)] shadow-[inset_0_0_0_1px_rgba(111,154,99,0.08)]">
                    <p className="text-[52px] font-semibold leading-none tracking-[-0.06em] text-[var(--ff-text)]">{healthPercent}%</p>
                    <p className="mt-2 text-[15px] font-semibold text-[var(--ff-primary)]">Rendben van</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-[28px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)] px-5 py-6">
                <div>
                  <p className="text-[15px] font-semibold text-[var(--ff-text)]">Összes hozzávaló</p>
                  <p className="mt-4 text-[50px] font-semibold leading-none tracking-[-0.06em] text-[var(--ff-text)]">{pantryCount}</p>
                  <p className="mt-3 text-[15px] font-medium text-[var(--ff-text-soft)]">/ {totalCount} tétel</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(230,241,218,0.90)] text-[var(--ff-primary)]">
                  <span className="material-symbols-outlined text-[22px]">eco</span>
                </span>
              </div>

              <div className="flex items-center justify-between rounded-[28px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)] px-5 py-6">
                <div>
                  <p className="text-[15px] font-semibold text-[var(--ff-text)]">Kevés mennyiségű</p>
                  <p className="mt-4 text-[50px] font-semibold leading-none tracking-[-0.06em] text-[#e1841a]">{lowStockCount}</p>
                  <p className="mt-3 text-[15px] font-medium text-[var(--ff-text-soft)]">Figyelj rájuk</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,242,220,0.92)] text-[#e1841a]">
                  <span className="material-symbols-outlined text-[22px]">warning</span>
                </span>
              </div>

              <div className="flex items-center justify-between rounded-[28px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)] px-5 py-6">
                <div>
                  <p className="text-[15px] font-semibold text-[var(--ff-text)]">Hamarosan lejár</p>
                  <p className="mt-4 text-[50px] font-semibold leading-none tracking-[-0.06em] text-[#ec5c2f]">{expiringCount}</p>
                  <p className="mt-3 text-[15px] font-medium text-[var(--ff-text-soft)]">7 napon belül</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,236,230,0.92)] text-[#ec5c2f]">
                  <span className="material-symbols-outlined text-[22px]">schedule</span>
                </span>
              </div>

              <div className="flex items-center justify-between rounded-[28px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)] px-5 py-6">
                <div>
                  <p className="text-[15px] font-semibold text-[var(--ff-text)]">Következő frissítés</p>
                  <p className="mt-4 text-[30px] font-semibold leading-none tracking-[-0.05em] text-[var(--ff-text)]">jövő héten</p>
                  <p className="mt-3 text-[15px] font-medium text-[var(--ff-text-soft)]">május 31.</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(235,242,227,0.92)] text-[var(--ff-primary)]">
                  <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                </span>
              </div>
            </div>
          </section>

          <section className="ff-glass-card rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Kategóriák áttekintése</h2>
              <button
                onClick={() => {
                  setActiveFilter(0);
                  setCategoryFilterIndex(0);
                }}
                className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-primary)]"
              >
                Kategóriák kezelése
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
            <div className="grid grid-cols-8 gap-3">
              {CATEGORY_CARDS.map((cat, index) => (
                <button
                  key={cat.title}
                  onClick={() => setActiveFilter(index)}
                  className={`rounded-[22px] border px-4 py-4 text-left transition-all ${
                    activeFilter === index
                      ? "border-[rgba(111,154,99,0.25)] bg-[rgba(235,242,227,0.88)]"
                      : "border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)] hover:bg-[rgba(255,248,236,0.94)]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px] text-[var(--ff-primary-soft)]">{cat.icon}</span>
                  <p className="mt-3 text-[16px] font-semibold leading-tight text-[var(--ff-text)]">{cat.title}</p>
                  <p className="mt-1 text-[15px] font-medium text-[var(--ff-text-soft)]">{cat.count}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="ff-glass-card rounded-[34px] p-5">
            <div className="mb-5">
              <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Hozzávalók listája</h2>
            </div>

            <div className="mb-5 flex items-center gap-3">
              <label className="flex min-w-[400px] items-center gap-3 rounded-full border border-[rgba(74,67,54,0.10)] bg-[rgba(255,252,244,0.92)] px-5 py-3.5">
                <span className="material-symbols-outlined text-[22px] text-[var(--ff-text-soft)]">search</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Keresés hozzávalóra..."
                  className="w-full bg-transparent text-[15px] text-[var(--ff-text)] placeholder:text-[var(--ff-text-soft)] focus:outline-none"
                />
              </label>
              <div className="ml-auto flex items-center gap-3">
                {[statusFilterLabels[statusFilterIndex], categoryFilterLabels[categoryFilterIndex], sortByExpiry ? "Lejárat szerint" : "Név szerint"].map((label, index) => (
                  <button
                    key={label}
                    onClick={() => {
                      if (index === 0) setStatusFilterIndex((current) => (current + 1) % statusFilterLabels.length);
                      if (index === 1) setCategoryFilterIndex((current) => (current + 1) % categoryFilterLabels.length);
                      if (index === 2) setSortByExpiry((current) => !current);
                    }}
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-[rgba(74,67,54,0.10)] bg-[rgba(255,252,244,0.92)] px-5 text-[15px] font-semibold text-[var(--ff-text)]"
                  >
                    {label}
                    <span className="material-symbols-outlined text-[18px]">
                      {index === 2 ? "swap_vert" : "expand_more"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.82)]">
              <div className="grid grid-cols-[1.4fr_1fr_0.9fr_1.2fr_0.9fr_0.9fr] gap-4 border-b border-[rgba(74,67,54,0.08)] px-5 py-4 text-[14px] font-semibold text-[var(--ff-text-soft)]">
                <span>Hozzávaló</span>
                <span>Kategória</span>
                <span>Mennyiség</span>
                <span>Státusz</span>
                <span>Lejárat</span>
                <span>Megjegyzés</span>
              </div>
              {filteredIngredients.map((item) => (
                <div
                  key={item.name}
                  className="grid grid-cols-[1.4fr_1fr_0.9fr_1.2fr_0.9fr_0.9fr] items-center gap-4 border-b border-[rgba(74,67,54,0.06)] px-5 py-4 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[32px]">{item.emoji}</span>
                    <span className="text-[16px] font-semibold text-[var(--ff-text)]">{item.name}</span>
                  </div>
                  <span className="text-[15px] text-[var(--ff-text-muted)]">{item.category}</span>
                  <span className="text-[15px] text-[var(--ff-text-muted)]">{item.amount}</span>
                  <div className="justify-self-start">
                    <StatusBadge status={item.status} />
                  </div>
                  <span className="text-[15px] text-[var(--ff-text-muted)]">{item.expires}</span>
                  <span className="text-[15px] text-[var(--ff-text-muted)]">{item.note}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between text-[15px] font-medium text-[var(--ff-text-soft)]">
              <span>{filteredIngredients.length} tétel megjelenítve</span>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilterIndex(0);
                  setCategoryFilterIndex(0);
                  setActiveFilter(0);
                }}
                className="flex items-center gap-2 font-semibold text-[var(--ff-primary)]"
              >
                Összes megtekintése
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="ff-glass-card rounded-[34px] p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Ötletek a kamrából</h2>
              <button onClick={() => router.push("/etkezes")} className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-primary)]">
                Összes megtekintése
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
            <p className="mb-5 text-[16px] leading-relaxed text-[var(--ff-text-muted)]">
              Ezeket az ételeket a meglévő alapanyagokból készítheted el.
            </p>
            <div className="space-y-6">
              {RECIPE_IDEAS.map((idea) => (
                <div key={idea.title} className="grid grid-cols-[138px_minmax(0,1fr)_44px] items-start gap-4">
                  <div className="h-[118px] overflow-hidden rounded-[22px]">
                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${idea.image})` }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">{idea.title}</h3>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="rounded-full bg-[rgba(233,241,220,0.98)] px-3 py-1.5 text-[13px] font-semibold text-[var(--ff-primary)]">{idea.badge}</span>
                      <span className="rounded-full bg-[rgba(238,242,229,0.98)] px-3 py-1.5 text-[13px] font-semibold text-[var(--ff-text-soft)]">{idea.time}</span>
                    </div>
                    <p className="mt-4 text-[15px] font-medium text-[var(--ff-text-muted)]">{idea.available} alapanyagod van hozzá</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[rgba(111,154,99,0.14)]">
                        <div className="h-full rounded-full bg-[#6f9a63]" style={{ width: `${idea.coverage}%` }} />
                      </div>
                      <span className="text-[15px] font-semibold text-[var(--ff-text-muted)]">{idea.coverage}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setSavedRecipeTitles((current) =>
                        current.includes(idea.title) ? current.filter((title) => title !== idea.title) : [...current, idea.title],
                      )
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(74,67,54,0.10)] bg-[rgba(255,252,244,0.92)] text-[var(--ff-text-soft)]"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {savedRecipeTitles.includes(idea.title) ? "bookmark" : "bookmark_border"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push("/etkezes")}
              className="mt-8 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[rgba(226,170,93,0.38)] bg-[rgba(255,251,244,0.98)] text-[18px] font-bold text-[#de8620]"
            >
              Új receptek keresése
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </section>

          <section className="overflow-hidden rounded-[34px] border border-[rgba(74,67,54,0.08)] bg-[linear-gradient(145deg,rgba(238,244,225,0.92),rgba(250,243,228,0.90))] p-6 shadow-[0_22px_54px_-34px_rgba(61,49,34,0.24)]">
            <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Kamra tippek</h2>
            <div className="mt-6 flex items-end justify-between gap-4">
              <div className="max-w-[260px]">
                <p className="text-[16px] leading-relaxed text-[var(--ff-text-muted)]">
                  Rendszeresen frissítsd a kamrát, hogy elkerüld a felesleges vásárlást és az élelmiszer-pazarlást.
                </p>
                <button onClick={() => router.push("/beallitasok")} className="mt-8 flex items-center gap-2 text-[16px] font-semibold text-[var(--ff-primary)]">
                  További tippek megtekintése
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
              <div className="relative flex h-[190px] w-[180px] items-end justify-center">
                <span className="text-[134px] leading-none">🫙</span>
                <span className="absolute bottom-2 left-0 text-[42px]">🌶️</span>
                <span className="absolute bottom-1 right-0 text-[42px]">🌿</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
