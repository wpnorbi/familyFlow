import type { Recipe } from "@/types/etkezes";

const PALETTES: Record<Recipe["protein"], { start: string; end: string; accent: string; plate: string; icon: string }> = {
  csirke: { start: "#f7d58d", end: "#f3a948", accent: "#8a4b00", plate: "#fff8eb", icon: "egg_alt" },
  hal: { start: "#90d7f7", end: "#4095df", accent: "#0c5c95", plate: "#eef9ff", icon: "set_meal" },
  marha: { start: "#f3a6a0", end: "#de5c4f", accent: "#81251e", plate: "#fff1ef", icon: "lunch_dining" },
  sertés: { start: "#f6b2be", end: "#df7391", accent: "#8c2947", plate: "#fff0f4", icon: "nutrition" },
  vegetáriánus: { start: "#9ae3a1", end: "#55b76b", accent: "#256338", plate: "#f3fff4", icon: "eco" },
  egyéb: { start: "#ccb8ff", end: "#8d69db", accent: "#4b2e8e", plate: "#f7f2ff", icon: "restaurant" },
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function splitLabel(label: string): [string, string] {
  const words = label.split(" ");
  const first = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const second = words.slice(Math.ceil(words.length / 2)).join(" ");
  return [first, second];
}

export function getRecipeImageDataUri(recipe: Recipe): string {
  const palette = PALETTES[recipe.protein];
  const [line1, line2] = splitLabel(recipe.name);
  const ingredientA = recipe.ingredients[0] ?? recipe.category;
  const ingredientB = recipe.ingredients[1] ?? recipe.protein;
  const tag = recipe.tags?.[0] ?? recipe.category;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.start}" />
          <stop offset="100%" stop-color="${palette.end}" />
        </linearGradient>
        <radialGradient id="glow" cx="0.2" cy="0.15" r="0.9">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" rx="48" fill="url(#bg)" />
      <rect width="800" height="600" rx="48" fill="url(#glow)" />
      <circle cx="590" cy="120" r="90" fill="#ffffff" fill-opacity="0.18" />
      <circle cx="150" cy="480" r="110" fill="#ffffff" fill-opacity="0.12" />
      <ellipse cx="400" cy="290" rx="195" ry="125" fill="${palette.plate}" fill-opacity="0.96" />
      <ellipse cx="400" cy="290" rx="145" ry="92" fill="#ffffff" fill-opacity="0.55" />
      <text x="400" y="282" text-anchor="middle" font-size="78" fill="${palette.accent}" font-family="Arial, sans-serif">🍽</text>
      <text x="400" y="422" text-anchor="middle" font-size="38" font-weight="700" fill="#1f241f" font-family="Arial, sans-serif">${esc(line1)}</text>
      <text x="400" y="466" text-anchor="middle" font-size="34" font-weight="700" fill="#1f241f" font-family="Arial, sans-serif">${esc(line2)}</text>
      <rect x="48" y="44" width="150" height="48" rx="24" fill="#ffffff" fill-opacity="0.84" />
      <text x="123" y="75" text-anchor="middle" font-size="24" font-weight="700" fill="#1f241f" font-family="Arial, sans-serif">${recipe.duration} perc</text>
      <rect x="556" y="44" width="196" height="48" rx="24" fill="#ffffff" fill-opacity="0.84" />
      <text x="654" y="75" text-anchor="middle" font-size="22" font-weight="700" fill="#1f241f" font-family="Arial, sans-serif">${esc(tag)}</text>
      <rect x="82" y="522" width="196" height="42" rx="21" fill="#ffffff" fill-opacity="0.85" />
      <text x="180" y="549" text-anchor="middle" font-size="22" fill="#1f241f" font-family="Arial, sans-serif">${esc(ingredientA)}</text>
      <rect x="302" y="522" width="196" height="42" rx="21" fill="#ffffff" fill-opacity="0.85" />
      <text x="400" y="549" text-anchor="middle" font-size="22" fill="#1f241f" font-family="Arial, sans-serif">${esc(ingredientB)}</text>
      <rect x="522" y="522" width="196" height="42" rx="21" fill="#ffffff" fill-opacity="0.85" />
      <text x="620" y="549" text-anchor="middle" font-size="22" fill="#1f241f" font-family="Arial, sans-serif">${esc(recipe.category)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
