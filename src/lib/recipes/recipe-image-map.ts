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

// ─── Unsplash photo helper ────────────────────────────────────────────────────

const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

// ─── Category photo library (multiple per category for visual variety) ────────

export const CATEGORY_PHOTOS: Record<RecipeImageCategory, string[]> = {
  pasta: [
    U("1612874742237-6526221588e3"), // creamy carbonara
    U("1555396273-367ea4eb4db5"),    // pasta with sauce
    U("1563379926898-05f4575a45d8"), // spaghetti bolognese
    U("1473093945921-9a89f4006fe1"), // creamy tagliatelle
    U("1551183053-bf91798d6d37"),    // tomato pasta
    U("1621996346565-e3dbc646d9a9"), // pasta varied
  ],
  soup: [
    U("1547592166-23ac45744acd"),    // bowl of soup
    U("1576577445504-6af96477db52"), // cream soup
    U("1604754524776-8f4f37790ca0"), // warm bowl
    U("1603105037880-880cd4edfb0d"), // vegetable soup
  ],
  chicken: [
    U("1598103442097-8b74394b95c1"), // chicken dish
    U("1567620832903-9fc6debc209f"), // roasted chicken
    U("1532550907401-a500c9a57435"), // chicken plate
    U("1604908176997-125f25cc6f3d"), // grilled chicken
  ],
  meat: [
    U("1546069901-ba9599a7e63c"),    // steak
    U("1529193591184-b1d58069ecdd"), // meat dish
    U("1519708227418-c8fd9a32b7a2"), // salmon
    U("1467003909585-2f8a72700288"), // grilled fish
  ],
  salad: [
    U("1512621776951-a57141f2eefd"), // colorful salad
    U("1540420773420-3366772f4999"), // mediterranean salad
    U("1543339308-43e59d6b73a6"),    // grain bowl
    U("1546793665-c74683f339c1"),    // caesar salad
  ],
  veggie: [
    U("1512621776951-a57141f2eefd"), // veggie bowl
    U("1540420773420-3366772f4999"), // salad bowl
    U("1565557623262-b51c2513a641"), // lentils
    U("1543339308-43e59d6b73a6"),    // buddha bowl
    U("1519996529931-28324d5a630e"), // vegetables
  ],
  sandwich: [
    U("1525351484163-7529414344d8"), // eggs on toast
    U("1482049016688-2d3e1b311543"), // omelette / egg dish
    U("1603046891744-3e9c5c027dfe"), // avocado toast
    U("1553909489-cd47e0907980"),    // sandwich
  ],
  dessert: [
    U("1488477181946-6428a0291777"), // dessert bowl
    U("1563805042-7684c019e1cb"),    // chocolate dessert
    U("1565958011703-44f9829ba187"), // cake slice
    U("1558303787-4e1e2f4be01e"),    // pastry
  ],
  drink: [
    U("1517673132405-a56a62b18caf"), // muesli / smoothie bowl
    U("1495214783159-3503fd1b572d"), // breakfast bowl
    U("1611601322175-ef8ec8c5c8b4"), // yogurt bowl
  ],
  bake: [
    U("1513104890138-7c749659a591"), // pizza
    U("1509440159596-0249088772ff"), // bread loaf
    U("1586190848861-99aa4a171e90"), // flatbread / pita
    U("1558303787-4e1e2f4be01e"),    // baked goods
  ],
  default: [
    U("1565299624946-b28f40a0ae38"), // food plating
    U("1504674900247-0877df9cc836"), // cooking / food prep
    U("1490645935967-10de6ba17061"), // plated meal
  ],
};

// ─── Recipe-specific name → photo mapping ────────────────────────────────────
// Keys: normalized name (lowercase, no accents, spaces only)

const RECIPE_PHOTO_BY_NORMALIZED_NAME: Record<string, string> = {

  // ── Reggeli / Breakfast ──────────────────────────────────────────────────
  "zabkasa bogyo gyumolcsokkel":        U("1517673132405-a56a62b18caf"),
  "zabkasa":                             U("1517673132405-a56a62b18caf"),
  "avokado piritos tojassal":            U("1603046891744-3e9c5c027dfe"),
  "avokado piritos":                     U("1603046891744-3e9c5c027dfe"),
  "sajtos sonkas omlett":                U("1482049016688-2d3e1b311543"),
  "sajtos omlett":                       U("1482049016688-2d3e1b311543"),
  "gorog joghurt granolaval":            U("1517673132405-a56a62b18caf"),
  "muzli joghurttal":                    U("1517673132405-a56a62b18caf"),
  "muzli":                               U("1517673132405-a56a62b18caf"),
  "granola":                             U("1517673132405-a56a62b18caf"),
  "palacsinta":                          U("1466637574441-749b8f19452f"),
  "rakott palacsinta":                   U("1466637574441-749b8f19452f"),
  "french toast":                        U("1525351484163-7529414344d8"),
  "piritos kenyer":                      U("1525351484163-7529414344d8"),
  "tojasregeli":                         U("1482049016688-2d3e1b311543"),
  "rugott tojas":                        U("1482049016688-2d3e1b311543"),
  "tukortojás":                          U("1482049016688-2d3e1b311543"),

  // ── Tészta / Pasta ───────────────────────────────────────────────────────
  "hazi paradicsomos teszta":            U("1551183053-bf91798d6d37"),
  "paradicsomos teszta":                 U("1551183053-bf91798d6d37"),
  "paradicsomos spagetti":               U("1563379926898-05f4575a45d8"),
  "carbonara":                           U("1612874742237-6526221588e3"),
  "spaghetti carbonara":                 U("1612874742237-6526221588e3"),
  "spagetti carbonara":                  U("1612874742237-6526221588e3"),
  "spagetti bolognese":                  U("1563379926898-05f4575a45d8"),
  "spaghetti bolognese":                 U("1563379926898-05f4575a45d8"),
  "bolognai teszta":                     U("1563379926898-05f4575a45d8"),
  "bolognai spagetti":                   U("1563379926898-05f4575a45d8"),
  "tejszines csirkes teszta":            U("1473093945921-9a89f4006fe1"),
  "tejszines csirke teszta":             U("1473093945921-9a89f4006fe1"),
  "kremteszta":                          U("1473093945921-9a89f4006fe1"),
  "hazi gyurt teszta":                   U("1555396273-367ea4eb4db5"),
  "dios teszta mezzel":                  U("1621996346565-e3dbc646d9a9"),
  "dios teszta":                         U("1621996346565-e3dbc646d9a9"),
  "lemon pasta citromos":                U("1555396273-367ea4eb4db5"),
  "pesto spagetti":                      U("1555396273-367ea4eb4db5"),
  "pesto teszta":                        U("1555396273-367ea4eb4db5"),
  "pesto spaghetti paradicsommal":       U("1555396273-367ea4eb4db5"),
  "mac and cheese":                      U("1621996346565-e3dbc646d9a9"),
  "teszta tonhallal":                    U("1555396273-367ea4eb4db5"),
  "teszta feta sajttal":                 U("1555396273-367ea4eb4db5"),
  "teszta zoldsegekkel":                 U("1621996346565-e3dbc646d9a9"),
  "csucsogos lasagne":                   U("1563379926898-05f4575a45d8"),
  "lasagne":                             U("1563379926898-05f4575a45d8"),
  "tagliatelle":                         U("1473093945921-9a89f4006fe1"),
  "rizotto":                             U("1621996346565-e3dbc646d9a9"),
  "risotto":                             U("1621996346565-e3dbc646d9a9"),
  "gnocchi":                             U("1555396273-367ea4eb4db5"),
  "gyurt teszta":                        U("1555396273-367ea4eb4db5"),
  "fattoush kozel keleti salata":        U("1512621776951-a57141f2eefd"),

  // ── Leves / Soup ────────────────────────────────────────────────────────
  "kremes gombaleves":                   U("1547592166-23ac45744acd"),
  "gombaleves":                          U("1547592166-23ac45744acd"),
  "japan ramen lagy tojassal":           U("1569718566521-4a1e6ebda5f9"),
  "japan ramen":                         U("1569718566521-4a1e6ebda5f9"),
  "ramen":                               U("1569718566521-4a1e6ebda5f9"),
  "csirkehus leves":                     U("1576577445504-6af96477db52"),
  "tyukhus leves":                       U("1576577445504-6af96477db52"),
  "paradicsomleves":                     U("1547592166-23ac45744acd"),
  "zoldseg leves":                       U("1603105037880-880cd4edfb0d"),
  "gulyas leves":                        U("1547592166-23ac45744acd"),
  "gulyas":                              U("1547592166-23ac45744acd"),
  "bableves":                            U("1603105037880-880cd4edfb0d"),
  "lencse leves":                        U("1565557623262-b51c2513a641"),
  "lencsekrem leves":                    U("1565557623262-b51c2513a641"),
  "minestrone":                          U("1603105037880-880cd4edfb0d"),
  "thai kokusztejes leves":              U("1547592166-23ac45744acd"),
  "thai leves":                          U("1547592166-23ac45744acd"),
  "hagymaleves":                         U("1576577445504-6af96477db52"),
  "brokkoli kremlevese":                 U("1576577445504-6af96477db52"),

  // ── Csirke / Chicken ────────────────────────────────────────────────────
  "kremes csirke curry":                 U("1603133872878-684f208fb84b"),
  "csirke curry":                        U("1603133872878-684f208fb84b"),
  "sutoben sult csirkecomb":             U("1567620832903-9fc6debc209f"),
  "sult csirkecomb":                     U("1567620832903-9fc6debc209f"),
  "csirkecomb":                          U("1567620832903-9fc6debc209f"),
  "citromos csirke":                     U("1598103442097-8b74394b95c1"),
  "fokhagymas csirke":                   U("1598103442097-8b74394b95c1"),
  "csirke porkolt":                      U("1598103442097-8b74394b95c1"),
  "csirke rizottoval":                   U("1604908176997-125f25cc6f3d"),
  "honey mustard csirke":                U("1598103442097-8b74394b95c1"),
  "teriyaki csirke":                     U("1604908176997-125f25cc6f3d"),
  "csirkemell":                          U("1532550907401-a500c9a57435"),
  "rantott csirke":                      U("1598103442097-8b74394b95c1"),
  "csirke tacos":                        U("1604908176997-125f25cc6f3d"),
  "csirke gyros":                        U("1598103442097-8b74394b95c1"),
  "csirke wrap":                         U("1553909489-cd47e0907980"),

  // ── Hús / Meat & Fish ───────────────────────────────────────────────────
  "citromos fokhagymas sult lazac":      U("1519708227418-c8fd9a32b7a2"),
  "sult lazac":                          U("1519708227418-c8fd9a32b7a2"),
  "lazac":                               U("1519708227418-c8fd9a32b7a2"),
  "citromos lazac":                      U("1519708227418-c8fd9a32b7a2"),
  "rozmaringos steak":                   U("1546069901-ba9599a7e63c"),
  "marhasteak":                          U("1546069901-ba9599a7e63c"),
  "steak":                               U("1546069901-ba9599a7e63c"),
  "serteskara j":                        U("1529193591184-b1d58069ecdd"),
  "serteskaraj":                         U("1529193591184-b1d58069ecdd"),
  "sertesporkolt":                       U("1529193591184-b1d58069ecdd"),
  "porkolt":                             U("1529193591184-b1d58069ecdd"),
  "tonhalas":                            U("1467003909585-2f8a72700288"),
  "tonhal":                              U("1467003909585-2f8a72700288"),
  "sult hal":                            U("1467003909585-2f8a72700288"),
  "marha porkolt":                       U("1529193591184-b1d58069ecdd"),
  "kolbasz":                             U("1529193591184-b1d58069ecdd"),

  // ── Saláta / Salad ───────────────────────────────────────────────────────
  "quinoa tal piritott zoldsegekkel":    U("1512621776951-a57141f2eefd"),
  "quinoa tal":                          U("1512621776951-a57141f2eefd"),
  "quinoa":                              U("1512621776951-a57141f2eefd"),
  "nyari avokado tal":                   U("1540420773420-3366772f4999"),
  "avokado tal":                         U("1540420773420-3366772f4999"),
  "az igazi cezarsalata":                U("1546793665-c74683f339c1"),
  "cezar salata":                        U("1546793665-c74683f339c1"),
  "caesar salata":                       U("1546793665-c74683f339c1"),
  "gorog salata":                        U("1540420773420-3366772f4999"),
  "mediterran salata":                   U("1540420773420-3366772f4999"),
  "nicoise salata":                      U("1512621776951-a57141f2eefd"),
  "caprese salata":                      U("1546793665-c74683f339c1"),

  // ── Főzelék / Veggie stew ────────────────────────────────────────────────
  "babfozelek":                          U("1565557623262-b51c2513a641"),
  "lencsefőzelek":                       U("1565557623262-b51c2513a641"),
  "lencsefozelek":                       U("1565557623262-b51c2513a641"),
  "paradicsomos babfozelek":             U("1565557623262-b51c2513a641"),
  "zoldbabfozelek":                      U("1519996529931-28324d5a630e"),
  "spenot fozelek":                      U("1519996529931-28324d5a630e"),
  "kelkáposzta fozelek":                 U("1519996529931-28324d5a630e"),
  "kelkaposzta fozelek":                 U("1519996529931-28324d5a630e"),
  "tofus wok":                           U("1543339308-43e59d6b73a6"),
  "tofu":                                U("1543339308-43e59d6b73a6"),
  "falafel":                             U("1586190848861-99aa4a171e90"),
  "falafel tal":                         U("1543339308-43e59d6b73a6"),
  "csicseri borsso curry":               U("1565557623262-b51c2513a641"),
  "csicseri borsso":                     U("1565557623262-b51c2513a641"),

  // ── Pizza / Bake ─────────────────────────────────────────────────────────
  "pizza":                               U("1513104890138-7c749659a591"),
  "deluxe pizza":                        U("1513104890138-7c749659a591"),
  "margherita pizza":                    U("1513104890138-7c749659a591"),
  "pite":                                U("1558303787-4e1e2f4be01e"),
  "almaspite":                           U("1558303787-4e1e2f4be01e"),
  "hazi kenyer":                         U("1509440159596-0249088772ff"),
  "kenyer":                              U("1509440159596-0249088772ff"),
  "pogacsa":                             U("1586190848861-99aa4a171e90"),
  "kifli":                               U("1509440159596-0249088772ff"),
  "quiche":                              U("1558303787-4e1e2f4be01e"),
  "pita":                                U("1586190848861-99aa4a171e90"),
  "burek":                               U("1586190848861-99aa4a171e90"),

  // ── Desszert / Dessert ───────────────────────────────────────────────────
  "csokolademousse":                     U("1563805042-7684c019e1cb"),
  "a legfinomabb csokolademousse":       U("1563805042-7684c019e1cb"),
  "tiramisu":                            U("1565958011703-44f9829ba187"),
  "tejberizs":                           U("1488477181946-6428a0291777"),
  "az en tejberizsem":                   U("1488477181946-6428a0291777"),
  "turogomboc":                          U("1488477181946-6428a0291777"),
  "a tokeletes turogomboc":              U("1488477181946-6428a0291777"),
  "creme brulee":                        U("1565958011703-44f9829ba187"),
  "creme caramel":                       U("1565958011703-44f9829ba187"),
  "chia puding":                         U("1517673132405-a56a62b18caf"),
  "aranygaluska":                        U("1558303787-4e1e2f4be01e"),
  "brownie":                             U("1563805042-7684c019e1cb"),
  "suti":                                U("1558303787-4e1e2f4be01e"),

  // ── Smoothie / Drink ──────────────────────────────────────────────────────
  "smoothie":                            U("1495214783159-3503fd1b572d"),
  "acai tal":                            U("1517673132405-a56a62b18caf"),
  "gyumolcs smoothie":                   U("1495214783159-3503fd1b572d"),
  "protein shake":                       U("1495214783159-3503fd1b572d"),

  // ── Egyéb / Other ────────────────────────────────────────────────────────
  "gyros":                               U("1586190848861-99aa4a171e90"),
  "burrito":                             U("1553909489-cd47e0907980"),
  "taco":                                U("1553909489-cd47e0907980"),
  "pad thai":                            U("1569718566521-4a1e6ebda5f9"),
  "wok":                                 U("1543339308-43e59d6b73a6"),
};

const EXACT_RECIPE_CATEGORY_BY_NAME: Record<string, RecipeImageCategory> = {
  "carbonara": "pasta",
  "sajtos-sonkas omlett": "sandwich",
  "gorog joghurt granolaval": "drink",
  "zabkasa bogyo gyumolcsokkel": "drink",
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

// ─── Public API ───────────────────────────────────────────────────────────────

export function normalizeRecipeImageLookup(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[„""']/g, "")
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

const LOCAL_CATEGORY_IMAGE_BY_KIND: Record<RecipeImageCategory, string> = {
  pasta: "/images/recipes/categories/pasta.png",
  soup: "/images/recipes/categories/soup.png",
  salad: "/images/recipes/categories/salad.png",
  chicken: "/images/recipes/categories/chicken.png",
  meat: "/images/recipes/categories/meat.png",
  sandwich: "/images/recipes/categories/sandwich.png",
  dessert: "/images/recipes/categories/dessert.png",
  drink: "/images/recipes/categories/drink.png",
  bake: "/images/recipes/categories/bake.png",
  veggie: "/images/recipes/categories/veggie.png",
  default: "/images/recipes/categories/default.png",
};

export function getLocalCategoryImagePath(kind: RecipeImageCategory): string {
  return LOCAL_CATEGORY_IMAGE_BY_KIND[kind] ?? LOCAL_CATEGORY_IMAGE_BY_KIND.default;
}

export function getRecipeImageVariantSeed(recipe: Recipe): string {
  return `${recipe.id}::${normalizeRecipeImageLookup(recipe.name)}`;
}

/** Returns a raw URL (Unsplash) for the recipe, or null if none found. */
export function getRecipePhotoUrl(recipe: Recipe): string | null {
  // 1. Exact name match against the curated specific-recipe list
  const key = normalizeRecipeImageLookup(recipe.name);
  const specific = RECIPE_PHOTO_BY_NORMALIZED_NAME[key];
  if (specific) return specific;

  // 2. Category photo (Unsplash, deterministic variety per recipe)
  const category = resolveRecipeImageCategory(recipe);
  const photos = CATEGORY_PHOTOS[category] ?? CATEGORY_PHOTOS.default;
  let hash = 0;
  const seed = recipe.id || recipe.name;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return photos[hash % photos.length];
}
