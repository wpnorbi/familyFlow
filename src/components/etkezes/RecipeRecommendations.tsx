"use client";

import { useEffect, useMemo, useState } from "react";
import { getBatchRecipe } from "@/lib/etkezes-data";
import { useMealData } from "@/hooks/useMealData";
import type { MealBatch, Recipe } from "@/types/etkezes";

const CARD_LIMIT = 4;
const MIN_HISTORY_FOR_PERSONALIZATION = 4;

const PROTEIN_ICONS: Record<string, string> = {
  csirke: "egg_alt",
  hal: "set_meal",
  marha: "lunch_dining",
  sertés: "nutrition",
  vegetáriánus: "eco",
  egyéb: "restaurant",
};

const PROTEIN_GRADIENTS: Record<string, string> = {
  csirke: "from-amber-100 to-amber-200",
  hal: "from-blue-100 to-blue-200",
  marha: "from-red-100 to-red-200",
  sertés: "from-pink-100 to-rose-200",
  vegetáriánus: "from-green-100 to-green-200",
  egyéb: "from-purple-100 to-purple-200",
};

const PROTEIN_ICON_COLORS: Record<string, string> = {
  csirke: "text-amber-500",
  hal: "text-blue-500",
  marha: "text-red-500",
  sertés: "text-pink-500",
  vegetáriánus: "text-green-500",
  egyéb: "text-purple-500",
};

const PROTEIN_LABELS: Record<string, string> = {
  csirke: "Csirke",
  hal: "Hal",
  marha: "Marha",
  sertés: "Sertés",
  vegetáriánus: "Vegetáriánus",
  egyéb: "Egyéb",
};

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
    <div className="group cursor-pointer">
      <div
        className={`aspect-[4/5] rounded-2xl mb-3 relative bg-gradient-to-br ${PROTEIN_GRADIENTS[recipe.protein]} flex items-center justify-center overflow-hidden border border-surface-variant/30 group-hover:shadow-lg transition-shadow`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.45),transparent_40%)]" />
        <span
          className={`material-symbols-outlined text-[90px] ${PROTEIN_ICON_COLORS[recipe.protein]} opacity-30 group-hover:opacity-45 group-hover:scale-110 transition-all duration-500`}
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 100" }}
        >
          {PROTEIN_ICONS[recipe.protein]}
        </span>

        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-[13px] text-surface-tint">timer</span>
          <span className="text-xs font-bold text-on-background">{recipe.duration} p</span>
        </div>

        <div className={`absolute bottom-3 left-3 bg-gradient-to-r ${PROTEIN_GRADIENTS[recipe.protein]} px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-white/50`}>
          <span className={`material-symbols-outlined text-[13px] ${PROTEIN_ICON_COLORS[recipe.protein]}`}>
            {PROTEIN_ICONS[recipe.protein]}
          </span>
          <span className={`text-xs font-bold ${PROTEIN_ICON_COLORS[recipe.protein]}`}>
            {PROTEIN_LABELS[recipe.protein]}
          </span>
        </div>
      </div>

      <h4 className="font-semibold text-on-background mb-1 leading-snug group-hover:text-primary transition-colors text-sm">
        {recipe.name}
      </h4>
      <p className="text-xs text-outline mb-1">{recipe.category}</p>
      <p className="text-xs text-on-surface-variant line-clamp-2">{recipe.description}</p>
    </div>
  );
}

export default function RecipeRecommendations() {
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
        // Csendes fallback: egyszerűen nem renderelünk ajánlókat, ha a catalog route nem elérhető.
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
    <section>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h3 className="text-xl font-bold text-on-background">Mit főzzünk legközelebb?</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            {recommendationState.personalized
              ? "A korábbi főzéseid alapján valószínűleg ezeket szeretnéd legközelebb."
              : "Még kevés a főzési előzmény, ezért most valódi receptekből válogatunk neked."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {recommendationState.recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}

        <div className="group">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-3 relative bg-surface-container flex items-center justify-center border-2 border-dashed border-outline-variant">
            <div className="text-center p-6">
              <span className="material-symbols-outlined text-4xl text-primary mb-2 block">grocery</span>
              <h4 className="font-semibold text-on-background mb-2 text-sm">Mi van itthon?</h4>
              <p className="text-xs text-outline leading-relaxed">
                Következő panel: hozzávalókból ajánl receptet a kamrád alapján.
              </p>
            </div>
          </div>
          <p className="font-semibold text-on-surface-variant text-sm">Új panel hamarosan</p>
          <p className="text-xs text-outline">Alapanyag alapú ajánló</p>
        </div>
      </div>
    </section>
  );
}
