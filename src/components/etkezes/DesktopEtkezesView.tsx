"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { getBatchRecipe, getBatchesForDate } from "@/lib/etkezes-data";
import { getRecipeImageSrc } from "@/lib/recipes/recipe-image";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import {
  getRecipeMealTypeLabel,
  getRecipeTimeBucket,
  isKidFriendlyRecipe,
  isQuickRecipe,
} from "@/lib/recipes/recipe-taxonomy";
import { getUserImportedRecipes } from "@/lib/recipes/user-import.provider";
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
  plannedDaysCount: number;
  openDaysCount: number;
  onAddMeal: (day?: WeekDay) => void;
  onOpenRecipeLibrary: () => void;
  onRemoveBatch: (batchId: string) => void;
  onStartCooking: (recipe: Recipe) => void;
  onViewRecipe: (recipe: Recipe) => void;
}

const ALL_RECIPES = getUserImportedRecipes();
const UNIQUE_RECIPES = Array.from(new Map(ALL_RECIPES.map((recipe) => [recipe.id, recipe])).values());
const LIDL_RECIPES = UNIQUE_RECIPES.filter((recipe) => recipe.sourceName === "Lidl Konyha");
const HERO_IMAGE = LIDL_RECIPES[0] ? getRecipeImageSrc(LIDL_RECIPES[0]) : "/images/recipes/categories/pasta.png";
const HU_WEEKEND = ["Szombat", "Vasárnap"];

const FILTER_GROUPS = [
  {
    title: "Hús / Fehérje",
    items: [
      { key: "csirke", icon: "egg_alt", label: "Csirke" },
      { key: "sertes", icon: "nutrition", label: "Sertés" },
      { key: "hal", icon: "set_meal", label: "Hal" },
      { key: "marha", icon: "lunch_dining", label: "Marha" },
    ],
  },
  {
    title: "Elkészítési idő",
    items: [
      { key: "gyors", icon: "bolt", label: "Gyors" },
      { key: "kozepes", icon: "timer", label: "Közepes" },
      { key: "lassu", icon: "hourglass_bottom", label: "Lassú" },
    ],
  },
  {
    title: "Ételtípus",
    items: [
      { key: "teszta", icon: "ramen_dining", label: "Tészta" },
      { key: "leves", icon: "soup_kitchen", label: "Leves" },
      { key: "foetel", icon: "dinner_dining", label: "Főétel" },
      { key: "fozelek", icon: "skillet", label: "Főzelék" },
    ],
  },
] as const;

const EXTRA_FILTERS = [
  { key: "gyerekbarat", icon: "sentiment_satisfied", label: "Gyerekbarát" },
  { key: "tobbnapos", icon: "calendar_month", label: "1-3 napra jó" },
] as const;

type FilterKey =
  | "gyors"
  | "kozepes"
  | "lassu"
  | "gyerekbarat"
  | "csirke"
  | "sertes"
  | "marha"
  | "hal"
  | "teszta"
  | "leves"
  | "foetel"
  | "fozelek"
  | "tobbnapos";

interface NotifItem {
  icon: string;
  text: string;
  sub: string;
  href: string;
}

function Icon({ name, className = "text-[20px]" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function getMealForDay(day: WeekDay, batches: MealBatch[]) {
  const batch = getBatchesForDate(batches, day.dateKey)[0];
  return batch ? getBatchRecipe(batch) : undefined;
}

function formatMonthDay(day: WeekDay) {
  const monthDay = day.date.toLocaleDateString("hu-HU", { month: "long", day: "numeric" });
  return monthDay.charAt(0).toUpperCase() + monthDay.slice(1);
}

function NotificationPopover({ items, onClose }: { items: NotifItem[]; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="Értesítések"
      className="absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] overflow-hidden rounded-[22px] border border-[rgba(170,135,84,0.18)] bg-[rgba(255,249,237,0.98)] shadow-[0_24px_56px_-24px_rgba(50,34,14,0.38)] backdrop-blur-[24px]"
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h3 className="text-[13px] font-extrabold text-[var(--ff-text)]">Értesítések</h3>
        <button
          onClick={onClose}
          aria-label="Bezárás"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ff-text-muted)] hover:bg-[rgba(61,49,34,0.08)]"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 pb-5 pt-3 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(210,228,192,0.92)] text-[var(--ff-primary)]">
            <Icon name="check_circle" className="text-[22px]" />
          </span>
          <p className="text-[12px] font-bold text-[var(--ff-text-muted)]">Nincs új értesítés.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[rgba(170,135,84,0.08)] px-2 pb-2">
          {items.map((item) => (
            <li key={item.text}>
              <Link
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-[14px] px-2 py-3 transition-colors hover:bg-[rgba(255,245,224,0.88)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(255,240,210,0.96)] text-[var(--ff-caramel-strong)]">
                  <Icon name={item.icon} className="text-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-extrabold text-[var(--ff-text)]">{item.text}</p>
                  <p className="text-[10.5px] font-semibold text-[var(--ff-text-muted)]">{item.sub}</p>
                </div>
                <Icon name="chevron_right" className="ml-auto shrink-0 text-[16px] text-[var(--ff-text-muted)] opacity-50" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterPill({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all ${
        selected
          ? "border-[rgba(124,145,111,0.26)] bg-[rgba(225,235,210,0.92)] text-[var(--ff-primary)] shadow-[0_10px_22px_-16px_rgba(55,80,45,0.28)]"
          : "border-[rgba(170,135,84,0.14)] bg-[rgba(255,252,245,0.92)] text-[var(--ff-text)] hover:bg-[rgba(255,245,224,0.92)]"
      }`}
    >
      <Icon name={icon} className="text-[16px]" />
      {label}
    </button>
  );
}

function WeeklyDayCard({
  day,
  recipe,
  onAddMeal,
  onViewRecipe,
}: {
  day: WeekDay;
  recipe?: Recipe;
  onAddMeal: (day?: WeekDay) => void;
  onViewRecipe: (recipe: Recipe) => void;
}) {
  const isWeekend = HU_WEEKEND.includes(day.name);
  const dayLabel = day.isToday ? "Ma" : day.name;
  const mealLabel = isWeekend ? "Vacsora hozzáadása" : "Ebéd hozzáadása";

  if (!recipe) {
    return (
      <button
        onClick={() => onAddMeal(day)}
        className="flex min-h-[228px] flex-col rounded-[24px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.92)] px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(61,49,34,0.2)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[20px] font-bold text-[var(--ff-text)]">{dayLabel}</p>
            <p className="text-[12px] font-medium text-[var(--ff-text-muted)]">{formatMonthDay(day)}</p>
          </div>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,248,232,0.96)] text-[var(--ff-text-muted)]"
            aria-label={`${dayLabel} menü`}
          >
            <Icon name="more_horiz" className="text-[18px]" />
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(185,130,71,0.24)] bg-[rgba(255,248,232,0.9)] text-[var(--ff-caramel-strong)]">
            <Icon name="add" className="text-[28px]" />
          </span>
          <p className="text-[16px] font-semibold text-[var(--ff-text-muted)]">{mealLabel}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onViewRecipe(recipe)}
      className={`flex min-h-[228px] flex-col rounded-[24px] border px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(61,49,34,0.24)] ${
        day.isToday
          ? "border-[rgba(124,145,111,0.3)] bg-[linear-gradient(180deg,rgba(248,251,243,0.98),rgba(255,252,245,0.96))]"
          : "border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.92)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[20px] font-bold text-[var(--ff-text)]">{dayLabel}</p>
          <p className="text-[12px] font-medium text-[var(--ff-text-muted)]">{formatMonthDay(day)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[var(--ff-text-muted)] shadow-[0_10px_16px_-14px_rgba(61,49,34,0.22)]">
            <Icon name="more_horiz" className="text-[18px]" />
          </span>
        </div>
      </div>

      <div className="relative mt-3 h-[86px] overflow-hidden rounded-[18px]">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
        <div className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.95)] text-[var(--ff-text-muted)]">
          <Icon name="more_horiz" className="text-[18px]" />
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-[var(--ff-text)]">{recipe.name}</h3>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <span className="rounded-full bg-[rgba(225,235,210,0.9)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ff-primary)]">
            {getRecipeTimeBucket(recipe) === "short" ? "Gyors" : getRecipeTimeBucket(recipe) === "medium" ? "Közepes" : "Lassú"}
          </span>
          <span className="text-[12px] font-medium text-[var(--ff-text-muted)]">{recipe.duration} perc</span>
        </div>
      </div>
    </button>
  );
}

function RecommendationCard({
  recipe,
  onViewRecipe,
  bookmarked,
  onToggleBookmark,
}: {
  recipe: Recipe;
  onViewRecipe: (recipe: Recipe) => void;
  bookmarked: boolean;
  onToggleBookmark: (recipe: Recipe) => void;
}) {
  return (
    <article
      className="overflow-hidden rounded-[24px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.94)] shadow-[0_18px_36px_-28px_rgba(61,49,34,0.2)]"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onViewRecipe(recipe)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onViewRecipe(recipe); }}
        className="block w-full cursor-pointer text-left"
      >
        <div className="relative h-[156px] overflow-hidden">
          <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {isQuickRecipe(recipe) && (
              <span className="rounded-full bg-[rgba(55,67,50,0.9)] px-2.5 py-1 text-[11px] font-semibold text-white">
                Gyors
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleBookmark(recipe);
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.94)] text-[var(--ff-text-muted)]"
            aria-label={bookmarked ? "Mentés eltávolítása" : "Mentés"}
          >
            <Icon
              name={bookmarked ? "bookmark" : "bookmark_border"}
              className={`text-[18px] ${bookmarked ? "text-[var(--ff-caramel-strong)]" : ""}`}
            />
          </button>
        </div>
        <div className="px-4 pb-4 pt-3">
          <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-[var(--ff-text)]">{recipe.name}</h3>
          <div className="mt-2 flex items-center gap-2 text-[12px] font-medium text-[var(--ff-text-muted)]">
            <span>{recipe.duration} perc</span>
            <span>•</span>
            <span>{getRecipeMealTypeLabel(recipe)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function DesktopEtkezesView({
  nextMealData,
  weekDays,
  batches,
  shoppingItems,
  pantryItems,
  catalog,
  plannedDaysCount,
  onAddMeal,
  onOpenRecipeLibrary,
  onStartCooking,
  onViewRecipe,
}: Props) {
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set(["csirke", "gyors", "gyerekbarat", "tobbnapos"]));
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNotifPopover) return;
    const handler = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifPopover]);

  const sourceRecipes = useMemo(() => {
    if (catalog.length > 0) return catalog;
    return UNIQUE_RECIPES;
  }, [catalog]);

  const plannedRecipes = useMemo(
    () => weekDays.map((day) => getMealForDay(day, batches) ?? undefined),
    [weekDays, batches],
  );

  const progressRatio = `${Math.max(plannedDaysCount, 1) / 7 * 100}%`;

  const filteredRecipes = useMemo(() => {
    let pool = sourceRecipes;

    const proteins = [
      activeFilters.has("csirke") ? "csirke" : null,
      activeFilters.has("sertes") ? "sertés" : null,
      activeFilters.has("marha") ? "marha" : null,
      activeFilters.has("hal") ? "hal" : null,
    ].filter(Boolean) as Recipe["protein"][];

    if (proteins.length > 0) {
      pool = pool.filter((recipe) => proteins.includes(recipe.protein));
    }

    const timeFilters = [
      activeFilters.has("gyors") ? "short" : null,
      activeFilters.has("kozepes") ? "medium" : null,
      activeFilters.has("lassu") ? "long" : null,
    ].filter(Boolean) as Array<"short" | "medium" | "long">;

    if (timeFilters.length > 0) {
      pool = pool.filter((recipe) => timeFilters.includes(getRecipeTimeBucket(recipe)));
    }

    if (activeFilters.has("gyerekbarat")) {
      pool = pool.filter((recipe) => isKidFriendlyRecipe(recipe));
    }

    if (activeFilters.has("teszta")) {
      pool = pool.filter((recipe) => getRecipeMealTypeLabel(recipe).toLowerCase().includes("tészta"));
    }
    if (activeFilters.has("leves")) {
      pool = pool.filter((recipe) => getRecipeMealTypeLabel(recipe).toLowerCase().includes("leves"));
    }
    if (activeFilters.has("foetel")) {
      pool = pool.filter((recipe) => recipe.category.toLowerCase().includes("főétel"));
    }
    if (activeFilters.has("fozelek")) {
      pool = pool.filter((recipe) => getRecipeMealTypeLabel(recipe).toLowerCase().includes("főzel"));
    }

    if (activeFilters.has("tobbnapos")) {
      pool = pool.filter((recipe) => (recipe.servings ?? 0) >= 4 || (recipe.tags ?? []).includes("2 napra elég"));
    }

    return pool
      .sort((a, b) => Number(isQuickRecipe(b)) - Number(isQuickRecipe(a)) || a.duration - b.duration)
      .slice(0, 6);
  }, [activeFilters, sourceRecipes]);

  const pantryRanked = useMemo(
    () => rankRecipesForPantry(sourceRecipes.slice(0, 30), pantryItems).slice(0, 3),
    [sourceRecipes, pantryItems],
  );

  const quickLunchRecipe = useMemo(
    () => nextMealData?.recipe ?? filteredRecipes[0] ?? sourceRecipes[0],
    [nextMealData, filteredRecipes, sourceRecipes],
  );

  const notifItems = useMemo<NotifItem[]>(() => {
    const items: NotifItem[] = [];
    if (plannedDaysCount < 7) {
      items.push({
        icon: "restaurant",
        text: `${7 - plannedDaysCount} nap még üres`,
        sub: "Egészítsd ki a heti tervet",
        href: "#planner",
      });
    }
    if (shoppingItems.length > 0) {
      items.push({
        icon: "shopping_basket",
        text: `${shoppingItems.length} tétel vár bevásárlásra`,
        sub: "Nézd át a listát",
        href: "/bevasarlas",
      });
    }
    if (pantryItems.length === 0) {
      items.push({
        icon: "inventory_2",
        text: "A kamra még üres",
        sub: "Tölts fel pár alapanyagot",
        href: "/kamra",
      });
    }
    return items;
  }, [plannedDaysCount, shoppingItems.length, pantryItems.length]);

  const missingItems = shoppingItems.length > 0 ? shoppingItems.slice(0, 5) : ["Csirkemell", "Paradicsom", "Tejszín", "Tészta", "Brokkoli"];

  return (
    <div className="hidden min-h-screen w-full px-3 py-3 md:block">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1780px] flex-col rounded-[32px] bg-[linear-gradient(180deg,rgba(246,235,216,0.78)_0%,rgba(248,240,226,0.86)_15%,rgba(250,244,234,0.92)_40%)] px-6 py-6 shadow-[0_44px_120px_-72px_rgba(50,34,14,0.56),inset_0_0_0_1px_rgba(175,140,88,0.13)] backdrop-blur-[22px] 2xl:px-8 2xl:py-7">
        <WelcomeHeader
          description="Mit főzzünk ma?"
          actions={
            <>
              <button
                onClick={onOpenRecipeLibrary}
                aria-label="Recepttár megnyitása"
                className="flex items-center gap-2 rounded-full border border-[rgba(170,135,84,0.18)] bg-[rgba(255,248,232,0.94)] px-4 py-2.5 text-[13px] font-extrabold text-[var(--ff-primary)] shadow-[0_8px_18px_-12px_rgba(61,49,34,0.22)] transition-all hover:bg-[rgba(255,242,215,0.99)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
              >
                <Icon name="menu_book" className="text-[18px]" />
                Recepttár
              </button>

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifPopover((value) => !value)}
                  aria-label={`Értesítések${notifItems.length > 0 ? ` — ${notifItems.length} új` : ""}`}
                  aria-expanded={showNotifPopover}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(170,135,84,0.16)] bg-[rgba(255,248,232,0.94)] text-[var(--ff-text)] shadow-[0_8px_18px_-12px_rgba(61,49,34,0.22)] transition-all hover:bg-[rgba(255,243,218,0.99)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
                >
                  <Icon name="notifications" className="text-[20px]" />
                  {notifItems.length > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#e8821e] shadow-[0_0_0_1.5px_rgba(248,239,224,0.95)]" />
                  )}
                </button>
                {showNotifPopover && <NotificationPopover items={notifItems} onClose={() => setShowNotifPopover(false)} />}
              </div>

              <Link
                href="/beallitasok"
                aria-label="Beállítások"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(170,135,84,0.16)] bg-[rgba(255,248,232,0.94)] text-[var(--ff-text)] shadow-[0_8px_18px_-12px_rgba(61,49,34,0.22)] transition-all hover:bg-[rgba(255,243,218,0.99)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
              >
                <Icon name="settings" className="text-[20px]" />
              </Link>
            </>
          }
        />

        <div className="grid flex-1 grid-cols-[minmax(0,1fr)_360px] gap-6 2xl:grid-cols-[minmax(0,1fr)_392px]">
          <section className="min-w-0">
            <section className="relative overflow-hidden rounded-[30px] border border-[rgba(170,135,84,0.12)] shadow-[0_30px_64px_-36px_rgba(36,20,6,0.56)]">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(34,18,5,0.8)_0%,rgba(34,18,5,0.48)_42%,rgba(34,18,5,0.14)_100%)]" />
              <div className="relative flex min-h-[295px] flex-col justify-end px-10 py-9">
                <div className="max-w-[420px]">
                  <h2 className="text-[56px] font-extrabold leading-[0.92] tracking-[-0.06em] text-white">
                    Mit főzzünk
                    <br />
                    ezen a héten?
                  </h2>
                  <p className="mt-4 text-[18px] font-medium leading-snug text-[rgba(255,241,220,0.9)]">
                    Tervezd meg az étkezéseket egyszerűen,
                    <br />
                    spórolj időt és energiát.
                  </p>
                  <div className="mt-7 flex items-center gap-4">
                    <button
                      onClick={() => onAddMeal()}
                      className="inline-flex items-center gap-5 rounded-full bg-[linear-gradient(135deg,#f1a533,#dc8620)] px-7 py-4 text-[16px] font-extrabold text-white shadow-[0_24px_50px_-22px_rgba(200,118,28,0.7)]"
                    >
                      Heti terv indítása
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#ca7a20]">
                        <Icon name="add" className="text-[22px]" />
                      </span>
                    </button>
                    <button
                      onClick={onOpenRecipeLibrary}
                      className="inline-flex items-center gap-2 rounded-full border border-white/26 bg-[rgba(255,248,230,0.14)] px-6 py-4 text-[16px] font-bold text-white backdrop-blur-sm"
                    >
                      <Icon name="menu_book" className="text-[18px]" />
                      Recepttár
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.92)] p-5 shadow-[0_24px_50px_-34px_rgba(61,49,34,0.18)]">
              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.95fr_1.15fr]">
                {FILTER_GROUPS.map((group) => (
                  <div key={group.title} className="min-w-0">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ff-text-soft)]">
                      {group.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <FilterPill
                          key={item.key}
                          icon={item.icon}
                          label={item.label}
                          selected={activeFilters.has(item.key)}
                          onClick={() =>
                            setActiveFilters((current) => {
                              const next = new Set(current);
                              if (next.has(item.key)) next.delete(item.key);
                              else next.add(item.key);
                              return next;
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {EXTRA_FILTERS.map((item) => (
                    <FilterPill
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      selected={activeFilters.has(item.key)}
                      onClick={() =>
                        setActiveFilters((current) => {
                          const next = new Set(current);
                          if (next.has(item.key)) next.delete(item.key);
                          else next.add(item.key);
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveFilters(new Set())}
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--ff-text-muted)]"
                >
                  <Icon name="ink_eraser" className="text-[16px]" />
                  Szűrők törlése
                </button>
              </div>
            </section>

            <section id="planner" className="mt-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-[32px] font-bold tracking-[-0.04em] text-[var(--ff-text)]">Heti terv</h3>
                  <p className="text-[18px] font-semibold text-[var(--ff-text-muted)]">{plannedDaysCount}/7 nap megtervezve</p>
                  <div className="h-3 w-[290px] overflow-hidden rounded-full bg-[rgba(220,214,201,0.84)]">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#76985f,#8cab6f)]" style={{ width: progressRatio }} />
                  </div>
                </div>
                <button className="inline-flex items-center gap-2 rounded-full bg-[rgba(225,235,210,0.9)] px-5 py-3 text-[14px] font-semibold text-[var(--ff-primary)]">
                  <Icon name="share" className="text-[18px]" />
                  Terv megosztása
                </button>
              </div>

              <div className="grid grid-cols-7 gap-4">
                {weekDays.map((day, index) => (
                  <WeeklyDayCard
                    key={day.dateKey}
                    day={day}
                    recipe={plannedRecipes[index]}
                    onAddMeal={onAddMeal}
                    onViewRecipe={onViewRecipe}
                  />
                ))}
              </div>

              <p className="mt-4 flex items-center gap-2 text-[14px] font-medium text-[var(--ff-text-muted)]">
                <Icon name="wb_incandescent" className="text-[18px] text-[#e0a33b]" />
                Tipp: Használd az „1-3 napra jó” szűrőt, hogy kevesebbet főzz és több időd maradjon!
              </p>
            </section>

            <section className="mt-7">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-[34px] font-bold tracking-[-0.04em] text-[var(--ff-text)]">Ajánlott receptek</h3>
                  <p className="text-[16px] font-medium text-[var(--ff-text-muted)]">A szűrőid és a kamrád alapján</p>
                </div>
                <button
                  onClick={onOpenRecipeLibrary}
                  className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-text-muted)]"
                >
                  Összes recept
                  <Icon name="arrow_forward" className="text-[18px]" />
                </button>
              </div>

              <div className="grid grid-cols-6 gap-4">
                {filteredRecipes.map((recipe) => (
                  <RecommendationCard
                    key={recipe.id}
                    recipe={recipe}
                    onViewRecipe={onViewRecipe}
                    bookmarked={savedRecipes.has(recipe.id)}
                    onToggleBookmark={(nextRecipe) =>
                      setSavedRecipes((current) => {
                        const next = new Set(current);
                        if (next.has(nextRecipe.id)) next.delete(nextRecipe.id);
                        else next.add(nextRecipe.id);
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </section>
          </section>

          <aside className="flex min-w-0 flex-col gap-5">
            <section className="rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.94)] p-5 shadow-[0_24px_50px_-34px_rgba(61,49,34,0.18)]">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[16px] font-bold text-[var(--ff-text)]">
                  <Icon name="shopping_basket" className="text-[20px] text-[var(--ff-primary)]" />
                  Kamra & Bevásárlólista
                </h3>
                <Icon name="chevron_right" className="text-[20px] text-[var(--ff-text-muted)]" />
              </div>

              <div className="mt-5 flex gap-2 rounded-full bg-[rgba(248,244,236,0.96)] p-1">
                <span className="rounded-full bg-[rgba(225,235,210,0.96)] px-4 py-2 text-[12px] font-bold text-[var(--ff-primary)]">
                  Hiányzik ({missingItems.length})
                </span>
                <span className="rounded-full px-4 py-2 text-[12px] font-semibold text-[var(--ff-text-muted)]">Kevés (6)</span>
                <span className="rounded-full px-4 py-2 text-[12px] font-semibold text-[var(--ff-text-muted)]">Van elég (31)</span>
              </div>

              <div className="mt-4 divide-y divide-[rgba(170,135,84,0.08)]">
                {missingItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 py-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,248,232,0.9)] text-[var(--ff-caramel-strong)]">
                      <Icon name="grocery" className="text-[18px]" />
                    </span>
                    <span className="flex-1 text-[14px] font-semibold text-[var(--ff-text)]">{item}</span>
                    <span className="text-[13px] font-semibold text-[var(--ff-text-muted)]">1 db</span>
                    <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(170,135,84,0.14)] bg-white text-[var(--ff-caramel-strong)]">
                      <Icon name="add" className="text-[18px]" />
                    </button>
                  </div>
                ))}
              </div>

              <button className="mt-5 flex w-full items-center justify-between rounded-full bg-[linear-gradient(135deg,#f1a533,#dc8620)] px-6 py-4 text-[16px] font-bold text-white shadow-[0_24px_44px_-24px_rgba(200,118,28,0.66)]">
                Bevásárlólista megnyitása
                <Icon name="arrow_forward" className="text-[20px]" />
              </button>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[linear-gradient(135deg,rgba(236,245,225,0.98),rgba(243,249,234,0.95))] p-5 shadow-[0_24px_50px_-34px_rgba(61,49,34,0.16)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 text-[16px] font-bold text-[var(--ff-text)]">
                    <Icon name="eco" className="text-[20px] text-[var(--ff-primary)]" />
                    Okos javaslat
                  </h3>
                  <p className="mt-3 text-[15px] font-medium leading-snug text-[var(--ff-text-muted)]">
                    {pantryRanked.length || 3} receptet találtunk, amihez minden alapanyagod megvan.
                  </p>
                  <button
                    onClick={() => pantryRanked[0] && onViewRecipe(pantryRanked[0].recipe)}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-bold text-[var(--ff-primary)]"
                  >
                    Megnézem
                    <Icon name="arrow_forward" className="text-[18px]" />
                  </button>
                </div>
                <div className="flex h-28 w-28 items-center justify-center rounded-[26px] bg-[rgba(255,255,255,0.55)] text-[var(--ff-caramel-strong)]">
                  <Icon name="shopping_bag" className="text-[54px]" />
                </div>
              </div>
            </section>

            {quickLunchRecipe && (
              <section className="rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.94)] p-5 shadow-[0_24px_50px_-34px_rgba(61,49,34,0.18)]">
                <h3 className="flex items-center gap-2 text-[16px] font-bold text-[var(--ff-text)]">
                  <Icon name="local_fire_department" className="text-[20px] text-[var(--ff-caramel-strong)]" />
                  Mai ebéd ötlet
                </h3>

                <div className="mt-4 grid grid-cols-[120px_1fr] gap-4">
                  <div className="overflow-hidden rounded-[18px]">
                    <RecipeImage recipe={quickLunchRecipe} className="h-[120px] w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-[28px] font-bold leading-tight tracking-[-0.04em] text-[var(--ff-text)]">
                      {quickLunchRecipe.name}
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[rgba(225,235,210,0.92)] px-3 py-1 text-[12px] font-semibold text-[var(--ff-primary)]">
                        {isQuickRecipe(quickLunchRecipe) ? "Gyors" : getRecipeMealTypeLabel(quickLunchRecipe)}
                      </span>
                      <span className="rounded-full bg-[rgba(248,244,236,0.96)] px-3 py-1 text-[12px] font-semibold text-[var(--ff-text-muted)]">
                        {quickLunchRecipe.duration} perc
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onStartCooking(quickLunchRecipe)}
                  className="mt-5 flex w-full items-center justify-between rounded-full border border-[rgba(170,135,84,0.14)] bg-white px-5 py-4 text-[16px] font-bold text-[var(--ff-caramel-strong)]"
                >
                  Hozzáadás a mai naphoz
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(170,135,84,0.16)]">
                    <Icon name="add" className="text-[20px]" />
                  </span>
                </button>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
