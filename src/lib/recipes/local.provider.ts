import { RECIPES } from "@/lib/etkezes-data";
import type { Recipe } from "@/types/etkezes";

export function getLocalRecipeCatalog(): Recipe[] {
  return RECIPES.map((recipe) => ({
    ...recipe,
    source: recipe.source ?? "local",
  }));
}
