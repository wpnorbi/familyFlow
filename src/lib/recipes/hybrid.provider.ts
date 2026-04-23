import { getLocalRecipeCatalog } from "@/lib/recipes/local.provider";
import { getHungarianWebRecipeCatalog } from "@/lib/recipes/hungarian-web.provider";
import { getUserImportedRecipes } from "@/lib/recipes/user-import.provider";
import type { Recipe } from "@/types/etkezes";

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
    ...localRecipes,
    ...hungarianRecipes,
    ...userImportedRecipes,
  ]).sort((a, b) => a.name.localeCompare(b.name, "hu"));
}
