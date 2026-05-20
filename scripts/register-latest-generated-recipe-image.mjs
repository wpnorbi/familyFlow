import { writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const ROOT = process.cwd();
const execFileAsync = promisify(execFile);

function parseArgs(argv) {
  const args = {
    input: "",
    slug: "",
    recipeId: "",
    reviewStatus: "approved",
  };

  if (argv.length === 1 && !argv[0].startsWith("--")) {
    throw new Error(
      "The latest-file workflow is disabled. Use: node scripts/register-latest-generated-recipe-image.mjs --slug <slug> --input <generated.png> [--recipe-id <id>]",
    );
  }

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key === "--input" && value) {
      args.input = value;
      index += 1;
      continue;
    }
    if (key === "--slug" && value) {
      args.slug = value;
      index += 1;
      continue;
    }
    if (key === "--recipe-id" && value) {
      args.recipeId = value;
      index += 1;
      continue;
    }
    if (key === "--review-status" && value) {
      args.reviewStatus = value;
      index += 1;
    }
  }

  if (!args.input || (!args.slug && !args.recipeId)) {
    throw new Error(
      "Usage: node scripts/register-latest-generated-recipe-image.mjs --slug <slug> --input <generated.png> [--recipe-id <id>] [--review-status approved]",
    );
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const batchPath = path.join("/private", "tmp", `family-flow-recipe-image-${Date.now()}.json`);
  const item = {
    recipeId: args.recipeId || undefined,
    slug: args.slug || undefined,
    generatedPngPath: path.isAbsolute(args.input) ? args.input : path.join(ROOT, args.input),
    reviewStatus: args.reviewStatus,
    mode: "register",
    notes: "Explicit single-image registration",
  };

  await writeFile(batchPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), items: [item] }, null, 2)}\n`);
  const { stdout } = await execFileAsync("node", [
    "scripts/register-generated-recipe-image-batch.mjs",
    "--batch",
    batchPath,
    "--review-status",
    args.reviewStatus,
  ], { cwd: ROOT });

  process.stdout.write(stdout);
}

await main();
