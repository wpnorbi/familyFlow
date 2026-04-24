"use client";

import RecipeImage from "@/components/etkezes/RecipeImage";
import { useEffect, useMemo, useState } from "react";
import { getBatchRecipe } from "@/lib/etkezes-data";
import { useMealData } from "@/hooks/useMealData";
import type { MealBatch, Recipe } from "@/types/etkezes";

const CARD_LIMIT = 3;
const MIN_HISTORY_FOR_PERSONALIZATION = 4;

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

    if (recipe.category === candidate.category) {
      score += 12 * weight;
    }

    const sharedTags = (candidate.tags ?? []).filter((tag) => (recipe.tags ?? []).includes(tag)).length;
    score += sharedTags * 6 * weight;

    if ((recipe.duration <= 30) === (candidate.duration <= 30)) {
      score += 5 * weight;
    }
  });

  if ((candidate.tags ?? []).includes("gyerekbarát")) score += 8;
  if ((candidate.tags ?? []).includes("maradékbarát")) score += 6;
  if ((candidate.tags ?? []).includes("2 napra elég")) score += 6;

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
    <article className="group overflow-hidden rounded-[18px] border border-surface-variant bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,243,238,0.93))] shadow-[0_10px_18px_-24px_rgba(34,27,19,0.18)] transition-all hover:border-primary/25 hover:shadow-[0_14px_22px_-24px_rgba(37,55,43,0.22)]">
      <div className="relative aspect-[4/2.55] overflow-hidden">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(18,24,20,0.12),rgba(18,24,20,0.02))]" />
        <div className="absolute top-2.5 right-2.5 rounded-full bg-white/90 p-1 text-on-surface shadow-sm">
          <span className="material-symbols-outlined text-[16px]">favorite_border</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h4 className="line-clamp-2 text-sm font-semibold leading-tight text-on-surface group-hover:text-primary transition-colors">
          {recipe.name}
        </h4>
        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {recipe.duration} perc
          </span>
          <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] font-bold text-on-primary-fixed-variant">
            {recipe.category}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-on-surface-variant line-clamp-1">{recipe.description}</p>
      </div>
    </article>
  );
}

function AiCard({ onGenerate }: { onGenerate?: () => void }) {
  const handleGenerate = onGenerate ?? (() => {});

  return (
    <button
      onClick={handleGenerate}
      className="relative overflow-hidden rounded-[18px] border border-primary/20 bg-[linear-gradient(135deg,rgba(178,200,177,0.6),rgba(226,235,222,0.72)_30%,rgba(255,255,255,0.96)_100%)] p-4 text-left shadow-[0_14px_24px_-26px_rgba(37,55,43,0.28)] transition-all hover:border-primary/30 hover:shadow-[0_18px_28px_-24px_rgba(37,55,43,0.34)] cursor-pointer"
    >
      <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -left-4 bottom-0 size-20 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative z-10 flex h-full flex-col gap-3">
        <div className="size-12 rounded-full border border-white/35 bg-white/18 backdrop-blur-md flex items-center justify-center text-on-primary-container shadow-sm">
          <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
        </div>
        <div>
          <h4 className="text-base font-bold text-on-background">AI Generálás</h4>
          <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant">
            Nem tetszenek az ajánlások? Kérj új ötleteket a mesterséges intelligenciától.
          </p>
        </div>
        <div className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-[0_12px_20px_-18px_rgba(51,69,55,0.55)]">
          <span className="material-symbols-outlined text-[16px]">refresh</span>
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
    <section className="rounded-[22px] border border-surface-variant bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,244,239,0.9))] px-4 py-3.5 shadow-[0_14px_24px_-24px_rgba(34,27,19,0.16)]">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-xs text-on-surface-variant">
          {recommendationState.personalized ? "A korábbi főzésekhez igazítva." : "Néhány gyorsan használható receptötlet."}
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {recommendationState.recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
        <AiCard onGenerate={onGenerate} />
      </div>
    </section>
  );
}
