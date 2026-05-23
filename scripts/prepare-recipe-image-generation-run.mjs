import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TMP_RUNS_DIR = path.join(ROOT, "tmp", "recipe-image-generation-runs");
const GENERATED_IMAGE_STAGING_DIR = path.join("/private", "tmp", "family-flow-generated-recipe-images");

function parseArgs(argv) {
  const args = {
    batch: "",
    outDir: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key === "--batch" && value) {
      args.batch = value;
      index += 1;
      continue;
    }
    if (key === "--out-dir" && value) {
      args.outDir = value;
      index += 1;
    }
  }

  if (!args.batch) {
    throw new Error("Usage: node scripts/prepare-recipe-image-generation-run.mjs --batch <batch.json> [--out-dir <dir>]");
  }

  return args;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function resolveProjectPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
}

function toSafeDirName(value) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
}

function buildPromptSheet(batch) {
  const lines = [
    `# ${batch.batchId}`,
    "",
    `Generated at: ${new Date().toISOString()}`,
    `Strategy: ${batch.strategy}`,
    `Items: ${batch.items.length}`,
    "",
  ];

  batch.items.forEach((item, index) => {
    lines.push(`## ${index + 1}. ${item.title}`);
    lines.push(`recipeId: ${item.recipeId}`);
    lines.push(`slug: ${item.slug}`);
    lines.push(`priorityScore: ${item.priorityScore}`);
    lines.push("");
    lines.push(item.imagePrompt);
    lines.push("");
  });

  return `${lines.join("\n")}\n`;
}

function buildInstructions(batchDirName) {
  return `# Recipe Image Run

1. Generate images for the prompts in \`prompt-sheet.md\` or \`prompts.json\`.
2. Save each generated PNG with the exact slug filename into:
   \`${GENERATED_IMAGE_STAGING_DIR}\`
3. When all PNG files are ready, register them with:
   \`node scripts/register-generated-recipe-image-batch.mjs --batch tmp/recipe-image-generation-runs/${batchDirName}/register-batch.template.json\`

Expected filename rule:
- \`<slug>.png\`

Example:
- \`a-vilag-legfinomabb-legegyszerubb-paradicsomos-sajtos-spagettije.png\`
`;
}

function buildRegisterTemplate(batch) {
  return {
    generatedAt: new Date().toISOString(),
    sourceBatchId: batch.batchId,
    notes: "Register generated PNG files for this image generation run.",
    items: batch.items.map((item) => ({
      recipeId: item.recipeId,
      slug: item.slug,
      generatedPngPath: path.join(GENERATED_IMAGE_STAGING_DIR, `${item.slug}.png`),
      reviewStatus: "approved",
      mode: "register",
      notes: `Generated from ${batch.batchId}`,
    })),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const batchPath = resolveProjectPath(args.batch);
  const batch = await readJson(batchPath);
  const batchFileStem = path.basename(batchPath, ".json");
  const batchDirName = toSafeDirName(batchFileStem || batch.batchId || "recipe-image-run");
  const outDir = args.outDir
    ? resolveProjectPath(args.outDir)
    : path.join(TMP_RUNS_DIR, batchDirName);

  await mkdir(outDir, { recursive: true });

  const promptsPath = path.join(outDir, "prompts.json");
  const promptSheetPath = path.join(outDir, "prompt-sheet.md");
  const registerTemplatePath = path.join(outDir, "register-batch.template.json");
  const instructionsPath = path.join(outDir, "README.md");

  await writeJson(promptsPath, {
    batchId: batch.batchId,
    sourceBatchFile: path.relative(ROOT, batchPath),
    strategy: batch.strategy,
    count: batch.items.length,
    items: batch.items.map((item, index) => ({
      index: index + 1,
      recipeId: item.recipeId,
      slug: item.slug,
      title: item.title,
      priorityScore: item.priorityScore,
      visualType: item.visualType,
      imagePrompt: item.imagePrompt,
      targetFilename: `${item.slug}.png`,
    })),
  });
  await writeFile(promptSheetPath, buildPromptSheet(batch), "utf8");
  await writeJson(registerTemplatePath, buildRegisterTemplate(batch));
  await writeFile(instructionsPath, buildInstructions(batchDirName), "utf8");

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        batchId: batch.batchId,
        outDir: path.relative(ROOT, outDir),
        files: {
          prompts: path.relative(ROOT, promptsPath),
          promptSheet: path.relative(ROOT, promptSheetPath),
          registerTemplate: path.relative(ROOT, registerTemplatePath),
          instructions: path.relative(ROOT, instructionsPath),
        },
        count: batch.items.length,
      },
      null,
      2,
    ),
  );
}

await main();
