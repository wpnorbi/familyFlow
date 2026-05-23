import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const TMP_BATCH_DIR = path.join(ROOT, "tmp", "recipe-image-batches");

const INPUTS = {
  lidl: path.join(DATA_DIR, "family-flow-lidl-expanded-recipes.safe-import.json"),
  nosalty: path.join(DATA_DIR, "family-flow-nosalty-recipes.safe-import.json"),
  prompts: path.join(DATA_DIR, "recipe-image-prompts.json"),
};

function parseArgs(argv) {
  const args = {
    strategy: "all",
    limit: 50,
    offset: 0,
    out: "",
    all: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key === "--strategy" && value) {
      args.strategy = value;
      index += 1;
      continue;
    }
    if (key === "--limit" && value) {
      args.limit = Number(value);
      index += 1;
      continue;
    }
    if (key === "--offset" && value) {
      args.offset = Number(value);
      index += 1;
      continue;
    }
    if (key === "--out" && value) {
      args.out = value;
      index += 1;
      continue;
    }
    if (key === "--all") {
      args.all = true;
    }
  }

  if (!["all", "source-fallback", "placeholder"].includes(args.strategy)) {
    throw new Error('Invalid --strategy. Use: "all", "source-fallback", or "placeholder".');
  }

  if (!Number.isFinite(args.limit) || args.limit < 1) {
    throw new Error("Invalid --limit. Use a positive integer.");
  }

  if (!Number.isFinite(args.offset) || args.offset < 0) {
    throw new Error("Invalid --offset. Use a non-negative integer.");
  }

  return args;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function normalizeImageStrategy(value) {
  if (value === "source-fallback" || value === "placeholder" || value === "generated") {
    return value;
  }
  if (value === "use-source-image-as-private-fallback") return "source-fallback";
  if (value === "use-placeholder") return "placeholder";
  if (value === "use-generated-image") return "generated";
  return "placeholder";
}

function hasTag(recipe, tag) {
  return Array.isArray(recipe.tags) && recipe.tags.includes(tag);
}

function getPriorityScore(recipe) {
  let score = 0;

  if (recipe.normalizedImageStrategy === "source-fallback") score += 220;
  else if (recipe.normalizedImageStrategy === "placeholder") score += 90;

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

function pickRecipes(recipes, strategy) {
  const filtered = recipes
    .map((recipe) => ({
      ...recipe,
      normalizedImageStrategy: normalizeImageStrategy(recipe.imageStrategy),
      priorityScore: 0,
    }))
    .filter((recipe) => recipe.normalizedImageStrategy !== "generated")
    .filter((recipe) => strategy === "all" || recipe.normalizedImageStrategy === strategy)
    .map((recipe) => ({
      ...recipe,
      priorityScore: getPriorityScore(recipe),
    }))
    .sort(
      (a, b) =>
        b.priorityScore - a.priorityScore ||
        a.duration - b.duration ||
        a.title.localeCompare(b.title, "hu"),
    );

  return filtered;
}

function buildDefaultOutPath(strategy, offset, limit) {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(
    TMP_BATCH_DIR,
    `${date}-missing-generated-images-${strategy}-${String(offset).padStart(4, "0")}-${String(limit).padStart(3, "0")}.json`,
  );
}

function buildDefaultIndexOutPath(strategy, limit) {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(
    TMP_BATCH_DIR,
    `${date}-missing-generated-images-${strategy}-index-${String(limit).padStart(3, "0")}.json`,
  );
}

function buildBatchPayload({ strategy, offset, slice, candidates, items, missingPromptRecipes }) {
  return {
    batchId: `missing-generated-images-${strategy}-${String(offset).padStart(4, "0")}`,
    generatedAt: new Date().toISOString(),
    strategy,
    startIndex: offset,
    count: items.length,
    requestedCount: slice.length,
    totalCandidates: candidates.length,
    missingPromptCount: missingPromptRecipes.length,
    missingPromptRecipeIds: missingPromptRecipes.map((recipe) => recipe.id),
    items,
  };
}

function buildBatchItems(slice, promptByRecipeId) {
  const missingPromptRecipes = slice.filter((recipe) => !promptByRecipeId.has(recipe.id));
  const items = slice
    .map((recipe) => {
      const prompt = promptByRecipeId.get(recipe.id);
      if (!prompt) return null;

      return {
        recipeId: recipe.id,
        slug: prompt.slug,
        title: prompt.title,
        sourceName: recipe.sourceName ?? "Importált recept",
        sourceUrl: recipe.sourceUrl,
        imageStrategy: recipe.normalizedImageStrategy,
        sourceImageUrl: recipe.image?.url ?? recipe.sourceImageUrl ?? null,
        priorityScore: recipe.priorityScore,
        visualType: prompt.visualType,
        imagePrompt: prompt.imagePrompt,
        targetFilename: prompt.targetFilename,
      };
    })
    .filter(Boolean);

  return { items, missingPromptRecipes };
}

async function writeBatchFile(outPath, payload) {
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [lidlImport, nosaltyImport, prompts] = await Promise.all([
    readJson(INPUTS.lidl),
    readJson(INPUTS.nosalty),
    readJson(INPUTS.prompts),
  ]);

  const allRecipes = [...(lidlImport.recipes ?? []), ...(nosaltyImport.recipes ?? [])];
  const promptByRecipeId = new Map((prompts.prompts ?? []).map((prompt) => [prompt.recipeId, prompt]));
  const candidates = pickRecipes(allRecipes, args.strategy);

  if (args.all) {
    const batches = [];
    let totalItems = 0;
    let totalMissingPromptCount = 0;

    for (let offset = args.offset; offset < candidates.length; offset += args.limit) {
      const slice = candidates.slice(offset, offset + args.limit);
      const { items, missingPromptRecipes } = buildBatchItems(slice, promptByRecipeId);
      const payload = buildBatchPayload({
        strategy: args.strategy,
        offset,
        slice,
        candidates,
        items,
        missingPromptRecipes,
      });
      const outPath = buildDefaultOutPath(args.strategy, offset, args.limit);

      await writeBatchFile(outPath, payload);

      batches.push({
        batchId: payload.batchId,
        outFile: path.relative(ROOT, outPath),
        startIndex: offset,
        requestedCount: slice.length,
        count: items.length,
        missingPromptCount: missingPromptRecipes.length,
        topRecipeIds: items.slice(0, 5).map((item) => item.recipeId),
      });
      totalItems += items.length;
      totalMissingPromptCount += missingPromptRecipes.length;
    }

    const indexPayload = {
      generatedAt: new Date().toISOString(),
      strategy: args.strategy,
      batchSize: args.limit,
      startOffset: args.offset,
      totalCandidates: candidates.length,
      exportedBatchCount: batches.length,
      totalItems,
      totalMissingPromptCount,
      batches,
    };
    const indexOutPath = args.out
      ? path.resolve(ROOT, args.out)
      : buildDefaultIndexOutPath(args.strategy, args.limit);

    await writeBatchFile(indexOutPath, indexPayload);

    process.stdout.write(
      JSON.stringify(
        {
          ok: true,
          mode: "all",
          outFile: path.relative(ROOT, indexOutPath),
          exportedBatchCount: batches.length,
          totalCandidates: candidates.length,
          totalItems,
          totalMissingPromptCount,
        },
        null,
        2,
      ),
    );
    return;
  }

  const slice = candidates.slice(args.offset, args.offset + args.limit);
  const { items, missingPromptRecipes } = buildBatchItems(slice, promptByRecipeId);
  const output = buildBatchPayload({
    strategy: args.strategy,
    offset: args.offset,
    slice,
    candidates,
    items,
    missingPromptRecipes,
  });

  const outPath = args.out ? path.resolve(ROOT, args.out) : buildDefaultOutPath(args.strategy, args.offset, args.limit);
  await writeBatchFile(outPath, output);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        mode: "single",
        outFile: path.relative(ROOT, outPath),
        count: items.length,
        totalCandidates: candidates.length,
        missingPromptCount: missingPromptRecipes.length,
        topRecipeIds: items.slice(0, 5).map((item) => item.recipeId),
      },
      null,
      2,
    ),
  );
}

await main();
