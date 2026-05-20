import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    inputPath: "",
    outputPath: "",
    maxPixelSize: 0,
  };

  const positionals = [];
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--max-pixel-size" && argv[index + 1]) {
      args.maxPixelSize = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    positionals.push(value);
  }

  args.inputPath = positionals[0] || "";
  args.outputPath = positionals[1] || "";

  if (!args.inputPath || !args.outputPath) {
    throw new Error("Usage: node scripts/convert-image-to-webp.mjs <input> <output> [--max-pixel-size <n>]");
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(path.dirname(args.outputPath), { recursive: true });

  let pipeline = sharp(args.inputPath).rotate().toColorspace("srgb");

  if (args.maxPixelSize > 0) {
    pipeline = pipeline.resize({
      width: args.maxPixelSize,
      height: args.maxPixelSize,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  await pipeline.webp({ quality: 82, effort: 5 }).toFile(args.outputPath);
}

await main();
