import lidlRecipeImport from "@/data/family-flow-lidl-expanded-recipes.safe-import.json";
import nosaltyRecipeImport from "@/data/family-flow-nosalty-recipes.safe-import.json";
import recipeImageManifest from "@/data/recipe-image-manifest.json";
import type {
  ExternalRecipeImportItem,
  ExternalRecipeImportPackage,
} from "@/lib/recipes/external-import.types";
import { getRecipeMealTypeLabel, normalizeRecipeTags } from "@/lib/recipes/recipe-taxonomy";
import type { Recipe } from "@/types/etkezes";

const APPROVED_GENERATED_RECIPE_IMAGE_BY_ID = new Map<string, string>(
  recipeImageManifest.items
    .filter((item) => item.image.status === "generated" && item.image.reviewStatus === "approved")
    .map((item) => [item.recipeId, item.image.path]),
);

function formatIngredientAmount(amount?: number | string, unit?: string): string {
  const amountPart = amount === undefined || amount === null || amount === "" ? "" : String(amount).trim();
  const unitPart = unit?.trim() ?? "";
  return [amountPart, unitPart].filter(Boolean).join(" ");
}

function formatIngredient(item: ExternalRecipeImportItem["ingredientGroups"][number]["items"][number]): string {
  const amountLabel = formatIngredientAmount(item.amount, item.unit);
  const core = [amountLabel, item.name.trim()].filter(Boolean).join(" ").trim();
  const note = item.note?.trim();
  const optional = item.optional ? "opcionális" : "";
  const extras = [note, optional].filter(Boolean).join(", ");

  return extras ? `${core} (${extras})` : core;
}

function inferProtein(recipe: ExternalRecipeImportItem): Recipe["protein"] {
  const haystack = [
    recipe.title,
    recipe.category,
    ...recipe.tags,
    ...recipe.ingredientGroups.flatMap((group) => group.items.map((item) => item.name)),
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes("vegetáriánus") || haystack.includes("gomba") || haystack.includes("zöldség")) {
    return "vegetáriánus";
  }
  if (/(lazac|hal|tonhal|pisztráng|tőkehal|ponty|harcsa|makréla|makrela)/.test(haystack)) return "hal";
  if (/(csirke|csirkemell|csirkecomb|pulyka)/.test(haystack)) return "csirke";
  if (/(marha|marhahús|steak|hátszín)/.test(haystack)) return "marha";
  if (/(sertés|karaj|tarja|szűzérme|kolbász)/.test(haystack)) return "sertés";
  return "egyéb";
}

function resolveImportedRecipeImage(item: ExternalRecipeImportItem): string | undefined {
  return APPROVED_GENERATED_RECIPE_IMAGE_BY_ID.get(item.id);
}

function mapImportedRecipe(item: ExternalRecipeImportItem): Recipe {
  const ingredientGroups = item.ingredientGroups.map((group) => ({
    name: group.name.trim(),
    items: group.items.map(formatIngredient),
  }));

  const ingredients = ingredientGroups.flatMap((group) => group.items);
  const rawTags = Array.from(
    new Set([
      ...item.tags,
      "importált",
      item.sourceName,
      ...(item.shoppingListReady ? ["bevásárlólista"] : []),
    ]),
  );

  const mapped: Recipe = {
    id: item.id,
    sourceId: item.id,
    name: item.title.trim(),
    duration: item.totalTimeMinutes ?? 45,
    category: item.category.trim(),
    protein: inferProtein(item),
    description: item.safeShortDescription.trim(),
    image: resolveImportedRecipeImage(item),
    ingredients,
    instructions: item.customPreparationSteps.map((step) => step.trim()),
    tags: rawTags,
    source: "user-import",
    sourceUrl: item.sourceUrl,
    sourceName: item.sourceName,
    servings: item.servings ?? undefined,
    difficulty: item.difficulty,
    ingredientGroups,
    familyNotes: item.familyNotes.trim(),
    kidFriendlyNotes: item.kidFriendlyNotes.trim(),
    shoppingListReady: item.shoppingListReady,
    openOriginalRecipeLabel: item.openOriginalRecipeLabel,
  };

  const normalizedTags = normalizeRecipeTags(mapped);

  return {
    ...mapped,
    category: getRecipeMealTypeLabel(mapped),
    tags: normalizedTags,
    kidFriendlyNotes: normalizedTags.includes("gyerekbarát")
      ? (mapped.kidFriendlyNotes || "Kisgyerekeknek is könnyen ehető, enyhébb családi változatban tálalható.")
      : "",
  };
}

export function getUserImportedRecipes(): Recipe[] {
  const packages = [lidlRecipeImport, nosaltyRecipeImport] as ExternalRecipeImportPackage[];
  return packages.flatMap((pkg) => pkg.recipes.map(mapImportedRecipe));
}
