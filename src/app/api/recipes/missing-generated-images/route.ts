import recipeImagePrompts from "@/data/recipe-image-prompts.json";
import { getUserImportedRecipes } from "@/lib/recipes/user-import.provider";

type MissingImageStrategy = "all" | "source-fallback" | "placeholder";

function normalizeStrategy(value: string | null): MissingImageStrategy {
  if (value === "source-fallback" || value === "placeholder") {
    return value;
  }
  return "all";
}

function hasTag(recipe: { tags: string[] }, tag: string) {
  return recipe.tags.includes(tag);
}

function getPriorityScore(recipe: {
  imageStrategy?: "generated" | "source-fallback" | "placeholder";
  duration: number;
  protein: string;
  category: string;
  tags: string[];
}) {
  let score = 0;

  if (recipe.imageStrategy === "source-fallback") score += 220;
  else if (recipe.imageStrategy === "placeholder") score += 90;

  if (hasTag(recipe, "gyerekbarát")) score += 120;
  if (hasTag(recipe, "gyors")) score += 100;

  if (recipe.duration <= 20) score += 70;
  else if (recipe.duration <= 40) score += 48;
  else if (recipe.duration <= 60) score += 24;

  if (recipe.protein === "csirke") score += 55;
  else if (recipe.protein === "sertés") score += 44;
  else if (recipe.protein === "marha") score += 32;
  else if (recipe.protein === "hal") score += 30;
  else if (recipe.protein === "vegetáriánus") score += 36;

  if (recipe.category === "Főétel") score += 16;
  if (recipe.category === "Tészta") score += 14;
  if (recipe.category === "Reggeli") score += 8;
  if (recipe.category === "Desszert") score -= 6;

  return score;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "list";
  const strategy = normalizeStrategy(searchParams.get("strategy"));
  const limit = Math.max(1, Number(searchParams.get("limit") ?? 50));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

  const allRecipes = getUserImportedRecipes()
    .filter((recipe) => recipe.imageStrategy !== "generated")
    .filter((recipe) => strategy === "all" || recipe.imageStrategy === strategy)
    .map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      sourceName: recipe.sourceName ?? "Importált recept",
      sourceUrl: recipe.sourceUrl,
      imageStrategy: recipe.imageStrategy,
      sourceImageUrl: recipe.sourceImageUrl,
      duration: recipe.duration,
      protein: recipe.protein,
      category: recipe.category,
      tags: recipe.tags ?? [],
      priorityScore: 0,
    }))
    .map((recipe) => ({
      ...recipe,
      priorityScore: getPriorityScore(recipe),
    }))
    .sort(
      (a, b) =>
        b.priorityScore - a.priorityScore ||
        a.duration - b.duration ||
        a.name.localeCompare(b.name, "hu"),
    );

  const sourceFallbackCount = allRecipes.filter((recipe) => recipe.imageStrategy === "source-fallback").length;
  const placeholderCount = allRecipes.filter((recipe) => recipe.imageStrategy === "placeholder").length;

  if (format !== "batch") {
    return Response.json({
      total: allRecipes.length,
      sourceFallbackCount,
      placeholderCount,
      recipes: allRecipes,
    });
  }

  const promptByRecipeId = new Map(recipeImagePrompts.prompts.map((prompt) => [prompt.recipeId, prompt]));
  const slice = allRecipes.slice(offset, offset + limit);
  const missingPromptRecipes = slice.filter((recipe) => !promptByRecipeId.has(recipe.id));
  const items = slice
    .map((recipe) => {
      const prompt = promptByRecipeId.get(recipe.id);
      if (!prompt) return null;
      return {
        recipeId: recipe.id,
        slug: prompt.slug,
        title: prompt.title,
        sourceName: recipe.sourceName,
        sourceUrl: recipe.sourceUrl,
        imageStrategy: recipe.imageStrategy,
        sourceImageUrl: recipe.sourceImageUrl,
        priorityScore: recipe.priorityScore,
        visualType: prompt.visualType,
        imagePrompt: prompt.imagePrompt,
        targetFilename: prompt.targetFilename,
      };
    })
    .filter(Boolean);

  return Response.json({
    batchId: `missing-generated-images-${strategy}-${String(offset).padStart(4, "0")}`,
    generatedAt: new Date().toISOString(),
    strategy,
    startIndex: offset,
    count: items.length,
    requestedCount: slice.length,
    totalCandidates: allRecipes.length,
    sourceFallbackCount,
    placeholderCount,
    missingPromptCount: missingPromptRecipes.length,
    missingPromptRecipeIds: missingPromptRecipes.map((recipe) => recipe.id),
    items,
  });
}
