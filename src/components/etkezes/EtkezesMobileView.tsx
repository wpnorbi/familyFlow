"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGreetingHeader from "@/components/mobile/MobileGreetingHeader";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { getBatchesForDate } from "@/lib/etkezes-data";
import { getRecipeMealType, isKidFriendlyRecipe, isQuickRecipe } from "@/lib/recipes/recipe-taxonomy";
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

type FilterId =
  | "gyerekbarat"
  | "30perc"
  | "teszta"
  | "leves"
  | "fozelek"
  | "egyszeru"
  | "2napra"
  | "kedvencek";

interface FilterOption {
  id: FilterId;
  label: string;
  icon: string;
  gradient: string;
  textColor: string;
  borderColor: string;
  activeGradient: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: "gyerekbarat",
    label: "Gyerekbarát",
    icon: "sentiment_satisfied",
    gradient: "linear-gradient(145deg,rgba(255,240,227,0.96),rgba(248,220,198,0.88))",
    textColor: "var(--ff-caramel-strong)",
    borderColor: "rgba(230,168,121,0.20)",
    activeGradient: "linear-gradient(145deg,rgba(213,120,60,0.96),rgba(185,90,35,0.92))",
  },
  {
    id: "30perc",
    label: "30 perc alatt",
    icon: "timer",
    gradient: "linear-gradient(145deg,rgba(238,243,231,0.96),rgba(221,230,211,0.88))",
    textColor: "var(--ff-primary)",
    borderColor: "rgba(94,113,87,0.18)",
    activeGradient: "linear-gradient(145deg,rgba(67,88,60,0.95),rgba(44,62,38,0.92))",
  },
  {
    id: "teszta",
    label: "Tészta",
    icon: "ramen_dining",
    gradient: "linear-gradient(145deg,rgba(255,240,227,0.96),rgba(255,249,237,0.88))",
    textColor: "var(--ff-caramel-strong)",
    borderColor: "rgba(230,168,121,0.18)",
    activeGradient: "linear-gradient(145deg,rgba(213,120,60,0.96),rgba(185,90,35,0.92))",
  },
  {
    id: "leves",
    label: "Leves",
    icon: "soup_kitchen",
    gradient: "linear-gradient(145deg,rgba(255,249,237,0.96),rgba(246,228,203,0.88))",
    textColor: "var(--ff-caramel-strong)",
    borderColor: "rgba(185,130,71,0.18)",
    activeGradient: "linear-gradient(145deg,rgba(170,110,45,0.96),rgba(140,85,28,0.92))",
  },
  {
    id: "fozelek",
    label: "Főzelék",
    icon: "eco",
    gradient: "linear-gradient(145deg,rgba(238,243,231,0.96),rgba(221,230,211,0.88))",
    textColor: "var(--ff-primary)",
    borderColor: "rgba(94,113,87,0.18)",
    activeGradient: "linear-gradient(145deg,rgba(67,88,60,0.95),rgba(44,62,38,0.92))",
  },
  {
    id: "egyszeru",
    label: "Egyszerű",
    icon: "home",
    gradient: "linear-gradient(145deg,rgba(255,252,244,0.96),rgba(246,235,216,0.88))",
    textColor: "var(--ff-text)",
    borderColor: "rgba(74,67,54,0.12)",
    activeGradient: "linear-gradient(145deg,rgba(61,49,34,0.92),rgba(36,28,18,0.90))",
  },
  {
    id: "2napra",
    label: "2 napra jó",
    icon: "calendar_month",
    gradient: "linear-gradient(145deg,rgba(244,249,239,0.96),rgba(238,243,231,0.88))",
    textColor: "var(--ff-primary)",
    borderColor: "rgba(124,145,111,0.16)",
    activeGradient: "linear-gradient(145deg,rgba(67,88,60,0.95),rgba(44,62,38,0.92))",
  },
  {
    id: "kedvencek",
    label: "Kedvencek",
    icon: "bookmark",
    gradient: "linear-gradient(145deg,rgba(255,240,227,0.96),rgba(255,249,237,0.88))",
    textColor: "var(--ff-caramel-strong)",
    borderColor: "rgba(230,168,121,0.18)",
    activeGradient: "linear-gradient(145deg,rgba(213,120,60,0.96),rgba(185,90,35,0.92))",
  },
];

// Category filters use OR logic among themselves; all others use AND
const CATEGORY_FILTER_IDS = new Set<FilterId>(["teszta", "leves", "fozelek"]);

function filterAndRankRecipes(
  recipes: Recipe[],
  activeFilters: Set<string>,
  bookmarkedIds: string[],
): Recipe[] {
  const activeCategoryFilters = FILTER_OPTIONS.filter(
    (f) => CATEGORY_FILTER_IDS.has(f.id) && activeFilters.has(f.id),
  );

  const filtered = recipes.filter((recipe) => {
    if (activeFilters.has("gyerekbarat") && !isKidFriendlyRecipe(recipe)) return false;
    if (activeFilters.has("30perc") && recipe.duration > 30) return false;
    if (activeFilters.has("egyszeru") && !isQuickRecipe(recipe)) return false;
    if (activeFilters.has("kedvencek") && !bookmarkedIds.includes(recipe.id)) return false;
    if (activeFilters.has("2napra")) {
      const tags = recipe.tags ?? [];
      const qualifies =
        tags.includes("2 napra elég") ||
        (recipe.servings !== undefined && recipe.servings >= 4);
      if (!qualifies) return false;
    }
    if (activeCategoryFilters.length > 0) {
      const type = getRecipeMealType(recipe);
      const matchesAnyCategory = activeCategoryFilters.some((f) => {
        if (f.id === "teszta") return type === "teszta";
        if (f.id === "leves") return type === "leves";
        if (f.id === "fozelek") return type === "fozelek";
        return false;
      });
      if (!matchesAnyCategory) return false;
    }
    return true;
  });

  return filtered
    .sort((a, b) => {
      const scoreA =
        (a.source === "user-import" ? 30 : 0) +
        (isKidFriendlyRecipe(a) ? 12 : 0) +
        (isQuickRecipe(a) ? 6 : 0);
      const scoreB =
        (b.source === "user-import" ? 30 : 0) +
        (isKidFriendlyRecipe(b) ? 12 : 0) +
        (isQuickRecipe(b) ? 6 : 0);
      return scoreB - scoreA || a.duration - b.duration || a.name.localeCompare(b.name, "hu");
    })
    .slice(0, 12);
}

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
    <div className="fixed inset-0 z-[70] flex items-end bg-[rgba(20,22,18,0.38)] backdrop-blur-sm">
      <button aria-label="Bezárás" className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full rounded-t-[32px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,252,244,0.99),rgba(246,235,216,0.96))] px-5 pb-8 pt-4 shadow-[0_-24px_60px_-30px_rgba(36,28,18,0.38)]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[rgba(111,106,96,0.18)]" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">{title}</h3>
          <button
            onClick={onClose}
            className="ff-icon-button flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-muted)]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MobileRecipeCard({
  recipe,
  onViewRecipe,
  onToggleBookmark,
  onQuickAdd,
  bookmarked,
}: {
  recipe: Recipe;
  onViewRecipe: (recipe: Recipe) => void;
  onToggleBookmark: (recipe: Recipe) => void;
  onQuickAdd: (recipe: Recipe) => void;
  bookmarked: boolean;
}) {
  const meta: Array<{ icon: string; label: string }> = [
    { icon: "schedule", label: `${recipe.duration} perc` },
  ];
  if (isKidFriendlyRecipe(recipe)) {
    meta.push({ icon: "sentiment_satisfied", label: "Gyerekbarát" });
  }
  if ((recipe.tags ?? []).includes("2 napra elég")) {
    meta.push({ icon: "calendar_month", label: "2 napra" });
  } else if (isQuickRecipe(recipe)) {
    meta.push({ icon: "bolt", label: "Gyors" });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onViewRecipe(recipe)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewRecipe(recipe);
        }
      }}
      className="flex items-center gap-3 rounded-[28px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(255,248,235,0.92))] p-3 text-left shadow-[0_14px_32px_-22px_rgba(61,49,34,0.18)] transition-all active:scale-[0.99]"
    >
      <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[20px]">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
        {recipe.sourceName && (
          <div className="absolute left-1.5 top-1.5 max-w-[64px] truncate rounded-full bg-[rgba(255,249,237,0.92)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--ff-caramel-strong)]">
            {recipe.sourceName}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-[15px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ff-text)]">
          {recipe.name}
        </h4>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {meta.map((item, i) => (
            <span
              key={`${recipe.id}-m${i}`}
              className="flex items-center gap-1 text-[11px] font-medium text-[var(--ff-text-muted)]"
            >
              <span className="material-symbols-outlined text-[13px]">{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2">
        {/* Quick-add: primary caramel CTA */}
        <button
          type="button"
          aria-label="Gyors hozzáadás a tervhez"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(recipe);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(220,153,78,0.96),rgba(200,132,50,0.94))] text-white shadow-[0_8px_18px_-8px_rgba(185,130,71,0.50)] transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-[19px]">add</span>
        </button>

        {/* Bookmark */}
        <button
          type="button"
          aria-label={bookmarked ? "Mentés eltávolítása" : "Recept mentése"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(recipe);
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
            bookmarked
              ? "bg-[rgba(221,230,211,0.86)] text-[var(--ff-primary)]"
              : "text-[var(--ff-text-soft)]"
          }`}
        >
          <span
            className="material-symbols-outlined text-[17px]"
            style={bookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            bookmark
          </span>
        </button>
      </div>
    </div>
  );
}

const FALLBACK_HERO_IMAGE =
  "/api/recipes/image?url=https%3A%2F%2Fcdn.recipes.lidl%2Fimages-v2%2Frecipes%2Fhu-HU%2Ff0cbd9af-219f-4203-acbb-81c9a7788366%2F16x9_fallback_carbonara-1774372941.jpeg";

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
    () => weekDays.filter((day) => getBatchesForDate(batches, day.dateKey).length > 0).length,
    [batches, weekDays],
  );

  const suggestedRecipes = useMemo(
    () => filterAndRankRecipes(catalog, activeFilters, bookmarkedIds),
    [catalog, activeFilters, bookmarkedIds],
  );

  const landingRecipes = useMemo(
    () => filterAndRankRecipes(catalog, new Set(), bookmarkedIds).slice(0, 4),
    [catalog, bookmarkedIds],
  );

  const weeklyProgressWidth = `${Math.max((plannedDaysCount / 7) * 100, plannedDaysCount > 0 ? 14 : 0)}%`;
  const heroImage = catalog[0]?.image ?? FALLBACK_HERO_IMAGE;
  const resultCount = suggestedRecipes.length;
  const hasActiveFilters = activeFilters.size > 0;

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout((showToast as typeof showToast & { _t?: number })._t);
    (showToast as typeof showToast & { _t?: number })._t = window.setTimeout(
      () => setToast(null),
      1800,
    );
  }

  function toggleFilter(id: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openIdeasWithPresets(presets: string[]) {
    setActiveFilters(new Set(presets));
    setScreen("ideas");
  }

  function openChooserClean() {
    setActiveFilters(new Set());
    setScreen("chooser");
  }

  function toggleRecipeBookmark(recipe: Recipe) {
    setBookmarkedIds((current) => {
      const exists = current.includes(recipe.id);
      showToast(exists ? "Mentés eltávolítva" : "Recept mentve");
      return exists ? current.filter((id) => id !== recipe.id) : [...current, recipe.id];
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--ff-bg)] md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,249,237,0.95),transparent_28%),radial-gradient(circle_at_top_right,rgba(238,243,231,0.82),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,240,227,0.72),transparent_24%)]" />

      <main
        className="relative flex min-h-screen flex-col px-4 pt-5"
        style={{ paddingBottom: "calc(112px + env(safe-area-inset-bottom, 0px))" }}
      >

        {/* ─────────────────────────────────────────────── LANDING ── */}
        {screen === "landing" && (
          <>
            <MobileGreetingHeader
              name="Norbi"
              onAvatarClick={() => setIsAccountOpen(true)}
              onNotificationClick={() => setIsNotificationsOpen(true)}
            />

            {/* Hero card */}
            <section className="relative overflow-hidden rounded-[36px] border border-white/70 shadow-[0_28px_60px_-28px_rgba(61,49,34,0.38)]">
              <div className="absolute inset-0">
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${heroImage})` }}
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(170deg,rgba(32,18,8,0.18)_0%,rgba(28,16,8,0.78)_100%)]" />

              <div className="relative p-5">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[rgba(255,248,238,0.88)]">
                  <span className="material-symbols-outlined text-[15px] text-[rgba(244,188,95,0.98)]">wb_twilight</span>
                  Mai vacsora
                </p>
                <h2 className="mt-3 max-w-[10rem] text-[30px] font-semibold leading-[1.04] tracking-[-0.04em] text-white">
                  Mit főzzünk ma?
                </h2>
                <p className="mt-1.5 max-w-[12rem] text-[14px] leading-snug text-[rgba(255,244,230,0.9)]">
                  Pár döntés — és mutatjuk az ötleteket.
                </p>

                {/* Quick preset chips — jump straight to ideas */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: "2 napra", presets: ["2napra"], icon: "calendar_month" },
                    { label: "30 perc", presets: ["30perc"], icon: "timer" },
                    { label: "Gyerekbarát", presets: ["gyerekbarat"], icon: "sentiment_satisfied" },
                    { label: "Kamrából", presets: ["fozelek"], icon: "inventory_2" },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => openIdeasWithPresets(p.presets)}
                      className="flex items-center gap-1.5 rounded-full border border-white/28 bg-[rgba(255,249,237,0.94)] px-3 py-2 text-[12px] font-semibold text-[var(--ff-text)] shadow-[0_8px_16px_-10px_rgba(61,49,34,0.26)]"
                    >
                      <span className="material-symbols-outlined text-[14px]">{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Main CTA */}
                <button
                  onClick={openChooserClean}
                  className="mt-4 flex w-full items-center justify-between rounded-full bg-[linear-gradient(135deg,#dc994e,#c88432)] px-5 py-4 text-[var(--ff-text-inverse)] shadow-[0_20px_36px_-16px_rgba(185,130,71,0.54)]"
                >
                  <span className="flex-1 pl-2 text-center text-[17px] font-semibold tracking-[-0.02em]">
                    Kaja kiválasztása
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#c68437] shadow-[0_8px_18px_-12px_rgba(61,49,34,0.28)]">
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </span>
                </button>
              </div>
            </section>

            {/* Info tiles */}
            <section className="mt-4 grid grid-cols-3 gap-3">
              <button
                onClick={openChooserClean}
                className="rounded-[26px] border border-white/78 bg-[linear-gradient(145deg,rgba(234,244,226,0.98),rgba(206,225,190,0.9))] p-3.5 text-left shadow-[0_20px_36px_-26px_rgba(61,49,34,0.22)]"
              >
                <div className="flex min-h-[110px] flex-col justify-between gap-2">
                  <div>
                    <h3 className="text-[13px] font-semibold text-[var(--ff-text)]">Heti terved</h3>
                    <p className="mt-2 text-[17px] font-semibold text-[var(--ff-primary)]">
                      {plannedDaysCount}/7 nap
                    </p>
                    <p className="mt-1 text-[10px] leading-snug text-[var(--ff-text-muted)]">
                      {plannedDaysCount > 0 ? "Folytatás" : "Még üres."}
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full bg-[rgba(61,49,34,0.08)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(135deg,var(--ff-primary-soft),var(--ff-primary))]"
                      style={{ width: weeklyProgressWidth }}
                    />
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push("/bevasarlas")}
                className="rounded-[26px] border border-white/78 bg-[linear-gradient(145deg,rgba(236,245,228,0.98),rgba(214,230,199,0.9))] p-3.5 text-left shadow-[0_20px_36px_-26px_rgba(61,49,34,0.22)]"
              >
                <div className="flex min-h-[110px] flex-col justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(197,220,179,0.98)] text-[var(--ff-primary)]">
                    <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-[var(--ff-text)]">Bevásárlás</h3>
                    <p className="mt-1 text-[11px] leading-snug text-[var(--ff-text-muted)]">
                      {shoppingItems.length > 0 ? "Lista nyitása" : "Étkezés hozzáadása"}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (!pantryItems.length) { router.push("/kamra"); return; }
                  openIdeasWithPresets(["fozelek"]);
                }}
                className="rounded-[26px] border border-white/78 bg-[linear-gradient(145deg,rgba(255,245,233,0.98),rgba(248,222,194,0.92))] p-3.5 text-left shadow-[0_20px_36px_-26px_rgba(61,49,34,0.22)]"
              >
                <div className="flex min-h-[110px] flex-col justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(255,240,210,0.96)] text-[var(--ff-caramel-strong)]">
                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-[var(--ff-text)]">Kamra ötletek</h3>
                    <p className="mt-1 text-[11px] leading-snug text-[var(--ff-text-muted)]">
                      {pantryItems.length > 0 ? "Főzz abból, ami van" : "Kamra feltöltése"}
                    </p>
                  </div>
                </div>
              </button>
            </section>

            {/* Mai ötletek */}
            <section className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">
                  Mai ötletek
                </h3>
                <button
                  onClick={() => { setActiveFilters(new Set()); setScreen("ideas"); }}
                  className="flex items-center gap-1 text-[13px] font-medium text-[var(--ff-text-muted)]"
                >
                  Összes
                  <span className="material-symbols-outlined text-[17px]">chevron_right</span>
                </button>
              </div>

              <button
                onClick={onOpenRecipeLibrary}
                className="mb-3 flex w-full items-center justify-between rounded-[24px] border border-white/78 bg-[linear-gradient(145deg,rgba(255,252,244,0.96),rgba(238,243,231,0.78))] px-4 py-3 text-left shadow-[0_12px_28px_-22px_rgba(61,49,34,0.18)]"
              >
                <span>
                  <span className="block text-[14px] font-semibold text-[var(--ff-text)]">
                    Recepttár
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium text-[var(--ff-text-muted)]">
                    Keresés az összes receptben
                  </span>
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ff-primary)] text-[var(--ff-text-inverse)]">
                  <span className="material-symbols-outlined text-[17px]">menu_book</span>
                </span>
              </button>

              <div className="flex flex-col gap-3">
                {landingRecipes.length > 0 ? (
                  landingRecipes.map((recipe) => (
                    <MobileRecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onViewRecipe={onViewRecipe}
                      onToggleBookmark={toggleRecipeBookmark}
                      onQuickAdd={onQuickAdd}
                      bookmarked={bookmarkedIds.includes(recipe.id)}
                    />
                  ))
                ) : (
                  <div className="ff-glass-card rounded-[28px] px-5 py-8 text-center">
                    <p className="text-[14px] text-[var(--ff-text-muted)]">
                      Most nincs pontos találat.
                    </p>
                    <button
                      onClick={openChooserClean}
                      className="mt-3 text-[13px] font-semibold text-[var(--ff-primary)]"
                    >
                      Szűrők módosítása
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* ────────────────────────────────────────────── CHOOSER ── */}
        {screen === "chooser" && (
          <>
            <header className="flex items-center justify-between gap-3 pb-4">
              <button
                onClick={() => setScreen("landing")}
                className="ff-icon-button flex h-11 w-11 items-center justify-center rounded-full text-[var(--ff-text-muted)]"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="text-center">
                <p className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--ff-text)]">
                  Mit főzzünk?
                </p>
                <p className="text-[11px] text-[var(--ff-text-muted)]">
                  Több szűrőt is választhatsz
                </p>
              </div>
              {hasActiveFilters ? (
                <button
                  onClick={() => setActiveFilters(new Set())}
                  className="text-[12px] font-bold text-[var(--ff-caramel-strong)]"
                >
                  Törlés
                </button>
              ) : (
                <div className="w-14" />
              )}
            </header>

            {/* Multi-select filter grid */}
            <section className="grid grid-cols-2 gap-2.5">
              {FILTER_OPTIONS.map((option) => {
                const selected = activeFilters.has(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleFilter(option.id)}
                    className="relative min-h-[96px] overflow-hidden rounded-[26px] border p-4 text-left shadow-[0_12px_26px_-18px_rgba(61,49,34,0.22)] transition-all active:scale-[0.97]"
                    style={{
                      background: selected ? option.activeGradient : option.gradient,
                      borderColor: selected ? "rgba(255,255,255,0.32)" : option.borderColor,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="material-symbols-outlined text-[22px]"
                        style={{ color: selected ? "rgba(255,255,255,0.92)" : option.textColor }}
                      >
                        {option.icon}
                      </span>
                      {selected && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(255,255,255,0.26)]">
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
                      className="mt-6 text-[14px] font-semibold leading-tight"
                      style={{ color: selected ? "rgba(255,255,255,0.96)" : option.textColor }}
                    >
                      {option.label}
                    </p>
                  </button>
                );
              })}
            </section>

            {/* Live result count */}
            <div className="mt-4 text-center">
              {catalog.length > 0 ? (
                <p className="text-[13px] font-semibold text-[var(--ff-text-muted)]">
                  {resultCount > 0 ? (
                    <>
                      <span className="text-[var(--ff-primary)]">{resultCount}</span> ötletet találtunk
                    </>
                  ) : (
                    "Nincs találat — próbálj kevesebb szűrőt"
                  )}
                </p>
              ) : (
                <p className="text-[12px] text-[var(--ff-text-soft)]">Receptek betöltése…</p>
              )}
            </div>

            {/* Sticky CTA */}
            <div className="mt-auto pt-5">
              <button
                onClick={() => setScreen("ideas")}
                disabled={catalog.length === 0}
                className="ff-button-primary flex w-full items-center justify-center gap-2 px-5 py-4 text-[15px] font-bold shadow-[0_20px_36px_-18px_rgba(44,56,38,0.36)] disabled:opacity-50"
              >
                {resultCount > 0
                  ? `${resultCount} ötlet megtekintése`
                  : "Mutasd az ötleteket"}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </>
        )}

        {/* ──────────────────────────────────────────────── IDEAS ── */}
        {screen === "ideas" && (
          <>
            <header className="flex items-center justify-between gap-3 pb-3">
              <button
                onClick={() => setScreen(hasActiveFilters ? "chooser" : "landing")}
                className="ff-icon-button flex h-11 w-11 items-center justify-center rounded-full text-[var(--ff-text-muted)]"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="text-center">
                <p className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--ff-text)]">
                  Ötletek
                </p>
                {resultCount > 0 && (
                  <p className="text-[11px] text-[var(--ff-text-muted)]">{resultCount} találat</p>
                )}
              </div>
              <button
                onClick={() => setScreen("chooser")}
                className="ff-icon-button flex h-11 w-11 items-center justify-center rounded-full text-[var(--ff-text-muted)]"
                aria-label="Szűrők módosítása"
              >
                <span className="material-symbols-outlined text-[20px]">tune</span>
              </button>
            </header>

            {/* Active filter chips (removable) */}
            {activeFilters.size > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                {FILTER_OPTIONS.filter((f) => activeFilters.has(f.id)).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleFilter(f.id)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-[linear-gradient(145deg,rgba(67,88,60,0.92),rgba(44,62,38,0.88))] px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_6px_14px_-8px_rgba(44,62,38,0.36)]"
                  >
                    <span className="material-symbols-outlined text-[13px]">{f.icon}</span>
                    {f.label}
                    <span className="material-symbols-outlined text-[12px] opacity-70">close</span>
                  </button>
                ))}
                <button
                  onClick={() => setActiveFilters(new Set())}
                  className="shrink-0 rounded-full border border-[rgba(74,67,54,0.12)] bg-[rgba(255,252,244,0.90)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ff-text-muted)]"
                >
                  Összes törlése
                </button>
              </div>
            )}

            {/* Recipe list */}
            <section className="flex flex-col gap-3">
              {suggestedRecipes.length > 0 ? (
                suggestedRecipes.map((recipe) => (
                  <MobileRecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onViewRecipe={onViewRecipe}
                    onToggleBookmark={toggleRecipeBookmark}
                    onQuickAdd={onQuickAdd}
                    bookmarked={bookmarkedIds.includes(recipe.id)}
                  />
                ))
              ) : (
                <div className="ff-glass-card rounded-[28px] px-5 py-10 text-center">
                  <span className="material-symbols-outlined text-[42px] text-[var(--ff-text-soft)]">
                    search_off
                  </span>
                  <p className="mt-3 text-[15px] font-semibold text-[var(--ff-text)]">
                    Nincs pontos találat.
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--ff-text-muted)]">
                    Mutunk hasonló ötleteket.
                  </p>
                  <button
                    onClick={() => setActiveFilters(new Set())}
                    className="mt-4 rounded-full bg-[var(--ff-primary)] px-5 py-2.5 text-[13px] font-bold text-[var(--ff-text-inverse)]"
                  >
                    Szűrők törlése
                  </button>
                </div>
              )}
            </section>

            <div className="mt-4">
              <button
                onClick={onAddMeal}
                className="ff-button-secondary flex w-full items-center justify-center gap-2 px-4 py-3 text-[13px] font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Részletesebb keresés
              </button>
            </div>
          </>
        )}
      </main>

      {/* ── Sheets ── */}
      {isAccountOpen && (
        <MobileSheet title="Profil és fiók" onClose={() => setIsAccountOpen(false)}>
          <div className="space-y-3">
            <button
              onClick={() => { setIsAccountOpen(false); router.push("/beallitasok"); }}
              className="flex w-full items-center justify-between rounded-[24px] border border-white/70 bg-[rgba(255,251,244,0.82)] px-4 py-4 text-left"
            >
              <span>
                <span className="block text-[15px] font-semibold text-[var(--ff-text)]">Fiók megnyitása</span>
                <span className="mt-1 block text-[13px] text-[var(--ff-text-muted)]">Profil és családi beállítások</span>
              </span>
              <span className="material-symbols-outlined text-[20px] text-[var(--ff-text-soft)]">chevron_right</span>
            </button>
          </div>
        </MobileSheet>
      )}

      {isNotificationsOpen && (
        <MobileSheet title="Értesítések" onClose={() => setIsNotificationsOpen(false)}>
          <div className="space-y-3">
            {[
              "A heti terv készen áll az esti vacsorához.",
              "3 bevásárlólista tétel vár még rád.",
              "Új gyerekbarát recept érkezett a mai ötletekhez.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/70 bg-[rgba(255,251,244,0.82)] px-4 py-4 text-[14px] text-[var(--ff-text)]"
              >
                {item}
              </div>
            ))}
          </div>
        </MobileSheet>
      )}

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-4 bottom-[96px] z-[75] flex justify-center md:hidden">
          <div className="rounded-full bg-[rgba(31,33,29,0.92)] px-4 py-2 text-[13px] font-medium text-[var(--ff-text-inverse)] shadow-[0_18px_34px_-18px_rgba(20,22,18,0.42)]">
            {toast}
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
