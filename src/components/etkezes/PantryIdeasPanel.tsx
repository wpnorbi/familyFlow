"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import type { Recipe } from "@/types/etkezes";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { normalizePantryItems, rankRecipesForPantry } from "@/lib/recipes/pantry-match";

interface Props {
  pantryItems: string[];
  catalog: Recipe[];
  onUpdatePantryItems: (nextPantryItems: string[]) => void | Promise<void>;
  onChooseRecipe: (recipe: Recipe) => void;
}

const QUICK_ITEMS = ["csirkemell", "rizs", "paprika", "hagyma", "paradicsom", "sajt"];

function MatchCard({
  recipe,
  missingCount,
  onChooseRecipe,
}: {
  recipe: Recipe;
  missingCount: number;
  onChooseRecipe: (recipe: Recipe) => void;
}) {
  return (
    <button
      onClick={() => onChooseRecipe(recipe)}
      className="flex items-center gap-2.5 rounded-[16px] border border-[rgba(160,179,154,0.28)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(244,248,243,0.98))] px-2.5 py-2.5 text-left shadow-[0_10px_18px_-22px_rgba(34,27,19,0.18)] transition-all hover:border-[rgba(92,122,91,0.22)] hover:shadow-[0_14px_22px_-20px_rgba(34,27,19,0.22)] cursor-pointer"
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-[12px]">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
      </div>
      <div className="flex min-w-0 flex-col">
        <h4 className="line-clamp-1 text-[13px] font-semibold leading-tight text-on-surface">{recipe.name}</h4>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-on-surface-variant">
          <span>{recipe.duration} perc</span>
          <span className="text-outline">•</span>
          <span>{missingCount} hiányzik</span>
        </div>
      </div>
    </button>
  );
}

export default function PantryIdeasPanel({ pantryItems, catalog, onUpdatePantryItems, onChooseRecipe }: Props) {
  const [draft, setDraft] = useState("");

  const matches = useMemo(
    () => rankRecipesForPantry(catalog, pantryItems).slice(0, 2),
    [catalog, pantryItems],
  );

  const addItem = async (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) return;
    const nextItems = normalizePantryItems([...pantryItems, value]);
    setDraft("");
    await onUpdatePantryItems(nextItems);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void addItem(draft);
    }
  };

  const visibleQuickItems = QUICK_ITEMS.filter((item) => !pantryItems.includes(item)).slice(0, 4);

  return (
    <section className="relative isolate overflow-hidden rounded-[34px] border border-[rgba(157,176,151,0.28)] bg-[linear-gradient(135deg,rgba(242,248,241,0.98),rgba(255,255,255,0.99)_48%,rgba(235,243,234,0.94)_100%)] px-5 py-5 shadow-[0_26px_56px_-40px_rgba(42,58,42,0.32)] ring-1 ring-white/60 md:col-span-3">
      <div className="pointer-events-none absolute -right-8 top-8 size-28 rounded-full bg-[rgba(139,161,136,0.14)] blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 size-24 rounded-full bg-[rgba(205,164,128,0.08)] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.36),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_26%)] opacity-85" />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 text-on-surface">
            <div className="rounded-[18px] border border-[rgba(139,161,136,0.2)] bg-[rgba(139,161,136,0.12)] p-2.5 text-[rgb(92,122,91)] shadow-[0_12px_20px_-18px_rgba(42,58,42,0.3)]">
              <span className="material-symbols-outlined text-[20px]">kitchen</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgb(92,122,91)]/70">Kamra ötletek</p>
              <h3 className="mt-1 text-[19px] font-semibold tracking-tight text-on-surface">Főzz abból, ami van</h3>
              <p className="mt-1 text-[11px] leading-snug text-on-surface-variant">
                Gyors input, kamrára hangolt ajánlatok, letisztultabb ritmus.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-[rgba(160,179,154,0.26)] bg-white/72 px-3 py-1 text-[11px] font-semibold text-[rgb(92,122,91)] shadow-[0_8px_16px_-14px_rgba(34,27,19,0.18)]">
            {pantryItems.length} alapanyag
          </span>
        </div>

        <div className="rounded-[26px] border border-white/70 bg-white/72 p-3 shadow-[0_16px_28px_-26px_rgba(34,27,19,0.24)] backdrop-blur-sm">
          <div className="flex flex-col gap-2 lg:flex-row">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Adj hozzá alapanyagot"
              className="min-w-0 flex-1 rounded-full border border-[rgba(160,179,154,0.26)] bg-white/90 px-4 py-2 text-[11px] text-on-surface outline-none transition-colors placeholder:text-outline focus:border-[rgba(92,122,91,0.35)]"
            />
            <button
              onClick={() => void addItem(draft)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(180deg,rgba(92,122,91,1),rgba(73,100,72,1))] px-4 py-2 text-[11px] font-semibold text-white shadow-[0_14px_22px_-18px_rgba(42,58,42,0.42)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Hozzáadom
            </button>
          </div>

          <div className="mt-3 rounded-[20px] border border-dashed border-[rgba(160,179,154,0.22)] bg-[rgba(248,250,247,0.78)] p-2.5">
            <div className="flex flex-wrap gap-1.5">
              {visibleQuickItems.map((item) => (
                <button
                  key={item}
                  onClick={() => void addItem(item)}
                  className="rounded-full border border-[rgba(160,179,154,0.28)] bg-white/92 px-2.5 py-1 text-[10px] font-medium text-[rgb(93,112,90)] transition-colors hover:border-[rgba(92,122,91,0.24)] hover:bg-white cursor-pointer"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {matches.map((match) => (
            <MatchCard
              key={match.recipe.id}
              recipe={match.recipe}
              missingCount={match.missingIngredients.length}
              onChooseRecipe={onChooseRecipe}
            />
          ))}

          <button className="flex items-center justify-center rounded-[16px] border border-dashed border-[rgba(160,179,154,0.28)] bg-[rgba(255,255,255,0.72)] px-3.5 py-2.5 text-center transition-colors hover:bg-[rgba(243,247,242,0.9)] cursor-pointer">
            <div className="flex flex-col items-center gap-1 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span className="text-[11px] font-medium">További {Math.max(0, catalog.length - matches.length)} ötlet</span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
