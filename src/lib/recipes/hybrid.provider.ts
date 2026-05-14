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
  const userImportedRecipes = getUserImportedRecipes();

  return dedupeRecipes(userImportedRecipes).sort((a, b) => a.name.localeCompare(b.name, "hu"));
}
