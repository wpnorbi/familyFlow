"use client";

import type { MealBatch, WeekDay } from "@/types/etkezes";
import { getBatchRecipe, getBatchesForDate, getCookBatchForDate } from "@/lib/etkezes-data";

const MONTHS_SHORT = ["jan", "febr", "már", "ápr", "máj", "jún", "júl", "aug", "szept", "okt", "nov", "dec"];

const PROTEIN_ICONS: Record<string, string> = {
  csirke: "egg_alt",
  hal: "set_meal",
  marha: "lunch_dining",
  vegetáriánus: "eco",
  egyéb: "restaurant",
};

const PROTEIN_COLORS: Record<string, string> = {
  csirke: "bg-amber-50 text-amber-700",
  hal: "bg-blue-50 text-blue-700",
  marha: "bg-red-50 text-red-700",
  vegetáriánus: "bg-green-50 text-green-700",
  egyéb: "bg-purple-50 text-purple-700",
};

interface Props {
  weekDays: WeekDay[];
  batches: MealBatch[];
  onAddBatch: () => void;
  onRemoveBatch: (batchId: string) => void;
}

export default function WeekPlanner({ weekDays, batches, onAddBatch, onRemoveBatch }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {weekDays.map((day) => {
        const dayBatches = getBatchesForDate(batches, day.dateKey);
        const cookBatch = getCookBatchForDate(batches, day.dateKey);
        const leftoverBatches = dayBatches.filter((b) => b.cookDate !== day.dateKey);
        const hasMeals = dayBatches.length > 0;

        return (
          <div
            key={day.dateKey}
            className={`rounded-2xl border transition-all ${
              day.isToday
                ? "border-primary-container bg-surface-container-lowest shadow-[0_4px_20px_rgba(74,93,78,0.08)]"
                : "border-surface-variant/50 bg-surface-container-lowest/60"
            }`}
          >
            {/* Nap fejléc */}
            <div className={`px-5 py-3 flex items-center justify-between rounded-t-2xl ${day.isToday ? "bg-primary-container/15" : ""}`}>
              <div className="flex items-center gap-3">
                {day.isToday && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
                <div>
                  <span className={`text-sm font-bold ${day.isToday ? "text-primary" : "text-on-surface"}`}>
                    {day.name}
                  </span>
                  <span className="text-xs text-outline ml-2">
                    {MONTHS_SHORT[day.date.getMonth()]} {day.date.getDate()}.
                  </span>
                </div>
                {day.isToday && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Ma
                  </span>
                )}
              </div>
              <button
                onClick={onAddBatch}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-primary transition-all cursor-pointer"
                title="Kaja hozzáadása"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>

            {/* Kaják */}
            <div className="px-4 pb-4 pt-1">
              {!hasMeals ? (
                <button
                  onClick={onAddBatch}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-surface-variant hover:border-primary-container hover:bg-primary-fixed/10 flex items-center justify-center gap-2 text-outline hover:text-primary transition-all cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">add</span>
                  <span className="text-xs font-medium">Kaja hozzáadása</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  {cookBatch && (() => {
                    const recipe = getBatchRecipe(cookBatch);
                    if (!recipe) return null;
                    return (
                      <div
                        key={cookBatch.id}
                        className="group relative flex items-center gap-3 p-3 rounded-xl bg-primary-container/20 border border-primary-container/40"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${PROTEIN_COLORS[recipe.protein]}`}>
                          <span className="material-symbols-outlined text-[16px]">{PROTEIN_ICONS[recipe.protein]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Főzés</span>
                            {cookBatch.eatDates.length > 1 && (
                              <span className="text-[10px] font-medium text-primary/70">
                                · {cookBatch.eatDates.length} napra
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-on-surface leading-snug truncate">{recipe.name}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-outline shrink-0">
                          <span className="material-symbols-outlined text-[11px]">timer</span>
                          {recipe.duration}p
                        </div>
                        <button
                          onClick={() => onRemoveBatch(cookBatch.id)}
                          className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 w-5 h-5 rounded-full bg-error/10 text-error flex items-center justify-center transition-opacity cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">close</span>
                        </button>
                      </div>
                    );
                  })()}
                  {leftoverBatches.map((batch) => {
                    const recipe = getBatchRecipe(batch);
                    if (!recipe) return null;
                    return (
                      <div
                        key={batch.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-surface-variant/40"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 opacity-60 ${PROTEIN_COLORS[recipe.protein]}`}>
                          <span className="material-symbols-outlined text-[16px]">{PROTEIN_ICONS[recipe.protein]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">♻ Maradék</span>
                          </div>
                          <p className="text-xs font-semibold text-on-surface leading-snug truncate">{recipe.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
