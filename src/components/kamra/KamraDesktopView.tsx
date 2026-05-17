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
}

interface RecipeIdea {
  title: string;
  meta: string;
  image: string;
}

const CATEGORY_CARDS = [
  {
    title: "Száraz",
    count: 12,
    icon: "inventory_2",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Hűtött",
    count: 7,
    icon: "kitchen",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Fagyasztó",
    count: 5,
    icon: "ac_unit",
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Fűszerek",
    count: 9,
    icon: "spa",
    image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Zöldségek",
    count: 8,
    icon: "eco",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Reggeli",
    count: 6,
    icon: "free_breakfast",
    image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=400&q=80",
  },
] as const;

const INGREDIENT_ITEMS: IngredientItem[] = [
  { name: "Csirkemell",        amount: "500 g", location: "Hűtő",            emoji: "🍗", status: "ok"  },
  { name: "Paprika",           amount: "1 kg",  location: "Zöldséges fiók",   emoji: "🫑", status: "ok"  },
  { name: "Paradicsom konzerv",amount: "500 g", location: "Kamra polc",       emoji: "🍅", status: "low" },
  { name: "Tej",               amount: "1 l",   location: "Hűtő",            emoji: "🥛", status: "ok"  },
  { name: "Liszt",             amount: "1 kg",  location: "Kamra polc",       emoji: "🌾", status: "low" },
  { name: "Olívaolaj",         amount: "500 ml",location: "Kamra polc",       emoji: "🫒", status: "out" },
];

const RECIPE_IDEAS: RecipeIdea[] = [
  {
    title: "Krémes gombás tészta",
    meta: "60 perc • 6 adag • 6 alapanyag",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Lencsefőzelék",
    meta: "35 perc • 4 adag • 8 alapanyag",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80",
  },
  {
    title: "Paradicsomos tészta",
    meta: "25 perc • 4 adag • 5 alapanyag",
    image: "https://images.unsplash.com/photo-1551183053-bf91798d6d37?auto=format&fit=crop&w=400&q=80",
  },
];

const FILTER_CHIPS = ["Összes", "Gabona", "Hűtve", "Tészta, rizs", "Állapot"] as const;

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
  const [ideaIndex, setIdeaIndex] = useState(0);

  const pantryCount = hydrated && pantryItems.length ? pantryItems.length : 9;
  const lowStockCount = hydrated && shoppingItems.length ? shoppingItems.length : 31;
  const listCount = 31;

  return (
    <div className="mx-auto hidden w-full max-w-[1600px] flex-col gap-5 px-4 py-4 md:flex md:px-6 md:py-5 lg:px-8">
      <WelcomeHeader
        description="Kövesd nyomon az otthoni készleteket, és főzz okosan abból, amid van."
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[#F7F3EE] shadow-[0_26px_70px_-34px_rgba(61,49,34,0.24)]">
        {/* Background image — right side */}
        <div
          className="absolute inset-y-0 right-0 w-[44%] bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#F7F3EE_0%,#F7F3EE_52%,rgba(247,243,238,0.5)_68%,rgba(247,243,238,0)_100%)]" />

        <div className="relative px-8 pb-7 pt-8">
          <h1 className="text-[60px] font-bold leading-none tracking-[-0.05em] text-[#1C1916]">Kamra</h1>
          <p className="mt-3 max-w-[44rem] text-[18px] text-[#786C60]">
            Kövesd nyomon az otthoni készleteket, és főzz okosan abból, amid van.
          </p>

          {/* Stat cards */}
          <div className="mt-7 grid grid-cols-4 gap-4">
            {/* Alapanyagok */}
            <div className="rounded-[24px] bg-white px-5 py-4 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[#E8EEE0]">
                  <span className="material-symbols-outlined text-[26px] text-[#3B5C33]">inventory_2</span>
                </div>
                <div>
                  <p className="text-[36px] font-bold leading-none tracking-[-0.04em] text-[#1C1916]">
                    {pantryCount}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[#1C1916]">alapanyag</p>
                  <p className="text-[12px] text-[#9A8E82]">Összesen a kamrában</p>
                </div>
              </div>
            </div>

            {/* Hamarosan elfogy */}
            <div className="rounded-[24px] bg-white px-5 py-4 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[#FFF3E0]">
                  <span className="material-symbols-outlined text-[26px] text-[#B87040]">schedule</span>
                </div>
                <div>
                  <p className="text-[36px] font-bold leading-none tracking-[-0.04em] text-[#1C1916]">
                    {lowStockCount}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-[#1C1916]">hamarosan elfogy</p>
                  <p className="text-[12px] text-[#9A8E82]">Érdemes pótolni</p>
                </div>
              </div>
            </div>

            {/* Lista */}
            <button className="rounded-[24px] bg-white px-5 py-4 text-left shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[#F5EDE3]">
                    <span className="material-symbols-outlined text-[26px] text-[#B87040]">event_note</span>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-[#1C1916]">Lista {listCount} tétel</p>
                    <p className="mt-1 text-[12px] text-[#9A8E82]">Következő</p>
                    <p className="text-[12px] text-[#9A8E82]">bevásárlásod</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[22px] text-[#9A8E82]">chevron_right</span>
              </div>
            </button>

            {/* Kamra frissítése — caramel CTA */}
            <button className="rounded-[24px] bg-[linear-gradient(135deg,#C88432,#B07228)] px-6 py-4 text-left shadow-[0_8px_24px_rgba(184,112,64,0.36)] transition-all hover:brightness-105">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[rgba(255,255,255,0.22)]">
                  <span className="material-symbols-outlined text-[24px] text-white">autorenew</span>
                </div>
                <div>
                  <p className="text-[16px] font-bold text-white">Kamra frissítése</p>
                  <p className="mt-0.5 text-[12px] text-[rgba(255,249,237,0.80)]">Utoljára frissítve: ma 18:30</p>
                </div>
              </div>
              <button className="mt-3 w-full rounded-full bg-[rgba(255,249,237,0.92)] py-2.5 text-center text-[13px] font-bold text-[#8A5A24]">
                Frissítés most
              </button>
            </button>
          </div>
        </div>
      </section>

      {/* ── Search + filter row ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex min-w-[400px] items-center gap-3 rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-5 py-3.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
          <span className="material-symbols-outlined text-[22px] text-[#9A8E82]">search</span>
          <span className="text-[15px] text-[#C0B8B0]">Keresés az alapanyagok között...</span>
        </div>
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {FILTER_CHIPS.map((chip, i) => (
            <button
              key={chip}
              onClick={() => setActiveFilter(i)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all ${
                activeFilter === i
                  ? "bg-[#3B5C33] text-white shadow-[0_4px_12px_rgba(59,92,51,0.28)]"
                  : "border border-[rgba(0,0,0,0.08)] bg-white text-[#5A4E44]"
              }`}
            >
              {chip}
              {chip === "Állapot" && (
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3-column content ─────────────────────────────────────────── */}
      <div className="grid grid-cols-[0.88fr_1fr_0.76fr] gap-5">

        {/* ── Left: Kategóriák ──────────────────────────────────────── */}
        <div className="rounded-[28px] bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-[#1C1916]">Kamra kategóriák</h2>
            <button className="flex items-center gap-1 text-[13px] font-semibold text-[#3B5C33]">
              Összes megtekintése
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {CATEGORY_CARDS.map((cat) => (
              <button
                key={cat.title}
                className="overflow-hidden rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-[#FAFAF7] text-left transition-all hover:shadow-[0_4px_14px_rgba(0,0,0,0.10)] active:scale-[0.98]"
              >
                <div
                  className="h-[110px] w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${cat.image})` }}
                />
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="material-symbols-outlined text-[16px] text-[#3B5C33]">{cat.icon}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1C1916]">{cat.title}</p>
                    <p className="text-[11px] text-[#9A8E82]">{cat.count} tétel</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Center: Alapanyagok ──────────────────────────────────── */}
        <div className="rounded-[28px] bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-[#1C1916]">Alapanyagok</h2>
            <button className="flex items-center gap-1.5 text-[13px] font-semibold text-[#9A8E82]">
              Rendezés
              <span className="material-symbols-outlined text-[18px]">sort</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {INGREDIENT_ITEMS.map((item) => (
              <div
                key={item.name}
                className="grid grid-cols-[48px_minmax(0,1fr)_96px_24px] items-center gap-3 rounded-[18px] border border-[rgba(0,0,0,0.06)] bg-[#FAFAF7] px-3.5 py-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#F5F0E8] text-[24px]">
                  {item.emoji}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-[#1C1916]">{item.name}</p>
                  <p className="mt-0.5 text-[12px] text-[#9A8E82]">
                    {item.amount} · {item.location}
                  </p>
                </div>
                <StatusBadge status={item.status} />
                <span className="material-symbols-outlined text-[18px] text-[#C0B8B0]">chevron_right</span>
              </div>
            ))}
          </div>

          <button className="mt-4 flex w-full items-center justify-center gap-2 text-[13px] font-semibold text-[#3B5C33]">
            Összes alapanyag megtekintése
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {/* ── Right: Ötletek + Okos hatás ─────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Ötletek a kamrából */}
          <div className="rounded-[28px] bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-[#1C1916]">Ötletek a kamrából</h2>
              <button className="flex items-center gap-0.5 text-[13px] font-semibold text-[#3B5C33]">
                Összes recept
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Featured recipe card */}
            <div className="mb-3 overflow-hidden rounded-[20px] border border-[rgba(0,0,0,0.06)]">
              <div className="relative h-[160px]">
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${RECIPE_IDEAS[ideaIndex].image})` }}
                />
                <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-[#5A4E44]">favorite_border</span>
                </button>
              </div>
              <div className="px-4 py-3">
                <h3 className="text-[15px] font-bold text-[#1C1916]">{RECIPE_IDEAS[ideaIndex].title}</h3>
                <p className="mt-1 text-[12px] text-[#9A8E82]">{RECIPE_IDEAS[ideaIndex].meta}</p>
                <button
                  onClick={() => router.push("/etkezes")}
                  className="mt-3 w-full rounded-full border border-[rgba(0,0,0,0.10)] bg-white py-2 text-[12px] font-semibold text-[#1C1916] hover:bg-[#F5F0E8]"
                >
                  Recept megnyitása
                </button>
              </div>
            </div>

            {/* Carousel dots */}
            <div className="flex items-center justify-center gap-1.5">
              {RECIPE_IDEAS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdeaIndex(i)}
                  className={`rounded-full transition-all ${
                    i === ideaIndex
                      ? "h-2 w-5 bg-[#3B5C33]"
                      : "h-2 w-2 bg-[#D8D0C8]"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Okos bevásárlás hatása */}
          <div className="rounded-[28px] bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#1C1916]">Okos bevásárlás hatása</h2>
              <button className="flex items-center gap-0.5 text-[13px] font-semibold text-[#3B5C33]">
                Részletek
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F0E0]">
                <span className="material-symbols-outlined text-[24px] text-[#3B5C33]">eco</span>
              </div>
              <div className="flex-1">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9A8E82]">Eddig megtakarítva</p>
                    <p className="text-[22px] font-bold text-[#1C1916]">8 450 Ft</p>
                    <p className="text-[11px] text-[#9A8E82]">az elmúlt 30 napban</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9A8E82]">Élelmiszer</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9A8E82]">mentve</p>
                    <p className="text-[18px] font-bold text-[#3B5C33]">2,3 kg</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[12px] text-[#9A8E82]">
              Nagyszerű munka! Így kevesebb étel végzi a kukában.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
