import { getHybridRecipeCatalog } from "@/lib/recipes/hybrid.provider";
import type { Recipe } from "@/types/etkezes";

const MIN_RECIPE_RESULTS = 20;

function matchesProtein(recipe: Recipe, protein: Recipe["protein"] | "mind"): boolean {
  return protein === "mind" || recipe.protein === protein;
}

function matchesSearch(recipe: Recipe, search: string): boolean {
  if (!search) return true;

  const haystack = [
    recipe.name,
    recipe.description,
    recipe.category,
    recipe.area ?? "",
    ...(recipe.ingredients ?? []),
    ...(recipe.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(search.toLowerCase());
}

function getRelaxedScore(
  recipe: Recipe,
  filters: {
    protein: Recipe["protein"] | "mind";
    category: string;
    tag: string;
    maxDuration: number;
  },
): number {
  let score = 0;

  if (filters.protein === "mind") {
    score += 8;
  } else if (recipe.protein === filters.protein) {
    score += 120;
  }

  if (filters.category === "mind") {
    score += 4;
  } else if (recipe.category === filters.category) {
    score += 36;
  }

  if (filters.tag === "mind") {
    score += 2;
  } else if ((recipe.tags ?? []).includes(filters.tag)) {
    score += 30;
  }

  if (!Number.isFinite(filters.maxDuration)) {
    score += 30;
  } else if (recipe.duration <= filters.maxDuration) {
    score += 90;
  } else if (recipe.duration <= filters.maxDuration + 10) {
    score += 64;
  } else if (recipe.duration <= filters.maxDuration + 20) {
    score += 46;
  } else if (recipe.duration <= filters.maxDuration + 35) {
    score += 24;
  }

  if ((recipe.tags ?? []).includes("gyors")) {
    if (filters.maxDuration <= 15) score += 18;
    if (filters.maxDuration > 15 && filters.maxDuration <= 30) score += 10;
  }

  return score;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const protein = (searchParams.get("protein") ?? "mind") as Recipe["protein"] | "mind";
    const search = (searchParams.get("search") ?? "").trim();
    const category = (searchParams.get("category") ?? "mind").trim();
    const tag = (searchParams.get("tag") ?? "mind").trim();
    const maxDurationParam = searchParams.get("maxDuration");
    const maxDuration = maxDurationParam === "Infinity" || !maxDurationParam ? Infinity : Number(maxDurationParam);

    const catalog = await getHybridRecipeCatalog();

    const baseFiltered = catalog
      .filter((recipe) => recipe.duration <= maxDuration)
      .filter((recipe) => matchesProtein(recipe, protein))
      .filter((recipe) => matchesSearch(recipe, search));

    const categories = Array.from(new Set(baseFiltered.map((recipe) => recipe.category))).sort((a, b) =>
      a.localeCompare(b, "hu"),
    );
    const tags = Array.from(new Set(baseFiltered.flatMap((recipe) => recipe.tags ?? []))).sort((a, b) =>
      a.localeCompare(b, "hu"),
    );

    const strictRecipes = baseFiltered
      .filter((recipe) => category === "mind" || recipe.category === category)
      .filter((recipe) => tag === "mind" || (recipe.tags ?? []).includes(tag))
      .sort((a, b) => a.duration - b.duration || a.name.localeCompare(b.name, "hu"));

    let recipes = strictRecipes.slice(0, 180);
    let usedFallback = false;

    if (!search && strictRecipes.length < MIN_RECIPE_RESULTS) {
      const strictIds = new Set(strictRecipes.map((recipe) => recipe.id));

      const fallbackRecipes = catalog
        .filter((recipe) => !strictIds.has(recipe.id))
        .map((recipe) => ({
          recipe,
          score: getRelaxedScore(recipe, { protein, category, tag, maxDuration }),
        }))
        .filter((item) => item.score > 0)
        .sort(
          (a, b) =>
            b.score - a.score ||
            a.recipe.duration - b.recipe.duration ||
            a.recipe.name.localeCompare(b.recipe.name, "hu"),
        )
        .map((item) => item.recipe);

      recipes = [...strictRecipes, ...fallbackRecipes].slice(0, 180);
      usedFallback = recipes.length > strictRecipes.length;
    }

    if (recipes.length > MIN_RECIPE_RESULTS) {
      recipes = recipes.slice(0, 180);
    }

    return Response.json({
      recipes,
      categories,
      tags,
      exactMatchCount: strictRecipes.length,
      usedFallback,
    });
  } catch {
    return Response.json(
      { error: "A receptforrások most nem elérhetők." },
      { status: 502 },
    );
  }
}
