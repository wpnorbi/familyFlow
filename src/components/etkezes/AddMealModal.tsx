"use client";

import { useEffect, useState, type ReactNode } from "react";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { toDateKey } from "@/lib/etkezes-data";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import {
  MEAL_TYPE_OPTIONS,
  PROTEIN_OPTIONS,
  TIME_BUCKET_OPTIONS,
  getRecipeMealType,
  getRecipeMealTypeLabel,
  getRecipeTimeBucket,
  isKidFriendlyRecipe,
  isQuickRecipe,
  matchesRecipeTaxonomy,
  type RecipeMealType,
  type RecipeTimeBucket,
} from "@/lib/recipes/recipe-taxonomy";
import { getUserImportedRecipes } from "@/lib/recipes/user-import.provider";
import type { MealBatch, Recipe } from "@/types/etkezes";

const TIME_FILTERS = [
  { label: "Rövid", sublabel: "kb. 20 perc", max: 20, bucket: "short" as const, icon: "bolt" },
  { label: "Közepes", sublabel: "kb. 50 perc", max: 50, bucket: "medium" as const, icon: "timer" },
  { label: "Hosszú", sublabel: "akár 2 óra", max: Infinity, bucket: "long" as const, icon: "hourglass_bottom" },
  { label: "Mindegy", sublabel: "Nincs limit", max: Infinity, bucket: "mind" as const, icon: "all_inclusive" },
];

const PROTEIN_FILTERS: { label: string; value: Recipe["protein"] | "mind"; icon: string }[] = [
  ...PROTEIN_OPTIONS,
  { label: "Mind", value: "mind", icon: "all_inclusive" },
];

const DAY_PLAN_OPTIONS = [
  { label: "Csak mára", value: 1, note: "Egy gyors mai döntés", icon: "today" },
  { label: "2 napra", value: 2, note: "Maradjon holnapra is", icon: "history_2" },
  { label: "3 napra", value: 3, note: "Nyugodtabb pár nap", icon: "calendar_view_week" },
  { label: "Az egész hétre", value: 7, note: "Nagyobb előretervezés", icon: "view_week" },
  { label: "Mindegy, csak legyen ötlet", value: 2, note: "Mutass valami működőt", icon: "auto_awesome" },
] as const;

const COOKING_TIME_OPTIONS = [
  { label: "Rövid", value: 20, bucket: "short" as const, note: "20 perc körül", icon: "bolt" },
  { label: "Közepes", value: 50, bucket: "medium" as const, note: "50 perc körül", icon: "timer" },
  { label: "Hosszú", value: Infinity, bucket: "long" as const, note: "akár 2 óra", icon: "hourglass_bottom" },
  { label: "Mindegy", value: Infinity, bucket: "mind" as const, note: "Csak legyen jó ötlet", icon: "all_inclusive" },
] as const;

const STARTING_POINT_OPTIONS = [
  { label: "Csirke", value: "csirke", note: "Biztos kedvenc", icon: "egg_alt" },
  { label: "Tészta", value: "teszta", note: "Gyors és hálás", icon: "ramen_dining" },
  { label: "Rizs", value: "rizs", note: "Jól variálható", icon: "grain" },
  { label: "Zöldséges", value: "zoldseges", note: "Könnyebb irány", icon: "eco" },
  { label: "Kamrából, ami van", value: "kamra", note: "A meglévőkből induljunk", icon: "kitchen" },
  { label: "Mindegy", value: "mind", note: "Mutass működő ötletet", icon: "restaurant" },
] as const;

const CHILD_FRIENDLY_OPTIONS = [
  { label: "Igen, ez fontos", value: "important", note: "A gyerekek biztosan egyék", icon: "favorite" },
  { label: "Jó lenne", value: "nice", note: "Inkább családbarát legyen", icon: "sentiment_satisfied" },
  { label: "Nem szempont", value: "off", note: "Most elég, ha működik", icon: "tune" },
] as const;

const DIRECTION_OPTIONS = [
  { label: "Egyszerű házias", value: "hazias", note: "Biztos, ismerős ízek", icon: "home" },
  { label: "Tészta", value: "teszta", note: "Gyors comfort vonal", icon: "menu_book" },
  { label: "Főzelék", value: "fozelek", note: "Puha, kanalas családi étel", icon: "eco" },
  { label: "Leves", value: "leves", note: "Kanállal is jól esik", icon: "soup_kitchen" },
  { label: "Desszert", value: "desszert", note: "Édes opció is jöhet", icon: "bakery_dining" },
  { label: "Sütőben készülő", value: "suto", note: "Kevesebb aktív idő", icon: "oven" },
  { label: "Egyserpenyős", value: "egyserpenyos", note: "Kevesebb mosogatás", icon: "skillet" },
  { label: "Mindegy, csak működjön", value: "mind", note: "Válogass helyettem", icon: "auto_awesome" },
] as const;

const QUICK_PRESETS = [
  { label: "Gyors vacsorák", icon: "bolt", days: 2, time: 30, child: "nice", start: "mind", direction: "hazias" },
  { label: "Gyerekbarát", icon: "favorite", days: 2, time: 30, child: "important", start: "mind", direction: "hazias" },
  { label: "Kamrából főznék", icon: "kitchen", days: 2, time: 30, child: "nice", start: "kamra", direction: "mind" },
  { label: "30 perc alatt", icon: "timer", days: 2, time: 30, child: "nice", start: "mind", direction: "mind" },
  { label: "2 napra főznék", icon: "history_2", days: 2, time: 45, child: "nice", start: "mind", direction: "hazias" },
  { label: "Egyszerű hétindító terv", icon: "wb_sunny", days: 3, time: 30, child: "nice", start: "csirke", direction: "hazias" },
] as const;

const FAST_STYLE_OPTIONS = [
  { label: "Gyerekbarát", note: "Biztosabb családi választás", icon: "favorite", tone: "peach" },
  { label: "Gyors", note: "30 perc körüli vagy rövidebb", icon: "bolt", tone: "sage" },
  { label: "Tészta", note: "Gyors comfort vonal", icon: "ramen_dining", tone: "peach" },
  { label: "Főzelék", note: "Kanalas, puhább családi étel", icon: "eco", tone: "sage" },
  { label: "Leves", note: "Kanállal is jól esik", icon: "soup_kitchen", tone: "caramel" },
  { label: "Desszert", note: "Édesség is megjelenhet", icon: "bakery_dining", tone: "peach" },
  { label: "Mindegy", note: "Csak mutass jó ötletet", icon: "auto_awesome", tone: "cream" },
] as const;

const PROTEIN_GRADIENTS: Record<Recipe["protein"], string> = {
  csirke: "from-amber-50 via-orange-50 to-amber-100",
  hal: "from-sky-50 via-cyan-50 to-blue-100",
  marha: "from-rose-50 via-red-50 to-orange-100",
  sertés: "from-pink-50 via-rose-50 to-red-100",
  vegetáriánus: "from-green-50 via-emerald-50 to-lime-100",
  egyéb: "from-violet-50 via-fuchsia-50 to-purple-100",
};

const PROTEIN_ICON_COLORS: Record<Recipe["protein"], string> = {
  csirke: "text-amber-700",
  hal: "text-sky-700",
  marha: "text-rose-700",
  sertés: "text-pink-700",
  vegetáriánus: "text-emerald-700",
  egyéb: "text-violet-700",
};

const PROTEIN_ICONS: Record<Recipe["protein"], string> = {
  csirke: "egg_alt",
  hal: "set_meal",
  marha: "lunch_dining",
  sertés: "nutrition",
  vegetáriánus: "eco",
  egyéb: "restaurant",
};

const FLOW_STEPS = [
  { id: 1, eyebrow: "Hangolás", title: "Szűrés" },
  { id: 2, eyebrow: "Választás", title: "Recept" },
  { id: 3, eyebrow: "Tervezés", title: "Ütemezés" },
] as const;

const CLIENT_FALLBACK_RECIPES = Array.from(
  new Map(
    getUserImportedRecipes().map((recipe) => [recipe.id, recipe]),
  ).values(),
);

interface Props {
  onAdd: (batch: Omit<MealBatch, "id">) => void | Promise<void>;
  onClose: () => void;
  initialRecipe?: Recipe | null;
  pantryItems?: string[];
}

type StartingPointValue = (typeof STARTING_POINT_OPTIONS)[number]["value"];
type ChildFriendlyPreference = (typeof CHILD_FRIENDLY_OPTIONS)[number]["value"];
type DirectionValue = (typeof DIRECTION_OPTIONS)[number]["value"];
type FastStyleValue = (typeof FAST_STYLE_OPTIONS)[number]["label"];

function getCookDateOptions() {
  const today = new Date();
  const dayNames = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const label = i === 0 ? "Ma" : i === 1 ? "Holnap" : i === 2 ? "Holnapután" : dayNames[date.getDay()];
    return { dateKey: toDateKey(date), label };
  });
}

function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d + n);
  return toDateKey(date);
}

function getProteinLabel(protein: Recipe["protein"]) {
  return PROTEIN_FILTERS.find((item) => item.value === protein)?.label ?? protein;
}

function isChildFriendly(recipe: Recipe): boolean {
  return isKidFriendlyRecipe(recipe);
}

function scaleIngredientLabel(ingredient: string, days: number): string {
  return days > 1 ? `${ingredient} ×${days}` : ingredient;
}

function buildPlannedRecipeSnapshot(recipe: Recipe, days: number): Recipe {
  const baseServings = recipe.servings ?? 4;

  return {
    ...recipe,
    ingredients: recipe.ingredients.map((ingredient) => scaleIngredientLabel(ingredient, days)),
    servings: baseServings * days,
    description:
      days > 1
        ? `${recipe.description} Ez a terv ${days} napra van skálázva.`
        : recipe.description,
  };
}

function getRecipeCategories(): string[] {
  return MEAL_TYPE_OPTIONS.map((option) => option.label);
}

function getRecipeTags(): string[] {
  return ["gyerekbarát", "gyors", "rövid", "közepes idő", "hosszú"];
}

function DecisionCard({
  label,
  note,
  icon,
  selected,
  onClick,
}: {
  label: string;
  note: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
}) {
  const tone = getDecisionTone(label);

  return (
    <button
      onClick={onClick}
      className={`group flex cursor-pointer items-start gap-3 rounded-[26px] border px-4 py-4 text-left transition-all ${
        selected
          ? `border-[rgba(55,67,50,0.18)] ${tone.selected} text-[var(--ff-text)] shadow-[var(--ff-shadow-soft)] ring-1 ring-white/40`
          : `border-[var(--ff-glass-border)] ${tone.base} text-[var(--ff-text)] hover:-translate-y-0.5 hover:border-[rgba(55,67,50,0.16)] hover:shadow-[0_16px_35px_-26px_rgba(61,49,34,0.28)]`
      }`}
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-[16px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ${
        selected
          ? "border-[rgba(55,67,50,0.14)] bg-[rgba(55,67,50,0.12)] text-[var(--ff-primary)]"
          : `border-[rgba(74,67,54,0.08)] ${tone.icon} text-[var(--ff-text-muted)]`
      }`}>
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight">{label}</p>
          {selected && (
            <span className="rounded-full bg-[var(--ff-primary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ff-text-inverse)]">
              Kész
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] leading-snug text-[var(--ff-text-muted)]">{note}</p>
      </div>
    </button>
  );
}

function SummaryChip({ children }: { children: ReactNode }) {
  return (
    <span className="ff-chip px-3 py-1.5 text-[11px] font-semibold text-[var(--ff-text)] shadow-none">
      {children}
    </span>
  );
}

function getPresetTone(label: string): string {
  switch (label) {
    case "Gyors vacsorák":
      return "bg-[rgba(238,243,231,0.94)] border-[rgba(124,145,111,0.16)] text-[var(--ff-primary)]";
    case "Gyerekbarát":
      return "bg-[rgba(255,240,227,0.96)] border-[rgba(230,168,121,0.18)] text-[var(--ff-caramel-strong)]";
    case "Kamrából főznék":
      return "bg-[rgba(246,228,203,0.88)] border-[rgba(185,130,71,0.18)] text-[var(--ff-caramel-strong)]";
    case "30 perc alatt":
      return "bg-[rgba(221,230,211,0.82)] border-[rgba(94,113,87,0.16)] text-[var(--ff-primary)]";
    case "2 napra főznék":
      return "bg-[rgba(243,248,238,0.94)] border-[rgba(124,145,111,0.14)] text-[var(--ff-primary)]";
    case "Egyszerű hétindító terv":
      return "bg-[rgba(255,249,237,0.96)] border-[rgba(231,196,154,0.18)] text-[var(--ff-caramel-strong)]";
    default:
      return "bg-[rgba(255,252,244,0.9)] border-[rgba(74,67,54,0.1)] text-[var(--ff-primary)]";
  }
}

function getDecisionTone(label: string): { base: string; selected: string; icon: string } {
  switch (label) {
    case "Csak mára":
      return {
        base: "bg-[rgba(255,249,237,0.78)]",
        selected: "bg-[linear-gradient(145deg,rgba(255,249,237,0.98),rgba(246,235,216,0.92))]",
        icon: "bg-[rgba(255,249,237,0.86)]",
      };
    case "2 napra":
      return {
        base: "bg-[rgba(244,249,239,0.78)]",
        selected: "bg-[linear-gradient(145deg,rgba(228,236,220,0.98),rgba(247,241,231,0.94))]",
        icon: "bg-[rgba(238,243,231,0.88)]",
      };
    case "3 napra":
      return {
        base: "bg-[rgba(248,242,232,0.78)]",
        selected: "bg-[linear-gradient(145deg,rgba(248,242,232,0.98),rgba(239,232,216,0.92))]",
        icon: "bg-[rgba(248,242,232,0.88)]",
      };
    case "Az egész hétre":
      return {
        base: "bg-[rgba(255,240,227,0.76)]",
        selected: "bg-[linear-gradient(145deg,rgba(255,240,227,0.98),rgba(246,228,203,0.9))]",
        icon: "bg-[rgba(255,240,227,0.9)]",
      };
    default:
      return {
        base: "bg-[rgba(255,252,244,0.72)]",
        selected: "bg-[linear-gradient(145deg,rgba(228,236,220,0.96),rgba(247,241,231,0.94))]",
        icon: "bg-[rgba(255,251,244,0.8)]",
      };
  }
}

function getSectionTone(label: string): string {
  switch (label) {
    case "1. lépés":
      return "bg-[linear-gradient(145deg,rgba(255,252,244,0.9),rgba(238,243,231,0.72))]";
    case "2. lépés":
      return "bg-[linear-gradient(145deg,rgba(255,252,244,0.92),rgba(255,240,227,0.66))]";
    case "3. lépés":
      return "bg-[linear-gradient(145deg,rgba(255,252,244,0.9),rgba(246,228,203,0.62))]";
    case "4. lépés":
      return "bg-[linear-gradient(145deg,rgba(255,252,244,0.92),rgba(255,240,227,0.7))]";
    case "5. lépés":
      return "bg-[linear-gradient(145deg,rgba(255,252,244,0.9),rgba(238,243,231,0.68))]";
    default:
      return "";
  }
}

function getFastStyleTone(tone: (typeof FAST_STYLE_OPTIONS)[number]["tone"], selected: boolean): string {
  if (tone === "peach") {
    return selected
      ? "border-[rgba(230,168,121,0.26)] bg-[linear-gradient(145deg,rgba(255,240,227,0.98),rgba(248,220,198,0.92))] text-[var(--ff-caramel-strong)]"
      : "border-[rgba(230,168,121,0.14)] bg-[rgba(255,240,227,0.78)] text-[var(--ff-caramel-strong)]";
  }
  if (tone === "sage") {
    return selected
      ? "border-[rgba(94,113,87,0.24)] bg-[linear-gradient(145deg,rgba(238,243,231,0.98),rgba(221,230,211,0.92))] text-[var(--ff-primary)]"
      : "border-[rgba(124,145,111,0.14)] bg-[rgba(238,243,231,0.82)] text-[var(--ff-primary)]";
  }
  if (tone === "caramel") {
    return selected
      ? "border-[rgba(185,130,71,0.24)] bg-[linear-gradient(145deg,rgba(255,249,237,0.98),rgba(246,228,203,0.92))] text-[var(--ff-caramel-strong)]"
      : "border-[rgba(185,130,71,0.14)] bg-[rgba(246,228,203,0.8)] text-[var(--ff-caramel-strong)]";
  }
  return selected
    ? "border-[rgba(74,67,54,0.16)] bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(246,235,216,0.92))] text-[var(--ff-text)]"
    : "border-[rgba(74,67,54,0.1)] bg-[rgba(255,249,237,0.84)] text-[var(--ff-text)]";
}

function matchesRecipe(
  recipe: Recipe,
  searchTerm: string,
  category: string,
  tag: string,
  maxDuration: number,
  protein: Recipe["protein"] | "mind",
  childFriendlyOnly: boolean,
  mealType: RecipeMealType | "mind",
  timeBucket: RecipeTimeBucket | "mind",
  quickOnly: boolean,
) {
  const normalizedQuery = searchTerm.trim().toLowerCase();
  const searchable = [
    recipe.name,
    recipe.description,
    recipe.category,
    ...recipe.ingredients,
    ...(recipe.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const timeOk = recipe.duration <= maxDuration;
  const taxonomyOk = matchesRecipeTaxonomy(recipe, {
    protein,
    mealType,
    timeBucket,
    quickOnly,
    childFriendlyOnly,
  });
  const categoryOk = category === "mind" || recipe.category === category || getRecipeMealTypeLabel(recipe) === category;
  const tagOk = tag === "mind" || (recipe.tags ?? []).includes(tag);
  const searchOk = !normalizedQuery || searchable.includes(normalizedQuery);

  return timeOk && taxonomyOk && categoryOk && tagOk && searchOk;
}

function getPrimaryReason(recipe: Recipe, pantryItems: string[]): string {
  const pantryMatch = rankRecipesForPantry([recipe], pantryItems)[0];
  const missingCount = pantryMatch?.missingIngredients.length ?? recipe.ingredients.length;

  if (missingCount === 0) return "Minden megvan hozzá";
  if (missingCount <= 2) return `Csak ${missingCount} hozzávaló hiányzik`;
  if (recipe.duration <= 20) return "20 perc alatt kész";
  if (isChildFriendly(recipe)) return "Gyerekbarát kedvenc";
  if (isQuickRecipe(recipe)) return "Gyors hétköznapi vacsora";
  if (recipe.servings && recipe.servings >= 4) return "Több adagra is jó választás";
  return "Most könnyen beilleszthető a heti tervbe";
}

function getSecondaryReason(recipe: Recipe, pantryItems: string[]): string {
  const pantryMatch = rankRecipesForPantry([recipe], pantryItems)[0];
  const missingCount = pantryMatch?.missingIngredients.length ?? recipe.ingredients.length;

  if (recipe.duration <= 20) return "Gyors megoldás egy sűrű napra";
  if (isChildFriendly(recipe)) return "Szívesen eszik a gyerekek is";
  if (missingCount === 0) return "Nem kell miatta külön boltba menni";
  if (missingCount <= 2) return "Kevés plusz beszerzéssel megfőzhető";
  return recipe.description;
}

function getDisplayTags(recipe: Recipe): string[] {
  const tags = recipe.tags ?? [];
  const preferred = tags.filter((tag) => ["gyerekbarát", "gyors", "rövid", "közepes idő", "hosszú"].includes(tag));
  const fallback = [getRecipeMealTypeLabel(recipe), getProteinLabel(recipe.protein), ...tags];
  return Array.from(new Set([...preferred, ...fallback])).slice(0, 2);
}

function FlowSection({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={`ff-glass-card rounded-[30px] px-5 py-5 sm:px-6 ${getSectionTone(label)}`}>
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--ff-text-soft)]">{label}</p>
        <h3 className="mt-2 text-lg font-semibold text-[var(--ff-text)]">{title}</h3>
        {description && <p className="mt-1 text-sm leading-relaxed text-[var(--ff-text-muted)]">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function AddMealModal({ onAdd, onClose, initialRecipe = null, pantryItems = [] }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(initialRecipe ? 3 : 1);
  const [timeFilter, setTimeFilter] = useState<number>(30);
  const [timeBucketFilter, setTimeBucketFilter] = useState<RecipeTimeBucket | "mind">("medium");
  const [proteinFilter, setProteinFilter] = useState<Recipe["protein"] | "mind">("mind");
  const [childFriendlyOnly, setChildFriendlyOnly] = useState(true);
  const [mealTypeFilter, setMealTypeFilter] = useState<RecipeMealType | "mind">("mind");
  const [quickOnly, setQuickOnly] = useState(false);
  const [startingPoint, setStartingPoint] = useState<StartingPointValue>("mind");
  const [childPreference, setChildPreference] = useState<ChildFriendlyPreference>("nice");
  const [directionPreference, setDirectionPreference] = useState<DirectionValue>("hazias");
  const [fastStyle, setFastStyle] = useState<FastStyleValue>("Mindegy");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("mind");
  const [tagFilter, setTagFilter] = useState<string>("mind");
  const [selected, setSelected] = useState<Recipe | null>(initialRecipe);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [cookDateKey, setCookDateKey] = useState<string>(getCookDateOptions()[0].dateKey);
  const [eatDays, setEatDays] = useState<number>(2);
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>(CLIENT_FALLBACK_RECIPES);
  const [availableCategories, setAvailableCategories] = useState<string[]>(getRecipeCategories());
  const [availableTags, setAvailableTags] = useState<string[]>(getRecipeTags());
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [usedFallbackResults, setUsedFallbackResults] = useState(false);
  const [exactMatchCount, setExactMatchCount] = useState(0);

  const fallbackRecipes = CLIENT_FALLBACK_RECIPES.filter((recipe) =>
    matchesRecipe(
      recipe,
      searchTerm,
      categoryFilter,
      tagFilter,
      timeFilter,
      proteinFilter,
      childFriendlyOnly,
      mealTypeFilter,
      timeBucketFilter,
      quickOnly,
    ),
  );
  const filtered = recipesError ? fallbackRecipes : availableRecipes;
  const visibleRecipes = filtered.slice(0, visibleRecipeCount);
  const cookDateOptions = getCookDateOptions();
  const eatDates = Array.from({ length: eatDays }, (_, i) => addDays(cookDateKey, i));
  const plannedRecipe = selected ? buildPlannedRecipeSnapshot(selected, eatDays) : null;

  const estimatedResultCount = recipesError ? fallbackRecipes.length : Math.max(exactMatchCount, filtered.length);
  const selectedDayLabel = DAY_PLAN_OPTIONS.find((option) => option.value === eatDays)?.label ?? `${eatDays} napra`;
  const selectedTimeLabel = COOKING_TIME_OPTIONS.find((option) => option.value === timeFilter)?.label ?? "Mindegy";
  const selectedStartingPointLabel = STARTING_POINT_OPTIONS.find((option) => option.value === startingPoint)?.label ?? "Mindegy";
  const selectedChildLabel = CHILD_FRIENDLY_OPTIONS.find((option) => option.value === childPreference)?.label ?? "Jó lenne";
  const selectedDirectionLabel = DIRECTION_OPTIONS.find((option) => option.value === directionPreference)?.label ?? "Egyszerű házias";

  function applyStartingPoint(value: StartingPointValue) {
    setStartingPoint(value);
    setVisibleRecipeCount(20);

    if (value === "csirke") {
      setProteinFilter("csirke");
      setSearchTerm("");
      setTagFilter("mind");
      return;
    }

    if (value === "teszta") {
      setProteinFilter("mind");
      setMealTypeFilter("teszta");
      setSearchTerm("tészta");
      setTagFilter("mind");
      return;
    }

    if (value === "rizs") {
      setProteinFilter("mind");
      setSearchTerm("rizs");
      setTagFilter("mind");
      return;
    }

    if (value === "zoldseges") {
      setProteinFilter("vegetáriánus");
      setSearchTerm("");
      setTagFilter("mind");
      return;
    }

    if (value === "kamra") {
      setProteinFilter("mind");
      setMealTypeFilter("mind");
      setSearchTerm("");
      setTagFilter("mind");
      return;
    }

    setProteinFilter("mind");
    setMealTypeFilter("mind");
    setSearchTerm("");
    setTagFilter("mind");
  }

  function applyChildPreference(value: ChildFriendlyPreference) {
    setChildPreference(value);
    setChildFriendlyOnly(value !== "off");
    setVisibleRecipeCount(20);
  }

  function applyDirection(value: DirectionValue) {
    setDirectionPreference(value);
    setVisibleRecipeCount(20);
    setCategoryFilter("mind");
    setMealTypeFilter("mind");

    if (value === "leves") {
      setMealTypeFilter("leves");
      setTagFilter("mind");
      if (startingPoint === "mind") setSearchTerm("");
      return;
    }

    if (value === "fozelek") {
      setMealTypeFilter("fozelek");
      setTagFilter("mind");
      if (startingPoint === "mind") setSearchTerm("");
      return;
    }

    if (value === "desszert") {
      setMealTypeFilter("desszert");
      setTagFilter("mind");
      setProteinFilter("mind");
      if (startingPoint === "mind") setSearchTerm("");
      return;
    }

    if (value === "suto") {
      setTagFilter("sütő");
      if (startingPoint === "mind") setSearchTerm("");
      return;
    }

    if (value === "egyserpenyos") {
      setSearchTerm("serpenyő");
      setTagFilter("mind");
      return;
    }

    if (value === "teszta") {
      setMealTypeFilter("teszta");
      setSearchTerm("tészta");
      setTagFilter("mind");
      return;
    }

    if (value === "hazias") {
      setSearchTerm("");
      setTagFilter("mind");
      return;
    }

    setTagFilter("mind");
    setSearchTerm("");
  }

  function applyQuickPreset(preset: (typeof QUICK_PRESETS)[number]) {
    setEatDays(preset.days);
    setTimeFilter(preset.time);
    setTimeBucketFilter(preset.time <= 20 ? "short" : preset.time <= 50 ? "medium" : "mind");
    setQuickOnly(preset.time <= 30);
    applyChildPreference(preset.child);
    applyStartingPoint(preset.start);
    applyDirection(preset.direction);
  }

  function applyFastStyle(value: FastStyleValue) {
    setFastStyle(value);
    setVisibleRecipeCount(20);

    if (value === "Gyerekbarát") {
      setQuickOnly(false);
      applyChildPreference("important");
      applyStartingPoint("mind");
      applyDirection("hazias");
      return;
    }

    if (value === "Gyors") {
      setTimeFilter(30);
      setTimeBucketFilter("mind");
      setQuickOnly(true);
      applyChildPreference("nice");
      applyStartingPoint("mind");
      applyDirection("hazias");
      return;
    }

    if (value === "Tészta") {
      setQuickOnly(false);
      applyChildPreference("nice");
      applyStartingPoint("teszta");
      applyDirection("teszta");
      return;
    }

    if (value === "Főzelék") {
      setQuickOnly(false);
      applyChildPreference("nice");
      applyStartingPoint("mind");
      applyDirection("fozelek");
      return;
    }

    if (value === "Leves") {
      setQuickOnly(false);
      applyChildPreference("nice");
      applyStartingPoint("mind");
      applyDirection("leves");
      return;
    }

    if (value === "Desszert") {
      setQuickOnly(false);
      applyChildPreference("off");
      applyStartingPoint("mind");
      applyDirection("desszert");
      return;
    }

    setQuickOnly(false);
    applyChildPreference("off");
    applyStartingPoint("mind");
    applyDirection("mind");
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        if (previewRecipe) {
          setPreviewRecipe(null);
          return;
        }
        onClose();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSubmitting, onClose, previewRecipe]);

  async function handleConfirm() {
    if (!selected || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        recipeId: selected.id,
        recipeSnapshot: plannedRecipe ?? selected,
        cookDate: cookDateKey,
        eatDates,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetRecipeFilters() {
    setSelected(null);
    setPreviewRecipe(null);
    setVisibleRecipeCount(20);
  }

  useEffect(() => {
    if (step !== 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoadingRecipes(true);
      setRecipesError(null);

      const params = new URLSearchParams({
        protein: proteinFilter,
        maxDuration: String(timeFilter),
        search: searchTerm,
        category: categoryFilter,
        tag: tagFilter,
        mealType: mealTypeFilter,
        timeBucket: timeBucketFilter,
        quickOnly: String(quickOnly),
        childFriendly: String(childFriendlyOnly),
      });

      try {
        const response = await fetch(`/api/recipes/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Recipe fetch failed.");
        }

        const payload = await response.json() as {
          recipes?: Recipe[];
          categories?: string[];
          tags?: string[];
          exactMatchCount?: number;
          usedFallback?: boolean;
        };

        if (controller.signal.aborted) return;

        setAvailableRecipes(Array.isArray(payload.recipes) ? payload.recipes : []);
        setAvailableCategories(Array.isArray(payload.categories) ? payload.categories : getRecipeCategories());
        setAvailableTags(Array.isArray(payload.tags) ? payload.tags : getRecipeTags());
        setExactMatchCount(typeof payload.exactMatchCount === "number" ? payload.exactMatchCount : 0);
        setUsedFallbackResults(Boolean(payload.usedFallback));
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRecipesError("A külső receptforrás most nem elérhető, a helyi és importált recepteket mutatjuk.");
        setAvailableRecipes(CLIENT_FALLBACK_RECIPES);
        setAvailableCategories(getRecipeCategories());
        setAvailableTags(getRecipeTags());
        setExactMatchCount(fallbackRecipes.length);
        setUsedFallbackResults(false);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingRecipes(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [step, proteinFilter, timeFilter, timeBucketFilter, searchTerm, categoryFilter, tagFilter, mealTypeFilter, quickOnly, childFriendlyOnly]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_38%),rgba(14,18,15,0.42)] p-0 backdrop-blur-md sm:p-3 md:p-6">
      <div className="ff-modal-shell flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-none border-0 sm:h-[min(92vh,860px)] sm:rounded-[36px] sm:border">
        <div className="shrink-0 border-b border-[var(--ff-card-border)] bg-[linear-gradient(180deg,rgba(255,252,244,0.82),rgba(255,247,238,0.42))] px-6 pb-5 pt-6 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ff-text-soft)]">
                Étkezéstervező
              </p>
              <h2 className="text-2xl font-semibold text-[var(--ff-text)] sm:text-[30px]">Mit főzzünk?</h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ff-text-muted)]">Válassz pár dolgot, és mutatjuk az ötleteket.</p>
            </div>
            <button
              onClick={onClose}
              className="ff-icon-button flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(255,252,244,0.92)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {FLOW_STEPS.map((flowStep) => (
              <div
                key={flowStep.id}
                className={`rounded-[24px] border px-3 py-3 transition-all ${
                  flowStep.id === step
                    ? "border-[rgba(55,67,50,0.16)] bg-[linear-gradient(145deg,rgba(221,230,211,0.96),rgba(255,249,237,0.92))] shadow-[var(--ff-shadow-soft)]"
                    : flowStep.id < step
                      ? flowStep.id === 1
                        ? "border-[var(--ff-glass-border)] bg-[linear-gradient(145deg,rgba(238,243,231,0.86),rgba(255,252,244,0.78))]"
                        : "border-[var(--ff-glass-border)] bg-[linear-gradient(145deg,rgba(255,240,227,0.84),rgba(255,252,244,0.78))]"
                      : flowStep.id === 2
                        ? "border-[var(--ff-glass-border)] bg-[linear-gradient(145deg,rgba(255,249,237,0.72),rgba(255,240,227,0.48))]"
                        : "border-[var(--ff-glass-border)] bg-[linear-gradient(145deg,rgba(255,252,244,0.66),rgba(238,243,231,0.42))]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      flowStep.id === step
                        ? "bg-[var(--ff-primary)] text-[var(--ff-text-inverse)]"
                        : flowStep.id < step
                          ? "bg-[var(--ff-primary-muted)] text-[var(--ff-primary)]"
                          : "bg-[rgba(255,252,244,0.82)] text-[var(--ff-text-soft)]"
                    }`}
                  >
                    {flowStep.id < step ? "✓" : flowStep.id}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">{flowStep.eyebrow}</p>
                    <p className="text-sm font-semibold text-[var(--ff-text)]">{flowStep.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="flex flex-1 overflow-y-auto px-6 py-6">
            <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex min-w-0 flex-col gap-5">
                <section className="ff-glass-card-strong relative overflow-hidden rounded-[34px] bg-[linear-gradient(145deg,rgba(255,250,240,0.96),rgba(255,240,227,0.78))] px-5 py-5 sm:px-6">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(230,168,121,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(124,145,111,0.12),transparent_30%)]" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div className="max-w-2xl">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--ff-text-soft)]">Gyors választás</p>
                        <h3 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--ff-text)]">Mit főzzünk?</h3>
                        <p className="mt-2 text-sm text-[var(--ff-text-muted)]">Válassz pár dolgot, és mutatjuk az ötleteket.</p>
                      </div>
                      <div className="hidden rounded-[24px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,252,244,0.78),rgba(238,243,231,0.62))] p-3 shadow-[var(--ff-shadow-soft)] lg:block">
                        <span className="material-symbols-outlined text-[32px] text-[var(--ff-primary)]">room_service</span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {FAST_STYLE_OPTIONS.map((option) => (
                        <button
                          key={option.label}
                          onClick={() => applyFastStyle(option.label)}
                          className={`group flex min-h-[108px] cursor-pointer flex-col justify-between rounded-[26px] border px-4 py-4 text-left shadow-[0_14px_28px_-24px_rgba(61,49,34,0.26)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_32px_-22px_rgba(61,49,34,0.28)] ${getFastStyleTone(option.tone, fastStyle === option.label)}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                            {fastStyle === option.label && (
                              <span className="rounded-full bg-[rgba(255,255,255,0.72)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                                Aktív
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight">{option.label}</p>
                            <p className="mt-1 text-[11px] leading-snug opacity-80">{option.note}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <FlowSection
                  label="1. lépés"
                  title="Hány napra?"
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {DAY_PLAN_OPTIONS.slice(0, 4).map((option) => (
                      <DecisionCard
                        key={option.label}
                        label={option.label}
                        note={option.note}
                        icon={option.icon}
                        selected={eatDays === option.value}
                        onClick={() => setEatDays(option.value)}
                      />
                    ))}
                  </div>
                </FlowSection>

                <FlowSection
                  label="2. lépés"
                  title="Mennyi idő van?"
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {COOKING_TIME_OPTIONS.map((option) => (
                      <DecisionCard
                        key={option.label}
                        label={option.label}
                        note={option.note}
                        icon={option.icon}
                        selected={timeFilter === option.value}
                        onClick={() => {
                          setTimeFilter(option.value);
                          setTimeBucketFilter(option.bucket);
                          setQuickOnly(option.bucket === "short");
                          resetRecipeFilters();
                        }}
                      />
                    ))}
                  </div>
                </FlowSection>

                <FlowSection
                  label="3. lépés"
                  title="Milyen legyen?"
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {FAST_STYLE_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => applyFastStyle(option.label)}
                        className={`group flex min-h-[104px] cursor-pointer flex-col justify-between rounded-[24px] border px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-24px_rgba(61,49,34,0.24)] ${getFastStyleTone(option.tone, fastStyle === option.label)}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                          {fastStyle === option.label && (
                            <span className="rounded-full bg-[rgba(255,255,255,0.72)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                              Kész
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold leading-tight">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </FlowSection>
              </div>

              <aside className="xl:sticky xl:top-0 xl:self-start">
                <div className="ff-glass-card rounded-[32px] bg-[linear-gradient(145deg,rgba(255,251,244,0.92),rgba(246,228,203,0.58),rgba(238,243,231,0.52))] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--ff-text-soft)]">Eddigi beállításaid</p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--ff-text)]">Már majdnem kész</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ff-text-muted)]">
                    Már ennyi alapján is tudok jó ötleteket mutatni.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <SummaryChip>{selectedDayLabel}</SummaryChip>
                    <SummaryChip>{selectedTimeLabel}</SummaryChip>
                    <SummaryChip>{fastStyle}</SummaryChip>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-[rgba(55,67,50,0.12)] bg-[linear-gradient(145deg,rgba(221,230,211,0.74),rgba(255,249,237,0.82))] px-4 py-4 shadow-[0_18px_30px_-24px_rgba(55,67,50,0.28)]">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ff-primary-soft)]">Várható találatok</p>
                    <p className="mt-2 text-[34px] font-semibold leading-none text-[var(--ff-primary-strong)]">{estimatedResultCount || filtered.length || "több"}</p>
                    <p className="mt-1 text-[12px] leading-snug text-[var(--ff-text-muted)]">ötlet várható</p>
                  </div>

                  <div className="mt-5 flex flex-col gap-2.5">
                    <button
                      onClick={() => setStep(2)}
                      className="ff-button-primary group flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-20px_rgba(38,51,38,0.3)] cursor-pointer"
                    >
                      Mutasd az ötleteket
                      <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-0.5">arrow_forward</span>
                    </button>
                    <button
                      onClick={() => {
                        setEatDays(2);
                        setTimeFilter(50);
                        setTimeBucketFilter("medium");
                        setQuickOnly(false);
                        setFastStyle("Mindegy");
                        applyChildPreference("nice");
                        applyStartingPoint("mind");
                        applyDirection("hazias");
                        setMealTypeFilter("mind");
                        setCategoryFilter("mind");
                        setSearchTerm("");
                        setSelected(null);
                        setPreviewRecipe(null);
                      }}
                      className="ff-button-secondary bg-[rgba(255,249,240,0.82)] px-5 py-3 text-sm font-semibold cursor-pointer"
                    >
                      Újrakezdem
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
            <div className="ff-glass-card-strong rounded-[32px] bg-[linear-gradient(145deg,rgba(255,250,240,0.96),rgba(255,240,227,0.74))] px-5 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--ff-text-soft)]">
                    {filtered.length} receptötlet
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--ff-text)]">Mutatok pár jó ötletet.</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ff-text-muted)]">
                    {selectedDayLabel}, {selectedTimeLabel.toLowerCase()}, {selectedChildLabel.toLowerCase()} vonalra válogatva.
                  </p>
                  {usedFallbackResults && (
                    <p className="mt-2 text-[11px] leading-snug text-[var(--ff-text-muted)]">
                      Kevés pontos találat volt, ezért közeli receptekkel is kibővítettem a listát.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SummaryChip>{selectedStartingPointLabel}</SummaryChip>
                    <SummaryChip>{selectedDirectionLabel}</SummaryChip>
                    {proteinFilter !== "mind" && <SummaryChip>{getProteinLabel(proteinFilter)}</SummaryChip>}
                  </div>
                </div>

                <div className="w-full lg:w-[360px]">
                  <label className="sr-only" htmlFor="recipe-search">Recept keresése</label>
                  <div className="ff-input flex items-center gap-2 rounded-[24px] px-4 py-3">
                    <span className="material-symbols-outlined text-[var(--ff-text-soft)] text-[18px]">search</span>
                    <input
                      id="recipe-search"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setVisibleRecipeCount(20);
                      }}
                      placeholder="Keresés név, hozzávaló vagy hangulat alapján"
                      className="w-full bg-transparent text-sm text-[var(--ff-text)] placeholder:text-[var(--ff-text-soft)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setStep(1);
                    setSelected(null);
                  }}
                  className="ff-button-secondary px-4 py-2 text-[11px] font-semibold cursor-pointer"
                >
                  Másik irányt választok
                </button>
                <button
                  onClick={() => {
                    setCategoryFilter("mind");
                    setTagFilter("mind");
                    setMealTypeFilter("mind");
                    setProteinFilter("mind");
                    setTimeBucketFilter("mind");
                    setTimeFilter(Infinity);
                    setQuickOnly(false);
                    setSearchTerm("");
                    setVisibleRecipeCount(20);
                  }}
                  className="ff-button-secondary px-4 py-2 text-[11px] font-semibold cursor-pointer"
                >
                  Finomhangolás törlése
                </button>
              </div>
            </div>

            <div className="ff-glass-card rounded-[28px] bg-[linear-gradient(145deg,rgba(255,252,244,0.9),rgba(238,243,231,0.58))] px-5 py-4">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ff-text-soft)]">Gyors finomítás</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setProteinFilter("mind");
                        setVisibleRecipeCount(20);
                      }}
                      className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                        proteinFilter === "mind"
                          ? "bg-[var(--ff-primary)] text-[var(--ff-text-inverse)] border-[var(--ff-primary)]"
                          : "bg-[rgba(255,252,244,0.78)] border-[rgba(74,67,54,0.1)] text-[var(--ff-text-muted)]"
                      }`}
                    >
                      Minden hús
                    </button>
                    {PROTEIN_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setProteinFilter(option.value);
                          setVisibleRecipeCount(20);
                        }}
                        className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                          proteinFilter === option.value
                            ? "bg-[var(--ff-primary)] text-[var(--ff-text-inverse)] border-[var(--ff-primary)]"
                            : "bg-[rgba(255,252,244,0.78)] border-[rgba(74,67,54,0.1)] text-[var(--ff-text-muted)]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setMealTypeFilter("mind");
                      setVisibleRecipeCount(20);
                    }}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                      mealTypeFilter === "mind"
                        ? "bg-[var(--ff-caramel-strong)] text-[var(--ff-text-inverse)] border-[var(--ff-caramel-strong)]"
                        : "bg-[rgba(255,249,240,0.8)] border-[rgba(185,130,71,0.14)] text-[var(--ff-text-muted)]"
                    }`}
                  >
                    Minden ételtípus
                  </button>
                  {MEAL_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setMealTypeFilter(option.value);
                        setVisibleRecipeCount(20);
                      }}
                      className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                        mealTypeFilter === option.value
                          ? "bg-[var(--ff-caramel-strong)] text-[var(--ff-text-inverse)] border-[var(--ff-caramel-strong)]"
                          : "bg-[rgba(255,249,240,0.8)] border-[rgba(185,130,71,0.14)] text-[var(--ff-text-muted)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {TIME_BUCKET_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTimeBucketFilter(option.value);
                        setTimeFilter(option.max);
                        setQuickOnly(option.value === "short");
                        setVisibleRecipeCount(20);
                      }}
                      className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                        timeBucketFilter === option.value
                          ? "bg-[var(--ff-primary)] text-[var(--ff-text-inverse)] border-[var(--ff-primary)]"
                          : "bg-[rgba(255,252,244,0.78)] border-[rgba(74,67,54,0.1)] text-[var(--ff-text-muted)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setQuickOnly((value) => !value);
                      setVisibleRecipeCount(20);
                    }}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                      quickOnly
                        ? "bg-[var(--ff-caramel-strong)] text-[var(--ff-text-inverse)] border-[var(--ff-caramel-strong)]"
                        : "bg-[rgba(255,249,240,0.8)] border-[rgba(185,130,71,0.14)] text-[var(--ff-text-muted)]"
                    }`}
                  >
                    Gyors kaják
                  </button>
                  <button
                    onClick={() => {
                      setChildFriendlyOnly((value) => !value);
                      setChildPreference((value) => (value === "off" ? "important" : "off"));
                      setVisibleRecipeCount(20);
                    }}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                      childFriendlyOnly
                        ? "bg-[var(--ff-caramel-strong)] text-[var(--ff-text-inverse)] border-[var(--ff-caramel-strong)]"
                        : "bg-[rgba(255,249,240,0.8)] border-[rgba(185,130,71,0.14)] text-[var(--ff-text-muted)]"
                    }`}
                  >
                    Gyerekbarát
                  </button>
                </div>

                <p className="text-xs leading-relaxed text-[var(--ff-text-muted)]">
                  Gyerekbarát étel: kisgyerekeknek is könnyen ehető, biztonságosan tálalható, enyhébb ízvilágú étel, amely jól beilleszthető a családi étkezésbe.
                </p>
              </div>
            </div>

            {recipesError && (
              <div className="rounded-2xl border border-secondary-fixed-dim/40 bg-secondary-fixed/25 px-4 py-3 text-sm text-on-surface-variant">
                {recipesError}
              </div>
            )}

            {isLoadingRecipes ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="h-[156px] rounded-3xl bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-14 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-outline mb-2 block">search_off</span>
                <p className="text-sm">Nincs recept ezekkel a szűrőkkel.</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("mind");
                    setTagFilter("mind");
                    setMealTypeFilter("mind");
                    setProteinFilter("mind");
                    setTimeBucketFilter("mind");
                    setTimeFilter(Infinity);
                    setQuickOnly(false);
                    setChildFriendlyOnly(false);
                  }}
                  className="mt-3 text-primary text-sm font-semibold cursor-pointer"
                >
                  Szűrők törlése
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {visibleRecipes.map((recipe) => {
                  const isSelected = selected?.id === recipe.id;
                  const pantryMatch = rankRecipesForPantry([recipe], pantryItems)[0];
                  const missingCount = pantryMatch?.missingIngredients.length ?? recipe.ingredients.length;
                  const primaryReason = getPrimaryReason(recipe, pantryItems);
                  const secondaryReason = getSecondaryReason(recipe, pantryItems);
                  const displayTags = getDisplayTags(recipe);
                  return (
                    <article
                      key={recipe.id}
                      className={`group overflow-hidden rounded-[30px] border transition-all duration-300 ${
                        isSelected
                          ? "border-primary/35 bg-[linear-gradient(180deg,rgba(255,248,238,0.98),rgba(250,244,238,0.98))] shadow-[0_24px_50px_-28px_rgba(120,72,18,0.45)]"
                          : "border-surface-variant/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,246,242,0.96))] shadow-[0_18px_40px_-30px_rgba(34,27,19,0.38)] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_28px_50px_-28px_rgba(120,72,18,0.35)]"
                      }`}
                    >
                      <button
                        onClick={() => setPreviewRecipe(recipe)}
                        className="relative block h-[228px] w-full overflow-hidden"
                        aria-label={`${recipe.name} részletei`}
                      >
                        <RecipeImage
                          recipe={recipe}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,12,9,0.04),rgba(16,12,9,0.1)_40%,rgba(16,12,9,0.62)_100%)]" />
                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-bold text-on-surface shadow-sm">
                            {recipe.duration} perc
                          </span>
                          <span className="rounded-full bg-white/82 px-3 py-1.5 text-[11px] font-semibold text-on-surface shadow-sm">
                            {missingCount === 0 ? "Minden megvan" : `${missingCount} hiányzik`}
                          </span>
                          {recipe.sourceName && (
                            <span className="rounded-full bg-[rgba(255,249,237,0.9)] px-3 py-1.5 text-[11px] font-semibold text-[var(--ff-caramel-strong)] shadow-sm">
                              {recipe.sourceName}
                            </span>
                          )}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                          <div className="max-w-[90%] rounded-[24px] bg-white/18 p-4 text-left backdrop-blur-md">
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/72">
                              Miért jó most
                            </p>
                            <p className="mt-2 text-lg font-semibold leading-tight text-white">
                              {primaryReason}
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
                        <div className="space-y-2">
                          <button
                            onClick={() => setPreviewRecipe(recipe)}
                            className={`text-left text-xl font-semibold leading-tight transition-colors hover:text-primary ${isSelected ? "text-primary" : "text-on-surface"}`}
                          >
                            {recipe.name}
                          </button>
                          <p className="text-sm leading-relaxed text-on-surface-variant line-clamp-2">
                            {recipe.description}
                          </p>
                        </div>

                        <div className="rounded-[24px] border border-primary/10 bg-primary/[0.04] px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">
                            Miért ajánlott
                          </p>
                          <p className="mt-1 text-sm font-semibold text-on-surface">
                            {primaryReason}
                          </p>
                          <p className="mt-1 text-sm text-on-surface-variant">
                            {secondaryReason}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {displayTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[rgba(135,102,64,0.08)] px-3 py-1.5 text-[11px] font-semibold text-on-surface"
                            >
                              {tag}
                            </span>
                          ))}
                          <span className="rounded-full bg-surface-container-high px-3 py-1.5 text-[11px] font-medium text-on-surface-variant">
                            {missingCount === 0 ? "Nem hiányzik semmi" : `${missingCount} hiányzó hozzávaló`}
                          </span>
                          {recipe.difficulty && (
                            <span className="rounded-full bg-surface-container-high px-3 py-1.5 text-[11px] font-medium text-on-surface-variant">
                              {recipe.difficulty}
                            </span>
                          )}
                        </div>

                        <div className="mt-auto flex flex-wrap gap-2">
                          <button
                            onClick={() => setPreviewRecipe(recipe)}
                            className="rounded-full border border-surface-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
                          >
                            Megnézem
                          </button>
                          <button
                            onClick={() => setSelected(recipe)}
                            className={`rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-primary/10 text-primary hover:bg-primary/15"
                            }`}
                          >
                            {isSelected ? "Kiválasztva" : "Ezt főzném"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {visibleRecipes.length < filtered.length && (
                  <button
                    onClick={() => setVisibleRecipeCount((count) => count + 20)}
                    className="xl:col-span-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                  >
                    További receptek mutatása ({filtered.length - visibleRecipes.length} maradt)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && selected && (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
            <div className={`flex items-center gap-4 rounded-[30px] border border-white/70 bg-gradient-to-br ${PROTEIN_GRADIENTS[selected.protein]} p-4 shadow-[0_22px_42px_-30px_rgba(34,27,19,0.38)]`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/76">
                <span className={`material-symbols-outlined text-[22px] ${PROTEIN_ICON_COLORS[selected.protein]}`}>
                  {PROTEIN_ICONS[selected.protein]}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/65">Kiválasztott recept</p>
                <p className="mt-1 font-semibold text-on-surface text-base">{selected.name}</p>
                <p className="text-[11px] text-outline mt-1">
                  {selected.duration} perc · {(plannedRecipe?.ingredients.length ?? selected.ingredients.length)} hozzávaló · {selected.instructions.length} lépés
                </p>
              </div>
            </div>

            <FlowSection
              label="Időzítés"
              title="Mikor főzöd?"
              description="Válaszd ki a főzés napját, és a terv rögtön ehhez igazodik."
            >
              <div className="flex flex-wrap gap-2">
                {cookDateOptions.slice(0, 5).map((opt) => (
                  <button
                    key={opt.dateKey}
                    onClick={() => setCookDateKey(opt.dateKey)}
                    className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
                      cookDateKey === opt.dateKey
                        ? "border-primary bg-primary text-white shadow-[0_16px_28px_-22px_rgba(51,69,55,0.8)]"
                        : "border-surface-variant/40 bg-white/78 text-on-surface-variant hover:bg-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FlowSection>

            <FlowSection
              label="Adagolás"
              title="Hány napra szóljon?"
              description="Egyszerű döntés: válaszd ki, hány napra tervezzük be ezt az ételt."
            >
              <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4, 7].map((days) => (
                  <button
                    key={days}
                    onClick={() => setEatDays(days)}
                    className={`cursor-pointer rounded-[26px] border px-3 py-4 text-center transition-all ${
                      eatDays === days
                        ? "border-primary/15 bg-[linear-gradient(180deg,rgba(74,93,78,0.96),rgba(57,75,61,0.98))] text-white shadow-[0_22px_36px_-24px_rgba(51,69,55,0.75)]"
                        : "border-surface-variant/40 bg-white/78 text-on-surface-variant hover:bg-white"
                    }`}
                  >
                      <span className="block text-2xl font-bold">{days}</span>
                    <span className={`mt-1 block text-[11px] ${eatDays === days ? "text-white/78" : ""}`}>napra</span>
                  </button>
                ))}
              </div>
            </FlowSection>

            <div className="rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,246,242,0.94))] p-5 shadow-[0_18px_40px_-34px_rgba(34,27,19,0.35)]">
              <div className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-outline">Heti terv összefoglaló</p>
                <h3 className="mt-2 text-lg font-semibold text-on-surface">Így kerül be a heti ritmusba</h3>
              </div>
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[220px_1fr]">
              <div className="rounded-[24px] border border-primary/10 bg-primary/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-1">Főzés napja</p>
                <p className="text-sm font-semibold text-on-surface">{cookDateKey}</p>
              </div>
              <div className="rounded-[24px] border border-secondary/10 bg-secondary/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-1">Ekkor eszitek</p>
                <p className="text-sm text-on-surface-variant">
                  {eatDates.join(", ")}
                </p>
              </div>
              </div>
              <div className="mt-4">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-2">Bevásárlólistára kerül</p>
                <div className="flex flex-wrap gap-1.5">
                  {(plannedRecipe?.ingredients ?? selected.ingredients).map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-full border border-secondary-fixed-dim/35 bg-secondary-fixed/25 px-3 py-1 text-xs font-medium text-on-surface"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-on-surface-variant">
                  {eatDays} napra tervezve, kb. {plannedRecipe?.servings ?? selected.servings ?? 4} adaggal.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="shrink-0 border-t border-white/65 bg-[linear-gradient(180deg,rgba(255,250,240,0.74),rgba(255,252,244,0.46))] px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          {step === 1 && (
            <>
              <button
                onClick={onClose}
                className="ff-button-secondary cursor-pointer px-5 py-2.5 text-sm font-semibold"
              >
                Mégse
              </button>
              <button
                onClick={() => setStep(2)}
                className="ff-button-primary group flex cursor-pointer items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-20px_rgba(38,51,38,0.3)]"
              >
                Mutasd az ötleteket
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-0.5">arrow_forward</span>
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="ff-button-secondary flex cursor-pointer items-center gap-1.5 px-5 py-2.5 text-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Vissza
              </button>
              <div className="flex items-center gap-3">
                {selected && (
                  <p className="hidden text-sm text-on-surface-variant sm:block">
                    Kiválasztva: <span className="font-semibold text-on-surface">{selected.name}</span>
                  </p>
                )}
                <button
                  onClick={() => selected && setStep(3)}
                  disabled={!selected}
                  className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                    selected
                      ? "ff-button-primary group cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-20px_rgba(38,51,38,0.3)]"
                      : "cursor-not-allowed bg-[rgba(94,113,87,0.35)] text-[rgba(255,249,237,0.85)]"
                  }`}
                >
                  Tovább
                  <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-0.5">arrow_forward</span>
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <button
                onClick={() => setStep(2)}
                className="ff-button-secondary flex cursor-pointer items-center gap-1.5 px-5 py-2.5 text-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Vissza
              </button>
              <button
                onClick={() => void handleConfirm()}
                disabled={isSubmitting}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                  isSubmitting
                    ? "cursor-progress bg-[rgba(94,113,87,0.55)] text-[rgba(255,249,237,0.92)]"
                    : "ff-button-primary cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-20px_rgba(38,51,38,0.3)]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                {isSubmitting ? "Mentés..." : "Hozzáadás"}
              </button>
            </>
          )}
        </div>
        </div>
      </div>

      {previewRecipe && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setPreviewRecipe(null)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),rgba(14,18,15,0.34)] backdrop-blur-md" />
          <div className="relative z-10 flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-none border-0 bg-[linear-gradient(180deg,rgba(253,251,248,0.99),rgba(248,244,239,0.98))] shadow-[0_30px_90px_-24px_rgba(27,28,26,0.42)] sm:max-h-[88vh] sm:rounded-[34px] sm:border sm:border-white/70">
            <div className="relative shrink-0 border-b border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0.36))] p-5 backdrop-blur-md">
              <button
                onClick={() => setPreviewRecipe(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-on-surface shadow-sm hover:bg-white"
                aria-label="Előnézet bezárása"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] items-end">
                <div className="relative h-64 overflow-hidden rounded-[28px] border border-white/70">
                  <RecipeImage recipe={previewRecipe} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,12,9,0.05),rgba(16,12,9,0.12)_45%,rgba(16,12,9,0.55)_100%)]" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-bold text-on-surface">
                      {previewRecipe.duration} perc
                    </span>
                    <span className="rounded-full bg-white/82 px-3 py-1 text-[11px] font-semibold text-on-surface">
                      {previewRecipe.category}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="rounded-[22px] bg-white/18 px-4 py-3 backdrop-blur-md">
                      <p className="text-lg font-semibold text-white">{previewRecipe.name}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-outline">Recept részletei</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                      {previewRecipe.duration} perc
                    </span>
                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-bold text-on-surface border border-surface-variant/40">
                      {previewRecipe.category}
                    </span>
                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-bold text-on-surface border border-surface-variant/40">
                      {getProteinLabel(previewRecipe.protein)}
                    </span>
                    {previewRecipe.difficulty && (
                      <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-bold text-on-surface border border-surface-variant/40">
                        {previewRecipe.difficulty}
                      </span>
                    )}
                    {previewRecipe.sourceName && (
                      <span className="rounded-full bg-[rgba(255,249,237,0.94)] px-3 py-1 text-[11px] font-bold text-[var(--ff-caramel-strong)] border border-[rgba(185,130,71,0.16)]">
                        {previewRecipe.sourceName}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface">{previewRecipe.name}</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {previewRecipe.description}
                  </p>
                  {previewRecipe.tags && previewRecipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {previewRecipe.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-secondary-fixed/20 px-2.5 py-1 text-[11px] font-semibold text-on-surface border border-secondary-fixed-dim/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-3">
                  Elkészítés
                </p>
                <ol className="flex flex-col gap-3">
                  {previewRecipe.instructions.map((stepText, index) => (
                    <li key={stepText} className="flex gap-3 rounded-[24px] border border-white/75 bg-white/78 px-4 py-3 shadow-[0_14px_30px_-28px_rgba(34,27,19,0.35)]">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-on-surface">{stepText}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/75 bg-white/78 p-4 shadow-[0_14px_30px_-28px_rgba(34,27,19,0.35)]">
                  <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-3">
                    Hozzávalók
                  </p>
                  {previewRecipe.ingredientGroups && previewRecipe.ingredientGroups.length > 0 ? (
                    <div className="space-y-4">
                      {previewRecipe.ingredientGroups.map((group) => (
                        <div key={group.name}>
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">
                            {group.name}
                          </p>
                          <ul className="space-y-2">
                            {group.items.map((ingredient) => (
                              <li key={`${group.name}-${ingredient}`} className="flex items-center gap-2 text-sm text-on-surface">
                                <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                                {ingredient}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {previewRecipe.ingredients.map((ingredient) => (
                        <li key={ingredient} className="flex items-center gap-2 text-sm text-on-surface">
                          <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-[28px] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,245,238,0.94))] p-4 shadow-[0_14px_30px_-28px_rgba(146,75,45,0.35)]">
                  <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-2">
                    Gyors összefoglaló
                  </p>
                  <div className="space-y-2 text-sm text-on-surface-variant">
                    <p>{previewRecipe.duration} perc alatt elkészíthető.</p>
                    <p>{previewRecipe.ingredients.length} alapanyag kell hozzá.</p>
                    <p>{previewRecipe.instructions.length} lépésből álló, appon belül követhető receptverzió.</p>
                  </div>
                </div>

                {(previewRecipe.familyNotes || previewRecipe.kidFriendlyNotes || previewRecipe.sourceUrl) && (
                  <div className="rounded-[28px] border border-white/75 bg-[linear-gradient(135deg,rgba(255,252,244,0.98),rgba(244,236,222,0.92))] p-4 shadow-[0_14px_30px_-28px_rgba(61,49,34,0.28)]">
                    <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-3">
                      Családi jegyzetek
                    </p>
                    <div className="space-y-3 text-sm text-on-surface-variant">
                      {previewRecipe.familyNotes && <p>{previewRecipe.familyNotes}</p>}
                      {previewRecipe.kidFriendlyNotes && <p>{previewRecipe.kidFriendlyNotes}</p>}
                      {previewRecipe.sourceUrl && previewRecipe.sourceName && (
                        <a
                          href={previewRecipe.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ff-button-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-semibold text-[var(--ff-caramel-strong)]"
                        >
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                          {previewRecipe.openOriginalRecipeLabel ?? `Eredeti ${previewRecipe.sourceName} recept megnyitása`}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(255,255,255,0.4))] p-5 backdrop-blur-md">
              <button
                onClick={() => setPreviewRecipe(null)}
                className="rounded-full border border-surface-variant/45 px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-white/75"
              >
                Bezárás
              </button>
              <button
                onClick={() => {
                  setSelected(previewRecipe);
                  setPreviewRecipe(null);
                }}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_20px_34px_-22px_rgba(51,69,55,0.75)] transition-colors hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-[17px]">check</span>
                Ezt választom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
