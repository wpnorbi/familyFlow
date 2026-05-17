"use client";

import { useMemo, useState } from "react";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import { toDateKey } from "@/lib/etkezes-data";
import type { MealBatch, Recipe } from "@/types/etkezes";

interface Props {
  recipe: Recipe;
  batches: MealBatch[];
  pantryItems: string[];
  onClose: () => void;
  onConfirm: (recipe: Recipe, startDate: string, days: number) => void;
}

const MONTH_NAMES = [
  "Január","Február","Március","Április","Május","Június",
  "Július","Augusztus","Szeptember","Október","November","December",
];
const DAY_HEADERS = ["H", "K", "Sz", "Cs", "P", "Sz", "V"];

function buildCalendarGrid(year: number, month: number) {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; dateKey: string | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, dateKey: null });
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, dateKey: toDateKey(new Date(year, month, d)) });
  }
  return cells;
}

export default function ScheduleSheet({
  recipe,
  batches,
  pantryItems,
  onClose,
  onConfirm,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [startDate, setStartDate] = useState<string>(todayKey);
  const [numDays, setNumDays] = useState(1);

  const cells = useMemo(() => buildCalendarGrid(calYear, calMonth), [calYear, calMonth]);

  const occupiedDates = useMemo(() => {
    const s = new Set<string>();
    batches.forEach((b) => b.eatDates.forEach((d) => s.add(d)));
    return s;
  }, [batches]);

  const selectedRange = useMemo(() => {
    const s = new Set<string>();
    const base = new Date(`${startDate}T12:00:00`);
    for (let i = 0; i < numDays; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      s.add(toDateKey(d));
    }
    return s;
  }, [startDate, numDays]);

  const selectedDatesArr = useMemo(() => [...selectedRange].sort(), [selectedRange]);

  // Shopping analysis
  const allIngredients = useMemo(
    () =>
      recipe.ingredientGroups?.length
        ? recipe.ingredientGroups.flatMap((g) => g.items)
        : recipe.ingredients,
    [recipe],
  );
  const pantryResult = useMemo(
    () => rankRecipesForPantry([recipe], pantryItems)[0],
    [recipe, pantryItems],
  );
  const missing = useMemo(
    () => pantryResult?.missingIngredients ?? allIngredients,
    [pantryResult, allIngredients],
  );
  const atHome = useMemo(
    () => allIngredients.filter((i) => !missing.includes(i)),
    [allIngredients, missing],
  );

  // Scale quantities by days (simple multiplier heuristic)
  const scaledMissing = useMemo(
    () => (numDays > 1 ? missing.map((i) => `${i} ×${numDays}`) : missing),
    [missing, numDays],
  );

  function goToPrevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }
  function goToNextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

  function handleDaySelect(dk: string) {
    const d = new Date(`${dk}T12:00:00`);
    if (d < new Date(todayKey)) return; // past
    setStartDate(dk);
  }

  const endDateKey = selectedDatesArr[selectedDatesArr.length - 1];

  function formatDate(dk: string) {
    return new Date(`${dk}T12:00:00`).toLocaleDateString("hu-HU", {
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/44 backdrop-blur-sm md:hidden">
      <button className="absolute inset-0" onClick={onClose} aria-label="Bezárás" />

      <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#F7F3EE]">

        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pb-1 pt-3">
          <div className="h-1.5 w-12 rounded-full bg-[#D0C8BC]" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-start justify-between px-5 py-3">
          <div>
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#1C1916]">
              Hova kerüljön?
            </h2>
            <p className="mt-0.5 text-[14px] font-semibold text-[#5A4E44]">{recipe.name}</p>
            <p className="text-[12px] text-[#9A8E82]">
              {recipe.duration} perc · {recipe.servings ?? 4} adag
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EDE8DF]"
          >
            <span className="material-symbols-outlined text-[18px] text-[#4A3C32]">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">

          {/* ── Calendar ─────────────────────────────────────────── */}
          <div className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">

            {/* Month navigation */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={goToPrevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full active:bg-[#F0EAE0]"
              >
                <span className="material-symbols-outlined text-[20px] text-[#4A3C32]">arrow_back</span>
              </button>
              <span className="text-[15px] font-bold text-[#1C1916]">
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <button
                onClick={goToNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-full active:bg-[#F0EAE0]"
              >
                <span className="material-symbols-outlined text-[20px] text-[#4A3C32]">arrow_forward</span>
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="mb-1 grid grid-cols-7">
              {DAY_HEADERS.map((h, i) => (
                <div key={i} className="py-1 text-center text-[11px] font-bold text-[#9A8E82]">
                  {h}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((cell, i) => {
                if (!cell.day || !cell.dateKey) {
                  return <div key={i} className="h-9" />;
                }
                const dk = cell.dateKey;
                const isPast = dk < todayKey;
                const isOccupied = occupiedDates.has(dk) && !selectedRange.has(dk);
                const isSelected = selectedRange.has(dk);
                const isStart = dk === startDate;
                const isEnd = dk === endDateKey && numDays > 1;
                const isToday = dk === todayKey;
                const isWeekend = (new Date(`${dk}T12:00:00`).getDay() + 6) % 7 >= 5;

                return (
                  <button
                    key={i}
                    onClick={() => handleDaySelect(dk)}
                    disabled={isPast}
                    className={[
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold transition-all",
                      isSelected ? "bg-[#3B5C33] text-white" : "",
                      isOccupied && !isSelected ? "bg-[#F5E8DC] text-[#C47A48]" : "",
                      isPast ? "cursor-not-allowed text-[#C8C0B8]" : "",
                      !isSelected && !isOccupied && !isPast && isToday
                        ? "border-2 border-[#3B5C33] text-[#3B5C33]"
                        : "",
                      !isSelected && !isOccupied && !isPast && !isToday
                        ? `text-[#3A3230] hover:bg-[#E8EEE0] active:scale-95 ${isWeekend ? "text-[#7A6E64]" : ""}`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Range label */}
            {selectedDatesArr.length > 0 && (
              <p className="mt-3 text-center text-[12px] text-[#7A6E64]">
                {numDays === 1
                  ? formatDate(startDate)
                  : `${formatDate(startDate)} – ${formatDate(endDateKey)}`}
                {numDays > 1 && (
                  <span className="ml-1 text-[#9A8E82]">· {numDays} napra választva</span>
                )}
              </p>
            )}

            {/* Legend */}
            <div className="mt-3 flex items-center justify-center gap-5">
              {[
                { color: "bg-[#E8EEE0]", label: "Szabad" },
                { color: "bg-[#F5E8DC]", label: "Foglalt" },
                { color: "bg-[#3B5C33]", label: "Kiválasztott" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`h-3 w-3 rounded-full ${l.color}`} />
                  <span className="text-[11px] text-[#9A8E82]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Days counter ─────────────────────────────────────── */}
          <div className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <h3 className="mb-3 text-[14px] font-bold text-[#1C1916]">Hány napra szóljon?</h3>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setNumDays((n) => Math.max(1, n - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EDE8DF] text-[22px] font-light text-[#4A3C32] active:scale-95"
              >
                −
              </button>
              <span className="text-[18px] font-bold text-[#1C1916]">{numDays} nap</span>
              <button
                onClick={() => setNumDays((n) => Math.min(7, n + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EDE8DF] text-[22px] font-light text-[#4A3C32] active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* ── Shopping preview ─────────────────────────────────── */}
          <div className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <h3 className="mb-3 text-[14px] font-bold text-[#1C1916]">Bevásárlólista változás</h3>

            {scaledMissing.length > 0 ? (
              <div className="mb-3">
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#9A8E82]">
                  Hozzáadjuk:
                </p>
                <div className="space-y-2">
                  {scaledMissing.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[13px] text-[#3A3230]">
                      <span className="material-symbols-outlined text-[15px] text-[#B87040]">
                        add
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mb-3 text-[13px] text-[#7A6E64]">Nincs hiányzó hozzávaló.</p>
            )}

            {atHome.length > 0 && (
              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[#9A8E82]">
                  Már van otthon:
                </p>
                <div className="space-y-2">
                  {atHome.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[13px] text-[#3A3230]">
                      <span className="material-symbols-outlined text-[15px] text-[#4A7A40]">
                        check
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky CTA ───────────────────────────────────────────── */}
        <div
          className="shrink-0 border-t border-[#E5DDD4] bg-[#F7F3EE] px-5 py-4"
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            onClick={() => onConfirm(recipe, startDate, numDays)}
            className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#3B5C33] py-4 text-[16px] font-semibold text-white"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Hozzáadás a tervhez
          </button>
        </div>
      </div>
    </div>
  );
}
