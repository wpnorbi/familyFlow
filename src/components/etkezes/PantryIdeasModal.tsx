"use client";

import { useMemo, useState } from "react";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { normalizePantryItems, rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import type { Recipe } from "@/types/etkezes";

interface Props {
  pantryItems: string[];
  catalog: Recipe[];
  onClose: () => void;
  onUpdatePantryItems: (nextPantryItems: string[]) => void | Promise<void>;
  onChooseRecipe: (recipe: Recipe) => void;
}

function percentLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function PantryIdeasModal({ pantryItems, catalog, onClose, onUpdatePantryItems, onChooseRecipe }: Props) {
  const [draftValue, setDraftValue] = useState("");
  const [pendingItems, setPendingItems] = useState<string[]>(pantryItems);

  const rankedRecipes = useMemo(
    () => rankRecipesForPantry(catalog, pendingItems).slice(0, 18),
    [catalog, pendingItems],
  );

  async function persist(nextItems: string[]) {
    const normalizedItems = normalizePantryItems(nextItems);
    setPendingItems(normalizedItems);
    await onUpdatePantryItems(normalizedItems);
  }

  async function addDraftItem() {
    const value = draftValue.trim();
    if (!value) return;
    await persist([...pendingItems, value]);
    setDraftValue("");
  }

  async function removeItem(item: string) {
    await persist(pendingItems.filter((current) => current !== item));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-end">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="ff-modal-shell relative z-10 flex h-[100dvh] w-full max-w-3xl flex-col border-l border-[var(--ff-glass-border)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--ff-card-border)] px-5 py-5 sm:px-6">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--ff-text-soft)]">Kamra alapú ajánló</p>
            <h2 className="text-2xl font-semibold text-[var(--ff-text)]">Mi van itthon?</h2>
            <p className="mt-1 text-sm text-[var(--ff-text-muted)]">
              Adj hozzá alapanyagokat, és az app rangsorolja, melyik recept áll hozzád a legközelebb.
            </p>
          </div>
          <button onClick={onClose} className="ff-icon-button flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(255,240,227,0.7)] cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 flex flex-col gap-6">
          <section className="ff-glass-card rounded-3xl p-4 sm:p-5">
            <p className="mb-3 text-sm font-semibold text-[var(--ff-text)]">Otthoni alapanyagok</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void addDraftItem();
                  }
                }}
                placeholder="pl. tej, rizs, tojás, csirkemell"
                className="ff-input flex-1 rounded-2xl px-4 py-3 text-sm"
              />
              <button
                onClick={() => void addDraftItem()}
                className="ff-button-primary rounded-2xl px-4 py-3 text-sm font-semibold cursor-pointer"
              >
                Hozzáadom
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {pendingItems.length > 0 ? pendingItems.map((item) => (
                <button
                  key={item}
                  onClick={() => void removeItem(item)}
                  className="ff-chip inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium hover:bg-[rgba(255,240,227,0.72)] transition-colors cursor-pointer"
                >
                  {item}
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )) : (
                <p className="text-sm text-[var(--ff-text-muted)]">Adj hozzá pár alapanyagot, hogy pontosabb legyen az ajánló.</p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-on-surface">Ajánlott receptek</p>
                <p className="text-sm text-on-surface-variant">
                  A több egyező hozzávaló és a kevesebb hiányzó alapanyag kerül előre.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rankedRecipes.map((match) => (
                <article
                  key={match.recipe.id}
                  className="rounded-3xl border border-surface-variant/35 bg-surface-container-low overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[16/10]">
                    <RecipeImage recipe={match.recipe} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-on-surface">
                      {match.matchedIngredients.length}/{match.recipe.ingredients.length} megvan
                    </div>
                    <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-on-surface">
                      {percentLabel(match.matchRatio)}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-on-surface border border-surface-variant/40">
                          {match.recipe.duration} perc
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-on-surface border border-surface-variant/40">
                          {match.recipe.category}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-on-surface">{match.recipe.name}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant line-clamp-2">{match.recipe.description}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-outline mb-2">Megvan</p>
                        <div className="flex flex-wrap gap-1.5">
                          {match.matchedIngredients.length > 0 ? match.matchedIngredients.slice(0, 5).map((ingredient) => (
                            <span
                              key={ingredient}
                              className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                            >
                              {ingredient}
                            </span>
                          )) : (
                            <span className="text-xs text-on-surface-variant">Még nincs egyező hozzávaló.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-outline mb-2">Hiányzik még</p>
                        <div className="flex flex-wrap gap-1.5">
                          {match.missingIngredients.length > 0 ? match.missingIngredients.slice(0, 5).map((ingredient) => (
                            <span
                              key={ingredient}
                              className="rounded-full border border-secondary-fixed-dim/40 bg-secondary-fixed/25 px-2.5 py-1 text-[11px] font-medium text-on-surface"
                            >
                              {ingredient}
                            </span>
                          )) : (
                            <span className="text-xs text-primary font-semibold">Minden megvan hozzá.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2">
                      <button
                        onClick={() => onChooseRecipe(match.recipe)}
                        className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        Ezt főzném
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
