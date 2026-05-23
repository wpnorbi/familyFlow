import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, "src/data/family-flow-lidl-expanded-recipes.safe-import.json");
const BASE_URL = "https://konyha.lidl.hu";
const CDN_BASE = "https://cdn.recipes.lidl/images-v2";
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

function decodeRscHtml(html) {
  return html.replace(/\\"/g, '"').replace(/\\u0026/g, "&").replace(/\\u003c/g, "<").replace(/\\u003e/g, ">");
}

function stripHtml(value) {
  return decodeRscHtml(String(value ?? ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBalancedJson(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return null;

  const start = source.indexOf("{", markerIndex + marker.length);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return null;
}

function extractRecipeCards(html) {
  const decoded = decodeRscHtml(html);
  const matches = decoded.matchAll(
    /\{"id":"([^"]+)","locale":"hu-HU","name":"([\s\S]*?)","slug":"([^"]+)","preparationTime":([^,]+),"cookingTime":([^,]+),"difficulty":([^,]+),[\s\S]*?"imageInfo":\{"name":"([^"]+)","prefix":"([^"]+)"\}/g,
  );

  return Array.from(matches, (match) => ({
    id: match[1],
    locale: "hu-HU",
    name: match[2].replace(/\\\\/g, "\\").replace(/\\"/g, '"').trim(),
    slug: match[3],
    preparationTime: Number(match[4]) || 0,
    cookingTime: Number(match[5]) || 0,
    difficulty: match[6].replace(/"/g, ""),
    imageInfo: {
      name: match[7],
      prefix: match[8],
    },
  }));
}

function extractTotalPages(html) {
  const decoded = decodeRscHtml(html);
  const json = extractBalancedJson(decoded, '"initialResults":');
  if (json) {
    try {
      const parsed = JSON.parse(json);
      return Number(parsed.total_amount_of_pages ?? 1);
    } catch {
      // Some pages contain escaped quotes in recipe names; fall back to regex metadata.
    }
  }

  const match = decoded.match(/"total_amount_of_pages":(\d+)/);
  return Number(match?.[1] ?? 1);
}

async function readBestExistingPackage() {
  const current = JSON.parse(await fs.readFile(OUTPUT_PATH, "utf8"));

  try {
    const gitContent = execFileSync("git", ["show", `HEAD:${path.relative(ROOT, OUTPUT_PATH)}`], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const fromHead = JSON.parse(gitContent);
    if ((fromHead.recipes?.length ?? 0) > (current.recipes?.length ?? 0)) {
      return fromHead;
    }
  } catch {
    // The file may be untracked in early prototypes; current workspace content is the fallback.
  }

  return current;
}

function imageUrlFromInfo(imageInfo) {
  if (!imageInfo?.name || !imageInfo?.prefix) return null;
  const basename = imageInfo.name.replace(/\.(jpe?g|png|webp)$/i, "");
  return `${CDN_BASE}${imageInfo.prefix}/16x9_fallback_${basename}.jpeg`;
}

function difficultyLabel(value) {
  const normalized = String(value ?? "").trim();
  if (normalized === "1") return "Könnyű";
  if (normalized === "2") return "Közepes";
  if (normalized === "3") return "Nehéz";
  return null;
}

function normalizeDurationMinutes(value) {
  const duration = Number(value ?? 0);
  if (!duration) return 0;
  return duration > 300 ? Math.round(duration / 60) : duration;
}

function inferCategory(title) {
  const text = title.toLowerCase();
  if (/(torta|pite|palacsinta|fánk|fank|bejgli|mousse|brownie|desszert|keksz|golyó|madeleine|babka|financier|süti|suti|édesség|edesseg)/.test(text)) {
    return "Desszert";
  }
  if (/(főzelék|fozelek)/.test(text)) return "Főzelék";
  if (/(leves|krémleves)/.test(text)) return "Leves";
  if (/(ragu|rakott|rizottó|rizotto|curry|egytál|egytal)/.test(text)) return "Egytálétel";
  if (/(saláta|salata)/.test(text)) return "Saláta";
  if (/(reggeli|omlett|tojás|tojásos|töltött tojás)/.test(text)) return "Reggeli";
  if (/(ital|limonádé|smoothie|koktél)/.test(text)) return "Ital";
  return "Főétel";
}

function inferMealType(title, category) {
  const text = `${title} ${category}`.toLowerCase();
  if (/(desszert|édesség|edesseg|torta|pite|palacsinta|fánk|fank|brownie|mousse|keksz|bejgli|süti|suti)/.test(text)) return "desszert";
  if (/(reggeli|omlett|tojásos|tojasos|tejbegríz|tejbegriz)/.test(text)) return "reggeli";
  if (/(főzelék|fozelek)/.test(text)) return "fozelek";
  if (/(leves|krémleves|kremleves)/.test(text)) return "leves";
  if (/(tészta|teszta|spaghetti|spagetti|gnocchi|nudli|nokedli|galuska|pizza|lasagne|ravioli)/.test(text)) return "teszta";
  if (/(saláta|salata)/.test(text)) return "salata";
  if (/(egytál|egytal|ragu|rakott|rizottó|rizotto|curry)/.test(text)) return "egytaletel";
  return "foetel";
}

function isKidFriendlyTitle(title, category) {
  const text = `${title} ${category}`.toLowerCase();
  const hardNo = /(csípős|csipos|chili|jalapeno|erős|eros|pikáns|pikans|alkohol|boros|sörös|soros|rumos|kávé|kave|tataki|steak|rib-eye|hátszín|hatszin|rostélyos|rostelyos|tarja|kacsa|kacsamell|oldalas|pacal|belsőség|belsoseg|garnéla|garnela|rák|rak|kagyló|kagylo|nyers|füstölt lazac|fustolt lazac|ponty)/;
  if (hardNo.test(text)) return false;

  const positive = /(gyerekbarát|gyerekbarat|kisgyerek|enyhe|krémes|kremes|selymes|püré|pure|főzelék|fozelek|tészta|teszta|gnocchi|nudli|nokedli|galuska|rizs|rizottó|rizotto|csirkemell|csirke|pulyka|sajt|túró|turo|tejföl|tejfol|omlett|tojás|tojas|palacsinta|túrógombóc|turogomboc|tejbegríz|tejbegriz|édesburgonya|edesburgonya|paradicsomleves|krémleves|kremleves)/;
  if (positive.test(text)) return true;

  return ["Főzelék", "Reggeli"].includes(category);
}

function inferTags(title, recipe) {
  const text = title.toLowerCase();
  const category = inferCategory(title);
  const tags = new Set(["lidl"]);
  const mealType = inferMealType(title, category);

  const totalTime = normalizeDurationMinutes(recipe.preparationTime) + normalizeDurationMinutes(recipe.cookingTime);
  if (/(gyors|villám|30 perc)/.test(text) || totalTime <= 30) {
    tags.add("gyors");
  }
  if (totalTime <= 20) tags.add("rövid");
  else if (totalTime <= 50) tags.add("közepes idő");
  else tags.add("hosszú");
  tags.add(mealType);
  if (/(csirke|csirkemell|csirkecomb)/.test(text)) tags.add("csirke");
  if (/(lazac|harcsa|tonhal|hal|makréla|makrela|ponty|pisztráng|pisztrang|tőkehal)/.test(text)) tags.add("hal");
  if (/(marha|steak|rostélyos)/.test(text)) tags.add("marha");
  if (/(sertés|sonka|szalonna|kolbász)/.test(text)) tags.add("sertés");
  if (/(gomba|zöldség|zoldseg|tofu|vegetáriánus|saláta)/.test(text)) tags.add("vegetáriánus");
  if (/(tészta|teszta|pizza|gnocchi|nudli|nokedli)/.test(text)) tags.add("tészta");
  if (/(sütés nélküli|sutes nelkuli)/.test(text)) tags.add("sütés nélküli");
  if (isKidFriendlyTitle(title, category)) tags.add("gyerekbarát");

  return Array.from(tags);
}

function addIngredient(items, seen, name, amount, unit, note) {
  const key = name.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  items.push({ name, amount, unit, ...(note ? { note } : {}) });
}

function inferIngredientGroups(title, category, tags) {
  const text = title.toLowerCase();
  const main = [];
  const pantry = [];
  const seen = new Set();

  if (/lazac/.test(text)) addIngredient(main, seen, "lazacfile", 600, "g");
  if (/ponty/.test(text)) addIngredient(main, seen, "pontyfilé", 600, "g");
  if (/harcsa/.test(text)) addIngredient(main, seen, "harcsafilé", 600, "g");
  if (/tonhal/.test(text)) addIngredient(main, seen, "tonhal", 400, "g");
  if (/makréla/.test(text)) addIngredient(main, seen, "makréla", 500, "g");
  if (/hal/.test(text) && !/(lazac|ponty|harcsa|tonhal|makréla|makrela)/.test(text)) addIngredient(main, seen, "halfélé", 600, "g");
  if (/csirkemell/.test(text)) addIngredient(main, seen, "csirkemellfilé", 600, "g");
  if (/csirkecomb/.test(text)) addIngredient(main, seen, "csirkecomb", 800, "g");
  if (/sültcsirke|sultcsirke/.test(text)) addIngredient(main, seen, "egész csirke", 1, "db");
  if (/csirke/.test(text) && !/(csirkemell|csirkecomb|sültcsirke|sultcsirke)/.test(text)) addIngredient(main, seen, "csirkehús", 600, "g");
  if (/marha|steak|rostélyos|rostelyos/.test(text)) addIngredient(main, seen, "marhahús", 700, "g");
  if (/sertés|sertes|tarja|karaj/.test(text)) addIngredient(main, seen, "sertéshús", 700, "g");
  if (/pulyka/.test(text)) addIngredient(main, seen, "pulykamell", 600, "g");
  if (/kolbász|kolbasz/.test(text)) addIngredient(main, seen, "kolbász", 250, "g");
  if (/szalonna/.test(text)) addIngredient(main, seen, "szalonna", 180, "g");
  if (/garnéla|garnela|rák|rak/.test(text)) addIngredient(main, seen, "garnéla", 400, "g");
  if (/tofu/.test(text)) addIngredient(main, seen, "tofu", 400, "g");
  if (/gomba/.test(text)) addIngredient(main, seen, "gomba", 500, "g");
  if (/tészta|teszta|spaghetti|spagetti/.test(text)) addIngredient(main, seen, "tészta", 400, "g");
  if (/gnocchi/.test(text)) addIngredient(main, seen, "gnocchi", 500, "g");
  if (/nudli|nokedli|galuska/.test(text)) addIngredient(main, seen, "nudli vagy galuska", 500, "g");
  if (/rizottó|rizotto|rizs/.test(text)) addIngredient(main, seen, "rizs", 320, "g");
  if (/burgonya|krumpli/.test(text)) addIngredient(main, seen, "burgonya", 800, "g");
  if (/édesburgonya|edesburgonya/.test(text)) addIngredient(main, seen, "édesburgonya", 700, "g");
  if (/zöldség|zoldseg|gyökérzöldség|gyokerzoldseg/.test(text)) addIngredient(main, seen, "vegyes zöldség", 700, "g");
  if (/répa|repa|sárgarépa|sargarepa/.test(text)) addIngredient(main, seen, "sárgarépa", 4, "db");
  if (/karalábé|karalabe/.test(text)) addIngredient(main, seen, "karalábé", 2, "db");
  if (/zeller/.test(text)) addIngredient(main, seen, "zeller", 1, "db");
  if (/káposzta|kaposzta/.test(text)) addIngredient(main, seen, "káposzta", 500, "g");
  if (/paradicsom|lecsó|lecso/.test(text)) addIngredient(main, seen, "paradicsom", 500, "g");
  if (/paprika/.test(text)) addIngredient(main, seen, "paprika", 4, "db");
  if (/spárga|sparga/.test(text)) addIngredient(main, seen, "spárga", 500, "g");
  if (/saláta|salata/.test(text)) addIngredient(main, seen, "salátakeverék", 200, "g");
  if (/citrus/.test(text)) addIngredient(main, seen, "citrom vagy narancs", 2, "db");
  if (/tojás|tojas|omlett/.test(text)) addIngredient(main, seen, "tojás", 6, "db");
  if (/sajt|feta|parmezán|parmezan|grana|cheddar/.test(text)) addIngredient(main, seen, "sajt", 180, "g");
  if (/túró|turo/.test(text)) addIngredient(main, seen, "túró", 500, "g");
  if (/tejföl|tejfol/.test(text)) addIngredient(main, seen, "tejföl", 200, "g");
  if (/tejszín|tejszin|mousse/.test(text)) addIngredient(main, seen, "tejszín", 250, "ml");
  if (/alma/.test(text)) addIngredient(main, seen, "alma", 4, "db");
  if (/eper|epres/.test(text)) addIngredient(main, seen, "eper", 300, "g");
  if (/málna|malna/.test(text)) addIngredient(main, seen, "málna", 250, "g");
  if (/citrom/.test(text)) addIngredient(main, seen, "citrom", 1, "db");
  if (/narancs/.test(text)) addIngredient(main, seen, "narancs", 2, "db");
  if (/csoki|csokoládé|csokolade/.test(text)) addIngredient(main, seen, "étcsokoládé", 200, "g");
  if (/dió|dio/.test(text)) addIngredient(main, seen, "dió", 120, "g");
  if (/pisztácia|pisztacia/.test(text)) addIngredient(main, seen, "pisztácia", 80, "g");

  if (main.length === 0) {
    if (category === "Desszert") {
      addIngredient(main, seen, "liszt", 250, "g");
      addIngredient(main, seen, "tojás", 3, "db");
      addIngredient(main, seen, "vaj", 120, "g");
    } else if (category === "Leves") {
      addIngredient(main, seen, "zöldségek", 700, "g");
      addIngredient(main, seen, "alaplé", 1, "l");
    } else {
      addIngredient(main, seen, "fő alapanyag", 600, "g", "a recept címéhez igazítva");
      addIngredient(main, seen, "köret vagy zöldség", 500, "g");
    }
  }

  if (category !== "Desszert") {
    addIngredient(pantry, seen, "vöröshagyma", 1, "db");
    addIngredient(pantry, seen, "fokhagyma", 2, "gerezd");
    addIngredient(pantry, seen, "olívaolaj", 2, "ek");
    addIngredient(pantry, seen, "só", "", "");
    addIngredient(pantry, seen, "frissen őrölt bors", "", "");
  } else {
    addIngredient(pantry, seen, "cukor", 120, "g");
    addIngredient(pantry, seen, "vanília", 1, "tk");
    addIngredient(pantry, seen, "só", 1, "csipet");
  }

  if (tags.includes("tészta") && !main.some((item) => item.name === "tészta")) {
    addIngredient(main, seen, "tészta", 400, "g");
  }

  return [
    { name: "Fő alapanyagok", items: main },
    { name: "Kamrából", items: pantry },
  ];
}

function normalizeInstructionText(value) {
  return stripHtml(value)
    .replace(/^\d+[\).\s-]*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLidlPreparationSteps(html) {
  const sectionMatch = html.match(/<h2[^>]*>\s*Előkészítés\s*<\/h2>([\s\S]*?)(?:<h2[^>]*>|<\/article>|<\/main>)/i);
  if (!sectionMatch) return [];

  const listItems = Array.from(
    sectionMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi),
    (match) => normalizeInstructionText(match[1]),
  ).filter(Boolean);

  if (listItems.length > 0) {
    return listItems;
  }

  const text = normalizeInstructionText(sectionMatch[1]);
  return Array.from(
    text.matchAll(/(?:^|\s)(\d+)\.\s+([\s\S]*?)(?=(?:\s+\d+\.\s)|$)/g),
    (match) => normalizeInstructionText(match[2]),
  ).filter(Boolean);
}

function rewritePreparationStep(step, index) {
  const leadIns = ["Elsőként", "Ezután", "Utána", "Közben", "Végül"];
  let text = normalizeInstructionText(step);

  const replacements = [
    [/\b(szépen\s+)?összekészítjük\b/gi, "készítsd elő"],
    [/\belőkészítjük\b/gi, "készítsd elő"],
    [/\bszedjük\b/gi, "szedd"],
    [/\bvágjuk\b/gi, "vágd"],
    [/\bszeljük\b/gi, "vágd"],
    [/\bmegtisztítjuk\b/gi, "tisztítsd meg"],
    [/\bátfényezzük\b/gi, "forgasd át"],
    [/\bsózzuk\b/gi, "sózd"],
    [/\bborsozzuk\b/gi, "borsozd"],
    [/\beltávolítjuk\b/gi, "távolítsd el"],
    [/\bdobunk bele\b/gi, "adj a vízhez"],
    [/\bszortírozzuk\b/gi, "oszd szét"],
    [/\brátesszük\b/gi, "helyezd rá"],
    [/\btesszük\b/gi, "tedd"],
    [/\bvágunk\b/gi, "vágj"],
    [/\breszelünk\b/gi, "reszelj"],
    [/\böntünk\b/gi, "önts"],
    [/\btálalhatunk is\b/gi, "tálald"],
    [/\bdobjuk\b/gi, "forgasd"],
    [/\bMíg\b/g, "Közben"],
    [/\bHa\b/g, "Amikor"],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  text = text
    .replace(/\s+,/g, ",")
    .replace(/\s+;/g, ";")
    .replace(/\s+\./g, ".")
    .replace(/,\s*majd\s*/gi, ", majd ")
    .replace(/\s+/g, " ")
    .trim();

  const lead = leadIns[Math.min(index, leadIns.length - 1)];
  text = text.charAt(0).toLowerCase() + text.slice(1);
  text = `${lead} ${text}`;
  text = text.charAt(0).toUpperCase() + text.slice(1);

  if (!/[.!?]$/.test(text)) {
    text += ".";
  }

  return text;
}

function adaptPreparationStepsFromSource(sourceSteps, title, category, tags) {
  const rewritten = sourceSteps.map((step, index) => rewritePreparationStep(step, index)).filter(Boolean);
  if (rewritten.length > 0) {
    return rewritten;
  }
  return makePreparationSteps(title, category, tags);
}

function determineImageStrategy(imageUrl) {
  if (imageUrl) {
    return "use-source-image-as-private-fallback";
  }
  return "use-placeholder";
}

function makePreparationSteps(title, category, tags) {
  if (category === "Desszert") {
    return [
      "Készítsd elő és mérd ki az alapanyagokat, majd melegítsd elő a sütőt, ha a desszert sütést igényel.",
      "A száraz alapanyagokat keverd össze egy nagy tálban, a nedves alapanyagokat pedig külön dolgozd egyneműre.",
      "Forgasd össze a két keveréket, majd add hozzá a recept címében szereplő gyümölcsöt, csokoládét vagy magvakat.",
      "Tedd formába vagy adagold ki, és süsd, hűtsd vagy pihentesd a desszert jellegének megfelelően.",
      "Tálalás előtt hagyd kissé összeállni, majd friss gyümölccsel, porcukorral vagy krémmel fejezd be.",
    ];
  }

  if (category === "Leves") {
    return [
      "Mosd meg és darabold fel a zöldségeket, a fő alapanyagot pedig készítsd elő a recept címéhez igazítva.",
      "Kevés olajon párold üvegesre a hagymát és a fokhagymát, majd add hozzá a zöldségeket.",
      "Öntsd fel alaplével vagy vízzel, sózd, borsozd, majd főzd addig, amíg minden megpuhul.",
      "Ha krémlevest készítesz, turmixold selymesre, ha tartalmas levest, hagyd darabosan.",
      "Tálaláskor friss zöldfűszerrel, tejföllel, pirított feltéttel vagy citrommal igazítsd az ízeket.",
    ];
  }

  if (category === "Saláta") {
    return [
      "Mosd meg és szárítsd le a salátához használt zöldségeket, majd darabold őket falatnyi méretre.",
      "A húsos, halas vagy sajtos feltétet külön készítsd el, hogy melegen vagy langyosan kerülhessen a salátára.",
      "Keverj egyszerű öntetet olajból, savas elemből, sóból és borsból.",
      "Forgasd össze lazán az alapanyagokat, majd a ropogós vagy krémes elemeket csak a végén add hozzá.",
      "Azonnal tálald, hogy a saláta friss és roppanós maradjon.",
    ];
  }

  if (category === "Reggeli") {
    return [
      "Készítsd elő a reggeli fő alapanyagait, és melegíts elő egy serpenyőt vagy sütőtálat.",
      "A tojásos, túrós vagy péksüteményes alapot keverd össze, majd ízesítsd sóval, borssal vagy édes fűszerekkel.",
      "Süsd vagy pirítsd addig, amíg a közepe is átsül, de nem szárad ki.",
      "Adj mellé friss zöldséget, gyümölcsöt vagy joghurtot, hogy teljesebb legyen az étkezés.",
      "Langyosan tálald, mert így a legjobb az állaga.",
    ];
  }

  if (tags.includes("tészta")) {
    return [
      "Forralj bő, sós vizet, és főzd meg a tésztát vagy tésztafélét a kívánt állagig.",
      "Közben készítsd elő a fő alapanyagokat, a zöldségeket és az ízesítőket.",
      "Serpenyőben pirítsd vagy párold meg a feltétet, majd alakíts ki hozzá szaftos mártást.",
      "Forgasd össze a tésztát a mártással, és szükség esetén lazítsd kevés főzővízzel.",
      "Tálaláskor adj hozzá sajtot, friss zöldfűszert vagy citromot az étel jellegéhez illően.",
    ];
  }

  return [
    "Készítsd elő az alapanyagokat: mosd meg, darabold fel, és különítsd el a gyorsan sülő, illetve hosszabban készülő részeket.",
    "A fő alapanyagot sózd, borsozd, majd kevés zsiradékon pirítsd körbe vagy kezdd el párolni.",
    "Add hozzá a zöldségeket és az ízesítőket, majd főzd, süsd vagy párold készre az étel jellegének megfelelően.",
    "Közben készíts köretet vagy friss kiegészítőt, hogy az étel komplett ebédként működjön.",
    "A végén kóstolj, igazíts az ízeken, majd tálald frissen, családi adagokra osztva.",
  ];
}

function slugFromSourceUrl(url) {
  const match = url?.match(/\/recept\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function makeImportItem(recipe, sourcePreparationSteps = []) {
  const title = recipe.name.trim();
  const rawTotalTimeMinutes =
    normalizeDurationMinutes(recipe.preparationTime) + normalizeDurationMinutes(recipe.cookingTime) || null;
  const totalTimeMinutes = rawTotalTimeMinutes ? Math.max(rawTotalTimeMinutes, 15) : null;
  const category = inferCategory(title);
  const tags = inferTags(title, recipe);
  const imageUrl = imageUrlFromInfo(recipe.imageInfo);

  return {
    id: `lidl-${recipe.slug}`,
    title,
    sourceName: "Lidl Konyha",
    sourceUrl: `${BASE_URL}/recept/${recipe.slug}`,
    contentMode: "source-faithful-family-flow-adaptation",
    difficulty: difficultyLabel(recipe.difficulty),
    totalTimeMinutes,
    servings: null,
    category,
    tags,
    safeShortDescription: `Family Flow verzió a(z) ${title} receptötlethez: appon belül főzhető, családi ebédre tervezett változat.`,
    image: {
      type: "external-source-url",
      url: imageUrl,
    },
    imageStrategy: determineImageStrategy(imageUrl),
    ingredientGroups: inferIngredientGroups(title, category, tags),
    sourcePreparationSteps,
    customPreparationSteps: adaptPreparationStepsFromSource(sourcePreparationSteps, title, category, tags),
    familyNotes:
      "Saját Family Flow változat, amely az eredeti Lidl recept lépéseinek tényszerű tartalmát követi, de újrafogalmazott szöveggel jelenik meg.",
    kidFriendlyNotes: tags.includes("gyerekbarát") ? "Gyerekbarát jellegű receptötlet." : "",
    shoppingListReady: true,
    openOriginalRecipeLabel: "Eredeti Lidl recept megnyitása",
  };
}

function mergeRecipe(existing, scraped) {
  const mergedTags = Array.from(new Set([...(existing.tags ?? []), ...(scraped.tags ?? [])]));
  const shouldLocalize =
    existing.contentMode === "external-link-catalog" ||
    existing.ingredientGroups.length === 0 ||
    existing.familyNotes === "Saját Family Flow változat, amely az appon belül követhető és heti tervezéshez használható.";

  if (shouldLocalize) {
    return {
      ...scraped,
      tags: mergedTags,
      sourceUrl: existing.sourceUrl || scraped.sourceUrl,
      image: scraped.image.url ? scraped.image : existing.image,
      openOriginalRecipeLabel: existing.openOriginalRecipeLabel || scraped.openOriginalRecipeLabel,
    };
  }

  return {
    ...existing,
    contentMode: scraped.contentMode,
    title: existing.title || scraped.title,
    sourceUrl: scraped.sourceUrl,
    difficulty: existing.difficulty ?? scraped.difficulty,
    totalTimeMinutes: existing.totalTimeMinutes ?? scraped.totalTimeMinutes,
    category: existing.category || scraped.category,
    tags: mergedTags,
    image: scraped.image.url ? scraped.image : existing.image,
    imageStrategy: scraped.imageStrategy,
    ingredientGroups: scraped.ingredientGroups?.length > 0 ? scraped.ingredientGroups : existing.ingredientGroups,
    sourcePreparationSteps:
      scraped.sourcePreparationSteps?.length > 0 ? scraped.sourcePreparationSteps : existing.sourcePreparationSteps,
    customPreparationSteps:
      scraped.customPreparationSteps?.length > 0 ? scraped.customPreparationSteps : existing.customPreparationSteps,
    familyNotes: scraped.familyNotes || existing.familyNotes,
    kidFriendlyNotes: scraped.kidFriendlyNotes || existing.kidFriendlyNotes,
    openOriginalRecipeLabel: existing.openOriginalRecipeLabel || scraped.openOriginalRecipeLabel,
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`${url} sikertelen válasz: ${response.status}`);
  }

  return response.text();
}

async function main() {
  const args = parseArgs();
  const limit = args.has("limit") ? Number(args.get("limit")) : null;
  const existingPackage = await readBestExistingPackage();
  const firstHtml = await fetchText(`${BASE_URL}/receptek`);
  const firstRecipes = extractRecipeCards(firstHtml);
  const totalPages = extractTotalPages(firstHtml);

  const allRecipes = [...firstRecipes];
  const pagesToFetch = limit ? Math.min(totalPages, Math.ceil(limit / 36)) : totalPages;

  for (let page = 2; page <= pagesToFetch; page += 1) {
    const html = await fetchText(`${BASE_URL}/receptek?page=${page}`);
    const recipes = extractRecipeCards(html);
    allRecipes.push(...recipes);
    console.log(`Lidl oldal ${page}/${pagesToFetch}: ${allRecipes.length} recept beolvasva`);
  }

  const uniqueRecipes = Array.from(new Map(allRecipes.map((recipe) => [recipe.slug, recipe])).values()).slice(
    0,
    limit ?? undefined,
  );
  const existingRecipes = Array.isArray(existingPackage.recipes) ? existingPackage.recipes : [];
  const existingBySlug = new Map(existingRecipes.map((item) => [slugFromSourceUrl(item.sourceUrl), item]));
  const merged = [];

  for (const recipe of uniqueRecipes) {
    const sourceUrl = `${BASE_URL}/recept/${recipe.slug}`;
    let sourcePreparationSteps = [];

    try {
      const recipeHtml = await fetchText(sourceUrl);
      sourcePreparationSteps = extractLidlPreparationSteps(recipeHtml);
    } catch (error) {
      console.warn(`Lidl lépések nem olvashatók: ${sourceUrl} (${error.message})`);
    }

    const scraped = makeImportItem(recipe, sourcePreparationSteps);
    const existing = existingBySlug.get(recipe.slug);
    merged.push(existing ? mergeRecipe(existing, scraped) : scraped);
  }

  const mergedBySlug = new Map(existingRecipes.map((item) => [slugFromSourceUrl(item.sourceUrl), item]));
  for (const item of merged) {
    mergedBySlug.set(slugFromSourceUrl(item.sourceUrl), item);
  }

  const output = {
    ...existingPackage,
    createdAt: new Date().toISOString(),
    source: {
      ...existingPackage.source,
      contentPolicy: [
        "Lidl recipe pages are referenced as external sources.",
        "Lidl image files are not downloaded or stored in this repository.",
        "Remote Lidl image URLs may be referenced for display when available.",
        "Detailed Family Flow recipe text is custom or links back to the original source.",
      ],
    },
    recipes: Array.from(mergedBySlug.values()).sort((a, b) => a.title.localeCompare(b.title, "hu")),
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Kész: ${output.recipes.length} recept írva ide: ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
