"use client";

import Link from "next/link";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { getBatchRecipe, getBatchesForDate } from "@/lib/etkezes-data";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
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
  onRemoveBatch: (batchId: string) => void;
  onStartCooking: (recipe: Recipe) => void;
  onViewRecipe: (recipe: Recipe) => void;
}

const USER_NAME = "Anna";
const HERO_IMAGE = "/images/dashboard/hero-kitchen.jpg";
const LIDL_RECIPES = getUserImportedRecipes();
const FALLBACK_SHOPPING_ITEMS = ["Csirkemell", "Tejszín", "Brokkoli", "Sajt", "Tojás"];
const SHOPPING_UNITS = ["1 kg", "2 db", "1 fej", "20 dkg", "6 db"];

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Jó reggelt, ${name}`;
  if (hour < 18) return `Jó napot, ${name}`;
  return `Jó estét, ${name}`;
}

function Icon({ name, className = "text-[20px]" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function getMealForDay(day: WeekDay, batches: MealBatch[]) {
  const batch = getBatchesForDate(batches, day.dateKey)[0];
  return batch ? getBatchRecipe(batch) : undefined;
}

function HeroChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex min-w-[104px] items-center justify-center gap-2 rounded-full bg-[rgba(255,251,244,0.94)] px-4 py-2.5 text-[12px] font-extrabold text-[var(--ff-text)] shadow-[0_14px_26px_-20px_rgba(61,49,34,0.32)]">
      <Icon name={icon} className="text-[18px] text-[var(--ff-primary)]" />
      {label}
    </span>
  );
}

function WeekMealCard({
  day,
  recipe,
  onAddMeal,
  onViewRecipe,
}: {
  day: WeekDay;
  recipe?: Recipe;
  onAddMeal: () => void;
  onViewRecipe: (recipe: Recipe) => void;
}) {
  if (!recipe) {
    return (
      <button
        onClick={onAddMeal}
        className="flex min-h-[156px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[rgba(185,130,71,0.28)] bg-[rgba(255,249,237,0.54)] px-3 py-4 text-center shadow-[0_12px_30px_-28px_rgba(61,49,34,0.22)]"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(185,130,71,0.34)] text-[var(--ff-caramel-strong)]">
          <Icon name="add" className="text-[24px]" />
        </span>
        <span className="mt-3 text-[12px] font-extrabold text-[var(--ff-caramel-strong)]">Étkezés</span>
        <span className="text-[11px] font-bold text-[var(--ff-caramel-strong)]">hozzáadása</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => onViewRecipe(recipe)}
      className="min-h-[156px] overflow-hidden rounded-[18px] bg-[rgba(247,242,229,0.92)] p-3 text-left shadow-[0_14px_34px_-30px_rgba(61,49,34,0.24)]"
    >
      <div className="mb-2">
        <p className="text-[12px] font-extrabold text-[var(--ff-text)]">{day.isToday ? "Ma" : day.name}</p>
        <p className="text-[10px] font-bold text-[var(--ff-text-muted)]">{day.shortName}</p>
      </div>
      <RecipeImage recipe={recipe} className="h-[76px] w-full rounded-[13px] object-cover" />
      <h3 className="mt-2 line-clamp-2 min-h-[28px] text-[11px] font-extrabold leading-tight text-[var(--ff-text)]">{recipe.name}</h3>
      <p className="mt-1 text-[9px] font-bold text-[var(--ff-text-muted)]">+2 további étkezés</p>
    </button>
  );
}

function RecipeCard({ recipe, onViewRecipe }: { recipe: Recipe; onViewRecipe: (recipe: Recipe) => void }) {
  const isKidFriendly = (recipe.tags ?? []).includes("gyerekbarát") || Boolean(recipe.kidFriendlyNotes);

  return (
    <button
      onClick={() => onViewRecipe(recipe)}
      className="overflow-hidden rounded-[18px] bg-[rgba(255,250,241,0.88)] text-left shadow-[0_18px_36px_-30px_rgba(61,49,34,0.24)]"
    >
      <RecipeImage recipe={recipe} className="h-[120px] w-full object-cover" />
      <div className="px-4 pb-3 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[14px] font-extrabold text-[var(--ff-text)]">{recipe.name}</h3>
          <Icon name="bookmark" className="text-[18px] text-[var(--ff-text-muted)]" />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-[var(--ff-text-muted)]">
          <span className="flex items-center gap-1">
            <Icon name="schedule" className="text-[14px]" />
            {recipe.duration} perc
          </span>
          <span className="flex items-center gap-1">
            <Icon name="sentiment_satisfied" className="text-[14px]" />
            {isKidFriendly ? "Gyerekbarát" : recipe.protein}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="calendar_month" className="text-[14px]" />
            2 napra
          </span>
        </div>
      </div>
    </button>
  );
}

function ShoppingListPanel({ shoppingItems }: { shoppingItems: string[] }) {
  const visibleItems = (shoppingItems.length > 0 ? shoppingItems : FALLBACK_SHOPPING_ITEMS).slice(0, 5);

  return (
    <section className="rounded-[26px] border border-white/70 bg-[rgba(255,249,237,0.78)] p-5 shadow-[0_22px_52px_-36px_rgba(61,49,34,0.22)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-[var(--ff-text)]">
          <Icon name="shopping_basket" className="text-[18px] text-[var(--ff-primary)]" />
          Bevásárlólista
        </h2>
        <Icon name="more_vert" className="text-[18px] text-[var(--ff-text-muted)]" />
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {["Összes (24)", "Szükséges (11)", "Befejezve (13)"].map((label, index) => (
          <span
            key={label}
            className={`rounded-full px-2 py-1.5 text-center text-[9px] font-extrabold ${
              index === 0 ? "bg-[rgba(238,243,230,0.9)] text-[var(--ff-primary)]" : "text-[var(--ff-text-muted)]"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="divide-y divide-[rgba(74,67,54,0.08)]">
        {visibleItems.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-3 py-2.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                index === visibleItems.length - 1
                  ? "border-[var(--ff-primary)] bg-[var(--ff-primary)] text-white"
                  : "border-[rgba(74,67,54,0.22)]"
              }`}
            >
              {index === visibleItems.length - 1 ? <Icon name="check" className="text-[13px]" /> : null}
            </span>
            <span className="flex-1 text-[12px] font-bold text-[var(--ff-text)]">{item}</span>
            <span className="text-[11px] font-bold text-[var(--ff-text-muted)]">{SHOPPING_UNITS[index] ?? "1 db"}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[rgba(74,67,54,0.08)] pt-3">
        <button className="flex items-center gap-2 text-[11px] font-extrabold text-[var(--ff-text-muted)]">
          <Icon name="add" className="text-[16px]" />
          Hozzáadás
        </button>
        <div className="flex gap-2 text-[var(--ff-primary)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(238,243,230,0.86)]">
            <Icon name="swap_vert" className="text-[17px]" />
          </span>
          <Link href="/bevasarlas" className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(238,243,230,0.86)]">
            <Icon name="open_in_new" className="text-[16px]" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PantryIdeasPanel({
  pantryItems,
  recipes,
  onViewRecipe,
}: {
  pantryItems: string[];
  recipes: Recipe[];
  onViewRecipe: (recipe: Recipe) => void;
}) {
  const ranked = rankRecipesForPantry(recipes, pantryItems).slice(0, 3);

  return (
    <section className="rounded-[24px] border border-white/70 bg-[rgba(255,249,237,0.78)] p-4 shadow-[0_20px_48px_-36px_rgba(61,49,34,0.22)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-[var(--ff-text)]">
          <Icon name="eco" className="text-[18px] text-[var(--ff-primary)]" />
          Kamra ötletek
        </h2>
        <button className="flex items-center gap-1 text-[10px] font-bold text-[var(--ff-text-muted)]">
          Összes megtekintése
          <Icon name="arrow_forward" className="text-[14px]" />
        </button>
      </div>
      <div className="space-y-2">
        {ranked.map(({ recipe, missingIngredients }) => (
          <button
            key={recipe.id}
            onClick={() => onViewRecipe(recipe)}
            className="grid w-full grid-cols-[58px_1fr] gap-3 rounded-[15px] bg-[rgba(247,242,229,0.72)] p-2 text-left"
          >
            <RecipeImage recipe={recipe} className="h-[52px] w-[58px] rounded-[11px] object-cover" />
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-[12px] font-extrabold text-[var(--ff-text)]">{recipe.name}</h3>
              <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-snug text-[var(--ff-text-muted)]">
                {missingIngredients.length > 0
                  ? `${missingIngredients.slice(0, 2).join(", ")} kell még.`
                  : "Készíts belőle ízletes főételt."}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function SeasonalPanel({ recipe, onStartCooking }: { recipe: Recipe; onStartCooking: (recipe: Recipe) => void }) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-white/70 bg-[rgba(255,242,224,0.84)] p-4 shadow-[0_20px_48px_-36px_rgba(61,49,34,0.22)]">
      <div className="relative z-10 max-w-[58%]">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[13px] font-extrabold text-[var(--ff-text)]">Szezonális kedvencek</h2>
        </div>
        <h3 className="text-[18px] font-extrabold leading-tight tracking-[-0.03em] text-[var(--ff-primary)]">Spárga receptek</h3>
        <p className="mt-1 text-[10px] font-semibold leading-snug text-[var(--ff-text-muted)]">
          Könnyű, friss ételek a tavaszi szezonra.
        </p>
        <button
          onClick={() => onStartCooking(recipe)}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[rgba(255,251,244,0.82)] px-4 py-2 text-[11px] font-extrabold text-[var(--ff-caramel-strong)]"
        >
          Megnézem
          <Icon name="arrow_forward" className="text-[15px]" />
        </button>
      </div>
      <div className="absolute -bottom-6 right-[-18px] h-[146px] w-[178px] rotate-[-10deg] rounded-full bg-[linear-gradient(135deg,#eef3e6,#7fb06b)] shadow-[0_18px_44px_-24px_rgba(61,49,34,0.35)]" />
      <div className="absolute bottom-2 right-4 grid h-[96px] w-[126px] rotate-[-10deg] grid-cols-5 gap-1">
        {Array.from({ length: 10 }).map((_, index) => (
          <span key={index} className="h-full rounded-full bg-[linear-gradient(180deg,#f7f4d8,#6ca653)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]" />
        ))}
      </div>
    </section>
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
  openDaysCount,
  onAddMeal,
  onStartCooking,
  onViewRecipe,
}: Props) {
  const recipes = catalog.length > 0 ? catalog : LIDL_RECIPES;
  const heroRecipe = nextMealData?.recipe ?? recipes[0] ?? LIDL_RECIPES[0];
  const fallbackWeekRecipes = [
    recipes.find((recipe) => recipe.id === "gombaleves"),
    recipes.find((recipe) => recipe.id === "teszta"),
    recipes.find((recipe) => recipe.id === "csirke-curry"),
    recipes.find((recipe) => recipe.id === "sajtos-omlett"),
    recipes.find((recipe) => recipe.id === "quinoa"),
    recipes.find((recipe) => recipe.id === "lazac"),
  ].filter(Boolean) as Recipe[];
  const plannedRecipes = weekDays.map((day, index) => getMealForDay(day, batches) ?? fallbackWeekRecipes[index]);
  const recommendationSeed = [
    nextMealData?.recipe,
    recipes.find((recipe) => recipe.id === "teszta"),
    recipes.find((recipe) => recipe.id === "csirke-curry"),
    recipes.find((recipe) => recipe.id === "sajtos-omlett"),
    recipes.find((recipe) => recipe.id === "zabkasa"),
  ].filter(Boolean) as Recipe[];
  const recommended = recommendationSeed.length >= 4 ? recommendationSeed.slice(0, 4) : recipes.slice(0, 4);
  const pantryRecipes = recipes.filter((recipe) => recipe.id !== heroRecipe.id).slice(0, 8);
  const seasonalRecipe = recipes.find((recipe) => recipe.category === "Főétel") ?? heroRecipe;

  return (
    <div className="hidden min-h-screen w-full px-2.5 py-2.5 md:block">
      <div className="mx-auto grid min-h-[calc(100vh-20px)] max-w-[1780px] grid-cols-[minmax(0,1fr)_360px] gap-5 rounded-[32px] bg-[rgba(255,252,246,0.62)] px-6 py-6 shadow-[0_34px_100px_-62px_rgba(61,49,34,0.42)] backdrop-blur-[20px] 2xl:grid-cols-[minmax(0,1fr)_400px] 2xl:gap-6 2xl:px-7 2xl:py-7">
        <section className="min-w-0">
          <header className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                aria-label={USER_NAME}
                className="h-12 w-12 rounded-full border border-white/80 bg-cover bg-center shadow-[0_14px_28px_-18px_rgba(61,49,34,0.28)]"
                style={{
                  backgroundImage:
                    "url(https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80)",
                }}
              />
              <h1 className="text-[19px] font-extrabold tracking-[-0.02em] text-[var(--ff-text)]">{getGreeting(USER_NAME)}</h1>
            </div>
          </header>

          <section className="relative min-h-[266px] overflow-hidden rounded-[24px] bg-[var(--ff-primary)] px-8 py-7 text-white shadow-[0_28px_58px_-32px_rgba(61,49,34,0.5)] 2xl:min-h-[300px] 2xl:px-9 2xl:py-8">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(48,31,15,0.82)_0%,rgba(54,35,18,0.52)_48%,rgba(38,24,10,0.16)_100%)]" />
            <div className="relative flex min-h-[212px] flex-col justify-between 2xl:min-h-[236px]">
              <div>
                <p className="mb-4 flex items-center gap-2 text-[12px] font-extrabold text-[rgba(255,246,230,0.96)]">
                  <Icon name="restaurant_menu" className="text-[18px] text-[#f0ae1c]" />
                  Étkezés tervező
                </p>
                <h2 className="max-w-[640px] text-[44px] font-extrabold leading-[0.98] tracking-[-0.055em] text-[rgba(255,252,246,1)] 2xl:text-[52px]">
                  Mit főzzünk ezen a héten?
                </h2>
                <p className="mt-4 max-w-[560px] text-[17px] font-medium leading-snug text-[rgba(255,244,228,0.96)] 2xl:text-[19px]">
                  Tervezd meg az étkezéseket egyszerűen, spórolj időt, pénzt és energiát a családnak.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <HeroChip icon="bolt" label="Gyors" />
                <HeroChip icon="sentiment_satisfied" label="Gyerekbarát" />
                <HeroChip icon="calendar_month" label="2 napra" />
                <HeroChip icon="schedule" label="30 perc" />
                <button
                  onClick={onAddMeal}
                  className="ml-auto flex min-w-[270px] items-center justify-between rounded-full bg-[linear-gradient(135deg,#e39b3d,#c97f2a)] py-3 pl-8 pr-2.5 text-[15px] font-extrabold text-[var(--ff-text-inverse)] shadow-[0_20px_40px_-22px_rgba(185,130,71,0.7)] 2xl:min-w-[310px]"
                >
                  Kaja hozzáadása
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#be7628]">
                    <Icon name="add" className="text-[25px]" />
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[16px] font-extrabold text-[var(--ff-text)]">Heti étkezéstervező</h2>
              <span className="text-[11px] font-extrabold text-[var(--ff-text-muted)]">
                {plannedDaysCount} nap tervezve · {openDaysCount} nyitott
              </span>
            </div>
            <div className="grid grid-cols-7 gap-3">
              {weekDays.slice(0, 7).map((day, index) => (
                <WeekMealCard
                  key={day.dateKey}
                  day={day}
                  recipe={index === 6 && !getMealForDay(day, batches) ? undefined : plannedRecipes[index]}
                  onAddMeal={onAddMeal}
                  onViewRecipe={onViewRecipe}
                />
              ))}
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-[var(--ff-text)]">Ajánlott receptek</h2>
              <Link href="/etkezes" className="flex items-center gap-1 text-[11px] font-bold text-[var(--ff-text-muted)]">
                Összes recept megtekintése
                <Icon name="arrow_forward" className="text-[15px]" />
              </Link>
            </div>
            <div className="relative grid grid-cols-4 gap-4">
              {recommended.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onViewRecipe={onViewRecipe} />
              ))}
              <button
                onClick={onAddMeal}
                className="absolute right-[-16px] top-[58px] flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--ff-caramel-strong)] shadow-[0_18px_36px_-20px_rgba(61,49,34,0.24)]"
                aria-label="További receptek"
              >
                <Icon name="arrow_forward" className="text-[24px]" />
              </button>
            </div>
          </section>
        </section>

        <aside className="min-w-0 space-y-5">
          <div className="flex justify-end">
            <button className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.86)] text-[var(--ff-text)] shadow-[0_14px_28px_-20px_rgba(61,49,34,0.25)]">
              <Icon name="notifications" className="text-[22px]" />
              <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-[#ed872d]" />
            </button>
          </div>

          <ShoppingListPanel shoppingItems={shoppingItems} />
          <PantryIdeasPanel pantryItems={pantryItems} recipes={pantryRecipes} onViewRecipe={onViewRecipe} />
          <SeasonalPanel recipe={seasonalRecipe} onStartCooking={onStartCooking} />

        </aside>
      </div>
    </div>
  );
}
