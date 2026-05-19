import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const GENERATED_ROOT = path.join(
  process.env.HOME || "",
  ".codex",
  "generated_images",
);

const ROOT = process.cwd();
const execFileAsync = promisify(execFile);

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    throw new Error("Usage: node scripts/register-latest-generated-recipe-image.mjs <slug>");
  }

  const generatedEntries = await readdir(GENERATED_ROOT, { withFileTypes: true });
  const generatedDirs = generatedEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const latestGeneratedDir = generatedDirs.at(-1);

  if (!latestGeneratedDir) {
    throw new Error(`No generated image directories found in ${GENERATED_ROOT}`);
  }

  const generatedDir = path.join(GENERATED_ROOT, latestGeneratedDir);

  const escapedGeneratedDir = generatedDir.replace(/'/g, "'\\''");
  const { stdout } = await execFileAsync("zsh", ["-lc", `ls -1t '${escapedGeneratedDir}'/*.png | head -n 1`], {
    cwd: ROOT,
  });
  const latestPngPath = stdout.trim();
  if (!latestPngPath) {
    throw new Error("No generated PNG found");
  }

  const imageDir = path.join(ROOT, "public", "assets", "recipes", "images");
  const thumbnailDir = path.join(imageDir, "thumbnails");

  await mkdir(thumbnailDir, { recursive: true });

  const copiedPngPath = path.join(imageDir, `${slug}.png`);
  const webpPath = path.join(imageDir, `${slug}.webp`);
  const thumbnailPath = path.join(thumbnailDir, `${slug}.webp`);

  await copyFile(latestPngPath, copiedPngPath);

  await execFileAsync("python3", ["scripts/convert-image-to-webp.py", copiedPngPath, webpPath, "--max-pixel-size", "1280"], {
    cwd: ROOT,
  });
  await execFileAsync("python3", ["scripts/convert-image-to-webp.py", copiedPngPath, thumbnailPath, "--max-pixel-size", "480"], {
    cwd: ROOT,
  });

  process.stdout.write(`${slug}\n`);
}

await main();
