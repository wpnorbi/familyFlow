"use client";

import RecipeImage from "@/components/etkezes/RecipeImage";
import { useEffect, useMemo, useState } from "react";
import { getBatchRecipe } from "@/lib/etkezes-data";
import { useMealData } from "@/hooks/useMealData";
import { getRecipeMealType, isKidFriendlyRecipe, isQuickRecipe } from "@/lib/recipes/recipe-taxonomy";
import type { MealBatch, Recipe } from "@/types/etkezes";

const CARD_LIMIT = 3;
const MIN_HISTORY_FOR_PERSONALIZATION = 4;

function isPriorityImportedRecipe(recipe: Recipe): boolean {
  return recipe.source === "user-import" || (recipe.tags ?? []).includes("lidl");
}

function toDaySeed(): number {
  const today = new Date();
  return Number(`${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`);
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return hash;
}

function getDeterministicRandomOrder(recipes: Recipe[]): Recipe[] {
  const seed = toDaySeed();
  return [...recipes].sort((a, b) => {
    const priorityDiff = Number(isPriorityImportedRecipe(b)) - Number(isPriorityImportedRecipe(a));
    if (priorityDiff !== 0) return priorityDiff;
    const aScore = (hashString(a.id) + seed) % 2147483647;
    const bScore = (hashString(b.id) + seed) % 2147483647;
    return aScore - bScore || a.name.localeCompare(b.name, "hu");
  });
}

function getHistoryRecipes(batches: MealBatch[]): Recipe[] {
  return [...batches]
    .sort((a, b) => b.cookDate.localeCompare(a.cookDate))
    .map((batch) => getBatchRecipe(batch))
    .filter((recipe): recipe is Recipe => recipe !== undefined);
}

function scoreRecipe(candidate: Recipe, history: Recipe[]): number {
  let score = 0;

  history.forEach((recipe, index) => {
    const weight = Math.max(1, history.length - index);

    if (recipe.id === candidate.id) {
      score -= index < 2 ? 240 : 80;
    }

    if (recipe.protein === candidate.protein) {
      score += 24 * weight;
    }

    if (getRecipeMealType(recipe) === getRecipeMealType(candidate)) {
      score += 12 * weight;
    }

    const sharedTags = (candidate.tags ?? []).filter((tag) => (recipe.tags ?? []).includes(tag)).length;
    score += sharedTags * 6 * weight;

    if (isQuickRecipe(recipe) === isQuickRecipe(candidate)) {
      score += 5 * weight;
    }
  });

  if (isKidFriendlyRecipe(candidate)) score += 8;
  if ((candidate.tags ?? []).includes("maradékbarát")) score += 6;
  if ((candidate.tags ?? []).includes("2 napra elég")) score += 6;
  if (isPriorityImportedRecipe(candidate)) score += 90;

  return score;
}

function getRecommendedRecipes(catalog: Recipe[], batches: MealBatch[]): { recipes: Recipe[]; personalized: boolean } {
  const history = getHistoryRecipes(batches);

  if (history.length < MIN_HISTORY_FOR_PERSONALIZATION) {
    return {
      recipes: getDeterministicRandomOrder(catalog).slice(0, CARD_LIMIT),
      personalized: false,
    };
  }

  const recentlyCookedIds = new Set(history.slice(0, 3).map((recipe) => recipe.id));

  const ranked = [...catalog]
    .filter((recipe) => !recentlyCookedIds.has(recipe.id))
    .map((recipe) => ({
      recipe,
      score: scoreRecipe(recipe, history),
    }))
    .sort((a, b) => b.score - a.score || a.recipe.duration - b.recipe.duration || a.recipe.name.localeCompare(b.recipe.name, "hu"))
    .map((item) => item.recipe);

  const topRecipes = ranked.slice(0, CARD_LIMIT);
  if (topRecipes.length >= CARD_LIMIT) {
    return { recipes: topRecipes, personalized: true };
  }

  const usedIds = new Set(topRecipes.map((recipe) => recipe.id));
  const fillers = getDeterministicRandomOrder(catalog).filter((recipe) => !usedIds.has(recipe.id));

  return {
    recipes: [...topRecipes, ...fillers].slice(0, CARD_LIMIT),
    personalized: true,
  };
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className="ff-glass-card-subtle group overflow-hidden rounded-[18px] transition-all hover:border-[rgba(55,67,50,0.18)] hover:shadow-[var(--ff-shadow-soft)]">
      <div className="relative aspect-[4/2.2] overflow-hidden">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(18,24,20,0.14),rgba(18,24,20,0.02))]" />
        <div className="ff-chip absolute right-2.5 top-2.5 p-1 text-[var(--ff-text)] shadow-sm">
          <span className="material-symbols-outlined text-[16px]">favorite_border</span>
        </div>
        {recipe.sourceName && (
          <div className="absolute left-2.5 top-2.5 rounded-full bg-[rgba(255,249,237,0.92)] px-2.5 py-1 text-[10px] font-semibold text-[var(--ff-caramel-strong)] shadow-sm">
            {recipe.sourceName}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.25 p-2.5 pb-2">
        <h4 className="line-clamp-1 text-[13px] font-semibold leading-tight text-[var(--ff-text)] transition-colors group-hover:text-[var(--ff-primary)]">
          {recipe.name}
        </h4>
        <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-[var(--ff-text-muted)]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {recipe.duration} perc
          </span>
          <span className="ff-chip px-2 py-0.5 text-[10px] font-bold text-[var(--ff-primary)]">
            {recipe.category}
          </span>
        </div>
        <p className="line-clamp-1 text-[11px] leading-snug text-[var(--ff-text-muted)]">{recipe.description}</p>
      </div>
    </article>
  );
}

function AiCard({ onGenerate }: { onGenerate?: () => void }) {
  const handleGenerate = onGenerate ?? (() => {});

  return (
    <button
      onClick={handleGenerate}
      className="ff-glass-card-subtle relative overflow-hidden rounded-[18px] p-4 text-left transition-all hover:border-[rgba(55,67,50,0.18)] hover:shadow-[var(--ff-shadow-soft)] cursor-pointer"
    >
      <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/18 blur-2xl" />
      <div className="absolute -left-4 bottom-0 size-20 rounded-full bg-primary/6 blur-2xl" />
      <div className="relative z-10 flex h-full flex-col gap-3">
        <div className="ff-chip flex size-10 items-center justify-center bg-white/36 text-[var(--ff-primary)] shadow-none">
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
        </div>
        <div>
          <h4 className="text-[15px] font-semibold text-[var(--ff-text)]">Nem találtál megfelelőt?</h4>
          <p className="mt-1 text-[11px] leading-snug text-[var(--ff-text-muted)]">
            Kérj új ötletet a meglévő alapanyagokból.
          </p>
        </div>
        <div className="ff-button-secondary mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold shadow-none">
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          Mondj mást
        </div>
      </div>
    </button>
  );
}

interface Props {
  onGenerate?: () => void;
}

export default function RecipeRecommendations({ onGenerate }: Props) {
  const { mealBatches, hydrated } = useMealData();
  const [catalog, setCatalog] = useState<Recipe[]>([]);

  useEffect(() => {
    let isCancelled = false;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/recipes/search?protein=mind&maxDuration=Infinity&search=&category=mind&tag=mind", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = await response.json() as { recipes?: Recipe[] };
        if (!isCancelled && Array.isArray(payload.recipes)) {
          setCatalog(payload.recipes);
        }
      } catch {
        // Ha nincs receptkatalógus, ez a blokk csendesen nem jelenik meg.
      }
    }

    void loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, []);

  const recommendationState = useMemo(() => {
    if (!hydrated || catalog.length === 0) {
      return { recipes: [] as Recipe[], personalized: false };
    }

    return getRecommendedRecipes(catalog, mealBatches);
  }, [catalog, hydrated, mealBatches]);

  if (!recommendationState.recipes.length) {
    return null;
  }

  return (
    <section className="ff-glass-card rounded-[22px] px-4 py-3">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-[11px] leading-snug text-[var(--ff-text-muted)]">Gyors ötletek a hét indításához.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {recommendationState.recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
        <AiCard onGenerate={onGenerate} />
      </div>
    </section>
  );
}
