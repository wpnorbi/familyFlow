import { getHybridRecipeCatalog } from "@/lib/recipes/hybrid.provider";
import {
  MEAL_TYPE_OPTIONS,
  TIME_BUCKET_OPTIONS,
  getRecipeMealType,
  getRecipeTimeBucket,
  isKidFriendlyRecipe,
  isQuickRecipe,
  matchesRecipeTaxonomy,
  type RecipeMealType,
  type RecipeTimeBucket,
} from "@/lib/recipes/recipe-taxonomy";
import type { Recipe } from "@/types/etkezes";

const MIN_RECIPE_RESULTS = 20;

function isPriorityImportedRecipe(recipe: Recipe): boolean {
  return recipe.source === "user-import" || (recipe.tags ?? []).includes("lidl");
}

function matchesProtein(recipe: Recipe, protein: Recipe["protein"] | "mind"): boolean {
  return protein === "mind" || recipe.protein === protein;
}

function matchesSearch(recipe: Recipe, search: string): boolean {
  if (!search) return true;

  const haystack = [
    recipe.name,
    recipe.description,
    recipe.category,
    recipe.sourceName ?? "",
    recipe.area ?? "",
    recipe.familyNotes ?? "",
    recipe.kidFriendlyNotes ?? "",
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
    mealType: RecipeMealType | "mind";
    timeBucket: RecipeTimeBucket | "mind";
    quickOnly: boolean;
    childFriendly: boolean;
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

  if (filters.mealType === "mind") {
    score += 4;
  } else if (getRecipeMealType(recipe) === filters.mealType) {
    score += 80;
  }

  if (filters.timeBucket === "mind") {
    score += 4;
  } else if (getRecipeTimeBucket(recipe) === filters.timeBucket) {
    score += 70;
  }

  if (filters.quickOnly && isQuickRecipe(recipe)) score += 80;
  if (filters.childFriendly && isKidFriendlyRecipe(recipe)) score += 100;

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

  if (isPriorityImportedRecipe(recipe)) {
    score += 160;
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
    const mealType = (searchParams.get("mealType") ?? "mind") as RecipeMealType | "mind";
    const timeBucket = (searchParams.get("timeBucket") ?? "mind") as RecipeTimeBucket | "mind";
    const quickOnly = searchParams.get("quickOnly") === "true";
    const childFriendly = searchParams.get("childFriendly") === "true";
    const limitParam = searchParams.get("limit");
    const maxDurationParam = searchParams.get("maxDuration");
    const maxDuration = maxDurationParam === "Infinity" || !maxDurationParam ? Infinity : Number(maxDurationParam);
    const resultLimit = limitParam === "all" ? Infinity : Number(limitParam ?? 180);

    const catalog = await getHybridRecipeCatalog();

    const baseFiltered = catalog
      .filter((recipe) => recipe.duration <= maxDuration)
      .filter((recipe) =>
        matchesRecipeTaxonomy(recipe, {
          protein,
          mealType,
          timeBucket,
          quickOnly,
          childFriendlyOnly: childFriendly,
        }),
      )
      .filter((recipe) => matchesSearch(recipe, search))
      .filter((recipe) => matchesProtein(recipe, protein));

    const categories = Array.from(new Set(baseFiltered.map((recipe) => recipe.category))).sort((a, b) =>
      a.localeCompare(b, "hu"),
    );
    const tags = Array.from(new Set(baseFiltered.flatMap((recipe) => recipe.tags ?? []))).sort((a, b) =>
      a.localeCompare(b, "hu"),
    );

    const strictRecipes = baseFiltered
      .filter((recipe) => category === "mind" || recipe.category === category)
      .filter((recipe) => tag === "mind" || (recipe.tags ?? []).includes(tag))
      .sort((a, b) => {
        const priorityDiff = Number(isPriorityImportedRecipe(b)) - Number(isPriorityImportedRecipe(a));
        if (priorityDiff !== 0) return priorityDiff;
        return a.duration - b.duration || a.name.localeCompare(b.name, "hu");
      });

    let recipes = strictRecipes.slice(0, resultLimit);
    let usedFallback = false;

    if (!search && strictRecipes.length < MIN_RECIPE_RESULTS) {
      const strictIds = new Set(strictRecipes.map((recipe) => recipe.id));

      const fallbackRecipes = catalog
        .filter((recipe) => !strictIds.has(recipe.id))
        .map((recipe) => ({
          recipe,
          score: getRelaxedScore(recipe, { protein, category, tag, maxDuration, mealType, timeBucket, quickOnly, childFriendly }),
        }))
        .filter((item) =>
          matchesRecipeTaxonomy(item.recipe, {
            protein,
            mealType,
            timeBucket,
            quickOnly,
            childFriendlyOnly: childFriendly,
          }),
        )
        .filter((item) => item.score > 0)
        .sort(
          (a, b) =>
            b.score - a.score ||
            a.recipe.duration - b.recipe.duration ||
            a.recipe.name.localeCompare(b.recipe.name, "hu"),
        )
        .map((item) => item.recipe);

      recipes = [...strictRecipes, ...fallbackRecipes].slice(0, resultLimit);
      usedFallback = recipes.length > strictRecipes.length;
    }

    if (Number.isFinite(resultLimit) && recipes.length > MIN_RECIPE_RESULTS) {
      recipes = recipes.slice(0, resultLimit);
    }

    return Response.json({
      recipes,
      categories,
      tags,
      mealTypes: MEAL_TYPE_OPTIONS,
      timeBuckets: TIME_BUCKET_OPTIONS,
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
