"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGreetingHeader from "@/components/mobile/MobileGreetingHeader";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { getBatchesForDate } from "@/lib/etkezes-data";
import { getRecipeImageSrc } from "@/lib/recipes/recipe-image";
import {
  getRecipeMealType,
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
}

type MobileScreen = "landing" | "chooser" | "ideas";

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
  | "kedvencek"
  | "kamrabol";

interface FilterDef {
  id: FilterId;
  label: string;
  icon: string;
  bg: string;         // inactive bg
  activeBg: string;   // active bg (gradient or solid)
  textColor: string;  // inactive text
}

const FILTERS: FilterDef[] = [
  {
    id: "gyerekbarat",
    label: "Gyerekbarát",
    icon: "sentiment_satisfied",
    bg: "#F5EDE3",
    activeBg: "#B87040",
    textColor: "#6A5040",
  },
  {
    id: "gyors",
    label: "Gyors",
    icon: "bolt",
    bg: "#E8EEE0",
    activeBg: "#3B5C33",
    textColor: "#3A4E34",
  },
  {
    id: "kozepes",
    label: "Közepes",
    icon: "timer",
    bg: "#F0EAE0",
    activeBg: "#B87040",
    textColor: "#6A5040",
  },
  {
    id: "lassu",
    label: "Lassú",
    icon: "hourglass_bottom",
    bg: "#F0EAE0",
    activeBg: "#B87040",
    textColor: "#6A5040",
  },
  {
    id: "csirke",
    label: "Csirke",
    icon: "egg_alt",
    bg: "#E8EEE0",
    activeBg: "#3B5C33",
    textColor: "#3A4E34",
  },
  {
    id: "sertes",
    label: "Sertés",
    icon: "nutrition",
    bg: "#F0EAE0",
    activeBg: "#B87040",
    textColor: "#6A5040",
  },
  {
    id: "marha",
    label: "Marha",
    icon: "lunch_dining",
    bg: "#E8EEE0",
    activeBg: "#3B5C33",
    textColor: "#3A4E34",
  },
  {
    id: "hal",
    label: "Hal",
    icon: "set_meal",
    bg: "#F0EAE0",
    activeBg: "#B87040",
    textColor: "#6A5040",
  },
  {
    id: "2napra",
    label: "2 napra jó",
    icon: "calendar_month",
    bg: "#F0EAE0",
    activeBg: "#B87040",
    textColor: "#6A5040",
  },
  {
    id: "kedvencek",
    label: "Kedvencek",
    icon: "bookmark",
    bg: "#F5EDE3",
    activeBg: "#B87040",
    textColor: "#6A5040",
  },
];

const PROTEIN_IDS = new Set<FilterId>(["csirke", "sertes", "marha", "hal"]);
const TIME_IDS = new Set<FilterId>(["gyors", "kozepes", "lassu"]);

function filterRecipes(
  recipes: Recipe[],
  activeFilters: Set<string>,
  bookmarkedIds: string[],
  pantryItems: string[],
): Recipe[] {
  const activeProteins = FILTERS.filter((f) => PROTEIN_IDS.has(f.id) && activeFilters.has(f.id));
  const activeTimes = FILTERS.filter((f) => TIME_IDS.has(f.id) && activeFilters.has(f.id));

  const filtered = recipes.filter((recipe) => {
    if (activeFilters.has("gyerekbarat") && !isKidFriendlyRecipe(recipe)) return false;
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
    if (activeFilters.has("kedvencek") && !bookmarkedIds.includes(recipe.id)) return false;
    if (activeFilters.has("2napra")) {
      const tags = recipe.tags ?? [];
      if (!tags.includes("2 napra elég") && !(recipe.servings !== undefined && recipe.servings >= 4))
        return false;
    }
    if (activeFilters.has("kamrabol") && pantryItems.length > 0) {
      const result = rankRecipesForPantry([recipe], pantryItems)[0];
      if (!result || result.matchRatio < 0.5) return false;
    }
    return true;
  });

  return filtered
    .sort((a, b) => {
      const sa =
        (a.source === "user-import" ? 30 : 0) +
        (isKidFriendlyRecipe(a) ? 12 : 0) +
        (isQuickRecipe(a) ? 6 : 0);
      const sb =
        (b.source === "user-import" ? 30 : 0) +
        (isKidFriendlyRecipe(b) ? 12 : 0) +
        (isQuickRecipe(b) ? 6 : 0);
      return sb - sa || a.duration - b.duration || a.name.localeCompare(b.name, "hu");
    })
    .slice(0, 12);
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
    <div className="fixed inset-0 z-[70] flex items-end bg-black/38 backdrop-blur-sm md:hidden">
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

// Recipe list card — "Legjobb találatok" design, screenshot alapján
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
    <button
      onClick={onTap}
      className="flex w-full items-center gap-3 rounded-[20px] bg-white px-3 py-3 text-left active:scale-[0.99]"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}
    >
      {/* Kép */}
      <div className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-[14px]">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
      </div>

      {/* Tartalom */}
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-[15px] font-semibold leading-[1.3] text-[#1C1916]">
          {recipe.name}
        </h4>

        {/* Meta: idő + tag egy sorban */}
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

        {/* Pantry állapot */}
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

      {/* Gyors hozzáadás "+" gomb — screenshot: halvány karamel kör */}
      <button
        onClick={(e) => { e.stopPropagation(); onQuickAdd(); }}
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full active:scale-90"
        style={{ backgroundColor: "#EDD8BE" }}
        aria-label="Gyors hozzáadás"
      >
        <span className="material-symbols-outlined text-[22px]" style={{ color: "#8A6040" }}>
          add
        </span>
      </button>
    </button>
  );
}

// 2 oszlopos kártya — "Családi kedvencek" grid, screenshot alapján
function RecipeGridCard({
  recipe,
  onTap,
}: {
  recipe: Recipe;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className="overflow-hidden rounded-[18px] bg-white text-left active:scale-[0.98]"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}
    >
      {/* Kép — a kártya felső ~62%-a */}
      <div className="relative h-[136px] w-full overflow-hidden">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
      </div>

      {/* Szöveg */}
      <div className="px-3 pb-3 pt-2.5">
        <h4 className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#1C1916]">
          {recipe.name}
        </h4>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#9A8E82]">
          <span className="material-symbols-outlined text-[12px]">schedule</span>
          <span>{recipe.duration} perc</span>
        </div>
      </div>
    </button>
  );
}

const FALLBACK_HERO = "/images/recipes/categories/pasta.png";

// ─── Main component ───────────────────────────────────────────────────────────

export default function EtkezesMobileView({
  weekDays,
  batches,
  shoppingItems,
  pantryItems,
  catalog,
  onAddMeal,
  onOpenRecipeLibrary,
  onViewRecipe,
  onQuickAdd,
}: Props) {
  const router = useRouter();
  const [screen, setScreen] = useState<MobileScreen>("landing");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const plannedDaysCount = useMemo(
    () => weekDays.filter((d) => getBatchesForDate(batches, d.dateKey).length > 0).length,
    [batches, weekDays],
  );

  const filteredRecipes = useMemo(
    () => filterRecipes(catalog, activeFilters, bookmarkedIds, pantryItems),
    [catalog, activeFilters, bookmarkedIds, pantryItems],
  );

  const landingRecipes = useMemo(
    () => filterRecipes(catalog, new Set(), bookmarkedIds, pantryItems).slice(0, 4),
    [catalog, bookmarkedIds, pantryItems],
  );

  // Ha van bookmark, azokat mutatja. Ha nincs, a szűrt lista első 2 receptje kerül ide,
  // hogy a Családi kedvencek blokk mindig látható legyen.
  const favoriteRecipes = useMemo(() => {
    const bookmarked = catalog.filter((r) => bookmarkedIds.includes(r.id));
    return bookmarked.length > 0 ? bookmarked.slice(0, 4) : filteredRecipes.slice(0, 2);
  }, [catalog, bookmarkedIds, filteredRecipes]);

  // A lista a family favorites után következik (duplikáció elkerülése)
  const listRecipes = useMemo(() => {
    const bookmarked = catalog.filter((r) => bookmarkedIds.includes(r.id));
    return bookmarked.length > 0 ? filteredRecipes : filteredRecipes.slice(2);
  }, [catalog, bookmarkedIds, filteredRecipes]);

  const heroImage = catalog[0] ? getRecipeImageSrc(catalog[0]) : FALLBACK_HERO;
  const resultCount = filteredRecipes.length;
  const hasFilters = activeFilters.size > 0;
  const weekProgress = `${Math.max((plannedDaysCount / 7) * 100, plannedDaysCount > 0 ? 14 : 0)}%`;

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

  function goToIdeasWithPresets(presets: string[]) {
    setActiveFilters(new Set(presets));
    setScreen("ideas");
  }

  function toggleBookmark(recipe: Recipe) {
    setBookmarkedIds((cur) => {
      const has = cur.includes(recipe.id);
      showToast(has ? "Mentés eltávolítva" : "Recept mentve");
      return has ? cur.filter((id) => id !== recipe.id) : [...cur, recipe.id];
    });
  }

  const activeFilterDefs = FILTERS.filter((f) => activeFilters.has(f.id));

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
              name="Norbi"
              onAvatarClick={() => setIsAccountOpen(true)}
              onNotificationClick={() => setIsNotificationsOpen(true)}
            />

            {/* Hero */}
            <section className="relative overflow-hidden rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/22 via-black/18 to-black/72" />
              <div className="relative px-5 pb-5 pt-5">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[rgba(255,248,238,0.88)]">
                  <span className="material-symbols-outlined text-[15px] text-[rgba(244,188,95,0.98)]">
                    wb_twilight
                  </span>
                  Mai vacsora
                </p>
                <h2 className="mt-3 max-w-[10rem] text-[30px] font-bold leading-[1.04] tracking-[-0.04em] text-white">
                  Mit főzzünk ma?
                </h2>
                <p className="mt-1.5 max-w-[12rem] text-[14px] leading-snug text-[rgba(255,244,230,0.9)]">
                  Pár döntés — mutatjuk az ötleteket.
                </p>

                {/* Quick preset chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      { label: "2 napra", presets: ["2napra"],      icon: "calendar_month" },
                    { label: "Gyors", presets: ["gyors"],      icon: "bolt" },
                    { label: "Gyerekbarát", presets: ["gyerekbarat"], icon: "sentiment_satisfied" },
                    { label: "Kamrából",  presets: ["kamrabol"],  icon: "inventory_2" },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => goToIdeasWithPresets(p.presets)}
                      className="flex items-center gap-1.5 rounded-full border border-white/28 bg-[rgba(255,249,237,0.94)] px-3 py-2 text-[12px] font-semibold text-[#3A3230] shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[14px]">{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { setActiveFilters(new Set()); setScreen("chooser"); }}
                  className="mt-4 flex w-full items-center justify-between rounded-full bg-[#B87040] px-5 py-4 shadow-[0_8px_24px_rgba(184,112,64,0.40)]"
                >
                  <span className="flex-1 pl-2 text-center text-[17px] font-semibold text-white">
                    Kaja kiválasztása
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#B87040]">
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </span>
                </button>
              </div>
            </section>

            {/* Info tiles */}
            <section className="mt-4 grid grid-cols-3 gap-3">
              <button
                onClick={() => { setActiveFilters(new Set()); setScreen("chooser"); }}
                className="rounded-[22px] bg-[#E8EEE0] p-3.5 text-left shadow-sm"
              >
                <div className="flex min-h-[100px] flex-col justify-between gap-2">
                  <div>
                    <h3 className="text-[13px] font-semibold text-[#1C1916]">Heti terv</h3>
                    <p className="mt-2 text-[17px] font-bold text-[#3B5C33]">
                      {plannedDaysCount}/7 nap
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full bg-[rgba(0,0,0,0.08)]">
                    <div
                      className="h-full rounded-full bg-[#3B5C33]"
                      style={{ width: weekProgress }}
                    />
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push("/bevasarlas")}
                className="rounded-[22px] bg-[#E8EEE0] p-3.5 text-left shadow-sm"
              >
                <div className="flex min-h-[100px] flex-col justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#C8D8B8] text-[#3B5C33]">
                    <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-[#1C1916]">Bevásárlás</h3>
                    <p className="mt-1 text-[11px] text-[#7A8A70]">
                      {shoppingItems.length > 0 ? `${shoppingItems.length} tétel` : "Üres"}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => goToIdeasWithPresets(["kamrabol"])}
                className="rounded-[22px] bg-[#F0EAE0] p-3.5 text-left shadow-sm"
              >
                <div className="flex min-h-[100px] flex-col justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#E0D0B8] text-[#8A6840]">
                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-[#1C1916]">Kamra</h3>
                    <p className="mt-1 text-[11px] text-[#8A7860]">
                      {pantryItems.length > 0 ? "Főzz ebből" : "Töltsd fel"}
                    </p>
                  </div>
                </div>
              </button>
            </section>

            {/* Mai ötletek */}
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[18px] font-bold tracking-[-0.02em] text-[#1C1916]">
                  Mai ötletek
                </h3>
                <button
                  onClick={() => { setActiveFilters(new Set()); setScreen("ideas"); }}
                  className="flex items-center gap-0.5 text-[13px] font-semibold text-[#3B5C33]"
                >
                  Összes
                  <span className="material-symbols-outlined text-[17px]">chevron_right</span>
                </button>
              </div>

              {/* Recepttár link */}
              <button
                onClick={onOpenRecipeLibrary}
                className="mb-3 flex w-full items-center justify-between rounded-[18px] bg-white px-4 py-3 text-left shadow-sm"
              >
                <span>
                  <span className="block text-[14px] font-semibold text-[#1C1916]">Recepttár</span>
                  <span className="mt-0.5 block text-[11px] text-[#9A8E82]">Keresés az összes receptben</span>
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3B5C33] text-white">
                  <span className="material-symbols-outlined text-[17px]">menu_book</span>
                </span>
              </button>

              <div className="flex flex-col gap-3">
                {landingRecipes.length > 0 ? (
                  landingRecipes.map((recipe) => (
                    <RecipeListCard
                      key={recipe.id}
                      recipe={recipe}
                      pantryItems={pantryItems}
                      bookmarked={bookmarkedIds.includes(recipe.id)}
                      onTap={() => onViewRecipe(recipe)}
                      onQuickAdd={() => onQuickAdd(recipe)}
                      onToggleBookmark={() => toggleBookmark(recipe)}
                    />
                  ))
                ) : (
                  <div className="rounded-[20px] bg-white px-5 py-8 text-center shadow-sm">
                    <p className="text-[14px] text-[#9A8E82]">Receptek betöltése…</p>
                  </div>
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
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px] text-[#4A3C32]">arrow_back</span>
              </button>
              <div className="text-center">
                <p className="text-[17px] font-bold tracking-[-0.02em] text-[#1C1916]">
                  Mit főzzünk?
                </p>
                <p className="text-[12px] text-[#9A8E82]">Több szűrőt is választhatsz</p>
              </div>
              {hasFilters ? (
                <button
                  onClick={() => setActiveFilters(new Set())}
                  className="text-[13px] font-bold text-[#B87040]"
                >
                  Törlés
                </button>
              ) : (
                <div className="w-14" />
              )}
            </header>

            {/* Filter card grid */}
            <section className="grid grid-cols-2 gap-2.5">
              {FILTERS.map((f) => {
                const selected = activeFilters.has(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFilter(f.id)}
                    className="relative min-h-[96px] rounded-[20px] p-4 text-left shadow-sm transition-all active:scale-[0.97]"
                    style={{
                      backgroundColor: selected ? f.activeBg : f.bg,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="material-symbols-outlined text-[22px]"
                        style={{ color: selected ? "rgba(255,255,255,0.92)" : f.textColor }}
                      >
                        {f.icon}
                      </span>
                      {selected && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(255,255,255,0.28)]">
                          <span
                            className="material-symbols-outlined text-[14px] text-white"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check
                          </span>
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-6 text-[14px] font-semibold"
                      style={{ color: selected ? "rgba(255,255,255,0.96)" : f.textColor }}
                    >
                      {f.label}
                    </p>
                  </button>
                );
              })}
            </section>

            {/* Result count */}
            <p className="mt-4 text-center text-[13px] text-[#9A8E82]">
              {catalog.length > 0
                ? resultCount > 0
                  ? `${resultCount} ötletet találtunk`
                  : "Nincs találat — próbálj kevesebb szűrőt"
                : "Receptek betöltése…"}
            </p>

            {/* Sticky CTA */}
            <div className="mt-auto pt-4">
              <button
                onClick={() => setScreen("ideas")}
                disabled={catalog.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#3B5C33] py-4 text-[16px] font-semibold text-white shadow-[0_6px_20px_rgba(59,92,51,0.32)] disabled:opacity-50"
              >
                {resultCount > 0 ? `${resultCount} ötlet megtekintése` : "Mutasd az ötleteket"}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════ IDEAS ═══ */}
        {screen === "ideas" && (
          <>
            {/* Header — screenshot: ← / "Ötletek\nX találat" / üres jobb oldal */}
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
              {/* jobb oldali placeholder a centering miatt */}
              <div className="h-10 w-10 shrink-0" />
            </header>

            {/* Aktív filter chip-ek — sötétzöld pill-ek × gombbal */}
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

            {/* ── Családi kedvencek — 2 oszlopos képgrid ────────── */}
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
                      onTap={() => onViewRecipe(recipe)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Legjobb találatok — vertikális lista ───────────── */}
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
                className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#D8CFC4] bg-white py-3.5 text-[14px] font-semibold text-[#3A3230]"
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
              <div key={item} className="rounded-[16px] bg-[#EDE8DF] px-4 py-3.5 text-[14px] text-[#3A3230]">
                {item}
              </div>
            ))}
          </div>
        </MobileSheet>
      )}

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-4 bottom-[96px] z-[75] flex justify-center md:hidden">
          <div className="rounded-full bg-[rgba(28,25,22,0.92)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
