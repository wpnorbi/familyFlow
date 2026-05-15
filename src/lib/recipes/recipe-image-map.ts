import type { Recipe } from "@/types/etkezes";

export type RecipeImageCategory =
  | "pasta"
  | "soup"
  | "salad"
  | "chicken"
  | "meat"
  | "sandwich"
  | "dessert"
  | "drink"
  | "bake"
  | "veggie"
  | "default";

type Rule = {
  category: RecipeImageCategory;
  patterns: RegExp[];
};

const EXACT_RECIPE_CATEGORY_BY_NAME: Record<string, RecipeImageCategory> = {
  "carbonara": "pasta",
  "sajtos-sonkas omlett": "sandwich",
  "gorog joghurt granolaval": "drink",
  "zabkasa bogyos gyumolcsokkel": "drink",
  "avokado piritos tojassal": "sandwich",
  "crepe suzette a francia palacsinta": "dessert",
  "az en tejberizsem": "dessert",
  "a tokeletes turogomboc": "dessert",
  "a legfinomabb csokolademousse": "dessert",
  "creme brulee es creme caramel": "dessert",
  "chia puding sokfelekeppen": "dessert",
  "deluxe pizza rokforttal datolyaval es lilahagymakompottal": "bake",
  "csucsogos lasagne": "pasta",
  "az igazi cezarsalata": "salad",
  "nyari avokado tal": "salad",
  "kremes gombaleves": "soup",
  "japan ramen lagy tojassal": "soup",
  "kremes csirke curry": "chicken",
  "citromos-fokhagymas sult lazac": "meat",
};

const CATEGORY_RULES: Rule[] = [
  {
    category: "drink",
    patterns: [
      /\bsmoothie\b/,
      /\bturmix\b/,
      /\bacai\b/,
      /\bjuice\b/,
      /\bshake\b/,
      /\bjoghurt\b/,
      /\bzabkasa\b/,
      /\bgranolaval\b/,
      /\bital\b/,
    ],
  },
  {
    category: "dessert",
    patterns: [
      /\btiramisu\b/,
      /\bmousse\b/,
      /\bbrownie\b/,
      /\bsuti\b/,
      /\bsutemeny\b/,
      /\btorta\b/,
      /\bpuding\b/,
      /\bpalacsinta\b/,
      /\btejberizs\b/,
      /\bturogomboc\b/,
      /\bcreme brulee\b/,
      /\bcreme caramel\b/,
      /\bfank\b/,
      /\baranygaluska\b/,
      /\bpiskota\b/,
      /\bcsokis\b/,
      /\bedesseg\b/,
    ],
  },
  {
    category: "soup",
    patterns: [
      /\bleves\b/,
      /\bramen\b/,
      /\bborscs\b/,
      /\bpho\b/,
      /\bkremleves\b/,
      /\bgulyas\b/,
      /\beroleves\b/,
      /\btyukhusleves\b/,
    ],
  },
  {
    category: "pasta",
    patterns: [
      /\bteszta\b/,
      /\bspagetti\b/,
      /\bcarbonara\b/,
      /\bpenne\b/,
      /\bfusilli\b/,
      /\btagliatelle\b/,
      /\bgnocchi\b/,
      /\blasagne\b/,
      /\blasagna\b/,
      /\brizotto\b/,
      /\bpaella\b/,
    ],
  },
  {
    category: "bake",
    patterns: [
      /\bpizza\b/,
      /\bpite\b/,
      /\bkifli\b/,
      /\bkenyer\b/,
      /\bretes\b/,
      /\bquiche\b/,
      /\bpogacsa\b/,
      /\bpuspokkenyer\b/,
      /\bpita\b/,
      /\bcroissant\b/,
      /\bburek\b/,
      /\balmaspite\b/,
    ],
  },
  {
    category: "sandwich",
    patterns: [
      /\bszendvics\b/,
      /\bpiritos\b/,
      /\btoast\b/,
      /\bomlett\b/,
      /\btojas\b/,
      /\bburger\b/,
      /\breggeli\b/,
    ],
  },
  {
    category: "salad",
    patterns: [
      /\bsalata\b/,
      /\bcaesar\b/,
      /\bquinoa\b/,
      /\bburrata\b/,
      /\bavokado tal\b/,
      /\btal\b/,
    ],
  },
  {
    category: "chicken",
    patterns: [
      /\bcsirke\b/,
      /\bcsirkemell\b/,
      /\bcsirkecomb\b/,
      /\bpulyka\b/,
    ],
  },
  {
    category: "meat",
    patterns: [
      /\blazac\b/,
      /\bhal\b/,
      /\btonhal\b/,
      /\bmarha\b/,
      /\bsteak\b/,
      /\bsertes\b/,
      /\bkolbasz\b/,
      /\boldalas\b/,
      /\bporkolt\b/,
      /\bkaraj\b/,
      /\btarja\b/,
      /\bhus\b/,
      /\bkacsa\b/,
    ],
  },
  {
    category: "veggie",
    patterns: [
      /\bvegetarianus\b/,
      /\bvegan\b/,
      /\bzoldseg\b/,
      /\bgomba\b/,
      /\blencse\b/,
      /\bbab\b/,
      /\bcsicseri\b/,
      /\bfozelek\b/,
      /\bfalafel\b/,
    ],
  },
];

export function normalizeRecipeImageLookup(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[„”"']/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function buildRecipeHaystack(recipe: Recipe) {
  return normalizeRecipeImageLookup(
    [
      recipe.name,
      recipe.category,
      recipe.protein,
      ...(recipe.tags ?? []),
      ...recipe.ingredients.slice(0, 8),
    ].join(" "),
  );
}

export function resolveRecipeImageCategory(recipe: Recipe): RecipeImageCategory {
  const normalizedName = normalizeRecipeImageLookup(recipe.name);
  const exact = EXACT_RECIPE_CATEGORY_BY_NAME[normalizedName];
  if (exact) return exact;

  const haystack = buildRecipeHaystack(recipe);

  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return rule.category;
    }
  }

  return "default";
}
