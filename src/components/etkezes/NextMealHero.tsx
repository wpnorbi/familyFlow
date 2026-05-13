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

function getHeroBadgeLabel(isCookDay: boolean): string {
  return isCookDay ? "MA ESTI FŐÉTEL" : "KÖVETKEZŐ";
}

function TinyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ff-chip px-2.5 py-1 text-[11px] font-semibold text-[var(--ff-text)] shadow-[var(--ff-shadow-soft)]">
      <span className="text-[var(--ff-text-soft)]">{label}</span> {value}
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
      <section className="ff-glass-card-sage rounded-[var(--ff-radius-xl)] px-4 py-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--ff-text-soft)]">Következő étkezés</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-[var(--ff-text)]">Még nincs betervezve semmi</h1>
              <TinyStat label="Heti terv" value={`${plannedDaysCount}/7 nap`} />
              <TinyStat label="Nyitott" value={`${openDaysCount} nap`} />
              <TinyStat label="Lista" value={`${shoppingItems.length} tétel`} />
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-[var(--ff-text-muted)]">
              Válassz egy ebédet vagy vacsorát, és indulhat a heti terv.
            </p>
          </div>

          <button
            onClick={onAddMeal}
            className="ff-button-primary inline-flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
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
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[16px] font-semibold tracking-tight text-[var(--ff-text)]">Következő étkezés</h2>
      <div className="ff-glass-card-sage relative isolate overflow-hidden rounded-[38px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.5),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.16),transparent_28%)] opacity-90" />
        <div className="pointer-events-none absolute left-6 top-6 h-14 w-14 rounded-full border border-white/40 bg-white/10 backdrop-blur-2xl" />

        <div className="grid gap-5 p-4 md:p-5 lg:grid-cols-[minmax(390px,460px)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:p-6">
          <div className="relative min-h-[360px] overflow-hidden rounded-[34px] border border-[rgba(255,255,255,0.78)] bg-[linear-gradient(180deg,rgba(255,255,255,0.32),rgba(255,255,255,0.08))] shadow-[0_28px_50px_-32px_rgba(34,27,19,0.5)]">
            <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.01),rgba(10,10,10,0.12)_54%,rgba(10,10,10,0.38)_100%)]" />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/26 bg-black/26 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {getHeroBadgeLabel(isCookDay)}
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-[24px] border border-white/16 bg-[rgba(17,18,16,0.2)] p-4 text-white backdrop-blur-md shadow-[0_14px_28px_-18px_rgba(0,0,0,0.5)]">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72">{isCookDay ? "Ma este jön" : "Következő"}</span>
                  <p className="mt-1 text-[13px] font-medium text-white/92">{recipe.duration} perc · {getDifficultyLabel(recipe.duration)}</p>
                </div>
                <span className="rounded-full border border-white/14 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/88">
                  {isCookDay ? "Most" : "Előkészítve"}
                </span>
              </div>
            </div>
          </div>

          <div className="min-w-0 py-1 lg:pr-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ff-chip px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ff-caramel-strong)] shadow-[var(--ff-shadow-soft)]">
                {getMealMomentLabel(isCookDay, eatDateLabel)}
              </span>
              <TinyStat label="Terv" value={`${plannedDaysCount}/7 nap`} />
            </div>

            <h3 className="mt-4 max-w-xl text-[30px] font-semibold leading-[1.02] tracking-tight text-on-surface">
              {recipe.name}
            </h3>
            <div className="mt-3 h-px w-12 bg-[rgba(170,133,96,0.18)]" />
            <p className="mt-3 max-w-xl line-clamp-2 text-[13px] leading-relaxed text-on-surface-variant">
              {recipe.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                {recipe.duration} perc
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">group</span>
                {servings} adag
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">shopping_basket</span>
                {missingCount} hiányzik
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button onClick={handleStartCooking} className="ff-button-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-[11px] font-semibold cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                Főzés indítása
              </button>
              <button onClick={handleViewRecipe} className="ff-button-secondary inline-flex items-center justify-center px-4 py-2.5 text-[11px] font-semibold cursor-pointer">
                Recept megtekintése
              </button>
              <div className="ff-chip inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium shadow-[var(--ff-shadow-soft)]">
                <span className="material-symbols-outlined text-[14px]">music_note</span>
                Indíts zenét főzéshez
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-snug text-on-surface-variant">
              {shoppingItems.length} tétel a listán, a recept {coveredDays} napra szól. {getDifficultyLabel(recipe.duration)}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
