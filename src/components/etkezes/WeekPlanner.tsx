"use client";

import type { ReactNode } from "react";
import { getBatchRecipe, getBatchesForDate, getCookBatchForDate, toDateKey } from "@/lib/etkezes-data";
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

function EmptyDay({
  state,
  isToday,
  onAddBatch,
}: {
  state: DayMealState;
  isToday: boolean;
  onAddBatch: () => void;
}) {
  return (
    <button
      onClick={onAddBatch}
      className={`ff-glass-card-subtle flex h-full min-w-0 flex-col items-center justify-center gap-2 rounded-[24px] border-dashed p-3 text-center transition-colors hover:bg-[rgba(255,252,244,0.88)] cursor-pointer ${isToday ? "border-[rgba(55,67,50,0.18)] bg-[linear-gradient(145deg,rgba(255,252,244,0.88),rgba(238,244,232,0.78))]" : ""}`}
    >
      <div className="flex w-full items-center justify-between gap-2 text-left text-[11px] font-semibold text-[var(--ff-text-muted)]">
        <span>{formatShortDate(state.day)}</span>
        {isToday && (
          <span className="ff-chip px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--ff-primary)] shadow-none">
            Ma
          </span>
        )}
      </div>
      <span className="ff-chip flex size-8 items-center justify-center text-[var(--ff-text-muted)] shadow-none">
        <span className="material-symbols-outlined text-[16px]">add</span>
      </span>
      <span className="text-[10px] font-medium text-[var(--ff-text-soft)]">Üres</span>
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
    <div className={`min-w-0 rounded-[22px] border p-5 shadow-[0_10px_22px_-18px_rgba(34,27,19,0.18)] ${secondaryTone ? "border-surface-variant/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,246,0.98))]" : "border-surface-variant/70 bg-white"}`}>
      <div className="mb-3 text-[11px] font-semibold text-on-surface-variant">{formatShortDate(state.day)}</div>
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
    <div className="min-w-0 rounded-[22px] border border-primary/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(249,247,243,0.98))] p-5 shadow-[0_12px_26px_-18px_rgba(34,27,19,0.3)]">
      <div className="mb-3 text-[11px] font-semibold text-on-surface-variant">{formatShortDate(state.day)}</div>
      <h4 className="text-[15px] font-bold leading-tight text-on-surface">{recipe.name}</h4>
      <div className="mt-6 flex items-center gap-1.5 text-xs font-medium text-primary/90">
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
    <div className="min-w-0 rounded-[22px] border border-surface-variant/70 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(250,248,244,0.98))] p-5 shadow-[0_12px_26px_-18px_rgba(34,27,19,0.22)]">
      <div className="mb-3 text-[11px] font-semibold text-secondary">{formatShortDate(state.day)}</div>
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
    <div className="group relative min-w-0 rounded-[22px] border border-surface-variant/70 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(249,250,248,0.98))] p-5 shadow-[0_12px_26px_-18px_rgba(34,27,19,0.2)]">
      <button
        onClick={() => onRemoveBatch(batch.id)}
        className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 text-outline hover:text-error cursor-pointer"
        aria-label="Étkezés törlése"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
      <div className="mb-3 text-[11px] font-semibold text-on-surface-variant">{formatShortDate(state.day)}</div>
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
    <div key={`${first.day.dateKey}-${second.day.dateKey}`} className="relative col-span-2 grid min-w-0 grid-cols-2 gap-4 rounded-[22px] border border-surface-variant/70 bg-[rgba(250,251,249,0.95)] p-2 shadow-[0_14px_30px_-24px_rgba(61,87,61,0.28)]">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white shadow-sm whitespace-nowrap">
        Két napos főzés
      </div>
      <div className="relative overflow-hidden rounded-[18px] border border-surface-variant/70 bg-white p-5 shadow-[0_12px_22px_-18px_rgba(34,27,19,0.22)]">
        <div className="absolute left-0 top-0 h-1.5 w-full bg-primary" />
        <div className="mb-3 text-[11px] font-semibold text-on-surface-variant">{formatShortDate(first.day)}</div>
        <h4 className="text-[15px] font-bold leading-tight text-on-surface">{firstRecipe.name}</h4>
        <div className="mt-6 flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">done_all</span>
          Készen van
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[18px] border border-surface-variant/70 bg-white p-5 shadow-[0_12px_22px_-18px_rgba(34,27,19,0.22)]">
        <div className="absolute left-0 top-0 h-1.5 w-full bg-primary" />
        <div className="mb-3 text-[11px] font-semibold text-on-surface-variant">{formatShortDate(second.day)}</div>
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
  const todayKey = toDateKey(new Date());
  const states = weekDays.map((day) => getDayState(day, batches));
  const startIndex = states.findIndex((state) => state.day.dateKey === todayKey);
  const orderedStates = startIndex >= 0
    ? [...states.slice(startIndex), ...states.slice(0, startIndex)]
    : states;
  const items: ReactNode[] = [];

  for (let index = 0; index < orderedStates.length; index += 1) {
    const state = orderedStates[index];
    const next = orderedStates[index + 1];

    if (state.hasMeals && next?.hasMeals) {
      const linked = renderLinkedPair(state, next);
      if (linked) {
        items.push(linked);
        index += 1;
        continue;
      }
    }

    if (!state.hasMeals) {
      items.push(<EmptyDay key={state.day.dateKey} state={state} isToday={state.day.dateKey === todayKey} onAddBatch={onAddBatch} />);
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
        <h2 className="text-[16px] font-semibold tracking-tight text-[var(--ff-text)]">Gyors heti áttekintés</h2>
        <button className="text-[11px] font-medium text-[var(--ff-text-muted)] hover:underline cursor-pointer">Részletes naptár</button>
      </div>

      <div className="ff-glass-card rounded-[36px] px-4 py-5 md:px-6">
        <div className="grid grid-cols-7 gap-4">{items}</div>
      </div>
    </section>
  );
}
