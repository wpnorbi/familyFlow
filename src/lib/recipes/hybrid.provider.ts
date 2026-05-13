import { getLocalRecipeCatalog } from "@/lib/recipes/local.provider";
import { getHungarianWebRecipeCatalog } from "@/lib/recipes/hungarian-web.provider";
import { getUserImportedRecipes } from "@/lib/recipes/user-import.provider";
import type { Recipe } from "@/types/etkezes";

function isPriorityImportedRecipe(recipe: Recipe): boolean {
  return recipe.source === "user-import" || (recipe.tags ?? []).includes("lidl");
}

function dedupeRecipes(recipes: Recipe[]): Recipe[] {
  const byId = new Map<string, Recipe>();

  for (const recipe of recipes) {
    byId.set(recipe.id, recipe);
  }

  return Array.from(byId.values());
}

export async function getHybridRecipeCatalog(): Promise<Recipe[]> {
  const localRecipes = getLocalRecipeCatalog();
  const hungarianRecipes = getHungarianWebRecipeCatalog();
  const userImportedRecipes = getUserImportedRecipes();

  return dedupeRecipes([
    ...userImportedRecipes,
    ...localRecipes,
    ...hungarianRecipes,
  ]).sort((a, b) => {
    const priorityDiff = Number(isPriorityImportedRecipe(b)) - Number(isPriorityImportedRecipe(a));
    if (priorityDiff !== 0) return priorityDiff;
    return a.name.localeCompare(b.name, "hu");
  });
}
