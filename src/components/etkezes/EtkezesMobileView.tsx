"use client";

import Link from "next/link";
import { useMemo } from "react";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { getBatchRecipe, getBatchesForDate, getCookBatchForDate } from "@/lib/etkezes-data";
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

function getCurrentStage() {
  const now = new Date();
  const hour = now.getHours();
  const minute = String(now.getMinutes()).padStart(2, "0");
  const timeLabel = `${hour}:${minute}`;

  if (hour < 12) {
    return { stage: "Reggel", current: `${timeLabel} - Reggeli ritmus`, progress: 22 };
  }
  if (hour < 18) {
    return { stage: "Délután", current: `${timeLabel} - Suli vége`, progress: 52 };
  }
  return { stage: "Este", current: `${timeLabel} - Vacsora készül`, progress: 82 };
}

function getDayState(day: WeekDay, batches: MealBatch[]) {
  const dayBatches = getBatchesForDate(batches, day.dateKey);
  const cookBatch = getCookBatchForDate(batches, day.dateKey);
  const primaryBatch = cookBatch ?? dayBatches[0];
  const recipe = primaryBatch ? getBatchRecipe(primaryBatch) : undefined;

  return {
    day,
    recipe,
  };
}

function getWeekendCard(weekDays: WeekDay[], batches: MealBatch[], fallback: Recipe | null) {
  const weekendDays = weekDays.filter((day) => day.name === "Szombat" || day.name === "Vasárnap");
  const plannedWeekend = weekendDays
    .map((day) => ({ day, recipe: getDayState(day, batches).recipe }))
    .find((entry) => entry.recipe);

  if (plannedWeekend?.recipe) {
    return {
      label: `${plannedWeekend.day.name} ${plannedWeekend.day.date.getDate()}:00`,
      title: plannedWeekend.recipe.name,
      recipe: plannedWeekend.recipe,
    };
  }

  if (fallback) {
    return {
      label: "Szombat 10:00",
      title: fallback.name,
      recipe: fallback,
    };
  }

  return null;
}

function getPantryAlert(shoppingItems: string[]) {
  if (shoppingItems.length === 0) {
    return "A kamrában most nincs kritikus hiány. A terv nyugodtan tartható.";
  }

  const items = shoppingItems.slice(0, 2).join(" és ");
  return `${items} kritikus szinten. Hozzáadva a megosztott bevásárlólistához.`;
}

function MobileRecommendationCard({
  recipe,
  onViewRecipe,
}: {
  recipe: Recipe;
  onViewRecipe: (recipe: Recipe) => void;
}) {
  return (
    <button
      onClick={() => onViewRecipe(recipe)}
      className="overflow-hidden rounded-[20px] border border-surface-variant bg-white text-left shadow-sm cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
        <div className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-on-surface shadow-sm">
          <span className="material-symbols-outlined text-[18px]">favorite_border</span>
        </div>
      </div>
      <div className="p-3">
        <h4 className="text-sm font-semibold leading-tight text-on-surface">{recipe.name}</h4>
        <div className="mt-2 flex items-center gap-1 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          {recipe.duration} perc
        </div>
      </div>
    </button>
  );
}

export default function EtkezesMobileView({
  nextMealData,
  weekDays,
  batches,
  shoppingItems,
  pantryItems,
  catalog,
  onStartCooking,
  onViewRecipe,
  onGenerateIdeas,
}: Props) {
  const currentStage = useMemo(() => getCurrentStage(), []);
  const nextMealMatch = nextMealData ? rankRecipesForPantry([nextMealData.recipe], pantryItems)[0] : null;
  const missingCount = nextMealMatch?.missingIngredients.length ?? nextMealData?.recipe.ingredients.length ?? 0;
  const ingredientProgress = nextMealData
    ? Math.round(((nextMealMatch?.matchedIngredients.length ?? 0) / Math.max(nextMealData.recipe.ingredients.length, 1)) * 100)
    : 0;
  const weekendCard = useMemo(
    () => getWeekendCard(weekDays, batches, nextMealData?.recipe ?? null),
    [weekDays, batches, nextMealData],
  );
  const recommendations = useMemo(() => catalog.slice(0, 3), [catalog]);

  return (
    <div className="md:hidden">
      <header className="fixed top-0 z-50 w-full border-none bg-white/80 shadow-[0_4px_20px_-2px_rgba(74,93,78,0.08)] backdrop-blur-lg">
        <div className="flex w-full items-center justify-between px-6 py-4">
          <button className="text-[#4A5D4E] transition-opacity cursor-pointer">
            <span className="material-symbols-outlined text-[28px]">calendar_today</span>
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-[#4A5D4E]">Családi Terv</h1>
          <button className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-primary-container text-on-primary-container shadow-sm cursor-pointer">
            <span className="flex h-full w-full items-center justify-center text-sm font-bold">FN</span>
          </button>
        </div>
      </header>

      <main className="flex w-full flex-col gap-0 pb-32 pt-[72px]">
        <section className="relative w-full rounded-b-[2.5rem] bg-primary px-6 py-8 text-on-primary shadow-xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-fixed-dim">Jelenleg</span>
              <h3 className="text-lg font-semibold text-on-primary">{currentStage.current}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-primary shadow-inner">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
          </div>

          <div className="relative mb-6 h-2 w-full overflow-hidden rounded-full bg-primary-fixed-dim/30">
            <div className="absolute left-0 top-0 h-full rounded-full bg-primary-fixed" style={{ width: `${currentStage.progress}%` }} />
          </div>

          <div className="relative flex justify-between px-2">
            {[
              { label: "Reggel", icon: "wb_sunny", active: currentStage.stage === "Reggel" },
              { label: "Délután", icon: "schedule", active: currentStage.stage === "Délután" },
              { label: "Este", icon: "nightlight_round", active: currentStage.stage === "Este" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.active ? "border-2 border-primary-fixed bg-primary text-primary-fixed shadow-sm" : item.label === "Reggel" ? "bg-primary-fixed text-primary shadow-sm" : "bg-primary-fixed-dim/20 text-primary-fixed-dim/70"}`}>
                  <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                </div>
                <span className={`text-[11px] font-medium ${item.active || item.label === "Reggel" ? "text-primary-fixed" : "text-primary-fixed-dim/70"}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {nextMealData && (
          <section className="mb-12 mt-8 flex flex-col gap-3 px-6">
            <h2 className="px-1 text-2xl font-semibold tracking-tight text-primary">Mai Vacsora</h2>
            <div className="relative pt-2">
              <button
                onClick={() => onStartCooking(nextMealData.recipe)}
                className="relative h-[260px] w-full overflow-hidden rounded-[22px] shadow-lg cursor-pointer"
              >
                <RecipeImage recipe={nextMealData.recipe} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                    <span className="material-symbols-outlined text-[14px]">timer</span>
                    {nextMealData.recipe.duration}p
                  </span>
                </div>
              </button>

              <div className="absolute -bottom-10 left-4 right-4 flex flex-col gap-3 rounded-[22px] border border-white/60 bg-white/95 p-5 shadow-[0_12px_40px_rgba(74,93,78,0.12)] backdrop-blur-xl">
                <div>
                  <h3 className="mb-1 text-2xl font-semibold text-primary">{nextMealData.recipe.name}</h3>
                  <p className="text-base text-on-surface-variant">{nextMealData.recipe.description}</p>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full bg-error-container px-3 py-1.5 text-on-error-container">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    <span className="text-[13px] font-semibold">{missingCount} hiányzó tétel</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[13px] font-semibold text-primary">{ingredientProgress}% kész</span>
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-variant">
                      <div className="h-full rounded-full bg-secondary-container" style={{ width: `${ingredientProgress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {weekendCard && (
          <section className={`mb-24 flex flex-col gap-3 px-6 ${nextMealData ? "pt-4" : "mt-8"}`}>
            <h2 className="px-1 text-2xl font-semibold tracking-tight text-primary">Hétvégi Kaland</h2>
            <div className="relative pt-2">
              <button
                onClick={() => onViewRecipe(weekendCard.recipe)}
                className="relative h-[240px] w-full overflow-hidden rounded-[22px] shadow-lg cursor-pointer"
              >
                <RecipeImage recipe={weekendCard.recipe} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute right-4 top-4 flex flex-col items-center rounded-xl border border-white/50 bg-white/90 p-2.5 shadow-sm backdrop-blur-md">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>partly_cloudy_day</span>
                  <span className="mt-1 text-[11px] font-semibold text-on-surface">22°C</span>
                </div>
              </button>

              <div className="absolute -bottom-24 left-4 right-4 flex flex-col gap-4 rounded-[22px] border border-white/60 bg-white/95 p-5 shadow-[0_12px_40px_rgba(74,93,78,0.12)] backdrop-blur-xl">
                <div>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary">{weekendCard.label}</span>
                  <h3 className="text-2xl font-semibold text-primary">{weekendCard.title}</h3>
                </div>

                <div className="rounded-[16px] border border-surface-variant bg-surface p-3.5 shadow-sm">
                  <h4 className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">backpack</span>
                    Pakolási lista (Kiemelt)
                  </h4>
                  <ul className="flex flex-col gap-2.5">
                    {weekendCard.recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                      <li key={ingredient} className="flex items-center gap-3">
                        <div className={`flex h-5 w-5 items-center justify-center rounded border-2 ${index === 0 ? "border-primary bg-primary-fixed text-primary" : "border-outline"}`}>
                          {index === 0 && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                        </div>
                        <span className={`text-sm ${index === 0 ? "text-on-surface opacity-70 line-through" : "text-on-surface"}`}>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="px-6 pb-8">
          <div className="flex items-start gap-4 rounded-2xl border border-error/20 bg-error-container/60 p-4 shadow-sm">
            <div className="mt-0.5">
              <span className="material-symbols-outlined text-on-error-container">notification_important</span>
            </div>
            <div>
              <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-on-error-container">Kamra Riport</h4>
              <p className="text-sm leading-relaxed text-on-error-container/90">{getPantryAlert(shoppingItems)}</p>
            </div>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-6 left-1/2 z-50 flex w-[90%] max-w-md -translate-x-1/2 items-center justify-around rounded-full border border-white/20 bg-white/90 px-2 py-2 shadow-[0_20px_50px_rgba(74,93,78,0.15)] backdrop-blur-2xl">
        <button className="flex scale-90 flex-col items-center justify-center rounded-full bg-[#4A5D4E] px-5 py-2 text-white transition-all">
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[11px] font-medium uppercase tracking-wide">Főoldal</span>
        </button>
        <Link href="/etkezes" className="flex flex-col items-center justify-center rounded-full px-5 py-2 text-[#4A5D4E]/60 transition-colors">
          <span className="material-symbols-outlined mb-1">restaurant</span>
          <span className="text-[11px] font-medium uppercase tracking-wide">Étkezés</span>
        </Link>
        <Link href="/programok" className="flex flex-col items-center justify-center rounded-full px-5 py-2 text-[#4A5D4E]/60 transition-colors">
          <span className="material-symbols-outlined mb-1">event_available</span>
          <span className="text-[11px] font-medium uppercase tracking-wide">Hétvége</span>
        </Link>
        <Link href="/kamra" className="flex flex-col items-center justify-center rounded-full px-5 py-2 text-[#4A5D4E]/60 transition-colors">
          <span className="material-symbols-outlined mb-1">group</span>
          <span className="text-[11px] font-medium uppercase tracking-wide">Család</span>
        </Link>
      </nav>
    </div>
  );
}
