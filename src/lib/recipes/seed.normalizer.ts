import type { Recipe } from "@/types/etkezes";
import type { RecipeSeedRecord } from "@/lib/recipes/seed.types";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferProtein(record: RecipeSeedRecord): Recipe["protein"] {
  if (record.protein) return record.protein;

  const haystack = `${record.title} ${record.ingredients.join(" ")} ${record.tags.join(" ")}`.toLowerCase();

  if (haystack.includes("csirke")) return "csirke";
  if (haystack.includes("sertés") || haystack.includes("tarja") || haystack.includes("karaj")) return "sertés";
  if (haystack.includes("marha")) return "marha";
  if (haystack.includes("hal")) return "hal";
  if (
    haystack.includes("zöldség") ||
    haystack.includes("gomba") ||
    haystack.includes("túrós") ||
    haystack.includes("tojásos")
  ) {
    return "vegetáriánus";
  }

  return "egyéb";
}

function inferCategory(record: RecipeSeedRecord): string {
  if (record.category?.trim()) return record.category;

  const haystack = `${record.title} ${record.tags.join(" ")}`.toLowerCase();

  if (haystack.includes("leves")) return "Leves";
  if (haystack.includes("főzelék")) return "Főzelék";
  if (haystack.includes("rakott") || haystack.includes("egytál")) return "Egytálétel";

  return "Főétel";
}

function inferDuration(record: RecipeSeedRecord): number {
  if (typeof record.duration === "number" && Number.isFinite(record.duration) && record.duration > 0) {
    return record.duration;
  }

  const estimated = record.instructions.length * 8 + Math.max(record.ingredients.length - 4, 0) * 2;
  return Math.min(Math.max(estimated, 20), 90);
}

function buildDescription(record: RecipeSeedRecord, category: string, protein: Recipe["protein"]): string {
  if (record.summary?.trim()) return record.summary.trim();

  const proteinLabel =
    protein === "vegetáriánus"
      ? "húsmentes"
      : protein === "egyéb"
        ? "klasszikus"
        : protein;

  return `${record.title} a ${record.collection} gyűjtemény alapján összeállított ${category.toLowerCase()} ${proteinLabel} alappal.`;
}

function normalizeInstructions(record: RecipeSeedRecord): string[] {
  if (record.instructions.length > 0) return record.instructions;

  return [
    "Készítsd elő a hozzávalókat a recept forrásoldala alapján.",
    "Főzd vagy süsd készre az ételt a megszokott családi ízlés szerint.",
    "Mentsd el a saját jegyzeteiddel, ha finomítasz az arányokon.",
  ];
}

function normalizeIngredients(record: RecipeSeedRecord): string[] {
  if (record.ingredients.length > 0) return record.ingredients;
  return ["Hozzávalók a forrásoldal alapján"];
}

function deriveTags(record: RecipeSeedRecord, category: string, protein: Recipe["protein"], duration: number): string[] {
  const tags = new Set(
    record.tags
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean),
  );

  tags.add("magyar");
  tags.add(protein);

  if (category.toLowerCase() === "leves") tags.add("leves");
  if (duration <= 30) tags.add("gyors");
  if (duration >= 45 || (record.servings ?? 0) >= 4) tags.add("2 napra elég");

  return Array.from(tags).sort((a, b) => a.localeCompare(b, "hu"));
}

function assertRecipe(recipe: Recipe): Recipe {
  if (!recipe.id.trim()) throw new Error("Seed recipe is missing id.");
  if (!recipe.name.trim()) throw new Error(`Seed recipe ${recipe.id} is missing name.`);
  if (recipe.ingredients.length === 0) throw new Error(`Seed recipe ${recipe.id} is missing ingredients.`);
  if (recipe.instructions.length === 0) throw new Error(`Seed recipe ${recipe.id} is missing instructions.`);
  return recipe;
}

export function normalizeSeedRecord(record: RecipeSeedRecord): Recipe {
  const protein = inferProtein(record);
  const category = inferCategory(record);
  const duration = inferDuration(record);
  const ingredients = normalizeIngredients(record);
  const instructions = normalizeInstructions(record);
  const tags = deriveTags(record, category, protein, duration);

  return assertRecipe({
    id: `${record.source}-${slugify(record.sourceId || record.title)}`,
    sourceId: record.sourceId,
    name: record.title.trim(),
    duration,
    category,
    protein,
    description: buildDescription(record, category, protein),
    ingredients,
    instructions,
    tags,
    source: record.source,
    sourceUrl: record.sourceUrl,
    area: record.area ?? "magyar",
    servings: record.servings,
  });
}

export function dedupeSeedCatalog(recipes: Recipe[]): Recipe[] {
  const byName = new Map<string, Recipe>();

  for (const recipe of recipes) {
    const key = slugify(recipe.name);
    if (!byName.has(key)) {
      byName.set(key, recipe);
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, "hu"));
}
