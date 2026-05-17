import {
  getLocalCategoryImagePath,
  type RecipeImageCategory,
} from "@/lib/recipes/recipe-image-map";

const VALID_KINDS = new Set<RecipeImageCategory>([
  "pasta",
  "soup",
  "salad",
  "chicken",
  "meat",
  "sandwich",
  "dessert",
  "drink",
  "bake",
  "veggie",
  "default",
]);

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickRange(hash: number, min: number, max: number, shift: number) {
  const unit = ((hash >>> shift) & 0xff) / 255;
  return min + (max - min) * unit;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kindParam = searchParams.get("kind");
  const seedParam = searchParams.get("seed") ?? "default";
  const kind = VALID_KINDS.has(kindParam as RecipeImageCategory)
    ? (kindParam as RecipeImageCategory)
    : "default";

  const hash = hashSeed(seedParam);
  const scale = pickRange(hash, 1.08, 1.26, 0);
  const offsetX = pickRange(hash, -180, 36, 8);
  const offsetY = pickRange(hash, -144, 24, 16);
  const glowX = pickRange(hash, 220, 980, 4);
  const glowY = pickRange(hash, 180, 920, 12);
  const glowOpacity = pickRange(hash, 0.12, 0.26, 20);
  const shadowOpacity = pickRange(hash, 0.12, 0.22, 6);
  const ringOpacity = pickRange(hash, 0.08, 0.18, 14);
  const rotation = pickRange(hash, -2.5, 2.5, 10);
  const baseImageUrl = new URL(getLocalCategoryImagePath(kind), request.url).toString();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" fill="none">
      <defs>
        <clipPath id="card">
          <rect width="1200" height="1200" rx="72" />
        </clipPath>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${glowX} ${glowY}) rotate(135) scale(460 420)">
          <stop stop-color="#FFF6E3" stop-opacity="${glowOpacity.toFixed(3)}"/>
          <stop offset="1" stop-color="#FFF6E3" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="fade" x1="120" y1="60" x2="1020" y2="1140" gradientUnits="userSpaceOnUse">
          <stop stop-color="rgba(255,252,244,0.06)"/>
          <stop offset="1" stop-color="rgba(55,67,50,0.16)"/>
        </linearGradient>
      </defs>
      <g clip-path="url(#card)">
        <rect width="1200" height="1200" fill="#F8F2E8"/>
        <g transform="translate(600 600) rotate(${rotation.toFixed(3)}) translate(-600 -600)">
          <image href="${baseImageUrl}" x="${offsetX.toFixed(2)}" y="${offsetY.toFixed(2)}" width="${(1200 * scale).toFixed(2)}" height="${(1200 * scale).toFixed(2)}" preserveAspectRatio="xMidYMid slice" />
        </g>
        <rect width="1200" height="1200" fill="url(#fade)"/>
        <rect width="1200" height="1200" fill="url(#glow)"/>
        <circle cx="1024" cy="180" r="188" fill="#FFF9F0" fill-opacity="${ringOpacity.toFixed(3)}"/>
        <circle cx="198" cy="1006" r="174" fill="#FFFFFF" fill-opacity="${(ringOpacity * 0.78).toFixed(3)}"/>
      </g>
      <rect x="10" y="10" width="1180" height="1180" rx="62" stroke="rgba(255,255,255,0.52)" stroke-width="20"/>
      <rect x="26" y="26" width="1148" height="1148" rx="52" stroke="rgba(61,49,34,${shadowOpacity.toFixed(3)})" stroke-width="2"/>
    </svg>
  `.trim();

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
