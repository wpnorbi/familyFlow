import type { Recipe } from "@/types/etkezes";

export interface RecipeUrlImportDraft {
  sourceUrl: string;
  recipe: Recipe;
}

export async function importRecipeFromUrl(_url: string): Promise<RecipeUrlImportDraft> {
  throw new Error("A recept URL-import v2-ben érkezik, kézi ellenőrzéses flow-val.");
}
