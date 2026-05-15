import type { Recipe } from "@/types/etkezes";
import {
  resolveRecipeImageCategory,
  type RecipeImageCategory,
} from "@/lib/recipes/recipe-image-map";

type RecipeVisualKind = RecipeImageCategory;

type VisualPalette = {
  bgStart: string;
  bgEnd: string;
  glow: string;
  plate: string;
  bowl: string;
  accent: string;
  soft: string;
  ink: string;
  chip: string;
  chipText: string;
};

const VISUALS: Record<RecipeVisualKind, VisualPalette> = {
  pasta: {
    bgStart: "#FFF7EA",
    bgEnd: "#F3DDC0",
    glow: "#F7C37A",
    plate: "#FFF9EE",
    bowl: "#E1A04C",
    accent: "#F5D48B",
    soft: "#D88A35",
    ink: "#5D3A1A",
    chip: "#FFF3E1",
    chipText: "#8D5A26",
  },
  soup: {
    bgStart: "#FFF8ED",
    bgEnd: "#E9E7CE",
    glow: "#E9B670",
    plate: "#FFF9EF",
    bowl: "#B98247",
    accent: "#F5E0AF",
    soft: "#D19758",
    ink: "#67431F",
    chip: "#FAF1DE",
    chipText: "#8F6534",
  },
  salad: {
    bgStart: "#FBFAEC",
    bgEnd: "#DDE7CC",
    glow: "#D5E3B0",
    plate: "#FFFDF4",
    bowl: "#7C916F",
    accent: "#A9CD87",
    soft: "#5E7157",
    ink: "#30402A",
    chip: "#EEF4E3",
    chipText: "#59704F",
  },
  chicken: {
    bgStart: "#FFF6E9",
    bgEnd: "#F0D4B1",
    glow: "#F4C280",
    plate: "#FFF9EF",
    bowl: "#D38F48",
    accent: "#F3C676",
    soft: "#A66628",
    ink: "#5C3919",
    chip: "#FFF1DD",
    chipText: "#905824",
  },
  meat: {
    bgStart: "#FFF3ED",
    bgEnd: "#EBCAB8",
    glow: "#F1B58D",
    plate: "#FFF8F1",
    bowl: "#B56D52",
    accent: "#E5A588",
    soft: "#8D4D33",
    ink: "#4F261D",
    chip: "#FCEBE3",
    chipText: "#8E5239",
  },
  sandwich: {
    bgStart: "#FFF8EC",
    bgEnd: "#EADCC0",
    glow: "#F2C98A",
    plate: "#FFF9EF",
    bowl: "#B98247",
    accent: "#F2D59A",
    soft: "#9D7343",
    ink: "#5A4121",
    chip: "#FBF0DF",
    chipText: "#84603A",
  },
  dessert: {
    bgStart: "#FFF7F3",
    bgEnd: "#F4D7CB",
    glow: "#F1B7A3",
    plate: "#FFF9F6",
    bowl: "#C7846D",
    accent: "#F3CCBE",
    soft: "#A85F4F",
    ink: "#5B312C",
    chip: "#FCECE7",
    chipText: "#94574C",
  },
  drink: {
    bgStart: "#F8FBF1",
    bgEnd: "#D9E6C2",
    glow: "#CFE3A6",
    plate: "#FBFDF6",
    bowl: "#89A56C",
    accent: "#B8D590",
    soft: "#69834F",
    ink: "#385036",
    chip: "#EEF5E1",
    chipText: "#5D7650",
  },
  bake: {
    bgStart: "#FFF6EB",
    bgEnd: "#E9D2B9",
    glow: "#EFC18D",
    plate: "#FFF9EF",
    bowl: "#B27B45",
    accent: "#EFC98E",
    soft: "#8B5A2C",
    ink: "#58381E",
    chip: "#FBF0E0",
    chipText: "#85542D",
  },
  veggie: {
    bgStart: "#FAFBEE",
    bgEnd: "#D7E6C9",
    glow: "#C5DFA6",
    plate: "#FFFDF2",
    bowl: "#75915E",
    accent: "#A7CA84",
    soft: "#557042",
    ink: "#30412D",
    chip: "#EDF4E1",
    chipText: "#526B4A",
  },
  default: {
    bgStart: "#FFF7EC",
    bgEnd: "#E7DEC9",
    glow: "#F0C694",
    plate: "#FFF9EF",
    bowl: "#9A8E74",
    accent: "#D9C5A6",
    soft: "#7B6A4D",
    ink: "#433727",
    chip: "#FBF2E3",
    chipText: "#6E5F47",
  },
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
  const words = label.split(/\s+/).filter(Boolean);
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

export function resolveRecipeVisualKind(recipe: Recipe): RecipeVisualKind {
  return resolveRecipeImageCategory(recipe);
}

function renderDish(kind: RecipeVisualKind, palette: VisualPalette) {
  const commonPlate = `<ellipse cx="400" cy="302" rx="206" ry="132" fill="${palette.plate}" fill-opacity="0.97"/><ellipse cx="400" cy="304" rx="156" ry="96" fill="#ffffff" fill-opacity="0.46"/>`;

  if (kind === "pasta") {
    return `
      ${commonPlate}
      <ellipse cx="400" cy="302" rx="122" ry="72" fill="${palette.bowl}" fill-opacity="0.18"/>
      <path d="M305 286c45-26 146-32 194 5M296 313c54-19 164-24 212 6M318 338c59-17 142-13 181 4" stroke="${palette.soft}" stroke-width="18" stroke-linecap="round"/>
      <circle cx="357" cy="280" r="12" fill="${palette.accent}"/><circle cx="448" cy="333" r="11" fill="${palette.accent}"/><circle cx="511" cy="297" r="9" fill="${palette.accent}"/>
      <path d="M350 257l12 9M385 349l10-12M462 275l12 11M491 326l12-10" stroke="#6D8A4F" stroke-width="8" stroke-linecap="round"/>
    `;
  }

  if (kind === "soup") {
    return `
      <ellipse cx="400" cy="320" rx="214" ry="120" fill="${palette.plate}" fill-opacity="0.96"/>
      <path d="M250 277c0-34 28-62 62-62h176c34 0 62 28 62 62v34c0 53-43 96-96 96H346c-53 0-96-43-96-96z" fill="${palette.bowl}"/>
      <ellipse cx="400" cy="289" rx="120" ry="54" fill="${palette.accent}" fill-opacity="0.92"/>
      <path d="M328 260c16 18 18 34 3 49M374 248c18 22 20 42 4 60M424 250c18 21 21 41 6 59" stroke="#ffffff" stroke-opacity="0.54" stroke-width="8" stroke-linecap="round"/>
      <circle cx="350" cy="288" r="11" fill="#D98B3C"/><circle cx="447" cy="274" r="9" fill="#7C916F"/><circle cx="409" cy="305" r="10" fill="#C9D87F"/>
    `;
  }

  if (kind === "salad" || kind === "veggie") {
    return `
      ${commonPlate}
      <ellipse cx="400" cy="303" rx="126" ry="76" fill="${palette.bowl}" fill-opacity="0.18"/>
      <circle cx="338" cy="282" r="26" fill="#A5CB81"/><circle cx="386" cy="259" r="24" fill="#88B56D"/><circle cx="445" cy="281" r="29" fill="#9BC779"/><circle cx="476" cy="320" r="25" fill="#7DAF67"/><circle cx="360" cy="327" r="28" fill="#B8D990"/>
      <circle cx="420" cy="318" r="11" fill="#F0A36E"/><circle cx="325" cy="320" r="10" fill="#E49F55"/><circle cx="476" cy="274" r="10" fill="#F4C17C"/>
      <path d="M401 245c14 30-3 52-28 68" stroke="#5E7157" stroke-width="8" stroke-linecap="round"/>
    `;
  }

  if (kind === "chicken") {
    return `
      ${commonPlate}
      <path d="M314 319c0-44 38-82 92-82 27 0 48 8 64 24 13 13 21 31 21 50 0 46-38 80-96 80-50 0-81-23-81-72z" fill="${palette.bowl}"/>
      <circle cx="322" cy="313" r="28" fill="${palette.accent}"/><ellipse cx="480" cy="271" rx="34" ry="18" fill="#F6E3C4"/><ellipse cx="500" cy="267" rx="16" ry="10" fill="#EACCA0"/>
      <circle cx="382" cy="283" r="11" fill="#F4C886"/><circle cx="434" cy="336" r="10" fill="#F6D08E"/>
      <path d="M354 257l11 10M388 349l12-11M454 302l9 10" stroke="#6F8E55" stroke-width="8" stroke-linecap="round"/>
    `;
  }

  if (kind === "meat") {
    return `
      ${commonPlate}
      <path d="M292 323c0-49 49-96 113-96 74 0 120 47 120 95 0 50-50 87-118 87-66 0-115-35-115-86z" fill="${palette.bowl}"/>
      <path d="M337 310c34-33 96-42 151-24" stroke="${palette.accent}" stroke-width="16" stroke-linecap="round"/>
      <path d="M340 345c33-18 85-22 128-10" stroke="${palette.accent}" stroke-width="14" stroke-linecap="round"/>
      <circle cx="326" cy="340" r="16" fill="#D8A46D"/><circle cx="487" cy="310" r="14" fill="#EAC08A"/>
    `;
  }

  if (kind === "sandwich") {
    return `
      ${commonPlate}
      <rect x="286" y="244" width="226" height="56" rx="24" fill="#F1C374"/>
      <rect x="278" y="293" width="244" height="36" rx="18" fill="#88B56D"/>
      <rect x="286" y="326" width="226" height="52" rx="22" fill="#E0A55D"/>
      <circle cx="352" cy="275" r="10" fill="#F9E6B8"/><circle cx="412" cy="342" r="10" fill="#F8C87C"/>
    `;
  }

  if (kind === "dessert") {
    return `
      ${commonPlate}
      <path d="M314 356l76-112h95l-74 112z" fill="${palette.bowl}"/>
      <path d="M350 300c22-20 68-29 107-20" stroke="#FFF8F1" stroke-width="14" stroke-linecap="round"/>
      <path d="M324 357h96" stroke="${palette.soft}" stroke-width="12" stroke-linecap="round"/>
      <circle cx="444" cy="247" r="14" fill="${palette.accent}"/><circle cx="470" cy="225" r="10" fill="#F8E5D8"/>
    `;
  }

  if (kind === "drink") {
    return `
      <ellipse cx="400" cy="326" rx="210" ry="116" fill="${palette.plate}" fill-opacity="0.96"/>
      <path d="M350 232h100l-10 162c-1 17-15 30-32 30h-16c-17 0-31-13-32-30z" fill="${palette.bowl}"/>
      <path d="M367 255h66l-8 98c-1 10-9 18-19 18h-12c-10 0-18-8-19-18z" fill="${palette.accent}" fill-opacity="0.92"/>
      <path d="M448 259l54-48" stroke="#F7E5BF" stroke-width="10" stroke-linecap="round"/>
      <path d="M383 281c21 17 28 40 21 67M423 274c16 13 22 31 18 54" stroke="#ffffff" stroke-opacity="0.42" stroke-width="7" stroke-linecap="round"/>
    `;
  }

  if (kind === "bake") {
    return `
      ${commonPlate}
      <path d="M298 343c8-52 51-96 104-107 59-13 125 17 160 73-6 42-43 80-95 95-67 19-145-9-169-61z" fill="${palette.bowl}"/>
      <path d="M320 332c40-24 111-37 180-19" stroke="${palette.accent}" stroke-width="16" stroke-linecap="round"/>
      <path d="M349 286l11 11M389 274l11 10M438 279l12 11M482 301l11 10" stroke="#FFF8EA" stroke-width="7" stroke-linecap="round"/>
    `;
  }

  return `
    ${commonPlate}
    <ellipse cx="400" cy="302" rx="120" ry="72" fill="${palette.bowl}" fill-opacity="0.24"/>
    <circle cx="350" cy="285" r="26" fill="${palette.accent}"/><circle cx="452" cy="284" r="24" fill="${palette.soft}" fill-opacity="0.75"/><circle cx="404" cy="334" r="28" fill="${palette.accent}" fill-opacity="0.85"/>
    <path d="M339 257l10 10M392 245l10 10M452 258l10 10M367 349l12-10" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="7" stroke-linecap="round"/>
  `;
}

export function getRecipeImageDataUri(recipe: Recipe): string {
  const kind = resolveRecipeVisualKind(recipe);
  const palette = VISUALS[kind];
  const [line1, line2] = splitLabel(recipe.name);
  const chipA = recipe.tags?.find((tag) => tag.length < 20) ?? recipe.category;
  const chipB = recipe.ingredients[0] ?? recipe.protein;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="90" y1="50" x2="710" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${palette.bgStart}" />
          <stop offset="100%" stop-color="${palette.bgEnd}" />
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(620 120) rotate(137) scale(260 240)">
          <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.55" />
          <stop offset="1" stop-color="${palette.glow}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" rx="44" fill="url(#bg)" />
      <rect width="800" height="600" rx="44" fill="url(#glow)" />
      <circle cx="160" cy="116" r="92" fill="#ffffff" fill-opacity="0.18"/>
      <circle cx="694" cy="478" r="86" fill="#ffffff" fill-opacity="0.14"/>
      ${renderDish(kind, palette)}
      <rect x="48" y="42" width="156" height="46" rx="23" fill="${palette.chip}" fill-opacity="0.95" />
      <text x="126" y="72" text-anchor="middle" font-size="22" font-weight="700" fill="${palette.chipText}" font-family="Arial, sans-serif">${recipe.duration} perc</text>
      <rect x="572" y="42" width="180" height="46" rx="23" fill="${palette.chip}" fill-opacity="0.95" />
      <text x="662" y="72" text-anchor="middle" font-size="20" font-weight="700" fill="${palette.chipText}" font-family="Arial, sans-serif">${esc(chipA)}</text>
      <text x="400" y="448" text-anchor="middle" font-size="36" font-weight="700" fill="${palette.ink}" font-family="Arial, sans-serif">${esc(line1)}</text>
      <text x="400" y="490" text-anchor="middle" font-size="32" font-weight="700" fill="${palette.ink}" font-family="Arial, sans-serif">${esc(line2)}</text>
      <rect x="230" y="526" width="340" height="38" rx="19" fill="${palette.chip}" fill-opacity="0.92" />
      <text x="400" y="551" text-anchor="middle" font-size="20" font-weight="600" fill="${palette.chipText}" font-family="Arial, sans-serif">${esc(chipB)}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getRecipeImageSrc(recipe: Recipe): string {
  if (recipe.image?.startsWith("/")) {
    return recipe.image;
  }

  return getRecipeImageDataUri(recipe);
}
