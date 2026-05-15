import recipeImport from "@/data/family-flow-lidl-expanded-recipes.safe-import.json";
import type {
  ExternalRecipeImportItem,
  ExternalRecipeImportPackage,
} from "@/lib/recipes/external-import.types";
import { LIDL_RECIPE_IMAGE_BY_ID } from "@/lib/recipes/lidl-image-map";
import type { Recipe } from "@/types/etkezes";

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
  if (/(lazac|hal|tonhal|pisztráng|tőkehal)/.test(haystack)) return "hal";
  if (/(csirke|csirkemell|csirkecomb|pulyka)/.test(haystack)) return "csirke";
  if (/(marha|marhahús|steak|hátszín)/.test(haystack)) return "marha";
  if (/(sertés|karaj|tarja|szűzérme|kolbász)/.test(haystack)) return "sertés";
  return "egyéb";
}

function mapImportedRecipe(item: ExternalRecipeImportItem): Recipe {
  const ingredientGroups = item.ingredientGroups.map((group) => ({
    name: group.name.trim(),
    items: group.items.map(formatIngredient),
  }));

  const ingredients = ingredientGroups.flatMap((group) => group.items);
  const tags = Array.from(
    new Set([
      ...item.tags,
      "lidl",
      "importált",
      item.sourceName,
      ...(item.kidFriendlyNotes ? ["gyerekbarát"] : []),
      ...(item.shoppingListReady ? ["bevásárlólista"] : []),
    ]),
  );

  return {
    id: item.id,
    sourceId: item.id,
    name: item.title.trim(),
    duration: item.totalTimeMinutes ?? 45,
    category: item.category.trim(),
    protein: inferProtein(item),
    description: item.safeShortDescription.trim(),
    image: item.image.url ?? LIDL_RECIPE_IMAGE_BY_ID[item.id] ?? undefined,
    ingredients,
    instructions: item.customPreparationSteps.map((step) => step.trim()),
    tags,
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
}

export function getUserImportedRecipes(): Recipe[] {
  const pkg = recipeImport as ExternalRecipeImportPackage;
  return pkg.recipes.map(mapImportedRecipe);
}
