"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGreetingHeader from "@/components/mobile/MobileGreetingHeader";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { getBatchesForDate } from "@/lib/etkezes-data";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import type { MealBatch, Recipe, WeekDay } from "@/types/etkezes";

interface NextMealData {
  recipe: Recipe;
  batch: MealBatch;
  nextEatDate: string;
  isCookDay: boolean;
}

interface Props {
  nextMealData: NextMealData | null;
  weekDays: WeekDay[];
  batches: MealBatch[];
  shoppingItems: string[];
  pantryItems: string[];
  catalog: Recipe[];
  onAddMeal: () => void;
  onStartCooking: (recipe: Recipe) => void;
  onViewRecipe: (recipe: Recipe) => void;
  onGenerateIdeas: () => void;
}

type MobileScreen = "landing" | "chooser" | "ideas";
type TimeChoice = 15 | 30 | 45 | "mind";
type DayChoice = 1 | 2 | 3 | 7;
type StyleChoice =
  | "Gyors vacsora"
  | "Gyerekbarát"
  | "Kamrából"
  | "30 perc alatt"
  | "2 napra"
  | "Egyszerű"
  | "Tészta"
  | "Leves";
type FilterChoice = "Összes" | "Gyors" | "Gyerekbarát" | "Kamra";
const LANDING_HERO_IMAGE = "/images/dashboard/hero-kitchen.jpg";

const STYLE_OPTIONS: Array<{
  label: StyleChoice;
  icon: string;
  tone: string;
}> = [
  { label: "Gyors vacsora", icon: "bolt", tone: "bg-[linear-gradient(145deg,rgba(238,243,231,0.98),rgba(221,230,211,0.92))] text-[var(--ff-primary)] border-[rgba(94,113,87,0.18)]" },
  { label: "Gyerekbarát", icon: "favorite", tone: "bg-[linear-gradient(145deg,rgba(255,240,227,0.98),rgba(248,220,198,0.92))] text-[var(--ff-caramel-strong)] border-[rgba(230,168,121,0.18)]" },
  { label: "Kamrából", icon: "kitchen", tone: "bg-[linear-gradient(145deg,rgba(255,249,237,0.98),rgba(246,228,203,0.92))] text-[var(--ff-caramel-strong)] border-[rgba(185,130,71,0.18)]" },
  { label: "30 perc alatt", icon: "timer", tone: "bg-[linear-gradient(145deg,rgba(244,249,239,0.98),rgba(221,230,211,0.88))] text-[var(--ff-primary)] border-[rgba(124,145,111,0.16)]" },
  { label: "2 napra", icon: "history_2", tone: "bg-[linear-gradient(145deg,rgba(244,249,239,0.98),rgba(238,243,231,0.9))] text-[var(--ff-primary)] border-[rgba(124,145,111,0.16)]" },
  { label: "Egyszerű", icon: "home", tone: "bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(246,235,216,0.9))] text-[var(--ff-text)] border-[rgba(74,67,54,0.12)]" },
  { label: "Tészta", icon: "ramen_dining", tone: "bg-[linear-gradient(145deg,rgba(255,240,227,0.98),rgba(255,249,237,0.92))] text-[var(--ff-caramel-strong)] border-[rgba(230,168,121,0.18)]" },
  { label: "Leves", icon: "soup_kitchen", tone: "bg-[linear-gradient(145deg,rgba(255,249,237,0.98),rgba(246,228,203,0.92))] text-[var(--ff-caramel-strong)] border-[rgba(185,130,71,0.18)]" },
];

function matchesFilter(recipe: Recipe, filter: FilterChoice, pantryItems: string[]) {
  if (filter === "Összes") return true;
  if (filter === "Gyors") return recipe.duration <= 30 || (recipe.tags ?? []).includes("gyors");
  if (filter === "Gyerekbarát") return (recipe.tags ?? []).includes("gyerekbarát");
  if (filter === "Kamra") {
    const match = rankRecipesForPantry([recipe], pantryItems)[0];
    return (match?.matchedIngredients.length ?? 0) > 0 || recipe.source === "user-import";
  }
  return true;
}

function applyStyleRanking(recipes: Recipe[], style: StyleChoice, pantryItems: string[]) {
  const rankedByPantry = rankRecipesForPantry(recipes, pantryItems);

  if (style === "Kamrából") {
    return rankedByPantry.map((item) => item.recipe);
  }

  const ordered = [...recipes].sort((a, b) => {
    const aTags = a.tags ?? [];
    const bTags = b.tags ?? [];
    const scoreRecipe = (recipe: Recipe, tags: string[]) => {
      let score = 0;
      if (style === "Gyors vacsora" && (recipe.duration <= 30 || tags.includes("gyors"))) score += 120;
      if (style === "Gyerekbarát" && tags.includes("gyerekbarát")) score += 140;
      if (style === "30 perc alatt" && recipe.duration <= 30) score += 120;
      if (style === "2 napra" && (tags.includes("2 napra elég") || recipe.servings && recipe.servings >= 4)) score += 110;
      if (style === "Egyszerű" && (recipe.duration <= 30 || tags.includes("gyors") || tags.includes("család"))) score += 100;
      if (style === "Tészta" && (recipe.category.toLowerCase().includes("tészta") || recipe.name.toLowerCase().includes("tészta"))) score += 130;
      if (style === "Leves" && recipe.category.toLowerCase().includes("leves")) score += 130;
      if (recipe.source === "user-import") score += 40;
      return score;
    };

    return scoreRecipe(b, bTags) - scoreRecipe(a, aTags) || a.duration - b.duration || a.name.localeCompare(b.name, "hu");
  });

  return ordered;
}

function MobileRecipeCard({
  recipe,
  onViewRecipe,
}: {
  recipe: Recipe;
  onViewRecipe: (recipe: Recipe) => void;
}) {
  const meta = [
    { icon: "schedule", label: `${recipe.duration} perc` },
    ...(recipe.tags ?? [])
      .filter((tag) => ["gyerekbarát", "gyors", "2 napra elég", "kamrabarát"].includes(tag))
      .slice(0, 2)
      .map((tag) => ({
        icon: tag === "2 napra elég" ? "calendar_month" : tag === "kamrabarát" ? "eco" : "sentiment_satisfied",
        label: tag === "2 napra elég" ? "2 napra" : tag === "kamrabarát" ? "Kamra" : "Gyerekbarát",
      })),
  ];

  return (
    <button
      onClick={() => onViewRecipe(recipe)}
      className="flex items-center gap-4 rounded-[28px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(255,248,235,0.92))] p-3 text-left shadow-[0_22px_40px_-28px_rgba(61,49,34,0.2)]"
    >
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[22px]">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
        {recipe.sourceName && (
          <div className="absolute left-2 top-2 rounded-full bg-[rgba(255,249,237,0.92)] px-2 py-0.5 text-[9px] font-semibold text-[var(--ff-caramel-strong)]">
            {recipe.sourceName}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-2 text-[16px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ff-text)]">{recipe.name}</h4>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ff-text-soft)]">
            <span className="material-symbols-outlined text-[18px]">bookmark</span>
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {meta.map((item, index) => (
            <span key={`${recipe.id}-${item.icon}-${item.label}-${index}`} className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ff-text-muted)]">
              <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

export default function EtkezesMobileView({
  weekDays,
  batches,
  shoppingItems,
  pantryItems,
  catalog,
  onAddMeal,
  onViewRecipe,
}: Props) {
  const [screen, setScreen] = useState<MobileScreen>("landing");
  const [days, setDays] = useState<DayChoice>(2);
  const [time, setTime] = useState<TimeChoice>(30);
  const [style, setStyle] = useState<StyleChoice>("Gyerekbarát");
  const [filter, setFilter] = useState<FilterChoice>("Összes");

  const plannedDaysCount = useMemo(
    () => weekDays.filter((day) => getBatchesForDate(batches, day.dateKey).length > 0).length,
    [batches, weekDays],
  );

  const suggestedRecipes = useMemo(() => {
    const base = catalog.length ? catalog : [];
    const timeFiltered = base.filter((recipe) => time === "mind" || recipe.duration <= time);
    const ranked = applyStyleRanking(timeFiltered, style, pantryItems);
    return ranked.filter((recipe) => matchesFilter(recipe, filter, pantryItems)).slice(0, 12);
  }, [catalog, filter, pantryItems, style, time]);

  const landingRecipes = suggestedRecipes.slice(0, 4);
  const weeklyProgressWidth = `${Math.max((plannedDaysCount / 7) * 100, plannedDaysCount > 0 ? 16 : 0)}%`;
  const shoppingSummary =
    shoppingItems.length > 0 ? "Okos lista, kevesebb felesleg" : "Már majdnem minden megvan";
  const pantrySummary = pantryItems.length > 0 ? "Használd, amid van otthon" : "Adj hozzá pár alapanyagot";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--ff-bg)] md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,249,237,0.95),transparent_28%),radial-gradient(circle_at_top_right,rgba(238,243,231,0.82),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,240,227,0.72),transparent_24%)]" />

      <main className="relative flex min-h-screen flex-col px-4 pb-28 pt-5">
        {screen === "landing" && (
          <>
            <MobileGreetingHeader />

            <section className="relative overflow-hidden rounded-[36px] border border-white/72 bg-[linear-gradient(145deg,rgba(255,250,240,0.96),rgba(246,228,203,0.78))] p-4 text-[var(--ff-text-inverse)] shadow-[0_28px_60px_-30px_rgba(61,49,34,0.36)]">
              <div className="absolute inset-0">
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${LANDING_HERO_IMAGE})` }}
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,22,14,0.24),rgba(31,22,14,0.58))]" />
              <div className="relative">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-[rgba(255,248,238,0.98)] [text-shadow:0_1px_10px_rgba(26,18,12,0.28)]">
                  <span className="material-symbols-outlined text-[17px] text-[rgba(244,188,95,0.98)]">wb_twilight</span>
                  Mai vacsora
                </p>
                <h2 className="mt-4 max-w-[12rem] text-[32px] font-semibold leading-[1.02] tracking-[-0.04em] text-[rgba(255,251,245,1)] [text-shadow:0_2px_14px_rgba(26,18,12,0.34)]">Mit főzzünk ma?</h2>
                <p className="mt-2 max-w-[13rem] text-[15px] leading-snug text-[rgba(255,244,230,0.98)] [text-shadow:0_1px_12px_rgba(26,18,12,0.32)]">
                  Pár gyors döntés, és mutatjuk az ötleteket.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    { icon: "calendar_month", label: "2 napra" },
                    { icon: "schedule", label: "30 perc" },
                    { icon: "sentiment_satisfied", label: "Gyerekbarát" },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className="flex items-center justify-center gap-2 rounded-full border border-white/28 bg-[rgba(255,249,237,0.94)] px-2.5 py-2.5 text-[11px] font-medium text-[var(--ff-text)] shadow-[0_14px_20px_-18px_rgba(61,49,34,0.28)]"
                    >
                      <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setScreen("chooser")}
                  className="mt-5 flex w-full items-center justify-between rounded-[999px] bg-[linear-gradient(135deg,#dc994e,#c88432)] px-5 py-4 text-[var(--ff-text-inverse)] shadow-[0_20px_36px_-18px_rgba(185,130,71,0.48)]"
                >
                  <span className="flex-1 pl-3 text-center text-[18px] font-semibold tracking-[-0.02em]">Kaja kiválasztása</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#c68437] shadow-[0_12px_22px_-16px_rgba(61,49,34,0.24)]">
                    <span className="material-symbols-outlined text-[21px]">arrow_forward</span>
                  </span>
                </button>
              </div>
            </section>

            <section className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-[26px] border border-white/78 bg-[linear-gradient(145deg,rgba(234,244,226,0.98),rgba(206,225,190,0.9))] p-3.5 shadow-[0_22px_40px_-28px_rgba(61,49,34,0.22)]">
                <div className="flex h-full min-h-[130px] flex-col justify-between gap-3">
                  <div>
                    <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-[var(--ff-text)]">Heti terved</h3>
                    <p className="mt-3 text-[17px] font-semibold text-[var(--ff-primary)]">{plannedDaysCount}/7 nap</p>
                    <p className="mt-1 text-[11px] leading-snug text-[var(--ff-text-muted)]">
                      {plannedDaysCount > 0 ? "Szuperül haladsz!" : "Kezdjük el együtt."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-2 flex-1 rounded-full bg-[rgba(61,49,34,0.08)]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(135deg,var(--ff-primary-soft),var(--ff-primary))]"
                        style={{ width: weeklyProgressWidth }}
                      />
                    </div>
                    <button
                      onClick={() => setScreen("chooser")}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,249,237,0.92)] text-[var(--ff-primary)] shadow-[0_10px_18px_-16px_rgba(61,49,34,0.28)]"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>

              <Link href="/bevasarlas" className="rounded-[26px] border border-white/78 bg-[linear-gradient(145deg,rgba(236,245,228,0.98),rgba(214,230,199,0.9))] p-3.5 shadow-[0_22px_40px_-28px_rgba(61,49,34,0.22)]">
                <div className="flex h-full min-h-[130px] flex-col justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[rgba(197,220,179,0.98)] text-[var(--ff-primary)] shadow-[0_10px_18px_-16px_rgba(61,49,34,0.22)]">
                    <span className="material-symbols-outlined text-[20px]">shopping_basket</span>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-[var(--ff-text)]">Bevásárlás</h3>
                    <p className="mt-2 text-[11px] leading-snug text-[var(--ff-text-muted)]">{shoppingSummary}</p>
                  </div>
                  <div className="flex justify-end">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,249,237,0.92)] text-[var(--ff-primary)] shadow-[0_10px_18px_-16px_rgba(61,49,34,0.28)]">
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </Link>

              <button
                onClick={() => setScreen("chooser")}
                className="rounded-[26px] border border-white/78 bg-[linear-gradient(145deg,rgba(255,245,233,0.98),rgba(248,222,194,0.92))] p-3.5 text-left shadow-[0_22px_40px_-28px_rgba(61,49,34,0.22)]"
              >
                <div className="flex h-full min-h-[130px] flex-col justify-between gap-3">
                  <div className="relative h-12 w-16 overflow-hidden rounded-[16px] bg-[linear-gradient(145deg,rgba(255,249,237,0.96),rgba(246,228,203,0.82))]">
                    <div className="absolute left-1 top-3 h-6 w-6 rounded-full bg-[rgba(246,228,203,0.96)]" />
                    <div className="absolute left-5 top-1 h-10 w-10 rounded-full bg-[rgba(255,249,237,0.98)]" />
                    <div className="absolute left-9 top-4 h-6 w-6 rounded-full bg-[rgba(230,168,121,0.22)]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-[var(--ff-text)]">Kamra ötletek</h3>
                    <p className="mt-2 text-[11px] leading-snug text-[var(--ff-text-muted)]">{pantrySummary}</p>
                  </div>
                  <div className="flex justify-end">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,249,237,0.92)] text-[var(--ff-primary)] shadow-[0_10px_18px_-16px_rgba(61,49,34,0.28)]">
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </button>
            </section>

            <section className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Mai ötletek</h3>
                <button
                  onClick={() => setScreen("ideas")}
                  className="flex items-center gap-1 text-[13px] font-medium text-[var(--ff-text-muted)]"
                >
                  Összes megtekintése
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {landingRecipes.length > 0 ? (
                  landingRecipes.map((recipe) => (
                    <MobileRecipeCard key={recipe.id} recipe={recipe} onViewRecipe={onViewRecipe} />
                  ))
                ) : (
                  <div className="ff-glass-card rounded-[28px] px-5 py-8 text-center">
                    <p className="text-sm text-[var(--ff-text-muted)]">Még nincs megjeleníthető ötlet.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {screen === "chooser" && (
          <>
            <header className="flex items-center justify-between gap-3 pb-4">
              <button
                onClick={() => setScreen("landing")}
                className="ff-icon-button flex h-11 w-11 items-center justify-center rounded-full text-[var(--ff-text-muted)]"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Gyors választás</span>
              <div className="h-11 w-11" />
            </header>

            <section className="ff-glass-card relative overflow-hidden rounded-[36px] px-5 py-6 text-center">
              <div className="absolute left-1/2 top-5 h-28 w-28 -translate-x-1/2 rounded-[34px] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.7),transparent_35%),linear-gradient(145deg,rgba(124,145,111,0.9),rgba(55,67,50,0.88))] shadow-[0_24px_50px_-24px_rgba(55,67,50,0.55)]" />
              <div className="absolute left-1/2 top-14 h-24 w-24 -translate-x-1/2 rounded-[32px] bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.24),transparent_42%),linear-gradient(145deg,rgba(221,230,211,0.5),rgba(255,249,237,0.16))] blur-[2px]" />
              <div className="relative pt-32">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Szia, Anna!</p>
                <h2 className="mt-2 text-[30px] font-semibold leading-[1.04] text-[var(--ff-text)]">Mit főzzünk ma?</h2>
              </div>
            </section>

            <section className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {STYLE_OPTIONS.map((option) => {
                  const selected = style === option.label;
                  return (
                    <button
                      key={option.label}
                      onClick={() => {
                        setStyle(option.label);
                        if (option.label === "30 perc alatt") setTime(30);
                        if (option.label === "2 napra") setDays(2);
                      }}
                      className={`relative min-h-[112px] rounded-[28px] border p-4 text-left shadow-[0_14px_30px_-24px_rgba(61,49,34,0.28)] transition-all ${option.tone} ${selected ? "ring-2 ring-white/60 shadow-[0_18px_34px_-20px_rgba(61,49,34,0.34)]" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                        {selected && (
                          <span className="rounded-full bg-[rgba(255,255,255,0.72)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                            Aktív
                          </span>
                        )}
                      </div>
                      <p className="mt-8 text-[15px] font-semibold leading-tight">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-4 grid grid-cols-2 gap-3">
              <div className="ff-glass-card rounded-[26px] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Hány napra?</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: "Ma", value: 1 as DayChoice },
                    { label: "2 napra", value: 2 as DayChoice },
                    { label: "3 napra", value: 3 as DayChoice },
                    { label: "Egész hétre", value: 7 as DayChoice },
                  ].map((option) => (
                    <button
                      key={option.label}
                      onClick={() => setDays(option.value)}
                      className={`rounded-[18px] px-3 py-3 text-[12px] font-semibold transition-all ${
                        days === option.value
                          ? "bg-[linear-gradient(145deg,rgba(221,230,211,0.98),rgba(238,243,231,0.92))] text-[var(--ff-primary)]"
                          : "bg-[rgba(255,252,244,0.78)] text-[var(--ff-text-muted)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ff-glass-card rounded-[26px] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Mennyi idő?</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: "15 perc", value: 15 as TimeChoice },
                    { label: "30 perc", value: 30 as TimeChoice },
                    { label: "45+ perc", value: 45 as TimeChoice },
                    { label: "Mindegy", value: "mind" as TimeChoice },
                  ].map((option) => (
                    <button
                      key={option.label}
                      onClick={() => setTime(option.value)}
                      className={`rounded-[18px] px-3 py-3 text-[12px] font-semibold transition-all ${
                        time === option.value
                          ? "bg-[linear-gradient(145deg,rgba(255,240,227,0.98),rgba(248,220,198,0.92))] text-[var(--ff-caramel-strong)]"
                          : "bg-[rgba(255,252,244,0.78)] text-[var(--ff-text-muted)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="mt-auto pt-5">
              <button
                onClick={() => setScreen("ideas")}
                className="ff-button-primary flex w-full items-center justify-center gap-2 px-5 py-4 text-sm font-bold"
              >
                Mutasd az ötleteket
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </>
        )}

        {screen === "ideas" && (
          <>
            <header className="flex items-center justify-between gap-3 pb-4">
              <button
                onClick={() => setScreen("chooser")}
                className="ff-icon-button flex h-11 w-11 items-center justify-center rounded-full text-[var(--ff-text-muted)]"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Mai ötletek</p>
                <h2 className="text-[22px] font-semibold text-[var(--ff-text)]">Mai ötletek</h2>
              </div>
              <button className="ff-icon-button flex h-11 w-11 items-center justify-center rounded-full text-[var(--ff-text-muted)]">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
            </header>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {(["Összes", "Gyors", "Gyerekbarát", "Kamra"] as FilterChoice[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-all ${
                    filter === item
                      ? "bg-[linear-gradient(145deg,rgba(221,230,211,0.98),rgba(246,228,203,0.88))] text-[var(--ff-primary)] shadow-[0_12px_24px_-18px_rgba(61,49,34,0.3)]"
                      : "ff-chip text-[var(--ff-text-muted)] shadow-none"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <section className="flex flex-col gap-3">
              {suggestedRecipes.length > 0 ? (
                suggestedRecipes.map((recipe) => (
                  <MobileRecipeCard key={recipe.id} recipe={recipe} onViewRecipe={onViewRecipe} />
                ))
              ) : (
                <div className="ff-glass-card rounded-[28px] px-5 py-8 text-center">
                  <p className="text-sm text-[var(--ff-text-muted)]">Nincs még találat ehhez az irányhoz.</p>
                </div>
              )}
            </section>

            <div className="mt-4 flex gap-3">
              <button
                onClick={onAddMeal}
                className="ff-button-secondary flex-1 px-4 py-3 text-sm font-semibold"
              >
                Részletesebb választás
              </button>
              <button
                onClick={onViewRecipe.bind(null, suggestedRecipes[0] ?? catalog[0])}
                disabled={!suggestedRecipes.length && !catalog.length}
                className="ff-button-primary flex-1 px-4 py-3 text-sm font-bold disabled:opacity-60"
              >
                Első recept
              </button>
            </div>
          </>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
