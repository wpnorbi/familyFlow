"use client";

import type { ReactNode } from "react";
import { getBatchRecipe, getBatchesForDate, getCookBatchForDate } from "@/lib/etkezes-data";
import type { MealBatch, Recipe, WeekDay } from "@/types/etkezes";

interface Props {
  weekDays: WeekDay[];
  batches: MealBatch[];
  onAddBatch: () => void;
  onRemoveBatch: (batchId: string) => void;
}

interface DayMealState {
  day: WeekDay;
  dayBatches: MealBatch[];
  cookBatch?: MealBatch;
  leftovers: MealBatch[];
  primaryRecipe?: Recipe;
  hasMeals: boolean;
}

function formatShortDate(day: WeekDay): string {
  return `${day.name}, ${day.date.getDate()}.`;
}

function getDayState(day: WeekDay, batches: MealBatch[]): DayMealState {
  const dayBatches = getBatchesForDate(batches, day.dateKey);
  const cookBatch = getCookBatchForDate(batches, day.dateKey);
  const leftovers = dayBatches.filter((batch) => batch.cookDate !== day.dateKey);
  const primaryBatch = cookBatch ?? dayBatches[0];
  const primaryRecipe = primaryBatch ? getBatchRecipe(primaryBatch) : undefined;

  return {
    day,
    dayBatches,
    cookBatch: cookBatch ?? undefined,
    leftovers,
    primaryRecipe: primaryRecipe ?? undefined,
    hasMeals: dayBatches.length > 0,
  };
}

function EmptyDay({ state, onAddBatch }: { state: DayMealState; onAddBatch: () => void }) {
  return (
    <button
      onClick={onAddBatch}
      className="flex h-full min-w-0 flex-col items-center justify-center gap-3 rounded-[26px] border border-dashed border-surface-variant bg-[rgba(255,255,255,0.5)] p-5 text-center transition-colors hover:bg-[rgba(255,255,255,0.7)] cursor-pointer"
    >
      <div className="w-full text-left text-sm font-semibold text-on-surface-variant">{formatShortDate(state.day)}</div>
      <span className="flex size-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
        <span className="material-symbols-outlined text-[22px]">add</span>
      </span>
      <span className="text-xs font-medium text-on-surface-variant">Nincs még kaja</span>
    </button>
  );
}

function PlannedDay({
  state,
  secondaryTone = false,
}: {
  state: DayMealState;
  secondaryTone?: boolean;
}) {
  const recipe = state.primaryRecipe;
  if (!recipe || !state.dayBatches[0]) return null;

  const infoLabel = state.leftovers.length > 0
    ? "Hűtőből"
    : state.dayBatches.some((batch) => batch.eatDates.length > 1)
      ? "Készen van"
      : "Betervezve";

  const infoIcon = state.leftovers.length > 0 ? "inventory_2" : "done_all";

  return (
    <div className={`min-w-0 rounded-[22px] border p-5 shadow-sm ${secondaryTone ? "border-surface-variant/75 bg-white" : "border-surface-variant/70 bg-white"}`}>
      <div className="mb-3 text-sm font-semibold text-on-surface-variant">{formatShortDate(state.day)}</div>
      <h4 className={`text-[15px] font-bold leading-tight ${secondaryTone ? "text-on-surface/80" : "text-on-surface"}`}>
        {recipe.name}
        {state.leftovers.length > 0 ? " (Maradék)" : ""}
      </h4>
      <div className={`mt-6 flex items-center gap-1.5 text-xs ${state.leftovers.length > 0 ? "text-on-surface-variant" : "text-on-surface-variant"}`}>
        <span className="material-symbols-outlined text-[16px]">{infoIcon}</span>
        {infoLabel}
      </div>
    </div>
  );
}

function MissingIngredientsDay({ state }: { state: DayMealState }) {
  const recipe = state.primaryRecipe;
  if (!recipe) return null;

  return (
    <div className="min-w-0 rounded-[22px] border border-surface-variant bg-white p-5 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-on-surface-variant">{formatShortDate(state.day)}</div>
      <h4 className="text-[15px] font-bold leading-tight text-on-surface">{recipe.name}</h4>
      <div className="mt-6 flex items-center gap-1.5 text-xs font-medium text-primary">
        <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
        Alapanyag hiányzik
      </div>
    </div>
  );
}

function ActivityDay({ state }: { state: DayMealState }) {
  const recipe = state.primaryRecipe;
  if (!recipe) return null;

  return (
    <div className="min-w-0 rounded-[22px] border border-surface-variant bg-white p-5 shadow-sm">
      <div className="mb-3 text-sm font-semibold text-secondary">{formatShortDate(state.day)}</div>
      <h4 className="text-[15px] font-bold leading-tight text-on-surface">{recipe.name}</h4>
      <div className="mt-6 flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px]">celebration</span>
        Családi program
      </div>
    </div>
  );
}

function DefaultPlannedDay({ state, onRemoveBatch }: { state: DayMealState; onRemoveBatch: (batchId: string) => void }) {
  const recipe = state.primaryRecipe;
  const batch = state.cookBatch ?? state.dayBatches[0];
  if (!recipe || !batch) return null;

  return (
    <div className="group relative min-w-0 rounded-[22px] border border-surface-variant bg-white p-5 shadow-sm">
      <button
        onClick={() => onRemoveBatch(batch.id)}
        className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 text-outline hover:text-error cursor-pointer"
        aria-label="Étkezés törlése"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
      <div className="mb-3 text-sm font-semibold text-on-surface-variant">{formatShortDate(state.day)}</div>
      <h4 className="text-[15px] font-bold leading-tight text-on-surface">{recipe.name}</h4>
      <div className="mt-6 flex items-center gap-1.5 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px]">schedule</span>
        {recipe.duration} perc
      </div>
    </div>
  );
}

function renderLinkedPair(
  first: DayMealState,
  second: DayMealState,
) {
  const firstRecipe = first.primaryRecipe;
  const secondRecipe = second.primaryRecipe;
  const firstBatch = first.cookBatch ?? first.dayBatches[0];

  if (!firstRecipe || !secondRecipe || !firstBatch) return null;

  const isSharedBatch = firstBatch.eatDates.includes(second.day.dateKey);
  if (!isSharedBatch) return null;

  return (
    <div key={`${first.day.dateKey}-${second.day.dateKey}`} className="relative col-span-2 grid min-w-0 grid-cols-2 gap-4 rounded-[22px] border border-primary/20 bg-primary/[0.08] p-2">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-sm whitespace-nowrap">
        Két napos főzés
      </div>
      <div className="relative overflow-hidden rounded-[18px] border border-primary/15 bg-white p-5 shadow-sm">
        <div className="absolute left-0 top-0 h-1.5 w-full bg-primary" />
        <div className="mb-3 text-sm font-semibold text-on-surface-variant">{formatShortDate(first.day)}</div>
        <h4 className="text-[15px] font-bold leading-tight text-on-surface">{firstRecipe.name}</h4>
        <div className="mt-6 flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">done_all</span>
          Készen van
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[18px] border border-primary/15 bg-white p-5 shadow-sm">
        <div className="absolute left-0 top-0 h-1.5 w-full bg-primary" />
        <div className="mb-3 text-sm font-semibold text-on-surface-variant">{formatShortDate(second.day)}</div>
        <h4 className="text-[15px] font-bold leading-tight text-on-surface/80">{secondRecipe.name} (Maradék)</h4>
        <div className="mt-6 flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">inventory_2</span>
          Hűtőből
        </div>
      </div>
    </div>
  );
}

export default function WeekPlanner({ weekDays, batches, onAddBatch, onRemoveBatch }: Props) {
  const states = weekDays.map((day) => getDayState(day, batches));
  const items: ReactNode[] = [];

  for (let index = 0; index < states.length; index += 1) {
    const state = states[index];
    const next = states[index + 1];

    if (state.hasMeals && next?.hasMeals) {
      const linked = renderLinkedPair(state, next);
      if (linked) {
        items.push(linked);
        index += 1;
        continue;
      }
    }

    if (!state.hasMeals) {
      items.push(<EmptyDay key={state.day.dateKey} state={state} onAddBatch={onAddBatch} />);
      continue;
    }

    if (state.leftovers.length > 0) {
      items.push(<PlannedDay key={state.day.dateKey} state={state} secondaryTone />);
      continue;
    }

    if (state.day.name === "Szombat") {
      items.push(<ActivityDay key={state.day.dateKey} state={state} />);
      continue;
    }

    if (state.day.date.getDay() === 4) {
      items.push(<MissingIngredientsDay key={state.day.dateKey} state={state} />);
      continue;
    }

    items.push(<DefaultPlannedDay key={state.day.dateKey} state={state} onRemoveBatch={onRemoveBatch} />);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-on-surface">Gyors heti áttekintés</h2>
        <button className="text-sm font-medium text-primary hover:underline cursor-pointer">Részletes naptár</button>
      </div>

      <div className="rounded-[40px] bg-surface-container-low px-5 py-6 shadow-inner md:px-8">
        <div className="grid grid-cols-7 gap-4">{items}</div>
      </div>
    </section>
  );
}
