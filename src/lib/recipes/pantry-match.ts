import type { Recipe } from "@/types/etkezes";

export interface PantryMatchResult {
  recipe: Recipe;
  matchedIngredients: string[];
  missingIngredients: string[];
  matchRatio: number;
  score: number;
}

function normalizeToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesIngredient(ingredient: string, pantryItems: string[]): boolean {
  const normalizedIngredient = normalizeToken(ingredient);

  return pantryItems.some((item) => {
    const normalizedItem = normalizeToken(item);
    return (
      normalizedIngredient === normalizedItem ||
      normalizedIngredient.includes(normalizedItem) ||
      normalizedItem.includes(normalizedIngredient)
    );
  });
}

export function normalizePantryItems(pantryItems: string[]): string[] {
  const uniqueItems = new Map<string, string>();

  pantryItems.forEach((item) => {
    const normalized = normalizeToken(item);
    if (!normalized || uniqueItems.has(normalized)) return;
    uniqueItems.set(normalized, item.trim());
  });

  return Array.from(uniqueItems.values());
}

export function rankRecipesForPantry(recipes: Recipe[], pantryItems: string[]): PantryMatchResult[] {
  const normalizedPantry = normalizePantryItems(pantryItems);
  const hasPantryItems = normalizedPantry.length > 0;

  const ranked = recipes.map((recipe) => {
    const matchedIngredients = recipe.ingredients.filter((ingredient) => matchesIngredient(ingredient, normalizedPantry));
    const missingIngredients = recipe.ingredients.filter((ingredient) => !matchesIngredient(ingredient, normalizedPantry));
    const ingredientCount = Math.max(recipe.ingredients.length, 1);
    const matchRatio = matchedIngredients.length / ingredientCount;

    let score = matchedIngredients.length * 24 - missingIngredients.length * 7;
    score += Math.round(matchRatio * 100);

    if ((recipe.tags ?? []).includes("kamrabarát")) score += 30;
    if ((recipe.tags ?? []).includes("gyors")) score += 10;
    if (recipe.duration <= 30) score += 8;
    if (recipe.duration <= 15) score += 5;

    if (!hasPantryItems) {
      score = 0;
      if ((recipe.tags ?? []).includes("kamrabarát")) score += 40;
      if ((recipe.tags ?? []).includes("gyors")) score += 25;
      if (recipe.duration <= 30) score += 12;
    }

    return {
      recipe,
      matchedIngredients,
      missingIngredients,
      matchRatio,
      score,
    };
  });

  return ranked.sort(
    (a, b) =>
      b.score - a.score ||
      b.matchRatio - a.matchRatio ||
      a.missingIngredients.length - b.missingIngredients.length ||
      a.recipe.duration - b.recipe.duration ||
      a.recipe.name.localeCompare(b.recipe.name, "hu"),
  );
}
