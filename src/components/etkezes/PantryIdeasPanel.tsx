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
      className="flex items-center gap-3 rounded-[18px] border border-surface-variant/70 bg-white px-3 py-3 text-left shadow-sm transition-all hover:border-primary/20 hover:shadow-md cursor-pointer"
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-[14px]">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
      </div>
      <div className="flex min-w-0 flex-col">
        <h4 className="line-clamp-2 text-sm font-semibold leading-tight text-on-surface">{recipe.name}</h4>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-on-surface-variant">
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
    <section className="rounded-[32px] border border-surface-variant bg-surface-container px-5 py-5 shadow-sm md:col-span-3">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-on-surface">
            <div className="rounded-full bg-surface-container-lowest p-2 shadow-sm text-primary">
              <span className="material-symbols-outlined">kitchen</span>
            </div>
            <h3 className="text-[18px] font-semibold">Főzz abból, ami van</h3>
          </div>
          <span className="text-sm text-on-surface-variant">{pantryItems.length} alapanyag</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2.5 lg:flex-row">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Adj hozzá alapanyagot"
              className="min-w-0 flex-1 rounded-full border border-surface-variant bg-white px-4 py-2.5 text-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary/35"
            />
            <button
              onClick={() => void addItem(draft)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Hozzáadom
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleQuickItems.map((item) => (
              <button
                key={item}
                onClick={() => void addItem(item)}
                className="rounded-full border border-surface-variant bg-white px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:border-primary/20 cursor-pointer"
              >
                + {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {matches.map((match) => (
            <MatchCard
              key={match.recipe.id}
              recipe={match.recipe}
              missingCount={match.missingIngredients.length}
              onChooseRecipe={onChooseRecipe}
            />
          ))}

          <button className="flex items-center justify-center rounded-[18px] border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-3 text-center transition-colors hover:bg-surface-variant cursor-pointer">
            <div className="flex flex-col items-center gap-1 text-on-surface-variant">
              <span className="material-symbols-outlined">search</span>
              <span className="text-xs font-medium">További {Math.max(0, catalog.length - matches.length)} ötlet</span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
