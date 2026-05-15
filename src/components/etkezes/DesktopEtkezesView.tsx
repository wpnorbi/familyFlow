"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { getBatchRecipe, getBatchesForDate } from "@/lib/etkezes-data";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import { getRecipeMealTypeLabel, isKidFriendlyRecipe } from "@/lib/recipes/recipe-taxonomy";
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
  onAddMeal: () => void;
  onOpenRecipeLibrary: () => void;
  onRemoveBatch: (batchId: string) => void;
  onStartCooking: (recipe: Recipe) => void;
  onViewRecipe: (recipe: Recipe) => void;
}

const USER_NAME = "Anna";
const HERO_IMAGE = "/images/dashboard/hero-kitchen.jpg";
const ALL_RECIPES = getUserImportedRecipes();
const LIDL_RECIPES = ALL_RECIPES.filter((r) => r.sourceName === "Lidl Konyha" && r.image);
const FALLBACK_SHOPPING = ["Csirkemell", "Tejszín", "Brokkoli", "Sajt", "Tojás"];
const FALLBACK_UNITS = ["1 kg", "2 dl", "1 fej", "20 dkg", "6 db"];
const HU_WEEKEND = ["Szombat", "Vasárnap"];

function getGreeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `Jó reggelt, ${name}!`;
  if (h < 18) return `Jó napot, ${name}!`;
  return `Jó estét, ${name}!`;
}

function Icon({ name, className = "text-[20px]" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function getMealForDay(day: WeekDay, batches: MealBatch[]) {
  const batch = getBatchesForDate(batches, day.dateKey)[0];
  return batch ? getBatchRecipe(batch) : undefined;
}

// ─── Filter chip (toggleable) ─────────────────────────────────────────────────

function FilterChip({
  icon,
  label,
  selected,
  onToggle,
}: {
  icon: string;
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-extrabold transition-all hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2 ${
        selected
          ? "border-[rgba(90,112,80,0.40)] bg-[rgba(150,192,114,0.96)] text-[var(--ff-primary-strong)] shadow-[0_6px_16px_-8px_rgba(55,80,45,0.30)]"
          : "border-[rgba(170,135,84,0.18)] bg-[rgba(255,248,232,0.96)] text-[var(--ff-text)] shadow-[0_4px_10px_-6px_rgba(61,49,34,0.18)] hover:bg-[rgba(255,242,218,0.99)]"
      }`}
    >
      <Icon name={icon} className={`text-[15px] ${selected ? "text-[var(--ff-primary-strong)]" : "text-[var(--ff-primary)]"}`} />
      {label}
      {selected && <Icon name="check" className="text-[13px]" />}
    </button>
  );
}

const FILTERS = [
  { key: "gyors",       icon: "bolt",               label: "Gyors"       },
  { key: "gyerekbarat", icon: "sentiment_satisfied", label: "Gyerekbarát" },
  { key: "kamra",       icon: "inventory_2",         label: "Kamrából"    },
  { key: "30perc",      icon: "schedule",            label: "30 perc"     },
] as const;

type FilterKey = typeof FILTERS[number]["key"];

const MODES = [
  { key: "heti",    label: "Heti terv"   },
  { key: "ma",      label: "Ma főzök"    },
  { key: "kamra",   label: "Kamrából"    },
  { key: "receptek", label: "Recepttár"  },
] as const;

type ModeKey = typeof MODES[number]["key"];

// ─── Notification popover (same pattern as dashboard) ────────────────────────

interface NotifItem { icon: string; text: string; sub: string; href: string }

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

// ─── Week day card ─────────────────────────────────────────────────────────────

function WeekDayCard({
  day,
  recipe,
  isWeekend,
  onAddMeal,
  onViewRecipe,
}: {
  day: WeekDay;
  recipe?: Recipe;
  isWeekend: boolean;
  onAddMeal: () => void;
  onViewRecipe: (recipe: Recipe) => void;
}) {
  const dayLabel = day.isToday ? "Ma" : day.name;

  if (!recipe) {
    return (
      <button
        onClick={onAddMeal}
        aria-label={`Étkezés hozzáadása: ${dayLabel}`}
        className={`group flex min-h-[168px] flex-col overflow-hidden rounded-[20px] border-dashed text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2 ${
          day.isToday
            ? "border-2 border-[rgba(90,112,80,0.38)] bg-[rgba(225,240,210,0.72)] hover:bg-[rgba(215,234,196,0.88)]"
            : isWeekend
            ? "border border-[rgba(185,130,71,0.24)] bg-[rgba(255,247,234,0.62)] hover:bg-[rgba(255,242,220,0.80)]"
            : "border border-[rgba(185,130,71,0.28)] bg-[rgba(255,249,237,0.54)] hover:bg-[rgba(255,245,222,0.78)]"
        }`}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-3 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(185,130,71,0.32)] bg-[rgba(255,248,232,0.92)] text-[var(--ff-caramel-strong)] transition-transform group-hover:scale-105">
            <Icon name="add" className="text-[22px]" />
          </span>
          <div>
            <p className={`text-[11px] font-extrabold ${day.isToday ? "text-[var(--ff-primary)]" : "text-[var(--ff-caramel-strong)]"}`}>
              {dayLabel}
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-[var(--ff-text-muted)]">Hozzáadás</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onViewRecipe(recipe)}
      aria-label={`${dayLabel}: ${recipe.name}`}
      className={`group flex min-h-[168px] flex-col overflow-hidden rounded-[20px] text-left shadow-[0_10px_28px_-20px_rgba(61,49,34,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgba(61,49,34,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2 ${
        day.isToday
          ? "border-2 border-[rgba(90,112,80,0.40)] bg-[rgba(255,249,235,0.97)]"
          : isWeekend
          ? "border border-[rgba(185,130,71,0.20)] bg-[rgba(255,249,235,0.97)]"
          : "border border-[rgba(170,135,84,0.15)] bg-[rgba(255,249,235,0.97)]"
      }`}
    >
      <div className="relative h-[96px] w-full overflow-hidden">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
        {day.isToday && (
          <span className="absolute left-2 top-2 rounded-full bg-[rgba(55,67,50,0.90)] px-2 py-0.5 text-[9px] font-extrabold text-white">
            Ma
          </span>
        )}
        {isWeekend && !day.isToday && (
          <span className="absolute left-2 top-2 rounded-full bg-[rgba(185,130,71,0.85)] px-2 py-0.5 text-[9px] font-extrabold text-white">
            {day.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between px-3 pb-2.5 pt-2">
        <div>
          {!isWeekend && <p className="text-[10px] font-bold text-[var(--ff-text-muted)]">{dayLabel}</p>}
          <h3 className="mt-0.5 line-clamp-2 text-[11px] font-extrabold leading-tight text-[var(--ff-text)]">
            {recipe.name}
          </h3>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[9.5px] font-bold text-[var(--ff-text-muted)]">
          <Icon name="schedule" className="text-[12px]" />
          {recipe.duration} perc
        </div>
      </div>
    </button>
  );
}

// ─── Recipe card (3-up, with bookmarking) ────────────────────────────────────

function RecipeCard({
  recipe,
  bookmarked,
  onViewRecipe,
  onToggleBookmark,
}: {
  recipe: Recipe;
  bookmarked: boolean;
  onViewRecipe: (recipe: Recipe) => void;
  onToggleBookmark: (recipe: Recipe) => void;
}) {
  const isKidFriendly = isKidFriendlyRecipe(recipe);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onViewRecipe(recipe)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onViewRecipe(recipe); }}
      aria-label={`${recipe.name} recept megnyitása`}
      className="cursor-pointer overflow-hidden rounded-[20px] border border-[rgba(170,135,84,0.13)] bg-[rgba(255,249,235,0.97)] shadow-[0_16px_36px_-26px_rgba(61,49,34,0.26)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-26px_rgba(61,49,34,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
    >
      <RecipeImage recipe={recipe} className="h-[140px] w-full object-cover 2xl:h-[158px]" />
      <div className="px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[14px] font-extrabold tracking-[-0.022em] text-[var(--ff-text)]">
            {recipe.name}
          </h3>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(recipe); }}
            aria-label={bookmarked ? `${recipe.name} mentés eltávolítása` : `${recipe.name} mentése`}
            title={bookmarked ? "Mentés eltávolítása" : "Mentés"}
            className="mt-0.5 shrink-0 text-[var(--ff-text-muted)] transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-1"
          >
            <Icon
              name={bookmarked ? "bookmark" : "bookmark_border"}
              className={`text-[18px] ${bookmarked ? "text-[var(--ff-caramel-strong)]" : "opacity-50"}`}
            />
          </button>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10.5px] font-semibold text-[var(--ff-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <Icon name="schedule" className="text-[14px]" />
            {recipe.duration} perc
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="sentiment_satisfied" className="text-[14px]" />
            {isKidFriendly ? "Gyerekbarát" : getRecipeMealTypeLabel(recipe)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="calendar_month" className="text-[14px]" />
            2 napra
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Shopping list panel ──────────────────────────────────────────────────────

function ShoppingListPanel({
  shoppingItems,
  onAddMeal,
}: {
  shoppingItems: string[];
  onAddMeal: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"osszes" | "szukseges" | "kesz">("osszes");
  const [doneItems, setDoneItems] = useState<Set<string>>(new Set());

  const rawItems = shoppingItems.length > 0 ? shoppingItems : FALLBACK_SHOPPING;
  const units = shoppingItems.length > 0 ? rawItems.map(() => "1 db") : FALLBACK_UNITS;
  const isEmpty = shoppingItems.length === 0 && doneItems.size === 0;

  const visibleItems = rawItems
    .map((item, i) => ({ item, unit: units[i] ?? "1 db", done: doneItems.has(item) }))
    .filter(({ done }) =>
      activeTab === "osszes" ? true : activeTab === "kesz" ? done : !done
    )
    .slice(0, 6);

  const toggleDone = (item: string) => {
    setDoneItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next;
    });
  };

  const TABS = [
    { key: "osszes",    label: `Összes (${rawItems.length})` },
    { key: "szukseges", label: `Szükséges (${rawItems.length - doneItems.size})` },
    { key: "kesz",      label: `Kész (${doneItems.size})` },
  ] as const;

  return (
    <section className="rounded-[26px] border border-[rgba(170,135,84,0.16)] bg-[rgba(255,249,237,0.96)] p-5 shadow-[0_22px_52px_-36px_rgba(61,49,34,0.26)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-[var(--ff-text)]">
          <Icon name="shopping_basket" className="text-[18px] text-[var(--ff-primary)]" />
          Bevásárlólista
        </h2>
        <Link href="/bevasarlas" aria-label="Teljes bevásárlólista megnyitása" className="flex items-center gap-1 text-[10px] font-bold text-[var(--ff-text-muted)] hover:opacity-70">
          Megnyitás
          <Icon name="open_in_new" className="text-[14px]" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-full px-2.5 py-1.5 text-[10px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-1 ${
              activeTab === key
                ? "bg-[rgba(210,228,192,0.96)] text-[var(--ff-primary)]"
                : "text-[var(--ff-text-muted)] hover:bg-[rgba(255,245,222,0.80)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div className="py-3 text-center">
          <p className="text-[11.5px] font-bold text-[var(--ff-text-muted)]">
            A lista a heti terv alapján fog frissülni.
          </p>
          <button
            onClick={onAddMeal}
            className="mt-2 text-[11px] font-extrabold text-[var(--ff-primary)] underline-offset-2 hover:underline"
          >
            Étkezés hozzáadása →
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[rgba(170,135,84,0.08)]">
          {visibleItems.map(({ item, unit, done }) => (
            <div key={item} className="flex items-center gap-3 py-2.5">
              <button
                onClick={() => toggleDone(item)}
                aria-label={done ? `${item} visszajelölése` : `${item} kipipálása`}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] ${
                  done
                    ? "border-[var(--ff-primary)] bg-[var(--ff-primary)] text-white"
                    : "border-[rgba(170,135,84,0.35)] hover:border-[var(--ff-primary)]"
                }`}
              >
                {done && <Icon name="check" className="text-[12px]" />}
              </button>
              <span className={`flex-1 text-[12px] font-bold ${done ? "text-[var(--ff-text-muted)] line-through" : "text-[var(--ff-text)]"}`}>
                {item}
              </span>
              <span className="text-[11px] font-bold text-[var(--ff-text-muted)]">{unit}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-[rgba(170,135,84,0.10)] pt-3">
        <button
          className="flex items-center gap-1.5 text-[11px] font-extrabold text-[var(--ff-text-muted)] hover:text-[var(--ff-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)]"
          aria-label="Tétel hozzáadása a bevásárlólistához"
        >
          <Icon name="add" className="text-[16px]" />
          Hozzáadás
        </button>
        <span className="text-[10px] font-bold text-[var(--ff-text-muted)]">
          {doneItems.size}/{rawItems.length} kész
        </span>
      </div>
    </section>
  );
}

// ─── Pantry ideas panel ───────────────────────────────────────────────────────

function PantryIdeasPanel({
  pantryItems,
  onViewRecipe,
}: {
  pantryItems: string[];
  onViewRecipe: (recipe: Recipe) => void;
}) {
  const ranked = useMemo(
    () => rankRecipesForPantry(LIDL_RECIPES, pantryItems).slice(0, 3),
    [pantryItems]
  );

  return (
    <section className="rounded-[24px] border border-[rgba(170,135,84,0.16)] bg-[rgba(255,249,237,0.96)] p-4 shadow-[0_18px_44px_-34px_rgba(61,49,34,0.24)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-[var(--ff-text)]">
          <Icon name="eco" className="text-[18px] text-[var(--ff-primary)]" />
          Kamra ötletek
        </h2>
        <Link href="/kamra" className="flex items-center gap-1 text-[10px] font-bold text-[var(--ff-text-muted)] hover:opacity-70">
          Összes
          <Icon name="chevron_right" className="text-[14px]" />
        </Link>
      </div>

      {pantryItems.length === 0 ? (
        <div className="py-3 text-center">
          <p className="text-[11.5px] font-bold text-[var(--ff-text-muted)]">A kamra még nincs feltöltve.</p>
          <Link href="/kamra" className="mt-2 block text-[11px] font-extrabold text-[var(--ff-primary)] hover:underline">
            Kamra feltöltése →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {ranked.map(({ recipe, missingIngredients }) => (
            <button
              key={recipe.id}
              onClick={() => onViewRecipe(recipe)}
              aria-label={`${recipe.name}: ${missingIngredients.length === 0 ? "minden megvan" : `${missingIngredients.length} hozzávaló hiányzik`}`}
              className="grid w-full grid-cols-[52px_1fr] gap-3 rounded-[16px] border border-[rgba(170,135,84,0.12)] bg-[rgba(248,242,228,0.88)] p-2.5 text-left transition-all hover:bg-[rgba(244,236,218,0.96)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)]"
            >
              {/* Image with fallback */}
              {recipe.image ? (
                <RecipeImage recipe={recipe} className="h-[52px] w-[52px] rounded-[12px] object-cover" />
              ) : (
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[12px] bg-[rgba(210,228,192,0.70)] text-[var(--ff-primary)]">
                  <Icon name="restaurant" className="text-[22px] opacity-70" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="line-clamp-1 text-[12px] font-extrabold text-[var(--ff-text)]">{recipe.name}</h3>
                <p className={`mt-0.5 text-[10px] font-semibold ${missingIngredients.length === 0 ? "text-[var(--ff-primary)]" : "text-[var(--ff-caramel-strong)]"}`}>
                  {missingIngredients.length === 0 ? "Minden megvan otthon" : `${missingIngredients.length} hozzávaló hiányzik`}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[9.5px] font-semibold text-[var(--ff-text-muted)]">
                  {missingIngredients.length === 0 ? "Azonnal elkészíthető" : missingIngredients.slice(0, 2).join(", ")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Seasonal panel ───────────────────────────────────────────────────────────

function SeasonalPanel({ recipe, onStartCooking }: { recipe: Recipe; onStartCooking: (r: Recipe) => void }) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-[rgba(195,148,70,0.22)] bg-[linear-gradient(140deg,rgba(255,228,178,0.99),rgba(246,208,150,0.94))] p-4 shadow-[0_16px_40px_-28px_rgba(140,88,20,0.36)]">
      <div className="relative z-10 max-w-[60%]">
        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-[rgba(100,62,14,0.60)]">Szezonális</p>
        <h3 className="text-[16px] font-extrabold leading-tight tracking-tight text-[rgba(72,44,10,0.92)]">Tavaszi kedvencek</h3>
        <p className="mt-1 text-[10.5px] font-semibold leading-snug text-[rgba(100,62,14,0.68)]">Friss, könnyű ételek a szezonra.</p>
        <button
          onClick={() => onStartCooking(recipe)}
          aria-label="Szezonális receptek megtekintése"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#d98a28,#c07018)] px-4 py-2 text-[11px] font-extrabold text-white shadow-[0_8px_20px_-10px_rgba(180,100,16,0.52)] transition-all hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Megnézem
          <Icon name="arrow_forward" className="text-[15px]" />
        </button>
      </div>
      <div className="absolute -bottom-8 right-[-20px] h-[148px] w-[148px] rounded-full bg-[linear-gradient(135deg,rgba(238,243,226,0.80),rgba(142,186,100,0.70))] blur-[2px]" />
      <div className="absolute bottom-3 right-5 grid h-[80px] w-[110px] rotate-[-8deg] grid-cols-4 gap-1 opacity-80">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="rounded-full bg-[linear-gradient(180deg,rgba(248,246,224,0.9),#6ca653)]" />
        ))}
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DesktopEtkezesView({
  nextMealData: _nextMealData,
  weekDays,
  batches,
  shoppingItems,
  pantryItems,
  catalog,
  plannedDaysCount,
  openDaysCount,
  onAddMeal,
  onOpenRecipeLibrary,
  onRemoveBatch: _onRemoveBatch,
  onStartCooking,
  onViewRecipe,
}: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
  const [activeMode, setActiveMode] = useState<ModeKey>("heti");
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNotifPopover) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifPopover]);

  const toggleFilter = useCallback((key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((recipe: Recipe) => {
    setSavedRecipes((prev) => {
      const next = new Set(prev);
      if (next.has(recipe.id)) next.delete(recipe.id); else next.add(recipe.id);
      return next;
    });
  }, []);

  const handleModeChange = useCallback((mode: ModeKey) => {
    setActiveMode(mode);
    if (mode === "receptek") onOpenRecipeLibrary();
  }, [onOpenRecipeLibrary]);

  // ── Recipe filtering ───────────────────────────────────────────────────────
  const filteredRecipes = useMemo(() => {
    let pool = LIDL_RECIPES;
    if (activeFilters.has("gyors") || activeFilters.has("30perc")) {
      pool = pool.filter((r) => r.duration <= 30);
    }
    if (activeFilters.has("gyerekbarat")) {
      pool = pool.filter((r) => isKidFriendlyRecipe(r));
    }
    if (activeFilters.has("kamra") && pantryItems.length > 0) {
      const ranked = rankRecipesForPantry(pool, pantryItems);
      pool = ranked.map((r) => r.recipe);
    }
    if (pool.length === 0) return [];
    return pool
      .sort((a, b) => {
        const aK = Number(isKidFriendlyRecipe(a)), bK = Number(isKidFriendlyRecipe(b));
        const aQ = Number(a.duration <= 30), bQ = Number(b.duration <= 30);
        return bK - aK || bQ - aQ || a.duration - b.duration;
      })
      .slice(0, 3);
  }, [activeFilters, pantryItems]);

  // ── Data ───────────────────────────────────────────────────────────────────
  const recipes = catalog.length > 0 ? catalog : [];

  const plannedRecipes = weekDays.map((day, i) =>
    i === 6 && !getMealForDay(day, batches) ? undefined : getMealForDay(day, batches) ?? undefined
  );

  const seasonalRecipe = LIDL_RECIPES.find((r) => r.category === "Főétel") ?? LIDL_RECIPES[0];

  const notifItems = useMemo<NotifItem[]>(() => {
    const items: NotifItem[] = [];
    if (plannedDaysCount < 7)
      items.push({ icon: "restaurant", text: `${7 - plannedDaysCount} nap nincs tervezve`, sub: "Egészítsd ki a heti tervet", href: "#planner" });
    if (shoppingItems.length > 0)
      items.push({ icon: "shopping_basket", text: `${shoppingItems.length} tétel a listán`, sub: "Tekintsd át a bevásárlólistát", href: "/bevasarlas" });
    if (pantryItems.length === 0)
      items.push({ icon: "inventory_2", text: "A kamra feltöltésre vár", sub: "Adj hozzá alapanyagokat", href: "/kamra" });
    return items;
  }, [plannedDaysCount, shoppingItems.length, pantryItems.length]);

  return (
    <div className="hidden min-h-screen w-full px-3 py-3 md:block">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1780px] flex-col rounded-[32px] bg-[linear-gradient(180deg,rgba(246,235,216,0.78)_0%,rgba(248,240,226,0.86)_15%,rgba(250,244,234,0.92)_40%)] px-6 py-6 shadow-[0_44px_120px_-72px_rgba(50,34,14,0.56),inset_0_0_0_1px_rgba(175,140,88,0.13)] backdrop-blur-[22px] 2xl:px-8 2xl:py-7">

        {/* ══ FULL-WIDTH HEADER ════════════════════════════════════════════════ */}
        <header className="mb-5 flex items-center justify-between gap-4 2xl:mb-6">
          <Link
            href="/beallitasok"
            aria-label="Profil és beállítások"
            className="flex items-center gap-3.5 rounded-[20px] px-1 py-1 transition-colors hover:bg-[rgba(255,248,232,0.60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
          >
            <div
              aria-hidden
              className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[rgba(255,246,228,0.9)] bg-cover bg-center shadow-[0_10px_24px_-14px_rgba(61,49,34,0.32)]"
              style={{ backgroundImage: "url(https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80)" }}
            />
            <div>
              <h1 className="text-[18px] font-extrabold tracking-[-0.025em] text-[var(--ff-text)]">
                {getGreeting(USER_NAME)}
              </h1>
              <p className="text-[11px] font-semibold text-[var(--ff-text-muted)]">Étkezés tervező</p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenRecipeLibrary}
              aria-label="Recepttár megnyitása"
              className="flex items-center gap-2 rounded-full border border-[rgba(170,135,84,0.18)] bg-[rgba(255,248,232,0.94)] px-4 py-2.5 text-[13px] font-extrabold text-[var(--ff-primary)] shadow-[0_8px_18px_-12px_rgba(61,49,34,0.22)] transition-all hover:bg-[rgba(255,242,215,0.99)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
            >
              <Icon name="menu_book" className="text-[18px]" />
              Recepttár
            </button>

            {/* Notification bell + popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifPopover((v) => !v)}
                aria-label={`Értesítések${notifItems.length > 0 ? ` — ${notifItems.length} új` : ""}`}
                aria-expanded={showNotifPopover}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(170,135,84,0.16)] bg-[rgba(255,248,232,0.94)] text-[var(--ff-text)] shadow-[0_8px_18px_-12px_rgba(61,49,34,0.22)] transition-all hover:bg-[rgba(255,243,218,0.99)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
              >
                <Icon name="notifications" className="text-[20px]" />
                {notifItems.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#e8821e] shadow-[0_0_0_1.5px_rgba(248,239,224,0.95)]" />
                )}
              </button>
              {showNotifPopover && (
                <NotificationPopover items={notifItems} onClose={() => setShowNotifPopover(false)} />
              )}
            </div>

            <Link
              href="/beallitasok"
              aria-label="Beállítások"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(170,135,84,0.16)] bg-[rgba(255,248,232,0.94)] text-[var(--ff-text)] shadow-[0_8px_18px_-12px_rgba(61,49,34,0.22)] transition-all hover:bg-[rgba(255,243,218,0.99)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
            >
              <Icon name="settings" className="text-[20px]" />
            </Link>
          </div>
        </header>

        {/* ══ TWO-COLUMN GRID ══════════════════════════════════════════════════ */}
        <div className="grid flex-1 grid-cols-[minmax(0,1fr)_360px] gap-5 2xl:grid-cols-[minmax(0,1fr)_400px] 2xl:gap-6">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
          <section className="min-w-0">

            {/* ── Hero ────────────────────────────────────────────────────────── */}
            <section className="relative min-h-[280px] overflow-hidden rounded-[26px] shadow-[0_30px_64px_-36px_rgba(36,20,6,0.56)] 2xl:min-h-[312px]">
              <div className="absolute inset-0">
                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(28,14,4,0.88)_0%,rgba(44,24,6,0.54)_44%,rgba(26,12,2,0.18)_100%)]" />

              <div className="relative flex min-h-[280px] flex-col justify-between px-8 py-7 2xl:min-h-[312px] 2xl:px-10 2xl:py-8">
                <p className="flex items-center gap-2 text-[12.5px] font-bold text-[rgba(255,234,190,0.88)]">
                  <Icon name="restaurant_menu" className="text-[18px] text-[#f0ae1c]" />
                  Étkezés tervező
                </p>

                <div>
                  <h2 className="max-w-[520px] text-[42px] font-extrabold leading-[0.94] tracking-[-0.055em] text-[rgba(255,252,242,1)] 2xl:text-[50px]">
                    Mit főzzünk<br />ezen a héten?
                  </h2>
                  <p className="mt-4 max-w-[380px] text-[16px] font-medium leading-snug text-[rgba(255,238,212,0.90)] 2xl:mt-5">
                    Tervezd meg az étkezéseket egyszerűen, spórolj időt és energiát.
                  </p>

                  <div className="mt-6 flex items-center gap-3">
                    <button
                      onClick={onAddMeal}
                      aria-label="Heti étkezéstervező indítása"
                      className="inline-flex items-center justify-between gap-5 rounded-full bg-[linear-gradient(135deg,#e8a040,#cc7c22)] py-3 pl-7 pr-2.5 text-[15px] font-extrabold text-white shadow-[0_20px_44px_-22px_rgba(200,118,28,0.82)] transition-all hover:-translate-y-0.5 hover:shadow-[0_26px_52px_-20px_rgba(200,118,28,0.94)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(40,20,5,0.6)] 2xl:py-3.5 2xl:pl-8"
                    >
                      Heti terv indítása
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#c07826]">
                        <Icon name="add" className="text-[22px]" />
                      </span>
                    </button>
                    <button
                      onClick={onOpenRecipeLibrary}
                      aria-label="Recepttár böngészése"
                      className="inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-[rgba(255,248,230,0.18)] py-3 pl-6 pr-5 text-[14px] font-extrabold text-[rgba(255,248,228,0.95)] backdrop-blur-sm transition-all hover:bg-[rgba(255,248,230,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <Icon name="menu_book" className="text-[18px] text-[rgba(255,220,150,0.95)]" />
                      Recepttár
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Filter + mode control bar ─────────────────────────────────────── */}
            <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-[rgba(170,135,84,0.16)] bg-[rgba(255,249,237,0.94)] px-4 py-3 shadow-[0_8px_20px_-14px_rgba(61,49,34,0.16)]">
              <span className="shrink-0 text-[11px] font-extrabold text-[var(--ff-text-muted)]">Szűrők:</span>
              <div className="flex items-center gap-2">
                {FILTERS.map(({ key, icon, label }) => (
                  <FilterChip
                    key={key}
                    icon={icon}
                    label={label}
                    selected={activeFilters.has(key)}
                    onToggle={() => toggleFilter(key)}
                  />
                ))}
                {activeFilters.size > 0 && (
                  <button
                    onClick={() => setActiveFilters(new Set())}
                    className="text-[10px] font-extrabold text-[var(--ff-text-muted)] hover:text-[var(--ff-primary)] transition-colors"
                    aria-label="Szűrők törlése"
                  >
                    Törlés
                  </button>
                )}
              </div>
              <div className="mx-1 h-5 w-px shrink-0 bg-[rgba(170,135,84,0.16)]" />
              <div className="ml-auto flex items-center gap-1.5">
                {MODES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleModeChange(key)}
                    aria-pressed={activeMode === key}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] ${
                      activeMode === key
                        ? "bg-[rgba(210,228,192,0.97)] text-[var(--ff-primary)]"
                        : "text-[var(--ff-text-muted)] hover:bg-[rgba(255,248,232,0.88)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Heti tervező ─────────────────────────────────────────────────── */}
            <section id="planner" className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[16px] font-extrabold tracking-[-0.02em] text-[var(--ff-text)]">
                  Heti étkezéstervező
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-extrabold text-[var(--ff-text-muted)]">
                    {plannedDaysCount} nap tervezve · {openDaysCount} nyitott
                  </span>
                  <button
                    onClick={onAddMeal}
                    aria-label="Új étkezés hozzáadása"
                    className="flex items-center gap-1.5 rounded-full bg-[rgba(210,228,192,0.97)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--ff-primary)] transition-all hover:bg-[rgba(196,218,176,0.99)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)]"
                  >
                    <Icon name="add" className="text-[14px]" />
                    Étkezés hozzáadása
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2.5">
                {weekDays.slice(0, 7).map((day, i) => (
                  <WeekDayCard
                    key={day.dateKey}
                    day={day}
                    recipe={plannedRecipes[i]}
                    isWeekend={HU_WEEKEND.includes(day.name)}
                    onAddMeal={onAddMeal}
                    onViewRecipe={onViewRecipe}
                  />
                ))}
              </div>
            </section>

            {/* ── Ajánlott receptek (3 larger cards) ───────────────────────────── */}
            <section className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-[var(--ff-text)]">
                    Ajánlott receptek
                  </h2>
                  {activeFilters.size > 0 && (
                    <span className="rounded-full bg-[rgba(210,228,192,0.96)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--ff-primary)]">
                      {activeFilters.size} szűrő aktív
                    </span>
                  )}
                </div>
                <button
                  onClick={onOpenRecipeLibrary}
                  className="flex items-center gap-1 text-[12px] font-bold text-[var(--ff-text-muted)] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)]"
                >
                  Összes recept
                  <Icon name="chevron_right" className="text-[16px]" />
                </button>
              </div>

              {filteredRecipes.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[20px] border border-[rgba(170,135,84,0.14)] bg-[rgba(255,249,237,0.80)] py-10 text-center">
                  <Icon name="search_off" className="text-[36px] text-[var(--ff-text-muted)] opacity-40" />
                  <p className="text-[13px] font-bold text-[var(--ff-text-muted)]">Nincs pontos találat a szűrőkre.</p>
                  <button
                    onClick={() => setActiveFilters(new Set())}
                    className="rounded-full bg-[rgba(210,228,192,0.96)] px-4 py-2 text-[12px] font-extrabold text-[var(--ff-primary)]"
                  >
                    Szűrők törlése
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 2xl:gap-5">
                  {filteredRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      bookmarked={savedRecipes.has(recipe.id)}
                      onViewRecipe={onViewRecipe}
                      onToggleBookmark={toggleBookmark}
                    />
                  ))}
                </div>
              )}
            </section>
          </section>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
          <aside className="flex min-w-0 flex-col gap-4 2xl:gap-5">
            <ShoppingListPanel shoppingItems={shoppingItems} onAddMeal={onAddMeal} />
            <PantryIdeasPanel pantryItems={pantryItems} onViewRecipe={onViewRecipe} />
            <SeasonalPanel recipe={seasonalRecipe ?? LIDL_RECIPES[0]} onStartCooking={onStartCooking} />
          </aside>

        </div>{/* end two-column grid */}
      </div>
    </div>
  );
}
