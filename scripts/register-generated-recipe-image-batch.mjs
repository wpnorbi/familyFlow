import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "src", "data");
const PUBLIC_DIR = path.join(ROOT, "public");
const IMAGE_DIR = path.join(PUBLIC_DIR, "assets", "recipes", "images");
const THUMB_DIR = path.join(IMAGE_DIR, "thumbnails");

const OUTPUTS = {
  manifest: path.join(DATA_DIR, "recipe-image-manifest.json"),
  prompts: path.join(DATA_DIR, "recipe-image-prompts.json"),
  review: path.join(DATA_DIR, "recipe-image-review.json"),
  reviewOverrides: path.join(DATA_DIR, "recipe-image-review-overrides.json"),
};

const execFileAsync = promisify(execFile);

function parseArgs(argv) {
  const args = {
    batchFile: "",
    reviewStatus: "approved",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key === "--batch" && value) {
      args.batchFile = value;
      index += 1;
      continue;
    }
    if (key === "--review-status" && value) {
      args.reviewStatus = value;
      index += 1;
    }
  }

  if (!args.batchFile) {
    throw new Error("Usage: node scripts/register-generated-recipe-image-batch.mjs --batch <batch.json>");
  }

  return args;
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (fallback !== null && error && error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function resolveProjectPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
}

function publicToAbsolute(publicPath) {
  return path.join(PUBLIC_DIR, publicPath.replace(/^\//, ""));
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fileSize(filePath) {
  try {
    return (await stat(filePath)).size;
  } catch {
    return 0;
  }
}

async function convertImage(inputPath, outputPath, maxPixelSize) {
  await mkdir(path.dirname(outputPath), { recursive: true });

  try {
    await execFileAsync("node", [
      "scripts/convert-image-to-webp.mjs",
      inputPath,
      outputPath,
      "--max-pixel-size",
      String(maxPixelSize),
    ], { cwd: ROOT });
    return;
  } catch (sharpError) {
    const sharpMessage = sharpError.stderr || sharpError.message;
    if (!sharpMessage.includes("Cannot find package") && !sharpMessage.includes("Cannot find module")) {
      throw new Error(`Sharp WebP conversion failed for ${inputPath}\nnode: ${sharpMessage}`);
    }
  }

  try {
    await execFileAsync("python3", [
      "scripts/convert-image-to-webp.py",
      inputPath,
      outputPath,
      "--max-pixel-size",
      String(maxPixelSize),
    ], { cwd: ROOT });
    return;
  } catch (pythonError) {
    try {
      await execFileAsync("swift", [
        "scripts/convert-image-to-webp.swift",
        inputPath,
        outputPath,
        "--max-pixel-size",
        String(maxPixelSize),
      ], {
        cwd: ROOT,
        env: {
          ...process.env,
          CLANG_MODULE_CACHE_PATH: path.join("/private", "tmp", "family-flow-clang-cache"),
        },
      });
      return;
    } catch (swiftError) {
      const pythonMessage = pythonError.stderr || pythonError.message;
      const swiftMessage = swiftError.stderr || swiftError.message;
      throw new Error(`WebP conversion failed for ${inputPath}\npython3: ${pythonMessage}\nswift: ${swiftMessage}`);
    }
  }
}

function findManifestItem(manifest, batchItem) {
  const byRecipeId = batchItem.recipeId
    ? manifest.items.find((item) => item.recipeId === batchItem.recipeId)
    : null;

  if (byRecipeId) {
    return byRecipeId;
  }

  if (batchItem.slug) {
    return manifest.items.find((item) => item.slug === batchItem.slug);
  }

  return null;
}

function upsertReviewOverride(reviewOverrides, recipeId, reviewStatus, notes) {
  const items = Array.isArray(reviewOverrides.items) ? reviewOverrides.items : [];
  const existing = items.find((item) => item.recipeId === recipeId);

  if (existing) {
    existing.reviewStatus = reviewStatus;
    existing.notes = notes || existing.notes || "Batch image review";
    return;
  }

  items.push({
    recipeId,
    reviewStatus,
    notes: notes || "Batch image review",
  });
  reviewOverrides.items = items;
}

function updatePromptRow(prompts, recipeId, image) {
  if (!Array.isArray(prompts.prompts)) {
    return;
  }

  const row = prompts.prompts.find((item) => item.recipeId === recipeId);
  if (!row) {
    return;
  }

  row.reviewStatus = image.reviewStatus;
  row.status = image.status;
  row.targetFilename = image.filename;
  row.imagePath = image.path;
  row.thumbnailPath = image.thumbnailPath;
}

function upsertReviewRow(review, manifestItem, imageBytes, thumbnailBytes, hasThumbnail) {
  const items = Array.isArray(review.items) ? review.items : [];
  const existing = items.find((item) => item.recipeId === manifestItem.recipeId);
  const row = {
    recipeId: manifestItem.recipeId,
    slug: manifestItem.slug,
    title: manifestItem.title,
    visualType: manifestItem.visualType,
    reviewStatus: manifestItem.image.reviewStatus,
    suspiciousMatch: manifestItem.visualConfidence !== "high",
    reviewNotes: "",
    imagePath: manifestItem.image.path,
    thumbnailPath: manifestItem.image.thumbnailPath,
    hasThumbnail,
    imageBytes,
    thumbnailBytes,
  };

  if (existing) {
    Object.assign(existing, row, { reviewNotes: existing.reviewNotes || "" });
  } else {
    items.push(row);
  }

  review.items = items;
  review.generatedCount = items.length;
}

async function registerBatchItem(batchItem, context) {
  const manifestItem = findManifestItem(context.manifest, batchItem);
  if (!manifestItem) {
    throw new Error(`No recipe found in manifest for ${batchItem.recipeId || batchItem.slug || "(missing id)"}`);
  }

  const slug = batchItem.slug || manifestItem.slug;
  const reviewStatus = batchItem.reviewStatus || context.defaultReviewStatus;
  const imagePublicPath = batchItem.targetWebpPath || `/assets/recipes/images/${slug}.webp`;
  const thumbnailPublicPath = batchItem.thumbnailPath || `/assets/recipes/images/thumbnails/${slug}.webp`;
  const targetWebpPath = publicToAbsolute(imagePublicPath);
  const thumbnailPath = publicToAbsolute(thumbnailPublicPath);
  const targetPngPath = path.join(IMAGE_DIR, `${slug}.png`);
  const mode = batchItem.mode || (batchItem.generatedPngPath ? "register" : "approve-old");

  await mkdir(IMAGE_DIR, { recursive: true });
  await mkdir(THUMB_DIR, { recursive: true });

  if (mode === "register") {
    if (!batchItem.generatedPngPath) {
      throw new Error(`Missing generatedPngPath for ${manifestItem.recipeId}`);
    }

    const generatedPngPath = resolveProjectPath(batchItem.generatedPngPath);
    if (!(await pathExists(generatedPngPath))) {
      throw new Error(`Generated PNG does not exist: ${generatedPngPath}`);
    }

    if (path.resolve(generatedPngPath) !== path.resolve(targetPngPath)) {
      await copyFile(generatedPngPath, targetPngPath);
    }

    await convertImage(targetPngPath, targetWebpPath, 1280);
    await convertImage(targetPngPath, thumbnailPath, 480);
  } else if (mode === "approve-old") {
    if (!(await pathExists(targetWebpPath))) {
      throw new Error(`Cannot approve missing image: ${targetWebpPath}`);
    }
    if (!(await pathExists(thumbnailPath))) {
      const fallbackPng = (await pathExists(targetPngPath)) ? targetPngPath : targetWebpPath;
      await convertImage(fallbackPng, thumbnailPath, 480);
    }
  } else {
    throw new Error(`Unknown mode "${mode}" for ${manifestItem.recipeId}`);
  }

  manifestItem.image = {
    ...manifestItem.image,
    filename: `${slug}.webp`,
    path: imagePublicPath,
    thumbnailPath: thumbnailPublicPath,
    status: "generated",
    reviewStatus,
    prompt: batchItem.prompt || manifestItem.image.prompt,
  };

  const imageBytes = await fileSize(targetWebpPath);
  const thumbnailBytes = await fileSize(thumbnailPath);
  upsertReviewOverride(context.reviewOverrides, manifestItem.recipeId, reviewStatus, batchItem.notes);
  updatePromptRow(context.prompts, manifestItem.recipeId, manifestItem.image);
  upsertReviewRow(context.review, manifestItem, imageBytes, thumbnailBytes, await pathExists(thumbnailPath));

  return {
    recipeId: manifestItem.recipeId,
    slug,
    mode,
    reviewStatus,
    imagePath: imagePublicPath,
    thumbnailPath: thumbnailPublicPath,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const batchPath = resolveProjectPath(args.batchFile);
  const batch = await readJson(batchPath);
  const items = Array.isArray(batch.items) ? batch.items : [];

  if (!items.length) {
    throw new Error(`Batch has no items: ${batchPath}`);
  }

  const context = {
    defaultReviewStatus: args.reviewStatus,
    manifest: await readJson(OUTPUTS.manifest),
    prompts: await readJson(OUTPUTS.prompts, { prompts: [] }),
    review: await readJson(OUTPUTS.review, { items: [] }),
    reviewOverrides: await readJson(OUTPUTS.reviewOverrides, { items: [] }),
  };

  const results = [];
  for (const item of items) {
    results.push(await registerBatchItem(item, context));
  }

  const timestamp = new Date().toISOString();
  context.manifest.generatedAt = timestamp;
  context.prompts.generatedAt = timestamp;
  context.review.generatedAt = timestamp;
  context.reviewOverrides.generatedAt = timestamp;

  await writeJson(OUTPUTS.manifest, context.manifest);
  await writeJson(OUTPUTS.prompts, context.prompts);
  await writeJson(OUTPUTS.review, context.review);
  await writeJson(OUTPUTS.reviewOverrides, context.reviewOverrides);

  process.stdout.write(JSON.stringify({ ok: true, count: results.length, items: results }, null, 2));
}

await main();
