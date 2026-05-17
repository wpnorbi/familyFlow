import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const PUBLIC_DIR = path.join(ROOT, "public");
const IMAGE_DIR = path.join(PUBLIC_DIR, "assets", "recipes", "images");
const THUMB_DIR = path.join(IMAGE_DIR, "thumbnails");

const INPUT_FILES = [
  {
    sourceKey: "lidl",
    sourceLabel: "Lidl Konyha",
    filePath: path.join(DATA_DIR, "family-flow-lidl-expanded-recipes.safe-import.json"),
  },
  {
    sourceKey: "nosalty",
    sourceLabel: "Nosalty",
    filePath: path.join(DATA_DIR, "family-flow-nosalty-recipes.safe-import.json"),
  },
];

const OUTPUTS = {
  normalized: path.join(DATA_DIR, "recipes.normalized.json"),
  manifest: path.join(DATA_DIR, "recipe-image-manifest.json"),
  promptsJson: path.join(DATA_DIR, "recipe-image-prompts.json"),
  promptsCsv: path.join(DATA_DIR, "recipe-image-prompts.csv"),
  review: path.join(DATA_DIR, "recipe-image-review.json"),
  reviewOverrides: path.join(DATA_DIR, "recipe-image-review-overrides.json"),
};

function parseArgs(argv) {
  const args = {
    batch: 1,
    start: 0,
    count: 20,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key === "--batch" && value) {
      args.batch = Number(value);
      index += 1;
      continue;
    }
    if (key === "--start" && value) {
      args.start = Number(value);
      index += 1;
      continue;
    }
    if (key === "--count" && value) {
      args.count = Number(value);
      index += 1;
    }
  }

  return args;
}

function removeAccents(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeSpace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return normalizeSpace(removeAccents(value).toLowerCase())
    .replace(/&/g, " es ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureStableId(item, sourceKey) {
  if (typeof item.id === "string" && item.id.trim()) {
    return item.id.trim();
  }
  return `${sourceKey}-${slugify(item.title || "recipe")}`;
}

function toRecipeTextParts(recipe) {
  const ingredients = recipe.ingredientGroups.flatMap((group) => group.items.map((item) => item.name));
  return {
    title: normalizeSpace(recipe.title || ""),
    ingredients,
    steps: recipe.customPreparationSteps.map((step) => normalizeSpace(step)),
    haystack: normalizeSpace(
      [
        recipe.title,
        recipe.category,
        ...(recipe.tags || []),
        ...ingredients,
        ...recipe.customPreparationSteps,
      ].join(" "),
    ).toLowerCase(),
  };
}

function ingredientNames(recipe) {
  return recipe.ingredientGroups.flatMap((group) =>
    group.items.map((item) => normalizeSpace(item.name || "")).filter(Boolean),
  );
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function makeVisualRule(visualType, confidence, patterns, subject, keywords = []) {
  return { visualType, confidence, patterns, subject, keywords };
}

const VISUAL_RULES = [
  makeVisualRule(
    "green-smoothie",
    "high",
    [/\bturmix\b/, /\bsmoothie\b/, /\bspenot\b/, /\bspen[oó]t\b/, /\bz[oö]ld turmix\b/],
    "a vibrant green smoothie in a clear glass, visibly blended from spinach and fruit",
    ["spinach smoothie", "green drink"],
  ),
  makeVisualRule(
    "smoothie",
    "high",
    [/\bsmoothie\b/, /\bshake\b/, /\bprotein\b/, /\bturmix\b/, /\bital\b/],
    "a thick fruit smoothie in a tall clear glass",
    ["smoothie", "drink"],
  ),
  makeVisualRule(
    "acai-bowl",
    "high",
    [/\bacai\b/, /\baça[ií]\b/],
    "an acai breakfast bowl with deep purple base and neatly arranged fruit toppings",
    ["acai bowl", "breakfast bowl"],
  ),
  makeVisualRule(
    "chia-pudding",
    "high",
    [/\bchia\b/, /\bpuding\b/, /\bpudding\b/],
    "a creamy chia pudding in a small glass or ceramic bowl with fruit topping",
    ["chia pudding", "breakfast dessert"],
  ),
  makeVisualRule(
    "yogurt-bowl",
    "high",
    [/\bjoghurt\b/, /\bjogurt\b/, /\bmuzli\b/, /\bm[uü]zli\b/, /\bgranola\b/, /\bzabkasa\b/],
    "a ceramic breakfast bowl with thick yogurt, muesli or granola, and fresh fruit",
    ["yogurt bowl", "breakfast bowl"],
  ),
  makeVisualRule(
    "bagel-sandwich",
    "high",
    [/\bbagel\b/],
    "a bagel sandwich or open-faced bagel with visible filling",
    ["bagel", "breakfast sandwich"],
  ),
  makeVisualRule(
    "toast",
    "high",
    [/\bpir[ií]t[oó]s\b/, /\btoast\b/, /\bbruschetta\b/],
    "artisan toast with clearly visible topping on top",
    ["toast", "open sandwich"],
  ),
  makeVisualRule(
    "omelette",
    "high",
    [/\bomlett\b/, /\br[aá]ntotta\b/, /\bt[oö]k[oö]rtoj[aá]s\b/, /\btoj[aá]s\b/],
    "a plated egg-based breakfast dish such as omelette or scrambled eggs",
    ["egg breakfast", "omelette"],
  ),
  makeVisualRule(
    "pancake-crepe",
    "high",
    [/\bpalacsinta\b/, /\bcrepe\b/, /\bcrépe\b/],
    "thin pancakes or crepes folded or stacked on a plate",
    ["crepe", "pancake"],
  ),
  makeVisualRule(
    "pogacsa",
    "high",
    [/\bpog[aá]csa\b/],
    "small golden savory pogacsa pastries on a plate or linen-lined tray",
    ["pogacsa", "savory pastry"],
  ),
  makeVisualRule(
    "burek",
    "high",
    [/\bburek\b/],
    "a flaky savory burek pastry with visible spiral or layered cut edge",
    ["burek", "savory pastry"],
  ),
  makeVisualRule(
    "brownie",
    "high",
    [/\bbrownie\b/, /\bblondie\b/],
    "a square brownie or blondie slice with dense crumb and clean cut edges",
    ["brownie", "dessert bar"],
  ),
  makeVisualRule(
    "cheesecake-bar",
    "high",
    [/\bsajttorta\b/, /\bcheesecake\b/],
    "a baked cheesecake square or slice with creamy filling and neat edges",
    ["cheesecake", "dessert bar"],
  ),
  makeVisualRule(
    "cake-slice",
    "medium",
    [/\bkr[eé]mes\b/, /\btorta\b/, /\bmousse\b/, /\bischler\b/, /\bpite\b/, /\bszelet\b/],
    "a plated slice or piece of homemade dessert with visible layers or texture",
    ["cake", "dessert"],
  ),
  makeVisualRule(
    "pizza",
    "high",
    [/\bpizza\b/, /\blangall[oó]\b/, /\bflammkuchen\b/],
    "a baked pizza seen from above with clearly visible toppings",
    ["pizza", "baked main"],
  ),
  makeVisualRule(
    "pasta",
    "high",
    [/\bt[eé]szta\b/, /\bteszta\b/, /\bspagetti\b/, /\bspaghetti\b/, /\bcarbonara\b/, /\blasagne\b/, /\bgnocchi\b/, /\bravioli\b/, /\btagliatelle\b/, /\bnudli\b/, /\bnokedli\b/],
    "a plated pasta dish with sauce clearly coating the pasta",
    ["pasta", "main dish"],
  ),
  makeVisualRule(
    "soup",
    "high",
    [/\bleves\b/, /\bkr[eé]mleves\b/, /\bkremleves\b/, /\bguly[aá]s\b/, /\bramen\b/, /\bpho\b/],
    "a bowl of soup served hot, with the broth or creamy texture clearly visible",
    ["soup", "bowl"],
  ),
  makeVisualRule(
    "salad",
    "high",
    [/\bsal[aá]ta\b/, /\bsalata\b/, /\bcezar\b/, /\bcaesar\b/, /\bcaprese\b/, /\bnicoise\b/, /\bquinoa t[aá]l\b/],
    "a fresh composed salad in a bowl or shallow plate with colorful ingredients",
    ["salad", "fresh bowl"],
  ),
  makeVisualRule(
    "roasted-potato",
    "high",
    [/\bs[uü]lt krumpli\b/, /\bburgonya\b/, /\bkrumpli\b/, /\bhas[áa]bburgonya\b/],
    "crispy roasted or fried potatoes on a plate, with golden edges and fluffy interior",
    ["potato", "side dish"],
  ),
  makeVisualRule(
    "roasted-chicken",
    "high",
    [/\bcsirke\b/, /\bcsirkemell\b/, /\bcsirkecomb\b/, /\bs[uü]ltcsirke\b/, /\bpulyka\b/],
    "a roasted or pan-cooked chicken main dish with visible chicken pieces",
    ["chicken main", "roasted chicken"],
  ),
  makeVisualRule(
    "fish-main",
    "high",
    [/\blazac\b/, /\bhal\b/, /\btonhal\b/, /\bpisztr[aá]ng\b/, /\bt[oő]kehal\b/, /\bgarn[eé]la\b/],
    "a plated fish or seafood main dish with the protein clearly visible",
    ["fish main", "seafood plate"],
  ),
  makeVisualRule(
    "steak-main",
    "high",
    [/\bsteak\b/, /\bmarha\b/, /\bmarhah[uú]s\b/, /\bh[aá]tsz[ií]n\b/],
    "a sliced or plated steak main dish cooked and served on a ceramic plate",
    ["steak", "meat main"],
  ),
  makeVisualRule(
    "stew",
    "medium",
    [/\bp[oö]rk[oö]lt\b/, /\bragu\b/, /\bcurry\b/, /\bchili\b/, /\begyt[aá]l\b/, /\bpaprik[aá]s\b/, /\bbabguly[aá]s\b/],
    "a hearty stew, ragu, or one-pot meal in a shallow bowl or plate",
    ["stew", "one pot"],
  ),
  makeVisualRule(
    "savory-bake",
    "medium",
    [/\bquiche\b/, /\br[eé]tes\b/, /\btekercs\b/, /\bkifli\b/, /\bkeny[eé]r\b/, /\bfocaccia\b/],
    "a savory baked pastry or bread with crisp golden crust",
    ["savory bake", "pastry"],
  ),
  makeVisualRule(
    "dessert",
    "low",
    [/\bdesszert\b/, /\b[eé]dess[eé]g\b/, /\bs[uü]ti\b/, /\bsutemeny\b/],
    "a plated homemade dessert with clearly defined texture",
    ["dessert"],
  ),
];

function inferVisualType(recipe) {
  const { haystack, title, ingredients, steps } = toRecipeTextParts(recipe);
  const titleText = removeAccents(title.toLowerCase());
  const ingredientText = removeAccents(ingredients.join(" ").toLowerCase());
  const stepText = removeAccents(steps.join(" ").toLowerCase());
  const fullText = `${titleText} ${ingredientText} ${stepText}`;

  const titleRule = (visualType, visualConfidence, visualSubject, suspiciousMatch = false) => ({
    visualType,
    visualConfidence,
    visualSubject,
    visualCues: ["title"],
    suspiciousMatch,
  });

  if (/\bzold turmix\b|\bturmix\b.*\bspenot\b|\bspenot\b.*\bturmix\b/.test(titleText)) {
    return titleRule("green-smoothie", "high", "a vibrant green smoothie in a clear glass, visibly blended from spinach and fruit");
  }
  if (/\bsmoothie\b|\bshake\b/.test(titleText)) {
    return titleRule("smoothie", "high", "a thick fruit smoothie in a tall clear glass");
  }
  if (/\bacai\b/.test(titleText)) {
    return titleRule("acai-bowl", "high", "an acai breakfast bowl with deep purple base and neatly arranged fruit toppings");
  }
  if (/\bchia\b/.test(titleText)) {
    return titleRule("chia-pudding", "high", "a creamy chia pudding in a small glass or ceramic bowl with fruit topping");
  }
  if (/\bmuzli\b|\bmuesli\b|\bgranola\b|\bjoghurt\b|\bjogurt\b|\bzabkasa\b/.test(titleText)) {
    return titleRule("yogurt-bowl", "high", "a ceramic breakfast bowl with thick yogurt, muesli or granola, and fresh fruit");
  }
  if (/\bbagel\b/.test(titleText)) {
    return titleRule("bagel-sandwich", "high", "a bagel sandwich or open-faced bagel with visible filling");
  }
  if (/\bpiritos\b|\btoast\b|\bbruschetta\b/.test(titleText)) {
    return titleRule("toast", "high", "artisan toast with clearly visible topping on top");
  }
  if (/hortobagyi.*palacsint/.test(titleText)) {
    return titleRule("savory-crepe", "high", "a savory stuffed crepe or rolled pancake filled with paprika-rich meat sauce");
  }
  if (/palacsint|crepe/.test(titleText)) {
    return titleRule("pancake-crepe", "high", "thin pancakes or crepes folded or stacked on a plate");
  }
  if (/\bturogomboc\b/.test(titleText)) {
    return titleRule("sweet-dumpling", "high", "soft sweet cottage cheese dumplings served as a plated dessert");
  }
  if (/\baranygaluska\b/.test(titleText)) {
    return titleRule("sweet-bun-dessert", "high", "golden pull-apart sweet pastry pieces dusted or glazed like a classic baked dessert");
  }
  if (/\bfank\b/.test(titleText)) {
    return titleRule("donut", "high", "a plated homemade donut with clear pastry texture and optional glaze or sugar coating");
  }
  if (/\bischler\b/.test(titleText)) {
    return titleRule("cookie-dessert", "high", "a small sandwich cookie dessert with chocolate coating or visible filling");
  }
  if (/\bsutinyaloka\b|\bcake pop\b/.test(titleText)) {
    return titleRule("cake-pop", "high", "decorated cake pops on sticks with homemade dessert styling");
  }
  if (/tiramisu/.test(titleText)) {
    return titleRule("layered-dessert", "high", "a plated tiramisu-style layered dessert with visible creamy layers");
  }
  if (/mousse/.test(titleText)) {
    return titleRule("mousse-dessert", "high", "a silky chocolate or fruit mousse served in a dessert glass or bowl");
  }
  if (/\bbrownie\b|\bblondie\b/.test(titleText)) {
    return titleRule("brownie", "high", "a square brownie or blondie slice with dense crumb and clean cut edges");
  }
  if (/sajttorta|cheesecake/.test(titleText)) {
    return titleRule("cheesecake-bar", "high", "a baked cheesecake square or slice with creamy filling and neat edges");
  }
  if (/pite/.test(titleText)) {
    return titleRule("pie-dessert", "high", "a slice of homemade pie with visible filling and golden crust");
  }
  if (/\bkr[eé]mes\b|\btorta\b|\bszufle\b|\bsouffle\b/.test(titleText)) {
    return titleRule("cake-slice", "medium", "a plated slice or piece of homemade dessert with visible layers or texture", true);
  }
  if (/\bpogacsa\b/.test(titleText)) {
    return titleRule("pogacsa", "high", "small golden savory pogacsa pastries on a plate or linen-lined tray");
  }
  if (/\bburek\b/.test(titleText)) {
    return titleRule("burek", "high", "a flaky savory burek pastry with visible spiral or layered cut edge");
  }
  if (/\bpizza\b/.test(titleText)) {
    return titleRule("pizza", "high", "a baked pizza seen from above with clearly visible toppings");
  }
  if (/\bspagetti\b|\bspaghetti\b|\bcarbonara\b|\blasagne\b|\blazagne\b|\bgnocchi\b|\bravioli\b|\btagliatelle\b|\bteszta\b|\bt[eé]szta\b/.test(titleText)) {
    return titleRule("pasta", "high", "a plated pasta dish with sauce clearly coating the pasta");
  }
  if (/\bleves\b|\bgulyas\b|\bramen\b|\bpho\b/.test(titleText)) {
    return titleRule("soup", "high", "a bowl of soup served hot, with the broth or creamy texture clearly visible");
  }
  if (/\bsalata\b|\bsal[aá]ta\b|\bcezar\b|\bcaesar\b|\bcaprese\b|\bnicoise\b/.test(titleText)) {
    return titleRule("salad", "high", "a fresh composed salad in a bowl or shallow plate with colorful ingredients");
  }
  if (/porkolt|ragu|curry|chili|paprikas|babgulyas/.test(titleText)) {
    return titleRule("stew", "high", "a hearty stew, ragu, or one-pot meal in a shallow bowl or plate");
  }
  if (/\bburgonya\b|\bkrumpli\b/.test(titleText)) {
    return titleRule("roasted-potato", "medium", "crispy roasted or fried potatoes on a plate, with golden edges and fluffy interior", true);
  }
  if (/\blazac\b|\bhal\b|\bgarnela\b|\bgarn[eé]la\b|\btonhal\b/.test(titleText)) {
    return titleRule("fish-main", "high", "a plated fish or seafood main dish with the protein clearly visible");
  }
  if (/\bmarhasteak\b|\bsteak\b|\bmarha\b/.test(titleText)) {
    return titleRule("steak-main", "high", "a sliced or plated steak main dish cooked and served on a ceramic plate");
  }
  if (/\bcsirke\b|\bcsirkemell\b|\bcsirkecomb\b|\bpulyka\b/.test(titleText)) {
    return titleRule("roasted-chicken", "high", "a roasted or pan-cooked chicken main dish with visible chicken pieces");
  }
  if (/\bpaella\b/.test(titleText)) {
    return titleRule("rice-main", "high", "a saffron-style rice main dish with the toppings clearly visible");
  }

  let matched = null;

  for (const rule of VISUAL_RULES) {
    const matches = rule.patterns.filter((pattern) => pattern.test(fullText));
    if (!matches.length) {
      continue;
    }

    const titleMatchCount = rule.patterns.filter((pattern) => pattern.test(titleText)).length;
    const ingredientMatchCount = rule.patterns.filter((pattern) => pattern.test(ingredientText)).length;
    const score = matches.length * 2 + titleMatchCount * 3 + ingredientMatchCount;

    if (!matched || score > matched.score) {
      matched = {
        ...rule,
        cues: unique([
          titleMatchCount ? "title" : "",
          ingredientMatchCount ? "ingredients" : "",
          stepText && rule.patterns.some((pattern) => pattern.test(stepText)) ? "steps" : "",
        ]),
        score,
      };
    }
  }

  if (matched) {
    return {
      visualType: matched.visualType,
      visualConfidence: matched.confidence,
      visualSubject: matched.subject,
      visualCues: matched.cues,
      suspiciousMatch: matched.confidence !== "high",
    };
  }

  const haystackFallback = removeAccents(haystack);

  if (/\blazac\b|\bhal\b|\bgarnela\b/.test(haystackFallback)) {
    return {
      visualType: "fish-main",
      visualConfidence: "medium",
      visualSubject: "a plated fish or seafood main dish with the protein clearly visible",
      visualCues: ["ingredients"],
      suspiciousMatch: true,
    };
  }

  if (/\bcsirke\b|\bcsirkemell\b|\bcsirkecomb\b|\bpulyka\b/.test(haystackFallback)) {
    return {
      visualType: "roasted-chicken",
      visualConfidence: "medium",
      visualSubject: "a roasted or pan-cooked chicken main dish with visible chicken pieces",
      visualCues: ["ingredients"],
      suspiciousMatch: true,
    };
  }

  if (/\btofu\b|\bspenot\b|\bzoldseg\b/.test(haystackFallback)) {
    return {
      visualType: "vegetable-main",
      visualConfidence: "low",
      visualSubject: "a vegetable-forward homemade main dish on a ceramic plate",
      visualCues: ["ingredients"],
      suspiciousMatch: true,
    };
  }

  return {
    visualType: "plated-main",
    visualConfidence: "low",
    visualSubject: "a plated homemade family meal on a ceramic plate",
    visualCues: [],
    suspiciousMatch: true,
  };
}

function pickHeroIngredients(ingredients) {
  const blocked = new Set([
    "fo alapanyag",
    "koret vagy zoldseg",
    "kamrabol",
    "so",
    "bors",
    "frissen orolt bors",
    "olivaolaj",
    "voroshagyma",
    "fokhagyma",
    "viz",
    "tej",
    "liszt",
    "tojas",
    "vaj",
    "cukor",
    "vanilia",
  ]);

  return unique(
    ingredients
      .map((ingredient) =>
        normalizeSpace(
          removeAccents(ingredient)
            .toLowerCase()
            .replace(/\b(optional|opcionalis|izles szerint|friss|apr[oó]ra v[aá]gva|langyos)\b/g, "")
            .replace(/[^a-z0-9\s]+/g, " "),
        ),
      )
      .filter(Boolean)
      .map((ingredient) => ingredient.split(" ").slice(-3).join(" ").trim())
      .filter((ingredient) => ingredient && !blocked.has(ingredient)),
  ).slice(0, 5);
}

function buildDishDetails(recipe, visualType) {
  const ingredients = pickHeroIngredients(ingredientNames(recipe));
  const detail = ingredients.length ? `with visible ${ingredients.join(", ")}` : "";

  switch (visualType) {
    case "green-smoothie":
      return `a tall glass of green smoothie ${detail || "with spinach and banana clearly visible through the glass"}`;
    case "smoothie":
      return `a thick fruit smoothie in a tall clear glass ${detail}`.trim();
    case "acai-bowl":
      return `an acai bowl with deep berry-purple base ${detail || "with sliced fruit and crunchy toppings"}`;
    case "chia-pudding":
      return `a chia pudding breakfast cup ${detail || "with fruit topping and creamy texture"}`;
    case "yogurt-bowl":
      return `a yogurt and muesli breakfast bowl ${detail || "with fruit and crunchy topping"}`;
    case "savory-crepe":
      return `savory stuffed crepes ${detail || "with rich paprika filling and sauce"}`;
    case "bagel-sandwich":
      return `a bagel with clearly visible filling ${detail}`;
    case "toast":
      return `an open-faced toast ${detail}`;
    case "omelette":
      return `a plated egg breakfast ${detail}`;
    case "pancake-crepe":
      return `thin pancakes or crepes on a ceramic plate ${detail}`;
    case "pogacsa":
      return `golden pogacsa pastries ${detail || "with flaky savory crumb"}`;
    case "burek":
      return `a flaky burek pastry ${detail || "with visible layered filling"}`;
    case "brownie":
      return `a neat brownie or blondie square ${detail || "with rich dense crumb"}`;
    case "cheesecake-bar":
      return `a cheesecake square ${detail || "with creamy baked filling"}`;
    case "pie-dessert":
      return `a slice of pie ${detail || "with golden crust and visible filling"}`;
    case "layered-dessert":
      return `a layered chilled dessert ${detail || "with clearly visible cream layers"}`;
    case "mousse-dessert":
      return `a mousse dessert ${detail || "with silky whipped texture"}`;
    case "cake-pop":
      return `decorated cake pops ${detail || "on small sticks with dessert styling"}`;
    case "cookie-dessert":
      return `small homemade sandwich cookies ${detail || "with chocolate glaze or visible filling"}`;
    case "sweet-dumpling":
      return `soft sweet dumplings ${detail || "served as a plated dessert"}`;
    case "sweet-bun-dessert":
      return `a baked sweet pastry dessert ${detail || "with golden pull-apart texture"}`;
    case "donut":
      return `a homemade donut ${detail || "with sugar or glaze"}`;
    case "cake-slice":
      return `a plated homemade dessert slice ${detail}`;
    case "pizza":
      return `a freshly baked pizza ${detail}`;
    case "pasta":
      return `a pasta plate ${detail}`;
    case "soup":
      return `a bowl of soup ${detail}`;
    case "salad":
      return `a composed salad ${detail}`;
    case "roasted-potato":
      return `crispy roasted or fried potatoes ${detail}`;
    case "roasted-chicken":
      return `a chicken main dish ${detail}`;
    case "fish-main":
      return `a fish or seafood main dish ${detail}`;
    case "steak-main":
      return `a steak or beef main dish ${detail}`;
    case "stew":
      return `a hearty stew or one-pot meal ${detail}`;
    case "rice-main":
      return `a rice-based main dish ${detail || "with colorful toppings and clear grain texture"}`;
    case "savory-bake":
      return `a savory baked pastry ${detail}`;
    case "vegetable-main":
      return `a vegetable-forward plated meal ${detail}`;
    default:
      return `a plated homemade family meal ${detail}`.trim();
  }
}

function buildImagePrompt(recipe, visualType, visualSubject) {
  const title = normalizeSpace(recipe.title);
  const ingredients = pickHeroIngredients(ingredientNames(recipe));
  const ingredientHint = ingredients.length ? ` Key ingredients: ${ingredients.join(", ")}.` : "";
  const dishDetails = buildDishDetails(recipe, visualType);

  return [
    `Recipe title: ${title}.`,
    `Create ${dishDetails}.`,
    `The dish must read visually as ${visualSubject}.`,
    "Style: realistic editorial food photography, warm natural daylight, cozy modern family kitchen, cream linen table, ceramic tableware, soft shadows, premium Family Flow look, clean composition.",
    "Camera: appetizing close-up or 3/4 tabletop framing with the food as the clear hero.",
    `${ingredientHint}`.trim(),
    "No text, no watermark, no logo, no brand packaging, no people, no hands.",
  ]
    .filter(Boolean)
    .join(" ");
}

function mapRecipe(item, sourceKey, sourceLabel, slugRegistry) {
  const stableId = ensureStableId(item, sourceKey);
  const baseSlug = slugify(item.title || stableId) || stableId;
  const slugCollisionCount = slugRegistry.get(baseSlug) ?? 0;
  slugRegistry.set(baseSlug, slugCollisionCount + 1);

  const slug =
    slugCollisionCount === 0 ? baseSlug : `${baseSlug}-${stableId.slice(-6).replace(/[^a-z0-9]/g, "") || "alt"}`;

  const visual = inferVisualType(item);
  const imagePrompt = buildImagePrompt(item, visual.visualType, visual.visualSubject);
  const imagePath = `/assets/recipes/images/${slug}.webp`;
  const thumbnailPath = `/assets/recipes/images/thumbnails/${slug}.webp`;

  return {
    id: stableId,
    sourceId: item.id,
    slug,
    sourceKey,
    sourceName: sourceLabel,
    title: normalizeSpace(item.title || stableId),
    description: normalizeSpace(item.safeShortDescription || ""),
    durationMinutes: item.totalTimeMinutes ?? null,
    servings: item.servings ?? null,
    difficulty: item.difficulty ?? null,
    category: normalizeSpace(item.category || ""),
    tags: item.tags || [],
    ingredients: ingredientNames(item),
    ingredientGroups: item.ingredientGroups.map((group) => ({
      name: normalizeSpace(group.name || ""),
      items: group.items.map((groupItem) => ({
        name: normalizeSpace(groupItem.name || ""),
        amount: groupItem.amount ?? null,
        unit: groupItem.unit ?? null,
        note: groupItem.note ?? null,
        optional: Boolean(groupItem.optional),
      })),
    })),
    steps: item.customPreparationSteps.map((step) => normalizeSpace(step)),
    sourceUrl: item.sourceUrl,
    visualType: visual.visualType,
    visualConfidence: visual.visualConfidence,
    visualCues: visual.visualCues,
    imagePrompt,
    image: {
      filename: `${slug}.webp`,
      path: imagePath,
      thumbnailPath,
      status: "missing",
      reviewStatus: "pending",
      prompt: imagePrompt,
    },
  };
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fileSizeIfExists(filePath) {
  try {
    const fileStat = await stat(filePath);
    return fileStat.size;
  } catch {
    return 0;
  }
}

function toCsv(rows, columns) {
  const escapeValue = (value) => {
    const stringValue = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  return [columns.join(","), ...rows.map((row) => columns.map((column) => escapeValue(row[column])).join(","))].join("\n");
}

async function loadImportFile(filePath) {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function loadReviewOverrides() {
  if (!(await pathExists(OUTPUTS.reviewOverrides))) {
    return { items: [] };
  }

  try {
    return await loadImportFile(OUTPUTS.reviewOverrides);
  } catch {
    return { items: [] };
  }
}

async function loadNormalizedRecipes() {
  const slugRegistry = new Map();
  const normalized = [];

  for (const input of INPUT_FILES) {
    const pkg = await loadImportFile(input.filePath);
    for (const recipe of pkg.recipes) {
      normalized.push(mapRecipe(recipe, input.sourceKey, input.sourceLabel, slugRegistry));
    }
  }

  return normalized;
}

async function attachImageStatuses(normalizedRecipes, reviewOverrides) {
  const overrideByRecipeId = new Map(
    (reviewOverrides.items || [])
      .filter((item) => item && typeof item.recipeId === "string")
      .map((item) => [item.recipeId, item]),
  );
  const generated = [];

  for (const recipe of normalizedRecipes) {
    const absoluteImagePath = path.join(PUBLIC_DIR, recipe.image.path.replace(/^\//, ""));
    const absoluteThumbnailPath = path.join(PUBLIC_DIR, recipe.image.thumbnailPath.replace(/^\//, ""));
    const hasImage = await pathExists(absoluteImagePath);
    const hasThumbnail = await pathExists(absoluteThumbnailPath);
    const imageSize = await fileSizeIfExists(absoluteImagePath);
    const thumbnailSize = await fileSizeIfExists(absoluteThumbnailPath);
    const suspiciousMatch = recipe.visualConfidence !== "high";
    const override = overrideByRecipeId.get(recipe.id);
    const reviewStatus = hasImage
      ? override?.reviewStatus || "needs-review"
      : override?.reviewStatus || "pending";
    const status = hasImage ? "generated" : "missing";

    recipe.image.status = status;
    recipe.image.reviewStatus = reviewStatus;

    if (hasImage) {
      generated.push({
        recipeId: recipe.id,
        slug: recipe.slug,
        title: recipe.title,
        visualType: recipe.visualType,
        reviewStatus,
        suspiciousMatch,
        reviewNotes: override?.notes || "",
        imagePath: recipe.image.path,
        thumbnailPath: recipe.image.thumbnailPath,
        hasThumbnail,
        imageBytes: imageSize,
        thumbnailBytes: thumbnailSize,
      });
    }
  }

  return generated;
}

function buildManifest(normalizedRecipes) {
  return {
    generatedAt: new Date().toISOString(),
    totalRecipes: normalizedRecipes.length,
    imageBasePath: "/assets/recipes/images",
    thumbnailBasePath: "/assets/recipes/images/thumbnails",
    items: normalizedRecipes.map((recipe) => ({
      recipeId: recipe.id,
      slug: recipe.slug,
      title: recipe.title,
      sourceName: recipe.sourceName,
      visualType: recipe.visualType,
      visualConfidence: recipe.visualConfidence,
      image: recipe.image,
    })),
  };
}

function buildPromptExport(normalizedRecipes) {
  return normalizedRecipes.map((recipe) => ({
    recipeId: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    sourceName: recipe.sourceName,
    visualType: recipe.visualType,
    visualConfidence: recipe.visualConfidence,
    reviewStatus: recipe.image.reviewStatus,
    status: recipe.image.status,
    targetFilename: recipe.image.filename,
    imagePath: recipe.image.path,
    thumbnailPath: recipe.image.thumbnailPath,
    imagePrompt: recipe.imagePrompt,
  }));
}

function buildBatch(normalizedRecipes, batchNumber, start, count) {
  const items = normalizedRecipes.slice(start, start + count).map((recipe) => ({
    recipeId: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    visualType: recipe.visualType,
    imagePrompt: recipe.imagePrompt,
    targetFilename: recipe.image.filename,
  }));

  return {
    batchId: `image-generation-batch-${String(batchNumber).padStart(3, "0")}`,
    generatedAt: new Date().toISOString(),
    startIndex: start,
    count: items.length,
    items,
  };
}

async function ensureDirs() {
  await mkdir(IMAGE_DIR, { recursive: true });
  await mkdir(THUMB_DIR, { recursive: true });
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await ensureDirs();

  const normalizedRecipes = await loadNormalizedRecipes();
  const reviewOverrides = await loadReviewOverrides();
  const generatedReviewRows = await attachImageStatuses(normalizedRecipes, reviewOverrides);
  const manifest = buildManifest(normalizedRecipes);
  const promptRows = buildPromptExport(normalizedRecipes);
  const batch = buildBatch(normalizedRecipes, args.batch, args.start, args.count);
  const batchOutputPath = path.join(
    DATA_DIR,
    `image-generation-batch-${String(args.batch).padStart(3, "0")}.json`,
  );

  await writeJson(OUTPUTS.normalized, {
    generatedAt: new Date().toISOString(),
    totalRecipes: normalizedRecipes.length,
    recipes: normalizedRecipes,
  });
  await writeJson(OUTPUTS.manifest, manifest);
  await writeJson(OUTPUTS.promptsJson, {
    generatedAt: new Date().toISOString(),
    totalRecipes: promptRows.length,
    prompts: promptRows,
  });
  await writeFile(
    OUTPUTS.promptsCsv,
    `${toCsv(promptRows, [
      "recipeId",
      "slug",
      "title",
      "sourceName",
      "visualType",
      "visualConfidence",
      "reviewStatus",
      "status",
      "targetFilename",
      "imagePath",
      "thumbnailPath",
      "imagePrompt",
    ])}\n`,
    "utf8",
  );
  await writeJson(OUTPUTS.review, {
    generatedAt: new Date().toISOString(),
    generatedCount: generatedReviewRows.length,
    items: generatedReviewRows,
  });
  if (!(await pathExists(OUTPUTS.reviewOverrides))) {
    await writeJson(OUTPUTS.reviewOverrides, {
      generatedAt: new Date().toISOString(),
      items: [],
    });
  }
  await writeJson(batchOutputPath, batch);

  const summaryHash = crypto
    .createHash("sha1")
    .update(normalizedRecipes.map((recipe) => recipe.id).join("|"))
    .digest("hex")
    .slice(0, 12);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        totalRecipes: normalizedRecipes.length,
        batchFile: path.relative(ROOT, batchOutputPath),
        generatedImages: generatedReviewRows.length,
        datasetFingerprint: summaryHash,
      },
      null,
      2,
    ),
  );
}

await main();
