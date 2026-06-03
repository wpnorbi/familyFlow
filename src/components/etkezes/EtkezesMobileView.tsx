"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGreetingHeader from "@/components/mobile/MobileGreetingHeader";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { getBatchesForDate } from "@/lib/etkezes-data";
import { getRecipeImageSrc } from "@/lib/recipes/recipe-image";
import {
  getRecipeMealType,
  getRecipeMealTypeLabel,
  getRecipeTimeBucket,
  isKidFriendlyRecipe,
  isQuickRecipe,
} from "@/lib/recipes/recipe-taxonomy";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import type { MealBatch, Recipe, WeekDay } from "@/types/etkezes";

interface NextMealData {
  recipe: Recipe;
  batch: MealBatch;
  nextEatDate: string;
  isCookDay: boolean;
}

interface Props {
  displayName: string;
  nextMealData: NextMealData | null;
  weekDays: WeekDay[];
  batches: MealBatch[];
  shoppingItems: string[];
  pantryItems: string[];
  catalog: Recipe[];
  onAddMeal: () => void;
  onOpenRecipeLibrary: () => void;
  onStartCooking: (recipe: Recipe) => void;
  onViewRecipe: (recipe: Recipe) => void;
  onQuickAdd: (recipe: Recipe) => void;
  onGenerateIdeas: () => void;
  onConfirmQuickSchedule: (recipe: Recipe, startDate: string, days: number) => void;
}

type MobileScreen = "landing" | "chooser" | "schedule" | "ideas";

// ─── Filter system ────────────────────────────────────────────────────────────

type FilterId =
  | "gyerekbarat"
  | "gyors"
  | "kozepes"
  | "lassu"
  | "csirke"
  | "sertes"
  | "marha"
  | "hal"
  | "2napra"
  | "1-3napra"
  | "kedvencek"
  | "kamrabol"
  | "teszta"
  | "leves"
  | "foetel"
  | "fozelek"
  | "vegetarianus"
  | "glutenmentes";

interface FilterDef {
  id: FilterId;
  label: string;
  icon: string;
  bg: string;
  activeBg: string;
  textColor: string;
}

const FILTERS: FilterDef[] = [
  { id: "gyerekbarat", label: "Gyerekbarát", icon: "sentiment_satisfied", bg: "#F5EDE3", activeBg: "#B87040", textColor: "#6A5040" },
  { id: "gyors",       label: "Gyors",        icon: "bolt",                bg: "#E8EEE0", activeBg: "#3B5C33", textColor: "#3A4E34" },
  { id: "kozepes",     label: "Közepes",       icon: "timer",               bg: "#F0EAE0", activeBg: "#B87040", textColor: "#6A5040" },
  { id: "lassu",       label: "Lassú",         icon: "hourglass_bottom",    bg: "#F0EAE0", activeBg: "#B87040", textColor: "#6A5040" },
  { id: "csirke",      label: "Csirke",        icon: "egg_alt",             bg: "#E8EEE0", activeBg: "#3B5C33", textColor: "#3A4E34" },
  { id: "sertes",      label: "Sertés",        icon: "nutrition",           bg: "#F0EAE0", activeBg: "#B87040", textColor: "#6A5040" },
  { id: "marha",       label: "Marha",         icon: "lunch_dining",        bg: "#E8EEE0", activeBg: "#3B5C33", textColor: "#3A4E34" },
  { id: "hal",         label: "Hal",           icon: "set_meal",            bg: "#F0EAE0", activeBg: "#B87040", textColor: "#6A5040" },
  { id: "teszta",      label: "Tészta",        icon: "ramen_dining",        bg: "#F0EAE0", activeBg: "#B87040", textColor: "#6A5040" },
  { id: "leves",       label: "Leves",         icon: "soup_kitchen",        bg: "#E8EEE0", activeBg: "#3B5C33", textColor: "#3A4E34" },
  { id: "foetel",      label: "Főétel",        icon: "restaurant",          bg: "#F0EAE0", activeBg: "#B87040", textColor: "#6A5040" },
  { id: "fozelek",     label: "Főzelék",       icon: "eco",                 bg: "#E8EEE0", activeBg: "#3B5C33", textColor: "#3A4E34" },
  { id: "2napra",      label: "2 napra jó",    icon: "calendar_month",      bg: "#F0EAE0", activeBg: "#B87040", textColor: "#6A5040" },
  { id: "kedvencek",   label: "Kedvencek",     icon: "bookmark",            bg: "#F5EDE3", activeBg: "#B87040", textColor: "#6A5040" },
  { id: "vegetarianus", label: "Vegetáriánus", icon: "eco",                 bg: "#E8EEE0", activeBg: "#3B5C33", textColor: "#3A4E34" },
  { id: "glutenmentes", label: "Gluténmentes", icon: "grass",               bg: "#F5EDE3", activeBg: "#B87040", textColor: "#6A5040" },
];

// Chips shown on the landing screen (ordered as in the screenshot)
const LANDING_CHIPS: Array<{ id: FilterId; label: string; icon: string }> = [
  { id: "gyors",      label: "Gyors",       icon: "bolt" },
  { id: "gyerekbarat",label: "Gyerekbarát", icon: "sentiment_satisfied" },
  { id: "csirke",     label: "Csirke",      icon: "egg_alt" },
  { id: "sertes",     label: "Sertés",      icon: "nutrition" },
  { id: "hal",        label: "Hal",         icon: "set_meal" },
  { id: "teszta",     label: "Tészta",      icon: "ramen_dining" },
  { id: "leves",      label: "Leves",       icon: "soup_kitchen" },
  { id: "foetel",     label: "Főétel",      icon: "restaurant" },
  { id: "fozelek",    label: "Főzelék",     icon: "eco" },
  { id: "1-3napra",   label: "1–3 napra jó",icon: "calendar_month" },
];

const MOBILE_QUICK_FILTERS: FilterId[] = [
  "gyerekbarat",
  "gyors",
  "2napra",
  "csirke",
  "sertes",
  "hal",
  "teszta",
  "leves",
  "foetel",
  "fozelek",
  "vegetarianus",
  "glutenmentes",
];

const PROTEIN_IDS = new Set<FilterId>(["csirke", "sertes", "marha", "hal"]);
const TIME_IDS = new Set<FilterId>(["gyors", "kozepes", "lassu"]);
const MEALTYPE_IDS = new Set<FilterId>(["teszta", "leves", "foetel", "fozelek"]);

function filterRecipes(
  recipes: Recipe[],
  activeFilters: Set<string>,
  bookmarkedIds: string[],
  pantryItems: string[],
): Recipe[] {
  const activeProteins = FILTERS.filter((f) => PROTEIN_IDS.has(f.id) && activeFilters.has(f.id));
  const activeTimes = FILTERS.filter((f) => TIME_IDS.has(f.id) && activeFilters.has(f.id));
  const activeMealTypes = FILTERS.filter((f) => MEALTYPE_IDS.has(f.id) && activeFilters.has(f.id));

  const filtered = recipes.filter((recipe) => {
    const tags = (recipe.tags ?? []).map((tag) => tag.toLowerCase());
    if (activeFilters.has("gyerekbarat") && !isKidFriendlyRecipe(recipe)) return false;
    if (activeFilters.has("vegetarianus") && recipe.protein !== "vegetáriánus") return false;
    if (
      activeFilters.has("glutenmentes") &&
      !tags.some((tag) => tag.includes("gluténmentes") || tag.includes("glutenmentes"))
    ) {
      return false;
    }
    if (activeTimes.length > 0) {
      const bucket = getRecipeTimeBucket(recipe);
      const matchesTime = activeTimes.some((filter) => {
        if (filter.id === "gyors") return bucket === "short";
        if (filter.id === "kozepes") return bucket === "medium";
        return bucket === "long";
      });
      if (!matchesTime) return false;
    }
    if (activeProteins.length > 0) {
      const matchesProtein = activeProteins.some((filter) => {
        if (filter.id === "csirke") return recipe.protein === "csirke";
        if (filter.id === "sertes") return recipe.protein === "sertés";
        if (filter.id === "marha") return recipe.protein === "marha";
        return recipe.protein === "hal";
      });
      if (!matchesProtein) return false;
    }
    if (activeMealTypes.length > 0) {
      const mealType = getRecipeMealType(recipe);
      const matchesMealType = activeMealTypes.some((f) => f.id === mealType);
      if (!matchesMealType) return false;
    }
    if (activeFilters.has("kedvencek") && !bookmarkedIds.includes(recipe.id)) return false;
    if (activeFilters.has("2napra") || activeFilters.has("1-3napra")) {
      const originalTags = recipe.tags ?? [];
      if (!originalTags.includes("2 napra elég") && !(recipe.servings !== undefined && recipe.servings >= 3))
        return false;
    }
    if (activeFilters.has("kamrabol") && pantryItems.length > 0) {
      const result = rankRecipesForPantry([recipe], pantryItems)[0];
      if (!result || result.matchRatio < 0.5) return false;
    }
    return true;
  });

  return filtered.sort((a, b) => {
    const sa =
      (a.source === "user-import" ? 30 : 0) +
      (isKidFriendlyRecipe(a) ? 12 : 0) +
      (isQuickRecipe(a) ? 6 : 0);
    const sb =
      (b.source === "user-import" ? 30 : 0) +
      (isKidFriendlyRecipe(b) ? 12 : 0) +
      (isQuickRecipe(b) ? 6 : 0);
    return sb - sa || a.duration - b.duration || a.name.localeCompare(b.name, "hu");
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MobileSheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-70 flex items-end bg-black/38 backdrop-blur-sm md:hidden">
      <button className="absolute inset-0" onClick={onClose} aria-label="Bezárás" />
      <div className="relative w-full rounded-t-[28px] border-t border-[#E5DDD4] bg-[#F7F3EE] px-5 pb-8 pt-4 shadow-[0_-20px_50px_rgba(0,0,0,0.14)]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#D0C8BC]" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-[#1C1916]">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EDE8DF]"
          >
            <span className="material-symbols-outlined text-[18px] text-[#4A3C32]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DifficultyBars({ difficulty }: { difficulty: "Könnyű" | "Közepes" | "Nehéz" }) {
  const level = difficulty === "Könnyű" ? 1 : difficulty === "Közepes" ? 2 : 3;
  return (
    <span className="flex items-end gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-0.75 rounded-[1px]"
          style={{
            height: `${i * 3 + 3}px`,
            backgroundColor: i <= level ? "#9A8E82" : "#D8D4CE",
          }}
        />
      ))}
    </span>
  );
}

// Horizontal scroll card — "Ajánlott receptek" section
function RecommendationScrollCard({
  recipe,
  bookmarked,
  onView,
  onToggleBookmark,
}: {
  recipe: Recipe;
  bookmarked: boolean;
  onView: () => void;
  onToggleBookmark: () => void;
}) {
  const tag = isKidFriendlyRecipe(recipe)
    ? "Gyerekbarát"
    : isQuickRecipe(recipe)
    ? "Gyors"
    : recipe.protein === "csirke"
    ? "Csirke"
    : recipe.protein === "hal"
    ? "Hal"
    : recipe.protein === "sertés"
    ? "Sertés"
    : getRecipeMealTypeLabel(recipe);

  const diffLabel =
    recipe.difficulty === "Könnyű" ? "Egyszerű" : recipe.difficulty ?? null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onView(); }}
      className="w-39 shrink-0 cursor-pointer overflow-hidden rounded-[20px] bg-white"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.09)" }}
    >
      <div className="relative h-34 w-full overflow-hidden">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
        <span className="absolute left-2 top-2 rounded-full bg-[rgba(28,25,22,0.72)] px-2.5 py-1 text-[11px] font-semibold text-white">
          {tag}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90"
          aria-label={bookmarked ? "Mentés eltávolítása" : "Mentés"}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{
              color: bookmarked ? "#C0784A" : "#9A8E82",
              fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            favorite
          </span>
        </button>
      </div>
      <div className="px-3 pb-3 pt-2.5">
        <h4 className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#1C1916]">{recipe.name}</h4>
        <div className="mt-1.5 flex items-center gap-2.5 text-[11px] text-[#9A8E82]">
          <span className="flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px]">schedule</span>
            {recipe.duration} perc
          </span>
          {recipe.difficulty && diffLabel && (
            <span className="flex items-center gap-1">
              <DifficultyBars difficulty={recipe.difficulty} />
              {diffLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Recipe list card — "Legjobb találatok" design
function RecipeListCard({
  recipe,
  pantryItems,
  onTap,
  onQuickAdd,
}: {
  recipe: Recipe;
  pantryItems: string[];
  bookmarked: boolean;
  onTap: () => void;
  onQuickAdd: () => void;
  onToggleBookmark: () => void;
}) {
  const allIngredients = recipe.ingredientGroups?.length
    ? recipe.ingredientGroups.flatMap((g) => g.items)
    : recipe.ingredients;
  const pantryResult = rankRecipesForPantry([recipe], pantryItems)[0];
  const missing = pantryResult?.missingIngredients ?? allIngredients;
  const atHome = allIngredients.length - missing.length;
  const total = allIngredients.length;
  const isKidFriendly = isKidFriendlyRecipe(recipe);
  const isQuick = isQuickRecipe(recipe);

  const metaTag = isKidFriendly ? "Gyerekbarát" : isQuick ? "Gyors" : null;

  const pantryColor =
    atHome === total
      ? "#4A7A40"
      : missing.length <= 2
        ? "#7A6A50"
        : "#9A8E82";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onTap(); }}
      className="flex w-full cursor-pointer items-center gap-3 rounded-[20px] bg-white px-3 py-3 text-left active:scale-[0.99]"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}
    >
      <div className="relative h-20.5 w-20.5 shrink-0 overflow-hidden rounded-[14px]">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-[15px] font-semibold leading-[1.3] text-[#1C1916]">
          {recipe.name}
        </h4>

        <div className="mt-1.5 flex items-center gap-1 text-[12px] text-[#9A8E82]">
          <span className="material-symbols-outlined text-[13px]">schedule</span>
          <span>{recipe.duration} perc</span>
          {metaTag && (
            <>
              <span className="mx-0.5">•</span>
              <span>{metaTag}</span>
            </>
          )}
        </div>

        {total > 0 && (
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="material-symbols-outlined text-[12px]"
              style={{ color: pantryColor, fontVariationSettings: "'FILL' 1" }}
            >
              circle
            </span>
            <span className="text-[12px] font-medium" style={{ color: pantryColor }}>
              {atHome}/{total} hozzávaló otthon
            </span>
          </div>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onQuickAdd(); }}
        className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-full active:scale-90"
        style={{ backgroundColor: "#EDD8BE" }}
        aria-label="Gyors hozzáadás"
      >
        <span className="material-symbols-outlined text-[22px]" style={{ color: "#8A6040" }}>
          add
        </span>
      </button>
    </div>
  );
}

// 2 oszlopos kártya — "Családi kedvencek" grid
function RecipeGridCard({
  recipe,
  onSelect,
  onToggleBookmark,
  bookmarked,
  selected = false,
}: {
  recipe: Recipe;
  onSelect: () => void;
  onToggleBookmark?: () => void;
  bookmarked?: boolean;
  selected?: boolean;
}) {
  const rating = (4.4 + ((recipe.name.length + recipe.duration) % 5) / 10).toFixed(1);
  const primaryTag = isQuickRecipe(recipe) ? "Gyors" : getRecipeMealTypeLabel(recipe);
  const secondaryTag = isKidFriendlyRecipe(recipe)
    ? "Gyerekbarát"
    : activeDaysTag(recipe);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className={`overflow-hidden rounded-[22px] border bg-white text-left active:scale-[0.98] ${
        selected
          ? "border-[rgba(111,154,99,0.72)] shadow-[0_18px_34px_-24px_rgba(77,110,52,0.34)]"
          : "border-[rgba(170,135,84,0.12)] shadow-[0_1px_8px_rgba(0,0,0,0.07)]"
      }`}
    >
      <div className="relative h-34 w-full overflow-hidden">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
        <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5A4E44] shadow-[0_8px_18px_-12px_rgba(61,49,34,0.2)]">
          {recipe.duration} perc
        </span>
        {selected && (
          <span className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ff-primary)] text-white shadow-[0_14px_20px_-14px_rgba(55,80,45,0.45)]">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check
            </span>
          </span>
        )}
        {onToggleBookmark && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleBookmark();
            }}
            className={`absolute flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)] ${selected ? "right-14 top-3" : "right-2 top-2"}`}
            aria-label={bookmarked ? "Mentés eltávolítása" : "Mentés"}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{
                color: bookmarked ? "#C0784A" : "#9A8E82",
                fontVariationSettings: bookmarked ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              favorite
            </span>
          </button>
        )}
      </div>

      <div className="px-3 pb-3 pt-2.5">
        <h4 className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#1C1916]">
          {recipe.name}
        </h4>
        <p className="mt-1 line-clamp-1 text-[12px] text-[#8C8075]">
          {recipe.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-[rgba(233,240,223,0.92)] px-2.5 py-1 text-[11px] font-medium text-[var(--ff-primary)]">
            {primaryTag}
          </span>
          {secondaryTag && (
            <span className="rounded-full bg-[rgba(255,243,226,0.96)] px-2.5 py-1 text-[11px] font-medium text-[#B87040]">
              {secondaryTag}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3 text-[12px] text-[#7B6F64]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#F0A316]">star</span>
            {rating}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">group</span>
            {recipe.servings ?? 4} adag
          </span>
        </div>
      </div>
    </div>
  );
}

function activeDaysTag(recipe: Recipe) {
  const tags = recipe.tags ?? [];
  if (tags.includes("2 napra elég") || (recipe.servings ?? 0) >= 4) return "2 napra jó";
  return null;
}

function QuickFilterTile({
  filter,
  selected,
  onToggle,
}: {
  filter: FilterDef;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative flex min-h-[120px] flex-col items-center justify-center rounded-[24px] border p-4 text-center transition-all active:scale-[0.98] ${
        selected
          ? "border-[rgba(124,145,111,0.55)] bg-[linear-gradient(180deg,rgba(245,249,237,0.98),rgba(255,252,246,0.96))] shadow-[0_16px_30px_-24px_rgba(55,80,45,0.34)]"
          : "border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,246,0.96)] shadow-[0_12px_22px_-20px_rgba(61,49,34,0.16)]"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ff-primary)] text-white">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check
          </span>
        </span>
      )}
      <span className={`material-symbols-outlined text-[38px] ${selected ? "text-[var(--ff-primary)]" : "text-[#688657]"}`}>
        {filter.icon}
      </span>
      <span className="mt-3 text-[16px] font-medium tracking-[-0.02em] text-[#1C1916]">
        {filter.label}
      </span>
    </button>
  );
}

const FALLBACK_HERO = "/images/recipes/categories/pasta.png";

// ─── Main component ───────────────────────────────────────────────────────────

export default function EtkezesMobileView({
  displayName,
  weekDays,
  batches,
  shoppingItems,
  pantryItems,
  catalog,
  onAddMeal,
  onOpenRecipeLibrary,
  onViewRecipe,
  onQuickAdd,
  onConfirmQuickSchedule,
}: Props) {
  const router = useRouter();
  const [screen, setScreen] = useState<MobileScreen>("landing");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [recipeSort, setRecipeSort] = useState<"recommended" | "time">("recommended");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(weekDays[0]?.dateKey ?? "");
  const [selectedCookDays, setSelectedCookDays] = useState(1);

  const plannedDaysCount = useMemo(
    () => weekDays.filter((d) => getBatchesForDate(batches, d.dateKey).length > 0).length,
    [batches, weekDays],
  );

  const filteredRecipes = useMemo(
    () => filterRecipes(catalog, activeFilters, bookmarkedIds, pantryItems),
    [catalog, activeFilters, bookmarkedIds, pantryItems],
  );

  const landingRecipes = useMemo(
    () => filterRecipes(catalog, new Set(), bookmarkedIds, pantryItems).slice(0, 8),
    [catalog, bookmarkedIds, pantryItems],
  );

  const favoriteRecipes = useMemo(() => {
    const bookmarked = catalog.filter((r) => bookmarkedIds.includes(r.id));
    return bookmarked.length > 0 ? bookmarked.slice(0, 4) : filteredRecipes.slice(0, 2);
  }, [catalog, bookmarkedIds, filteredRecipes]);

  const listRecipes = useMemo(() => {
    const bookmarked = catalog.filter((r) => bookmarkedIds.includes(r.id));
    return bookmarked.length > 0 ? filteredRecipes : filteredRecipes.slice(2);
  }, [catalog, bookmarkedIds, filteredRecipes]);

  const chooserRecipes = useMemo(() => {
    if (recipeSort === "time") {
      return [...filteredRecipes].sort(
        (a, b) => a.duration - b.duration || a.name.localeCompare(b.name, "hu"),
      );
    }

    return filteredRecipes;
  }, [filteredRecipes, recipeSort]);

  const heroImage = catalog[0] ? getRecipeImageSrc(catalog[0]) : FALLBACK_HERO;
  const resultCount = filteredRecipes.length;
  const hasFilters = activeFilters.size > 0;
  const weekProgress = `${Math.max((plannedDaysCount / 7) * 100, plannedDaysCount > 0 ? 14 : 0)}%`;
  const quickPlanDays = weekDays.slice(0, 5);

  useEffect(() => {
    if (selectedRecipe && !chooserRecipes.some((recipe) => recipe.id === selectedRecipe.id)) {
      setSelectedRecipe(null);
    }
  }, [chooserRecipes, selectedRecipe]);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as typeof showToast & { _t?: number })._t);
    (showToast as typeof showToast & { _t?: number })._t = window.setTimeout(
      () => setToast(null), 1800,
    );
  }

  function toggleFilter(id: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openQuickAdd(presets?: string[]) {
    if (presets) {
      setActiveFilters(new Set(presets));
    }
    setSelectedRecipe(null);
    setSelectedCookDays(activeFilters.has("2napra") || (presets?.includes("2napra") ?? false) ? 2 : 1);
    if (!selectedDayKey && weekDays[0]) {
      setSelectedDayKey(weekDays[0].dateKey);
    }
    setScreen("chooser");
  }

  function goToIdeasWithPresets(presets: string[]) {
    openQuickAdd(presets);
  }

  function toggleBookmark(recipe: Recipe) {
    setBookmarkedIds((cur) => {
      const has = cur.includes(recipe.id);
      showToast(has ? "Mentés eltávolítva" : "Recept mentve");
      return has ? cur.filter((id) => id !== recipe.id) : [...cur, recipe.id];
    });
  }

  useEffect(() => {
    if (activeFilters.has("2napra")) {
      setSelectedCookDays((current) => (current < 2 ? 2 : current));
    }
  }, [activeFilters]);

  const activeFilterDefs = FILTERS.filter((f) => activeFilters.has(f.id));
  const chooserFilterDefs = MOBILE_QUICK_FILTERS.map((id) => FILTERS.find((filter) => filter.id === id)).filter(Boolean) as FilterDef[];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F3EE] md:hidden">
      <main
        className="relative flex min-h-screen flex-col px-4 pt-5"
        style={{ paddingBottom: "calc(108px + env(safe-area-inset-bottom, 0px))" }}
      >

        {/* ═══════════════════════════════════════════ LANDING ═══ */}
        {screen === "landing" && (
          <>
            <MobileGreetingHeader
              name={displayName}
              onAvatarClick={() => setIsAccountOpen(true)}
              onNotificationClick={() => setIsNotificationsOpen(true)}
            />

            {/* Page title */}
            <div className="mt-5">
              <h1 className="text-[30px] font-bold tracking-[-0.03em] text-[#1C1916]">Étkezés</h1>
              <p className="mt-1 text-[14px] text-[#9A8E82]">
                Tervezd meg a heti ebédeket gyorsan és egyszerűen.
              </p>
            </div>

            {/* Hero banner */}
            <section
              className="relative mt-5 overflow-hidden rounded-3xl"
              style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.18)" }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
              <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/10 to-black/65" />
              <div className="relative flex flex-col justify-end px-5 pb-5 pt-25">
                <h2 className="text-[26px] font-bold leading-[1.1] tracking-[-0.03em] text-white">
                  Mit főzzünk<br />ezen a héten?
                </h2>
                <div className="mt-4 flex gap-2.5">
                  <button
                    onClick={() => openQuickAdd()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#C88840] py-3 text-[14px] font-semibold text-white shadow-[0_4px_16px_rgba(200,136,64,0.42)]"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        add
                      </span>
                    </span>
                    Gyors étel hozzáadása
                  </button>
                  <button
                    onClick={onOpenRecipeLibrary}
                    className="flex items-center gap-1.5 rounded-full bg-white/92 px-4 py-3 text-[14px] font-semibold text-[#1C1916]"
                  >
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    Recepttár
                  </button>
                </div>
              </div>
            </section>

            {/* Filter chips — 2 rows flex-wrap */}
            <section className="mt-4">
              <div className="flex flex-wrap gap-2">
                {LANDING_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => goToIdeasWithPresets([chip.id])}
                    className="flex items-center gap-1.5 rounded-full border border-[#E0D8CE] bg-white px-3 py-1.5 text-[12px] font-medium text-[#4A3C32] active:bg-[#F0EAE0]"
                  >
                    <span className="material-symbols-outlined text-[14px]">{chip.icon}</span>
                    {chip.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Heti terv */}
            <section
              className="mt-6 overflow-hidden rounded-3xl bg-white px-4 pb-4 pt-4"
              style={{ boxShadow: "0 1px 10px rgba(0,0,0,0.07)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-[#1C1916]">Heti terv</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#9A8E82]">
                    {plannedDaysCount}/7 nap megtervezve
                  </span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E8EEE0]">
                    <div className="h-full rounded-full bg-[#3B5C33]" style={{ width: weekProgress }} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                {weekDays.map((day) => {
                  const dayBatches = getBatchesForDate(batches, day.dateKey);
                  const batch = dayBatches[0];
                  const recipe = batch
                    ? (catalog.find((r) => r.id === batch.recipeId) ?? batch.recipeSnapshot ?? null)
                    : null;
                  return (
                    <div key={day.dateKey} className="flex w-15 shrink-0 flex-col items-center gap-1.5">
                      <span className={`text-[11px] font-semibold ${day.isToday ? "text-[#3B5C33]" : "text-[#9A8E82]"}`}>
                        {day.shortName}
                      </span>
                      {recipe ? (
                        <div className="relative flex flex-col items-center">
                          <div className="relative h-15 w-15 overflow-hidden rounded-[14px]">
                            <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
                          </div>
                          <div className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B5C33] shadow-sm">
                            <span
                              className="material-symbols-outlined text-[12px] text-white"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              check
                            </span>
                          </div>
                          <p className="mt-3 line-clamp-2 text-center text-[10px] font-medium leading-tight text-[#3A3230]">
                            {recipe.name}
                          </p>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => openQuickAdd()}
                            className="flex h-15 w-15 items-center justify-center rounded-[14px] border-2 border-dashed border-[#DDD5CB] active:bg-[#F5EDE3]"
                          >
                            <span className="material-symbols-outlined text-[22px] text-[#C0B8B0]">add</span>
                          </button>
                          <p className="text-[10px] text-[#C0B8B0]">Hozzáadás</p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Tip banner */}
            <button
              onClick={() => goToIdeasWithPresets(["1-3napra"])}
              className="mt-4 flex w-full items-center gap-3 rounded-[18px] bg-[#F5EDE3] px-4 py-3.5 text-left"
            >
              <span
                className="material-symbols-outlined text-[22px] text-[#C08840]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lightbulb
              </span>
              <p className="flex-1 text-[13px] leading-snug text-[#6A5040]">
                Tipp: Ha 3 napra előre tervezel, kevesebb lesz a napi döntés.
              </p>
              <span className="material-symbols-outlined text-[18px] text-[#C08840]">chevron_right</span>
            </button>

            {/* Ajánlott receptek */}
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[18px] font-bold tracking-[-0.02em] text-[#1C1916]">
                  Ajánlott receptek
                </h3>
                <button
                  onClick={() => openQuickAdd([])}
                  className="flex items-center gap-0.5 text-[13px] font-semibold text-[#3B5C33]"
                >
                  Összes mutatása
                  <span className="material-symbols-outlined text-[17px]">chevron_right</span>
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                {landingRecipes.length > 0 ? (
                  landingRecipes.map((recipe) => (
                    <RecommendationScrollCard
                      key={recipe.id}
                      recipe={recipe}
                      bookmarked={bookmarkedIds.includes(recipe.id)}
                      onView={() => onViewRecipe(recipe)}
                      onToggleBookmark={() => toggleBookmark(recipe)}
                    />
                  ))
                ) : (
                  <p className="text-[14px] text-[#9A8E82]">Receptek betöltése…</p>
                )}
              </div>
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════ CHOOSER ═══ */}
        {screen === "chooser" && (
          <>
            <header className="flex items-center justify-between gap-3 pb-4">
              <button
                onClick={() => setScreen("landing")}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_12px_24px_-18px_rgba(61,49,34,0.24)]"
              >
                <span className="material-symbols-outlined text-[20px] text-[#4A3C32]">arrow_back</span>
              </button>
              <div className="text-center">
                <p className="text-[18px] font-semibold tracking-[-0.03em] text-[#1C1916]">
                  Gyors hozzáadás
                </p>
                <p className="text-[13px] text-[#9A8E82]">Válassz szűrőket, mi adunk ötleteket</p>
              </div>
              <button
                onClick={() => router.push("/kamra")}
                className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_12px_24px_-18px_rgba(61,49,34,0.24)]"
                aria-label="Kamra megnyitása"
              >
                <span className="material-symbols-outlined text-[22px] text-[#4A3C32]">shopping_basket</span>
                <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#6D8750] text-[12px] font-semibold text-white">
                  {activeFilterDefs.length}
                </span>
              </button>
            </header>

            <div className="mb-4 mt-2 rounded-[24px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,246,0.96)] p-4 shadow-[0_18px_34px_-28px_rgba(61,49,34,0.22)]">
              <div className="flex gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch]">
                {activeFilterDefs.length > 0 ? (
                  activeFilterDefs.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => toggleFilter(filter.id)}
                      className="flex shrink-0 items-center gap-2 rounded-full bg-[linear-gradient(180deg,rgba(243,247,232,0.96),rgba(235,241,223,0.9))] px-4 py-3 text-[15px] font-medium text-[#33462f]"
                    >
                      <span className="material-symbols-outlined text-[20px]">{filter.icon}</span>
                      {filter.label}
                      <span className="material-symbols-outlined text-[18px] text-[#7A6E64]">close</span>
                    </button>
                  ))
                ) : (
                  <p className="px-1 py-2 text-[14px] text-[#9A8E82]">Válassz pár szűrőt a gyors ötletekhez.</p>
                )}
              </div>
            </div>

            <section className="grid grid-cols-2 gap-3">
              {chooserFilterDefs.map((filter) => (
                <QuickFilterTile
                  key={filter.id}
                  filter={filter}
                  selected={activeFilters.has(filter.id)}
                  onToggle={() => toggleFilter(filter.id)}
                />
              ))}
            </section>

            <section id="mobile-idea-results" className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-[rgba(225,235,210,0.92)] px-3 text-[15px] font-semibold text-[var(--ff-primary)]">
                    {resultCount}
                  </span>
                  <span className="text-[15px] font-medium text-[#3A3230]">ötlet található</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRecipeSort((current) => (current === "recommended" ? "time" : "recommended"))}
                  className="flex items-center gap-2 rounded-full border border-[rgba(170,135,84,0.14)] bg-white px-4 py-2.5 text-[15px] font-medium text-[#3A3230]"
                >
                  <span className="material-symbols-outlined text-[18px]">swap_vert</span>
                  Rendezés
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </button>
              </div>

              {chooserRecipes.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {chooserRecipes.map((recipe) => (
                    <RecipeGridCard
                      key={recipe.id}
                      recipe={recipe}
                      onSelect={() => setSelectedRecipe(recipe)}
                      bookmarked={bookmarkedIds.includes(recipe.id)}
                      onToggleBookmark={() => toggleBookmark(recipe)}
                      selected={selectedRecipe?.id === recipe.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] bg-white px-5 py-10 text-center shadow-[0_12px_22px_-18px_rgba(61,49,34,0.14)]">
                  <span className="material-symbols-outlined text-[42px] text-[#C8C0B8]">search_off</span>
                  <p className="mt-3 text-[15px] font-semibold text-[#1C1916]">Nincs pontos találat.</p>
                  <p className="mt-1 text-[13px] text-[#9A8E82]">Próbálj kevesebb szűrőt.</p>
                  <button
                    onClick={() => setActiveFilters(new Set())}
                    className="mt-4 rounded-full bg-[#3B5C33] px-5 py-2.5 text-[13px] font-bold text-white"
                  >
                    Szűrők törlése
                  </button>
                </div>
              )}
            </section>

          </>
        )}

        {screen === "schedule" && selectedRecipe && (
          <>
            <header className="mb-5 flex items-center gap-3">
              <button
                onClick={() => setScreen("chooser")}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_12px_24px_-18px_rgba(61,49,34,0.24)]"
              >
                <span className="material-symbols-outlined text-[22px] text-[#3A3230]">arrow_back</span>
              </button>
              <div className="flex-1">
                <div className="mx-auto flex max-w-[260px] items-center justify-between text-center">
                  {[
                    { label: "Recept\nkiválasztása", done: true, active: false },
                    { label: "Részletek", done: true, active: false },
                    { label: "Ütemezés", done: false, active: true },
                  ].map((step, index) => (
                    <div key={step.label} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-[18px] font-semibold ${
                            step.active
                              ? "bg-[#F59B23] text-white"
                              : "bg-[#6D8750] text-white"
                          }`}
                        >
                          {step.done ? (
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              check
                            </span>
                          ) : (
                            index + 1
                          )}
                        </span>
                        <span className={`mt-2 whitespace-pre-line text-[12px] leading-4 ${step.active ? "text-[#F59B23]" : "text-[#3A3230]"}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < 2 && <div className="mx-3 h-[2px] w-10 bg-[#D9E0D1]" />}
                    </div>
                  ))}
                </div>
              </div>
            </header>

            <section className="rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-white p-4 shadow-[0_16px_30px_-24px_rgba(61,49,34,0.18)]">
              <div className="flex items-center gap-4">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-[20px]">
                  <RecipeImage recipe={selectedRecipe} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-[#1C1916]">
                    {selectedRecipe.name}
                  </h3>
                  <div className="mt-3 flex items-center gap-3 text-[14px] text-[#6F655B]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      {selectedRecipe.duration} perc
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">group</span>
                      {selectedRecipe.servings ?? 4} adag
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-7">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6D8750] text-[18px] font-semibold text-white">1</span>
                <h3 className="text-[18px] font-semibold text-[#1C1916]">Melyik napra?</h3>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {quickPlanDays.map((day) => (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDayKey(day.dateKey)}
                    className={`rounded-[20px] border p-3 text-center ${
                      selectedDayKey === day.dateKey
                        ? "border-[rgba(111,154,99,0.72)] bg-[linear-gradient(180deg,rgba(245,249,237,0.98),rgba(255,252,246,0.96))]"
                        : "border-[rgba(170,135,84,0.12)] bg-white"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[24px] ${selectedDayKey === day.dateKey ? "text-[#6D8750]" : "text-[#7F776F]"}`}>calendar_today</span>
                    <div className="mt-3 text-[16px] font-medium text-[#1C1916]">{day.isToday ? "Ma" : day.name}</div>
                    <div className="mt-1 text-[12px] text-[#7F776F]">
                      {new Date(day.date).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-7">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6D8750] text-[18px] font-semibold text-white">2</span>
                <h3 className="text-[18px] font-semibold text-[#1C1916]">Hány napra főzöd?</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setSelectedCookDays(days)}
                    className={`rounded-[22px] border p-5 text-center ${
                      selectedCookDays === days
                        ? "border-[rgba(111,154,99,0.72)] bg-[linear-gradient(180deg,rgba(245,249,237,0.98),rgba(255,252,246,0.96))]"
                        : "border-[rgba(170,135,84,0.12)] bg-white"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[36px] ${selectedCookDays === days ? "text-[#6D8750]" : "text-[#707070]"}`}>soup_kitchen</span>
                    <div className="mt-3 text-[16px] font-medium text-[#1C1916]">{days} napra</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-7 rounded-[26px] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(61,49,34,0.16)]">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(245,248,235,0.96)] text-[#F0A316]">
                  <span className="material-symbols-outlined text-[32px]">celebration</span>
                </span>
                <div className="flex-1">
                  <div className="text-[18px] font-semibold text-[#1C1916]">
                    Ezen a héten <span className="text-[#6D8750]">{plannedDaysCount}/7 nap</span>
                    <br />
                    már megtervezve
                  </div>
                  <div className="mt-4 h-2.5 rounded-full bg-[#ECE7DE]">
                    <div className="h-2.5 rounded-full bg-[#6D8750]" style={{ width: weekProgress }} />
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-[24px] border border-[rgba(247,179,70,0.26)] bg-[rgba(255,250,242,0.96)] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(247,179,70,0.36)] text-[#F59B23]">
                  <span className="material-symbols-outlined text-[22px]">info</span>
                </span>
                <p className="text-[15px] leading-6 text-[#594E44]">
                  A hiányzó hozzávalók automatikusan a bevásárlólistára kerülnek.
                </p>
              </div>
            </section>
          </>
        )}

        {/* ════════════════════════════════════════════ IDEAS ═══ */}
        {screen === "ideas" && (
          <>
            <header className="mb-4 flex items-center gap-3">
              <button
                onClick={() => setScreen(hasFilters ? "chooser" : "landing")}
                className="flex h-10 w-10 shrink-0 items-center justify-center"
              >
                <span className="material-symbols-outlined text-[22px] text-[#3A3230]">arrow_back</span>
              </button>
              <div className="flex-1 text-center">
                <p className="text-[17px] font-bold tracking-[-0.02em] text-[#1C1916]">Ötletek</p>
                <p className="text-[12px] text-[#9A8E82]">{resultCount} találat</p>
              </div>
              <div className="h-10 w-10 shrink-0" />
            </header>

            {activeFilterDefs.length > 0 && (
              <div className="mb-5 flex gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
                {activeFilterDefs.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleFilter(f.id)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-white"
                    style={{ backgroundColor: "#3B5C33" }}
                  >
                    {f.label}
                    <span className="material-symbols-outlined text-[13px] opacity-80">close</span>
                  </button>
                ))}
              </div>
            )}

            {favoriteRecipes.length > 0 && (
              <section className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[16px] font-bold text-[#1C1916]">Családi kedvencek</h3>
                  <button className="flex items-center gap-0.5 text-[13px] font-semibold text-[#3B5C33]">
                    Összes
                    <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {favoriteRecipes.slice(0, 2).map((recipe) => (
                    <RecipeGridCard
                      key={recipe.id}
                      recipe={recipe}
                      onSelect={() => onViewRecipe(recipe)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-3 text-[16px] font-bold text-[#1C1916]">Legjobb találatok</h3>
              {listRecipes.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {listRecipes.map((recipe) => (
                    <RecipeListCard
                      key={recipe.id}
                      recipe={recipe}
                      pantryItems={pantryItems}
                      bookmarked={bookmarkedIds.includes(recipe.id)}
                      onTap={() => onViewRecipe(recipe)}
                      onQuickAdd={() => onQuickAdd(recipe)}
                      onToggleBookmark={() => toggleBookmark(recipe)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[20px] bg-white px-5 py-10 text-center shadow-sm">
                  <span className="material-symbols-outlined text-[42px] text-[#C8C0B8]">
                    search_off
                  </span>
                  <p className="mt-3 text-[15px] font-semibold text-[#1C1916]">
                    Nincs pontos találat.
                  </p>
                  <p className="mt-1 text-[13px] text-[#9A8E82]">
                    Próbálj kevesebb szűrőt.
                  </p>
                  <button
                    onClick={() => setActiveFilters(new Set())}
                    className="mt-4 rounded-full bg-[#3B5C33] px-5 py-2.5 text-[13px] font-bold text-white"
                  >
                    Szűrők törlése
                  </button>
                </div>
              )}
            </section>

            <div className="mt-4">
              <button
                onClick={onAddMeal}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D8CFC4] bg-white py-3.5 text-[14px] font-semibold text-[#3A3230]"
              >
                <span className="material-symbols-outlined text-[17px]">tune</span>
                Részletesebb keresés
              </button>
            </div>
          </>
        )}
      </main>

      {/* ── Sheets ────────────────────────────────────────────────── */}
      {isAccountOpen && (
        <MobileSheet title="Profil és fiók" onClose={() => setIsAccountOpen(false)}>
          <button
            onClick={() => { setIsAccountOpen(false); router.push("/beallitasok"); }}
            className="flex w-full items-center justify-between rounded-[18px] bg-[#EDE8DF] px-4 py-4"
          >
            <span>
              <span className="block text-[15px] font-semibold text-[#1C1916]">Fiók megnyitása</span>
              <span className="mt-1 block text-[13px] text-[#7A6E64]">Profil és beállítások</span>
            </span>
            <span className="material-symbols-outlined text-[20px] text-[#9A8E82]">chevron_right</span>
          </button>
        </MobileSheet>
      )}

      {isNotificationsOpen && (
        <MobileSheet title="Értesítések" onClose={() => setIsNotificationsOpen(false)}>
          <div className="space-y-2.5">
            {[
              "A heti terv készen áll az esti vacsorához.",
              "3 bevásárlólista tétel vár még rád.",
              "Új gyerekbarát recept érkezett.",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#EDE8DF] px-4 py-3.5 text-[14px] text-[#3A3230]">
                {item}
              </div>
            ))}
          </div>
        </MobileSheet>
      )}

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-4 bottom-24 z-75 flex justify-center md:hidden">
          <div className="rounded-full bg-[rgba(28,25,22,0.92)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}

      {(screen === "chooser" && hasFilters) || (screen === "schedule" && selectedRecipe) ? (
        <div
          className="fixed inset-x-4 z-70 md:hidden"
          style={{ bottom: "calc(92px + env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            type="button"
            onClick={() => {
              if (screen === "chooser" && selectedRecipe) {
                setScreen("schedule");
                return;
              }

              if (screen === "schedule" && selectedRecipe && selectedDayKey) {
                onConfirmQuickSchedule(selectedRecipe, selectedDayKey, selectedCookDays);
                return;
              }

              document.getElementById("mobile-idea-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-[linear-gradient(135deg,#ffb024_0%,#ff9800_100%)] py-4 text-[17px] font-semibold text-white shadow-[0_14px_26px_-18px_rgba(255,152,0,0.7)]"
          >
            {screen === "schedule"
              ? "Hozzáadás"
              : selectedRecipe
                ? "Tovább"
                : resultCount > 0
                  ? `${resultCount} ötlet megtekintése`
                  : "Mutasd az ötleteket"}
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      ) : null}

      <MobileBottomNav />
    </div>
  );
}
