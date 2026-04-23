import { getHungarianSeedCatalog } from "@/lib/recipes/seed.loader";
import type { Recipe } from "@/types/etkezes";

export function getHungarianWebRecipeCatalog(): Recipe[] {
  return getHungarianSeedCatalog();
}
