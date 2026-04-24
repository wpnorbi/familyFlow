import curatedWebRaw from "@/lib/recipes/seeds/curated-web.raw.json";
import { mapCuratedWebRecipe } from "@/lib/recipes/curated-web.adapter";
import mekRaw from "@/lib/recipes/seeds/mek.raw.json";
import wikikonyvekRaw from "@/lib/recipes/seeds/wikikonyvek.raw.json";
import { mapMekRecipe } from "@/lib/recipes/mek.adapter";
import { dedupeSeedCatalog, normalizeSeedRecord } from "@/lib/recipes/seed.normalizer";
import type { CuratedWebRecipeDTO, MekRecipeDTO, WikikonyvekRecipeDTO } from "@/lib/recipes/seed.types";
import { mapWikikonyvekRecipe } from "@/lib/recipes/wikikonyvek.adapter";
import type { Recipe } from "@/types/etkezes";

let cachedCatalog: Recipe[] | null = null;

export function getHungarianSeedCatalog(): Recipe[] {
  if (cachedCatalog) return cachedCatalog;

  const wikikonyvekRecipes = (wikikonyvekRaw as WikikonyvekRecipeDTO[])
    .map(mapWikikonyvekRecipe)
    .map(normalizeSeedRecord);

  const mekRecipes = (mekRaw as MekRecipeDTO[])
    .map(mapMekRecipe)
    .map(normalizeSeedRecord);

  const curatedWebRecipes = (curatedWebRaw as CuratedWebRecipeDTO[])
    .map(mapCuratedWebRecipe)
    .map(normalizeSeedRecord);

  cachedCatalog = dedupeSeedCatalog([...wikikonyvekRecipes, ...mekRecipes, ...curatedWebRecipes]);
  return cachedCatalog;
}
