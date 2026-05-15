import type { Recipe } from "@/types/etkezes";

export type RecipeMealType =
  | "teszta"
  | "fozelek"
  | "leves"
  | "egytaletel"
  | "foetel"
  | "salata"
  | "desszert"
  | "reggeli";

export type RecipeTimeBucket = "short" | "medium" | "long";

export const MEAL_TYPE_OPTIONS: Array<{ label: string; value: RecipeMealType; icon: string }> = [
  { label: "Tészták", value: "teszta", icon: "ramen_dining" },
  { label: "Főzelékek", value: "fozelek", icon: "eco" },
  { label: "Levesek", value: "leves", icon: "soup_kitchen" },
  { label: "Egytálételek", value: "egytaletel", icon: "skillet" },
  { label: "Főételek", value: "foetel", icon: "restaurant" },
  { label: "Saláták", value: "salata", icon: "local_florist" },
  { label: "Desszert", value: "desszert", icon: "bakery_dining" },
  { label: "Reggeli", value: "reggeli", icon: "breakfast_dining" },
];

export const TIME_BUCKET_OPTIONS: Array<{ label: string; value: RecipeTimeBucket; max: number; icon: string }> = [
  { label: "Rövid", value: "short", max: 20, icon: "bolt" },
  { label: "Közepes", value: "medium", max: 50, icon: "timer" },
  { label: "Hosszú", value: "long", max: Infinity, icon: "hourglass_bottom" },
];

export const PROTEIN_OPTIONS: Array<{ label: string; value: Recipe["protein"]; icon: string }> = [
  { label: "Csirke", value: "csirke", icon: "egg_alt" },
  { label: "Sertés", value: "sertés", icon: "nutrition" },
  { label: "Marha", value: "marha", icon: "lunch_dining" },
  { label: "Hal", value: "hal", icon: "set_meal" },
];

function normalizeRecipeText(recipe: Recipe): string {
  return [
    recipe.name,
    recipe.description,
    recipe.category,
    recipe.familyNotes ?? "",
    recipe.kidFriendlyNotes ?? "",
    recipe.protein,
    ...(recipe.ingredients ?? []),
    ...(recipe.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

export function getRecipeTimeBucket(recipe: Recipe): RecipeTimeBucket {
  if (recipe.duration <= 20) return "short";
  if (recipe.duration <= 50) return "medium";
  return "long";
}

export function getRecipeMealType(recipe: Recipe): RecipeMealType {
  const text = normalizeRecipeText(recipe);
  const category = recipe.category.toLowerCase();

  if (/(desszert|édesség|edesseg|torta|pite|palacsinta|fánk|fank|brownie|mousse|keksz|bejgli|süti|suti)/.test(text)) {
    return "desszert";
  }
  if (/(reggeli|omlett|tojásos|tojasos|tejbegríz|tejbegriz)/.test(text) || category.includes("reggeli")) {
    return "reggeli";
  }
  if (/(főzelék|fozelek)/.test(text)) return "fozelek";
  if (/(leves|krémleves|kremleves)/.test(text) || category.includes("leves")) return "leves";
  if (/(tészta|teszta|spaghetti|spagetti|gnocchi|nudli|nokedli|galuska|pizza|lasagne|ravioli)/.test(text)) {
    return "teszta";
  }
  if (/(saláta|salata)/.test(text) || category.includes("saláta")) return "salata";
  if (/(egytál|egytal|ragu|rakott|főtt étel|foott etel|rizottó|rizotto|curry|chili con carne)/.test(text)) {
    return "egytaletel";
  }
  return "foetel";
}

export function getRecipeMealTypeLabel(recipe: Recipe): string {
  const type = getRecipeMealType(recipe);
  return MEAL_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? recipe.category;
}

export function isQuickRecipe(recipe: Recipe): boolean {
  return recipe.duration <= 30 || (recipe.tags ?? []).includes("gyors");
}

export function isKidFriendlyRecipe(recipe: Recipe): boolean {
  const text = normalizeRecipeText(recipe);

  const hardNo = /(csípős|csipos|chili|jalapeno|jalapeño|habanero|chipotle|erős|eros|pikáns|pikans|alkohol|boros|sörös|soros|rumos|kávé|kave|tataki|steak|rib-eye|hátszín|hatszin|rostélyos|rostelyos|tarja|kacsa|kacsamell|oldalas|pacal|belsőség|belsoseg|garnéla|garnela|rák|rak|kagyló|kagylo|nyers|füstölt lazac|fustolt lazac|ponty)/;
  if (hardNo.test(text)) return false;

  const kidSignals = /(gyerekbarát|gyerekbarat|kisgyerek|enyhe|krémes|kremes|selymes|püré|pure|főzelék|fozelek|tészta|teszta|gnocchi|nudli|nokedli|galuska|rizs|rizottó|rizotto|csirkemell|csirke|pulyka|sajt|túró|turo|tejföl|tejfol|omlett|tojás|tojas|palacsinta|túrógombóc|turogomboc|tejbegríz|tejbegriz|édesburgonya|edesburgonya|paradicsomleves|krémleves|kremleves)/;
  if (kidSignals.test(text)) return true;

  const mealType = getRecipeMealType(recipe);
  if (["fozelek", "teszta", "leves", "reggeli"].includes(mealType) && recipe.protein !== "marha") {
    return true;
  }

  return recipe.duration <= 30 && recipe.protein !== "marha" && recipe.protein !== "sertés";
}

export function normalizeRecipeTags(recipe: Recipe): string[] {
  const tags = new Set(recipe.tags ?? []);
  const mealType = getRecipeMealType(recipe);
  const timeBucket = getRecipeTimeBucket(recipe);

  tags.add(mealType);
  tags.add(timeBucket === "short" ? "rövid" : timeBucket === "medium" ? "közepes idő" : "hosszú");

  if (isQuickRecipe(recipe)) tags.add("gyors");
  if (isKidFriendlyRecipe(recipe)) tags.add("gyerekbarát");
  else tags.delete("gyerekbarát");

  return Array.from(tags);
}

export function matchesRecipeTaxonomy(
  recipe: Recipe,
  filters: {
    protein?: Recipe["protein"] | "mind";
    mealType?: RecipeMealType | "mind";
    timeBucket?: RecipeTimeBucket | "mind";
    quickOnly?: boolean;
    childFriendlyOnly?: boolean;
  },
): boolean {
  if (filters.protein && filters.protein !== "mind" && recipe.protein !== filters.protein) return false;
  if (filters.mealType && filters.mealType !== "mind" && getRecipeMealType(recipe) !== filters.mealType) return false;
  if (filters.timeBucket && filters.timeBucket !== "mind" && getRecipeTimeBucket(recipe) !== filters.timeBucket) return false;
  if (filters.quickOnly && !isQuickRecipe(recipe)) return false;
  if (filters.childFriendlyOnly && !isKidFriendlyRecipe(recipe)) return false;
  return true;
}
