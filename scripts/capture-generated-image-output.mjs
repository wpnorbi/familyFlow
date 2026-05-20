import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const GENERATED_ROOT = path.join(process.env.HOME || "", ".codex", "generated_images");

function parseArgs(argv) {
  const args = {
    snapshot: "",
    slug: "",
    outDir: path.join("/private", "tmp", "family-flow-generated-recipe-images"),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key === "--snapshot" && value) {
      args.snapshot = value;
      index += 1;
      continue;
    }
    if (key === "--slug" && value) {
      args.slug = value;
      index += 1;
      continue;
    }
    if (key === "--out-dir" && value) {
      args.outDir = value;
      index += 1;
    }
  }

  if (!args.snapshot || !args.slug) {
    throw new Error("Usage: node scripts/capture-generated-image-output.mjs --snapshot <snapshot.txt> --slug <slug> [--out-dir <dir>]");
  }

  return args;
}

async function walkPngs(dirPath) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkPngs(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function readSnapshot(snapshotPath) {
  try {
    const content = await readFile(snapshotPath, "utf8");
    return new Set(content.split("\n").map((line) => line.trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function writeSnapshot(snapshotPath, files) {
  await writeFile(snapshotPath, `${files.sort().join("\n")}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const before = await readSnapshot(args.snapshot);
  const current = await walkPngs(GENERATED_ROOT);
  const added = current.filter((filePath) => !before.has(filePath));

  if (added.length !== 1) {
    throw new Error(`Expected exactly one new generated PNG for ${args.slug}, got ${added.length}`);
  }

  await mkdir(args.outDir, { recursive: true });
  const targetPath = path.join(args.outDir, `${args.slug}.png`);
  await copyFile(added[0], targetPath);
  await writeSnapshot(args.snapshot, current);

  process.stdout.write(targetPath);
}

await main();
