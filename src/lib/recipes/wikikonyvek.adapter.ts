import type { RecipeSeedRecord, WikikonyvekRecipeDTO } from "@/lib/recipes/seed.types";

export function mapWikikonyvekRecipe(dto: WikikonyvekRecipeDTO): RecipeSeedRecord {
  return {
    source: "wikikonyvek",
    sourceId: dto.slug,
    sourceUrl: dto.sourceUrl,
    collection: dto.chapter,
    title: dto.title,
    category: dto.category,
    duration: dto.duration,
    protein: dto.protein,
    summary: dto.summary,
    ingredients: dto.ingredients ?? [],
    instructions: dto.instructions ?? [],
    tags: dto.tags ?? [],
    servings: dto.servings,
    area: dto.area,
  };
}
