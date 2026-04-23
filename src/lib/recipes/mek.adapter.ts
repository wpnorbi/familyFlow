import type { MekRecipeDTO, RecipeSeedRecord } from "@/lib/recipes/seed.types";

export function mapMekRecipe(dto: MekRecipeDTO): RecipeSeedRecord {
  return {
    source: "mek",
    sourceId: dto.slug,
    sourceUrl: dto.sourceUrl,
    collection: dto.bookTitle,
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
