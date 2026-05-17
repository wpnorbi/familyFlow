"use client";

import { useState, useEffect } from "react";
import RecipeImage from "@/components/etkezes/RecipeImage";
import {
  isKidFriendlyRecipe,
  isQuickRecipe,
  getRecipeMealTypeLabel,
} from "@/lib/recipes/recipe-taxonomy";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import type { Recipe } from "@/types/etkezes";

interface Props {
  recipe: Recipe;
  bookmarked: boolean;
  pantryItems: string[];
  onClose: () => void;
  onSchedule: (recipe: Recipe) => void;
  onStartCooking: (recipe: Recipe) => void;
  onToggleBookmark: (recipe: Recipe) => void;
}

type ContentTab = "ingredients" | "instructions";

function MetaPill({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#EDEAE3] px-3 py-1.5 text-[12px] font-semibold text-[#5A4E44]">
      <span className="material-symbols-outlined text-[13px]">{icon}</span>
      {label}
    </span>
  );
}

export default function RecipePreviewSheet({
  recipe,
  bookmarked,
  pantryItems,
  onClose,
  onSchedule,
  onStartCooking,
  onToggleBookmark,
}: Props) {
  const [activeTab, setActiveTab] = useState<ContentTab>("ingredients");

  const isKidFriendly = isKidFriendlyRecipe(recipe);
  const isQuick = isQuickRecipe(recipe);

  const allIngredients = recipe.ingredientGroups?.length
    ? recipe.ingredientGroups.flatMap((g) => g.items)
    : recipe.ingredients;

  const pantryResult = rankRecipesForPantry([recipe], pantryItems)[0];
  const missingIngredients = pantryResult?.missingIngredients ?? allIngredients;
  const atHomeIngredients = allIngredients.filter((i) => !missingIngredients.includes(i));

  const whyGoodNow: string[] = [];
  if (isQuick) whyGoodNow.push(`${recipe.duration} perc alatt kész`);
  if (isKidFriendly) whyGoodNow.push("Gyerekbarát recept");
  if (atHomeIngredients.length === allIngredients.length && allIngredients.length > 0) {
    whyGoodNow.push("Minden hozzávaló van otthon");
  } else if (missingIngredients.length > 0 && missingIngredients.length <= 2) {
    whyGoodNow.push(`Csak ${missingIngredients.length} hozzávaló hiányzik`);
  } else if (atHomeIngredients.length > 0) {
    whyGoodNow.push(`${atHomeIngredients.length}/${allIngredients.length} hozzávaló van otthon`);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[75] flex items-end bg-black/40 backdrop-blur-sm md:hidden">
      <button className="absolute inset-0" onClick={onClose} aria-label="Bezárás" />

      <div className="relative flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-[#F7F3EE]">

        {/* ── Hero image ─────────────────────────────────────────── */}
        <div className="relative h-[260px] shrink-0">
          <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10" />

          {/* Top controls */}
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md"
            >
              <span className="material-symbols-outlined text-[20px] text-[#3A3230]">arrow_back</span>
            </button>
            <div className="flex gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md">
                <span className="material-symbols-outlined text-[18px] text-[#3A3230]">share</span>
              </button>
              <button
                onClick={() => onToggleBookmark(recipe)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md"
              >
                <span
                  className="material-symbols-outlined text-[18px] text-[#3A3230]"
                  style={bookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  bookmark
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Scrollable content ─────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-5 pt-5">

            {/* Meta pills */}
            <div className="mb-3 flex flex-wrap gap-2">
              <MetaPill icon="schedule" label={`${recipe.duration} perc`} />
              <MetaPill icon="restaurant" label={getRecipeMealTypeLabel(recipe)} />
              {isKidFriendly && <MetaPill icon="sentiment_satisfied" label="Gyerekbarát" />}
              {isQuick && <MetaPill icon="bolt" label="Gyors" />}
            </div>

            {/* Recipe name */}
            <h2 className="mb-4 text-[24px] font-bold leading-tight tracking-[-0.03em] text-[#1C1916]">
              {recipe.name}
            </h2>

            {/* Miért jó most? */}
            {whyGoodNow.length > 0 && (
              <div className="mb-5 rounded-[16px] bg-[#F0EDE6] px-4 py-4">
                <h3 className="mb-2.5 text-[13px] font-bold text-[#1C1916]">Miért jó most?</h3>
                <div className="space-y-2">
                  {whyGoodNow.map((reason) => (
                    <div key={reason} className="flex items-center gap-2.5">
                      <span
                        className="material-symbols-outlined text-[18px] text-[#4A7A40]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <span className="text-[14px] text-[#3A3230]">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-4 flex border-b border-[#E5DDD4]">
              <button
                onClick={() => setActiveTab("ingredients")}
                className={`flex-1 py-3 text-[15px] font-semibold transition-colors ${
                  activeTab === "ingredients"
                    ? "-mb-px border-b-2 border-[#B87040] text-[#1C1916]"
                    : "text-[#9A8C7E]"
                }`}
              >
                Hozzávalók
              </button>
              <button
                onClick={() => setActiveTab("instructions")}
                className={`flex-1 py-3 text-[15px] font-semibold transition-colors ${
                  activeTab === "instructions"
                    ? "-mb-px border-b-2 border-[#B87040] text-[#1C1916]"
                    : "text-[#9A8C7E]"
                }`}
              >
                Elkészítés
              </button>
            </div>

            {activeTab === "ingredients" && (
              <ul className="space-y-2.5 pb-2">
                {allIngredients.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined mt-0.5 text-[16px] text-[#5A7A50]">
                      check
                    </span>
                    <span className="text-[14px] text-[#3A3230]">{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === "instructions" && (
              <ol className="space-y-3 pb-2">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B5C33] text-[12px] font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-[14px] leading-relaxed text-[#3A3230]">{step}</p>
                  </li>
                ))}
              </ol>
            )}

            {/* Bottom spacing so content isn't hidden behind action bar */}
            <div className="h-4" />
          </div>
        </div>

        {/* ── Sticky action bar ──────────────────────────────────── */}
        <div
          className="shrink-0 border-t border-[#E5DDD4] bg-[#F7F3EE] px-5 py-4"
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            onClick={() => onSchedule(recipe)}
            className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#B87040] py-4 text-[16px] font-semibold text-white"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Hozzáadás a tervhez
          </button>
          <button
            onClick={() => onStartCooking(recipe)}
            className="w-full rounded-[16px] border border-[#D8CFC4] bg-white py-3.5 text-[15px] font-semibold text-[#3A3230]"
          >
            Főzés indítása
          </button>
        </div>
      </div>
    </div>
  );
}
