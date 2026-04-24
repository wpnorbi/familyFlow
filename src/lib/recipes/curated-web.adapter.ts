import type { CuratedWebRecipeDTO, RecipeSeedRecord } from "@/lib/recipes/seed.types";

export function mapCuratedWebRecipe(dto: CuratedWebRecipeDTO): RecipeSeedRecord {
  return {
    source: "hungarian-web",
    sourceId: dto.slug,
    sourceUrl: dto.sourceUrl,
    collection: dto.siteName,
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
