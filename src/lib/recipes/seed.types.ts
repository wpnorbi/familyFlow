import type { Recipe } from "@/types/etkezes";

export type ExternalRecipeSource = "wikikonyvek" | "mek" | "hungarian-web" | "user-import";

export interface RawSeedRecipeDTO {
  slug: string;
  title: string;
  sourceUrl: string;
  category?: string;
  duration?: number;
  protein?: Recipe["protein"];
  summary?: string;
  ingredients?: string[];
  instructions?: string[];
  tags?: string[];
  servings?: number;
  area?: string;
}

export interface WikikonyvekRecipeDTO extends RawSeedRecipeDTO {
  chapter: string;
}

export interface MekRecipeDTO extends RawSeedRecipeDTO {
  bookTitle: string;
}

export interface CuratedWebRecipeDTO extends RawSeedRecipeDTO {
  siteName: string;
}

export interface RecipeSeedRecord {
  source: ExternalRecipeSource;
  sourceId: string;
  sourceUrl: string;
  collection: string;
  title: string;
  category?: string;
  duration?: number;
  protein?: Recipe["protein"];
  summary?: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  servings?: number;
  area?: string;
}
