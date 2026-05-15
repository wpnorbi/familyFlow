import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, "src/data/family-flow-nosalty-recipes.safe-import.json");
const SITEMAP_URL = "https://www.nosalty.hu/sitemap.xml";
const BASE_URL = "https://www.nosalty.hu";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

function parseArgs() {
  const args = new Map();
  for (const arg of process.argv.slice(2)) {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    args.set(key, value);
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractLocs(xml) {
  return Array.from(xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g), (match) => decodeXml(match[1].trim()));
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function decodeHtml(value) {
  return decodeXml(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
}

function stripHtml(value) {
  return decodeHtml(String(value ?? "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function normalizeTitle(value) {
  return stripHtml(value)
    .replace(/\s+\|\s*Nosalty$/i, "")
    .replace(/\s+recept$/i, "")
    .trim();
}

function durationToMinutes(value) {
  if (!value) return 0;
  const text = String(value);
  const iso = text.match(/^P(?:T)?(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (iso) return (Number(iso[1] ?? 0) * 60) + Number(iso[2] ?? 0);

  const hours = text.match(/(\d+)\s*(?:óra|ora|h)/i);
  const minutes = text.match(/(\d+)\s*(?:perc|min|m)/i);
  return (Number(hours?.[1] ?? 0) * 60) + Number(minutes?.[1] ?? 0);
}

function normalizeDuration(recipe) {
  const total = durationToMinutes(recipe.totalTime);
  if (total) return total;
  const parts = durationToMinutes(recipe.prepTime) + durationToMinutes(recipe.cookTime);
  return parts || null;
}

function normalizeImage(image) {
  if (typeof image === "string") return image;
  if (Array.isArray(image)) return normalizeImage(image[0]);
  if (image && typeof image === "object") return image.url ?? image.contentUrl ?? null;
  return null;
}

function normalizeServings(value) {
  if (typeof value === "number") return value;
  if (Array.isArray(value)) return normalizeServings(value[0]);
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function normalizeDifficulty(value) {
  const text = String(value ?? "").toLowerCase();
  if (/neh[eé]z|hard/.test(text)) return "Nehéz";
  if (/közepes|kozepes|medium/.test(text)) return "Közepes";
  if (/könnyű|konnyu|easy/.test(text)) return "Könnyű";
  return null;
}

function inferCategory(title, sourceCategory = "") {
  const text = `${title} ${Array.isArray(sourceCategory) ? sourceCategory.join(" ") : sourceCategory}`.toLowerCase();
  if (/(torta|pite|palacsinta|fánk|fank|bejgli|muffin|brownie|keksz|süti|suti|édesség|edesseg|desszert|krémes)/.test(text)) {
    return "Desszert";
  }
  if (/(reggeli|omlett|tojás|tojas|zabkása|zabkasa|szendvics)/.test(text)) return "Reggeli";
  if (/(főzelék|fozelek)/.test(text)) return "Főzelék";
  if (/(leves|krémleves|kremleves)/.test(text)) return "Leves";
  if (/(saláta|salata)/.test(text)) return "Saláta";
  if (/(tészta|teszta|pasta|spagetti|spaghetti|gnocchi|pizza|lasagne|nudli|nokedli)/.test(text)) return "Tészta";
  if (/(rakott|ragu|curry|egytál|egytal|rizottó|rizotto)/.test(text)) return "Egytálétel";
  return "Főétel";
}

function inferMealType(title, category) {
  const text = `${title} ${category}`.toLowerCase();
  if (/desszert|édesség|edesseg|torta|pite|palacsinta|fánk|fank|brownie|keksz|süti|suti/.test(text)) return "desszert";
  if (/reggeli|omlett|tojás|tojas|zabkása|zabkasa|szendvics/.test(text)) return "reggeli";
  if (/főzelék|fozelek/.test(text)) return "fozelek";
  if (/leves|krémleves|kremleves/.test(text)) return "leves";
  if (/tészta|teszta|pasta|spagetti|spaghetti|gnocchi|pizza|lasagne|nudli|nokedli/.test(text)) return "teszta";
  if (/saláta|salata/.test(text)) return "salata";
  if (/rakott|ragu|curry|egytál|egytal|rizottó|rizotto/.test(text)) return "egytaletel";
  return "foetel";
}

function inferTags(title, category, duration, ingredients) {
  const text = `${title} ${category} ${ingredients.join(" ")}`.toLowerCase();
  const tags = new Set(["nosalty", inferMealType(title, category)]);

  if (duration && duration <= 30) tags.add("gyors");
  if (duration && duration <= 20) tags.add("rövid");
  else if (duration && duration <= 50) tags.add("közepes idő");
  else tags.add("hosszú");

  if (/csirke|csirkemell|csirkecomb|pulyka/.test(text)) tags.add("csirke");
  if (/hal|lazac|tonhal|pisztráng|pisztrang|tőkehal|ponty|harcsa/.test(text)) tags.add("hal");
  if (/marha|borjú|borju|steak|hátszín|hatszin/.test(text)) tags.add("marha");
  if (/sertés|sertes|karaj|tarja|szalonna|kolbász|kolbasz|sonka/.test(text)) tags.add("sertés");
  if (/vegetáriánus|vegetarian|zöldség|zoldseg|gomba|tofu/.test(text)) tags.add("vegetáriánus");
  if (/tészta|teszta|pasta|spagetti|spaghetti|gnocchi|pizza/.test(text)) tags.add("tészta");

  const hardNo = /(csípős|csipos|chili|jalapeno|jalapeño|habanero|chipotle|erős|eros|pikáns|pikans|alkohol|boros|sörös|soros|rum|kávé|kave|steak|hátszín|hatszin|pacal|belsőség|belsoseg|garnéla|garnela|rák|rak|kagyló|kagylo|nyers)/;
  const kidSignals = /(krémes|kremes|selymes|főzelék|fozelek|tészta|teszta|gnocchi|nudli|nokedli|rizs|csirke|pulyka|sajt|túró|turo|tejföl|tejfol|omlett|tojás|tojas|palacsinta|tejbegríz|tejbegriz|krémleves|kremleves)/;
  if (!hardNo.test(text) && (kidSignals.test(text) || duration <= 30)) tags.add("gyerekbarát");

  return Array.from(tags);
}

function parseIngredientLine(line) {
  const clean = stripHtml(line);
  const tasteAmount = clean.match(/^0\s+(ízlés szerint\s+.+)$/i);
  if (tasteAmount) return { name: tasteAmount[1].trim() };
  const zeroAmount = clean.match(/^0\s+(?:db|g|dkg|kg|ml|l|dl|ek|tk|csipet|csomag|fej|gerezd|szál|szelet|bögre|pohár)\s+(.+)$/i);
  if (zeroAmount) return { name: zeroAmount[1].trim() };

  const match = clean.match(/^((?:\d+[.,]?\d*|\d+\/\d+|fél|negyed|kevés|ízlés szerint)\s*(?:db|g|dkg|kg|ml|l|dl|ek|tk|csipet|csomag|fej|gerezd|szál|szelet|bögre|pohár)?)\s+(.+)$/i);
  if (!match) return { name: clean };

  const amountPart = match[1].trim();
  if (amountPart === "0") return { name: match[2].trim() };

  const unitMatch = amountPart.match(/^(.*?)(db|g|dkg|kg|ml|l|dl|ek|tk|csipet|csomag|fej|gerezd|szál|szelet|bögre|pohár)$/i);
  if (!unitMatch) return { amount: amountPart, name: match[2].trim() };

  return {
    amount: unitMatch[1].trim(),
    unit: unitMatch[2].trim(),
    name: match[2].trim(),
  };
}

function makePreparationSteps(title, category, tags) {
  if (category === "Desszert") {
    return [
      "Mérd ki az alapanyagokat, és készítsd elő a formát vagy tepsit a desszert jellegének megfelelően.",
      "Dolgozd össze a száraz és nedves alapokat külön, majd keverd őket egynemű masszává vagy tésztává.",
      "Add hozzá a recept fő ízesítőit, gyümölcsét, csokoládéját vagy magvait.",
      "Süsd, hűtsd vagy pihentesd addig, amíg a desszert szeletelhető vagy tálalható állagú lesz.",
      "Tálalás előtt hagyd összeállni, majd díszítsd egyszerűen a családi ebédhez illően.",
    ];
  }

  if (category === "Leves") {
    return [
      "Mosd meg és darabold fel az alapanyagokat, a fő hozzávalót pedig készítsd elő a recept címéhez igazítva.",
      "Kevés zsiradékon indítsd el az ízesítő alapot, majd add hozzá a zöldségeket és a fő alapanyagot.",
      "Öntsd fel vízzel vagy alaplével, sózd óvatosan, és főzd puhára.",
      "Krémlevesnél turmixold selymesre, tartalmas levesnél hagyd darabosan.",
      "Tálaláskor friss zöldfűszerrel, tejföllel vagy citrommal igazítsd az ízeket.",
    ];
  }

  if (tags.includes("teszta") || tags.includes("tészta")) {
    return [
      "Forralj bő, sós vizet, és főzd meg a tésztát vagy tésztafélét.",
      "Közben készítsd elő a feltétet, zöldségeket és ízesítőket.",
      "Serpenyőben vagy lábasban készíts szaftos alapot a fő hozzávalókból.",
      "Forgasd össze a tésztával, és szükség esetén lazítsd kevés főzővízzel.",
      "Tálald frissen, sajttal, zöldfűszerrel vagy egyszerű salátával.",
    ];
  }

  return [
    "Készítsd elő az alapanyagokat: mosd meg, darabold fel, és tedd külön a gyorsan, illetve lassabban készülő részeket.",
    "A fő alapanyagot enyhén sózd, majd kevés zsiradékon kezdd el pirítani vagy párolni.",
    "Add hozzá a zöldségeket, fűszereket és a recept jellegéhez illő folyadékot vagy mártásalapot.",
    "Főzd, süsd vagy párold készre, közben készíts hozzá köretet vagy friss kiegészítőt.",
    "A végén kóstolj, igazíts az ízeken, majd családi adagokban tálald.",
  ];
}

function findRecipeSchema(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRecipeSchema(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== "object") return null;

  const type = value["@type"];
  if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) return value;
  return findRecipeSchema(value["@graph"]) ?? null;
}

function extractJsonLdRecipes(html) {
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const recipes = [];

  for (const match of matches) {
    const raw = decodeHtml(match[1].trim());
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const recipe = findRecipeSchema(parsed);
      if (recipe) recipes.push(recipe);
    } catch {
      // Ignore non-JSON or malformed structured data blocks.
    }
  }

  return recipes;
}

function makeImportItem(recipe, sourceUrl) {
  const title = normalizeTitle(recipe.name);
  const duration = normalizeDuration(recipe);
  const ingredients = Array.isArray(recipe.recipeIngredient)
    ? recipe.recipeIngredient.map(stripHtml).filter(Boolean)
    : [];
  const category = inferCategory(title, recipe.recipeCategory);
  const tags = inferTags(title, category, duration ?? 45, ingredients);

  return {
    id: `nosalty-${slugify(sourceUrl.replace(`${BASE_URL}/recept/`, "")) || slugify(title)}`,
    title,
    sourceName: "Nosalty",
    sourceUrl,
    contentMode: "original-family-flow-version-inspired-by-title",
    difficulty: normalizeDifficulty(recipe.recipeDifficulty),
    totalTimeMinutes: duration ? Math.max(duration, 10) : null,
    servings: normalizeServings(recipe.recipeYield),
    category,
    tags,
    safeShortDescription: `Family Flow verzió a(z) ${title} receptötlethez: appon belül tervezhető, családi ebédre igazított változat.`,
    image: {
      type: "external-source-url",
      url: normalizeImage(recipe.image),
    },
    ingredientGroups: [
      {
        name: "Hozzávalók",
        items: ingredients.map(parseIngredientLine),
      },
    ],
    customPreparationSteps: makePreparationSteps(title, category, tags),
    familyNotes: "Saját Family Flow változat, amely Nosalty receptötlet alapján, appon belüli tervezéshez használható.",
    kidFriendlyNotes: tags.includes("gyerekbarát") ? "Kisgyerekeknek is könnyen ehető, enyhébb családi változatban tálalható." : "",
    shoppingListReady: ingredients.length > 0,
    openOriginalRecipeLabel: "Eredeti Nosalty recept megnyitása",
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml",
      "user-agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`${url} sikertelen válasz: ${response.status}`);
  }

  return response.text();
}

async function readExistingPackage() {
  try {
    return JSON.parse(await fs.readFile(OUTPUT_PATH, "utf8"));
  } catch {
    return {
      schemaVersion: "2.0.0",
      createdAt: new Date().toISOString(),
      source: {
        name: "Nosalty",
        baseUrl: BASE_URL,
        importMode: "external-reference-with-original-family-flow-version",
        contentPolicy: [
          "Nosalty recipe pages are referenced as external sources.",
          "Nosalty image files are not downloaded or stored in this repository.",
          "Remote Nosalty image URLs may be referenced for display when available.",
          "Detailed Family Flow recipe text is custom or links back to the original source.",
        ],
      },
      recipes: [],
    };
  }
}

async function collectRecipeUrls(limit) {
  const sitemapIndex = await fetchText(SITEMAP_URL);
  const recipeSitemaps = extractLocs(sitemapIndex).filter((url) => /\/(?:fresh-recipes|recipes-\d+)-sitemap\.xml$/.test(url));
  const urls = [];
  const seen = new Set();

  for (const sitemap of recipeSitemaps) {
    const xml = await fetchText(sitemap);
    for (const url of extractLocs(xml)) {
      if (!url.startsWith(`${BASE_URL}/recept/`) || seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
      if (limit && urls.length >= limit) return urls;
    }
  }

  return urls;
}

async function main() {
  const args = parseArgs();
  const limit = args.has("limit") ? Number(args.get("limit")) : 100;
  const delayMs = args.has("delay") ? Number(args.get("delay")) : 120;
  const existingPackage = await readExistingPackage();
  const existingBySourceUrl = new Map(existingPackage.recipes.map((item) => [item.sourceUrl, item]));
  const existingByTitle = new Map(existingPackage.recipes.map((item) => [item.title.toLowerCase(), item]));
  const recipeUrls = await collectRecipeUrls(limit);
  const imported = [];
  let skipped = 0;

  for (const [index, url] of recipeUrls.entries()) {
    try {
      const html = await fetchText(url);
      const recipe = extractJsonLdRecipes(html)[0];
      if (!recipe) {
        skipped += 1;
        continue;
      }

      const item = makeImportItem(recipe, url);
      if (!item.title || !item.image.url || item.ingredientGroups[0].items.length === 0) {
        skipped += 1;
        continue;
      }

      const existing = existingBySourceUrl.get(url) ?? existingByTitle.get(item.title.toLowerCase());
      imported.push(existing ? { ...existing, ...item, tags: Array.from(new Set([...(existing.tags ?? []), ...item.tags])) } : item);

      if ((index + 1) % 20 === 0 || index + 1 === recipeUrls.length) {
        console.log(`Nosalty ${index + 1}/${recipeUrls.length}: ${imported.length} recept importálható`);
      }

      if (delayMs) await sleep(delayMs);
    } catch (error) {
      skipped += 1;
      console.warn(`Kihagyva: ${url} (${error.message})`);
    }
  }

  const mergedByUrl = new Map(existingPackage.recipes.map((item) => [item.sourceUrl, item]));
  for (const item of imported) mergedByUrl.set(item.sourceUrl, item);

  const output = {
    ...existingPackage,
    createdAt: new Date().toISOString(),
    recipes: Array.from(mergedByUrl.values()).sort((a, b) => a.title.localeCompare(b.title, "hu")),
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(
    `Kész: ${output.recipes.length} Nosalty recept írva ide: ${path.relative(ROOT, OUTPUT_PATH)} (${skipped} kihagyva)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
