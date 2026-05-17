"use client";

import { useEffect } from "react";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { getRecipeMealTypeLabel, isKidFriendlyRecipe, isQuickRecipe } from "@/lib/recipes/recipe-taxonomy";
import type { Recipe } from "@/types/etkezes";

interface Props {
  recipe: Recipe;
  onClose: () => void;
  onPlan: (recipe: Recipe) => void;
  onQuickSchedule: (recipe: Recipe) => void;
  onStartCooking: (recipe: Recipe) => void;
}

function Icon({ name, className = "text-[18px]" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function MetaChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-[rgba(255,251,244,0.9)] px-3 py-2 text-[12px] font-bold text-(--ff-text) shadow-[0_12px_24px_-20px_rgba(61,49,34,0.24)]">
      <Icon name={icon} className="text-[16px] text-(--ff-primary)" />
      {label}
    </span>
  );
}

export default function RecipeDetailModal({
  recipe,
  onClose,
  onPlan,
  onQuickSchedule,
  onStartCooking,
}: Props) {
  const isKidFriendly = isKidFriendlyRecipe(recipe);
  const isQuick = isQuickRecipe(recipe);
  const ingredients = recipe.ingredientGroups?.length
    ? recipe.ingredientGroups
    : [{ name: "Hozzávalók", items: recipe.ingredients }];

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-[rgba(20,22,18,0.44)] p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <button aria-label="Bezárás" className="absolute inset-0 cursor-default" onClick={onClose} />

      <article className="relative flex max-h-dvh w-full max-w-5xl flex-col overflow-hidden rounded-t-[34px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(246,235,216,0.94))] shadow-[0_32px_90px_-42px_rgba(36,28,18,0.46)] sm:max-h-[92vh] sm:rounded-[36px]">

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">

          {/* Image panel */}
          <div className="relative min-h-60 md:min-h-full">
            <RecipeImage recipe={recipe} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,15,10,0.10),rgba(20,15,10,0.52))]" />

            {/* Close — top right, always visible */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-[rgba(255,251,244,0.90)] text-(--ff-text) shadow-[0_14px_28px_-16px_rgba(31,22,14,0.36)]"
            >
              <Icon name="close" className="text-[20px]" />
            </button>

            <div className="absolute bottom-5 left-5 right-5">
              <div className="flex flex-wrap gap-2">
                <MetaChip icon="schedule" label={`${recipe.duration} perc`} />
                <MetaChip icon="restaurant" label={getRecipeMealTypeLabel(recipe)} />
                {isKidFriendly && <MetaChip icon="sentiment_satisfied" label="Gyerekbarát" />}
                {isQuick && <MetaChip icon="bolt" label="Gyors" />}
              </div>
            </div>
          </div>

          {/* Content panel */}
          <div className="min-h-0 overflow-y-auto px-5 py-6 sm:px-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-(--ff-text-soft)">
              {recipe.sourceName ?? "Family Flow recept"}
            </p>
            <h2 className="mt-2 text-[26px] font-semibold leading-[1.05] tracking-[-0.04em] text-(--ff-text) sm:text-[34px]">
              {recipe.name}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-(--ff-text-muted)">
              {recipe.description}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] bg-[rgba(255,249,237,0.78)] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--ff-text-soft)">Idő</p>
                <p className="mt-1 text-[15px] font-extrabold text-(--ff-text)">{recipe.duration} perc</p>
              </div>
              <div className="rounded-[22px] bg-[rgba(238,243,231,0.72)] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--ff-text-soft)">Típus</p>
                <p className="mt-1 text-[15px] font-extrabold text-(--ff-text)">{getRecipeMealTypeLabel(recipe)}</p>
              </div>
              <div className="rounded-[22px] bg-[rgba(255,240,227,0.74)] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--ff-text-soft)">Adag</p>
                <p className="mt-1 text-[15px] font-extrabold text-(--ff-text)">{recipe.servings ?? 4} adag</p>
              </div>
            </div>

            <section className="mt-6">
              <h3 className="text-[17px] font-extrabold text-(--ff-text)">Hozzávalók</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {ingredients.map((group) => (
                  <div
                    key={group.name}
                    className="rounded-3xl border border-white/70 bg-[rgba(255,251,244,0.72)] p-4"
                  >
                    <h4 className="text-[13px] font-extrabold text-(--ff-primary)">{group.name}</h4>
                    <ul className="mt-3 space-y-2">
                      {group.items.map((item, index) => (
                        <li
                          key={`${group.name}-${item}-${index}`}
                          className="flex gap-2 text-[13px] font-semibold leading-snug text-(--ff-text-muted)"
                        >
                          <Icon name="check_circle" className="mt-0.5 text-[16px] text-(--ff-primary-soft)" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h3 className="text-[17px] font-extrabold text-(--ff-text)">Elkészítés</h3>
              <ol className="mt-3 space-y-3">
                {recipe.instructions.map((step, index) => (
                  <li
                    key={`${recipe.id}-step-${index}`}
                    className="grid grid-cols-[34px_1fr] gap-3 rounded-[22px] bg-[rgba(255,249,237,0.72)] p-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--ff-primary) text-[12px] font-extrabold text-(--ff-text-inverse)">
                      {index + 1}
                    </span>
                    <p className="text-[13px] font-medium leading-relaxed text-(--ff-text)">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        {/* Action bar
            Mobile:  [Hozzáadás a tervhez — primary]  [Főzés | Részletes]
            Desktop: [Részletes tervezés]  [Főzés]  [Hozzáadás — primary]
        */}
        <div className="shrink-0 border-t border-white/70 bg-[rgba(255,251,244,0.92)] px-5 py-4 backdrop-blur">

          {/* Mobile layout */}
          <div className="flex flex-col gap-2.5 sm:hidden">
            <button
              onClick={() => onQuickSchedule(recipe)}
              className="ff-button-warm flex w-full items-center justify-center gap-2 px-5 py-4 text-[15px] font-bold"
            >
              <Icon name="add_circle" className="text-[18px]" />
              Hozzáadás a tervhez
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={() => onStartCooking(recipe)}
                className="ff-button-secondary flex-1 px-4 py-3 text-[13px] font-semibold"
              >
                Főzés indítása
              </button>
              <button
                onClick={() => onPlan(recipe)}
                className="ff-button-secondary flex-1 px-4 py-3 text-[13px] font-semibold"
              >
                Részletes tervezés
              </button>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden items-center justify-end gap-3 sm:flex">
            <button
              onClick={() => onPlan(recipe)}
              className="ff-button-secondary px-5 py-3 text-sm font-bold"
            >
              Részletes tervezés
            </button>
            <button
              onClick={() => onStartCooking(recipe)}
              className="ff-button-secondary px-5 py-3 text-sm font-bold"
            >
              Főzés indítása
            </button>
            <button
              onClick={() => onQuickSchedule(recipe)}
              className="ff-button-primary px-6 py-3 text-sm font-bold"
            >
              Hozzáadás a tervhez
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
