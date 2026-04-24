import type { Recipe, MealBatch } from "@/types/etkezes";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";

interface NextMealData {
  recipe: Recipe;
  batch: MealBatch;
  nextEatDate: string;
  isCookDay: boolean;
}

interface Props {
  nextMealData: NextMealData | null;
  pantryItems: string[];
  shoppingItems: string[];
  plannedDaysCount: number;
  openDaysCount: number;
  onAddMeal: () => void;
  onStartCooking?: (recipe: Recipe) => void;
  onViewRecipe?: (recipe: Recipe) => void;
}

const MONTHS = ["jan.", "febr.", "már.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."];

function getDifficultyLabel(duration: number): string {
  if (duration <= 20) return "Könnyű";
  if (duration <= 40) return "Közepes nehézség";
  return "Komolyabb főzés";
}

function getMealMomentLabel(isCookDay: boolean, dateLabel: string): string {
  return isCookDay ? "Ma, vacsora" : `${dateLabel}, étkezés`;
}

function TinyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/55 bg-white/82 px-2.5 py-1 text-[10px] font-semibold text-on-surface shadow-[0_8px_14px_-12px_rgba(21,36,28,0.35)]">
      <span className="text-outline">{label}</span> {value}
    </div>
  );
}

export default function NextMealHero({
  nextMealData,
  pantryItems,
  shoppingItems,
  plannedDaysCount,
  openDaysCount,
  onAddMeal,
  onStartCooking,
  onViewRecipe,
}: Props) {
  if (!nextMealData) {
    return (
      <section className="rounded-[28px] border border-primary/20 bg-[linear-gradient(135deg,rgba(214,227,212,0.52),rgba(255,255,255,0.98)_35%,rgba(247,243,238,0.95)_100%)] px-4 py-3.5 shadow-[0_24px_36px_-26px_rgba(37,55,43,0.35)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-outline">Következő étkezés</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-on-surface">Még nincs betervezve semmi</h1>
              <TinyStat label="Heti terv" value={`${plannedDaysCount}/7 nap`} />
              <TinyStat label="Nyitott" value={`${openDaysCount} nap`} />
              <TinyStat label="Lista" value={`${shoppingItems.length} tétel`} />
            </div>
            <p className="mt-1.5 text-xs text-on-surface-variant">
              Válassz egy ebédet vagy vacsorát, és már indulhat is a hét.
            </p>
          </div>

          <button
            onClick={onAddMeal}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/15 bg-primary px-4 py-2 text-xs font-bold text-white shadow-[0_12px_18px_-16px_rgba(51,69,55,0.6)] transition-colors hover:bg-primary/90 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            Kaja hozzáadása
          </button>
        </div>
      </section>
    );
  }

  const { recipe, batch, nextEatDate, isCookDay } = nextMealData;
  const [eatYear, eatMonth, eatDay] = nextEatDate.split("-").map(Number);
  const eatDateObj = new Date(eatYear, eatMonth - 1, eatDay);
  const eatDateLabel = `${MONTHS[eatDateObj.getMonth()]} ${eatDateObj.getDate()}.`;
  const coveredDays = batch.eatDates.length;
  const pantryMatch = rankRecipesForPantry([recipe], pantryItems)[0];
  const missingCount = pantryMatch?.missingIngredients.length ?? recipe.ingredients.length;
  const servings = recipe.servings ?? 4;
  const handleViewRecipe = () => {
    if (onViewRecipe) onViewRecipe(recipe);
  };
  const handleStartCooking = () => {
    if (onStartCooking) onStartCooking(recipe);
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold text-on-surface">Következő étkezés</h2>
      <div className="overflow-hidden rounded-[32px] border border-surface-variant/80 bg-white shadow-[0_10px_30px_rgba(34,27,19,0.06)]">
        <div className="grid gap-4 p-4 md:p-5 lg:grid-cols-[208px_minmax(0,1fr)] lg:items-center lg:gap-6">
          <div className="relative h-36 overflow-hidden rounded-[22px] border border-white/75 shadow-[0_14px_24px_-18px_rgba(24,39,31,0.32)]">
            <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/28 via-black/8 to-transparent" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[rgba(255,151,122,0.18)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[rgb(158,78,54)]">
                {getMealMomentLabel(isCookDay, eatDateLabel)}
              </span>
              <TinyStat label="Terv" value={`${plannedDaysCount}/7 nap`} />
              <TinyStat label="Nyitott" value={`${openDaysCount} nap`} />
            </div>

            <h3 className="mt-3 text-[24px] font-semibold leading-tight text-on-surface">{recipe.name}</h3>
            <p className="mt-1.5 max-w-2xl line-clamp-2 text-sm leading-relaxed text-on-surface-variant">{recipe.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px]">schedule</span>
                {recipe.duration} perc
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px]">restaurant</span>
                {getDifficultyLabel(recipe.duration)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px]">group</span>
                {servings} adag
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px]">shopping_basket</span>
                {missingCount} hiányzik
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                onClick={handleStartCooking}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_24px_-20px_rgba(51,69,55,0.6)] transition-colors hover:bg-primary/90 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">play_arrow</span>
                Főzés indítása
              </button>
              <button
                onClick={handleViewRecipe}
                className="inline-flex items-center justify-center rounded-full border border-primary/30 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/[0.06] cursor-pointer"
              >
                Recept megtekintése
              </button>
            </div>

            <p className="mt-3 text-xs text-on-surface-variant">
              {shoppingItems.length} tétel vár a bevásárlólistán, ez a recept {coveredDays} napra szól.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
