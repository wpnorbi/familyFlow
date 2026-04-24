"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getWeekDays,
  toDateKey,
  getBatchRecipe,
  getUpcomingBatches,
  getBatchesForDate,
} from "@/lib/etkezes-data";
import type { MealBatch, Recipe, WeekDay } from "@/types/etkezes";
import { useMealData } from "@/hooks/useMealData";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";

import NextMealHero from "./NextMealHero";
import WeekPlanner from "./WeekPlanner";
import RecipeRecommendations from "./RecipeRecommendations";
import AddMealModal from "./AddMealModal";
import PantryIdeasPanel from "./PantryIdeasPanel";
import CookingSessionModal from "./CookingSessionModal";

function getNextBatch(batches: MealBatch[], todayKey: string) {
  const upcoming = getUpcomingBatches(batches, todayKey, 1);
  if (!upcoming.length) return null;
  const { batch, nextEatDate } = upcoming[0];
  const recipe = getBatchRecipe(batch);
  if (!recipe) return null;
  return { recipe, batch, nextEatDate, isCookDay: batch.cookDate === nextEatDate };
}

export default function EtkezesClient() {
  const { mealBatches: batches, shoppingItems, pantryItems, updateMealData, updatePantryItems, hydrated } = useMealData();
  const [weekDays] = useState<WeekDay[]>(() => getWeekDays());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCookingOpen, setIsCookingOpen] = useState(false);
  const [initialRecipe, setInitialRecipe] = useState<Recipe | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [catalog, setCatalog] = useState<Recipe[]>([]);

  const todayKey = toDateKey(new Date());
  const nextMealData = getNextBatch(batches, todayKey);
  const plannedDaysCount = weekDays.filter((day) => getBatchesForDate(batches, day.dateKey).length > 0).length;
  const openDaysCount = weekDays.length - plannedDaysCount;

  const handleAddBatch = async (batchData: Omit<MealBatch, "id">) => {
    const id = crypto.randomUUID();
    const nextBatches = [...batches, { id, ...batchData }];

    const recipe = batchData.recipeSnapshot;
    let nextShoppingItems = shoppingItems;

    if (recipe) {
      const existing = new Set(shoppingItems);
      const pantryMatch = rankRecipesForPantry([recipe], pantryItems)[0];
      const missingIngredients = pantryMatch?.missingIngredients ?? recipe.ingredients;
      const toAdd = missingIngredients.filter((item) => !existing.has(item));
      nextShoppingItems = toAdd.length ? [...shoppingItems, ...toAdd] : shoppingItems;
    }

    await updateMealData(nextBatches, nextShoppingItems);
  };

  const handleRemoveBatch = async (batchId: string) => {
    await updateMealData(
      batches.filter((batch) => batch.id !== batchId),
      shoppingItems,
    );
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/recipes/search?protein=mind&maxDuration=Infinity&search=&category=mind&tag=mind", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = await response.json() as { recipes?: Recipe[] };
        if (!isCancelled && Array.isArray(payload.recipes)) {
          setCatalog(payload.recipes);
        }
      } catch {
        // Ha a receptlista átmenetileg nem elérhető, a kisegítő blokkok csendesen üresen maradnak.
      }
    }

    void loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <>
      <div className="mx-auto flex w-full min-w-0 max-w-[1400px] flex-col gap-4 overflow-x-hidden px-4 py-4 md:px-5 lg:px-6">
        {!hydrated && (
          <div className="rounded-2xl border border-surface-variant/70 bg-white/92 px-4 py-3 text-sm text-outline">
            Adatok betöltése...
          </div>
        )}

        <NextMealHero
          nextMealData={nextMealData}
          pantryItems={pantryItems}
          shoppingItems={shoppingItems}
          plannedDaysCount={plannedDaysCount}
          openDaysCount={openDaysCount}
          onAddMeal={() => setIsModalOpen(true)}
          onStartCooking={(recipe) => {
            setCookingRecipe(recipe);
            setIsCookingOpen(true);
          }}
          onViewRecipe={(recipe) => {
            setInitialRecipe(recipe);
            setIsModalOpen(true);
          }}
        />

        <section className="flex flex-col gap-3">
          <WeekPlanner
            weekDays={weekDays}
            batches={batches}
            onAddBatch={() => setIsModalOpen(true)}
            onRemoveBatch={handleRemoveBatch}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Link
            href="/bevasarlas"
            className="group relative col-span-1 overflow-hidden rounded-[32px] border border-[rgba(197,154,133,0.22)] bg-[linear-gradient(180deg,rgba(255,240,233,0.84),rgba(255,246,241,0.94))] px-6 py-6 shadow-[0_10px_22px_-22px_rgba(121,83,64,0.28)] transition-colors hover:bg-[linear-gradient(180deg,rgba(255,242,236,0.9),rgba(255,248,244,0.96))]"
          >
            <div className="absolute -right-5 -top-5 size-24 rounded-full bg-[rgba(220,164,134,0.18)] blur-xl" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-outline/90">Bevásárlás</p>
            <div className="relative z-10 mt-3 flex h-full flex-col justify-between gap-6">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[rgb(120,73,47)]">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_basket</span>
                  <h3 className="text-base font-bold">Bevásárlás</h3>
                </div>
                <p className="text-[rgb(120,73,47)] text-sm leading-snug">
                  <strong className="mb-1 block text-[26px] font-semibold">{shoppingItems.length} tétel</strong>
                  hiányzik a következő étkezésekhez.
                </p>
              </div>
              <div className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(148,95,63,0.16)] bg-[rgba(148,95,63,0.12)] px-4 py-3 text-sm font-semibold text-[rgb(120,73,47)] transition-colors group-hover:bg-[rgba(148,95,63,0.16)] cursor-pointer">
                Lista megnyitása
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
            </div>
          </Link>

          <PantryIdeasPanel
            pantryItems={pantryItems}
            catalog={catalog}
            onUpdatePantryItems={updatePantryItems}
            onChooseRecipe={(recipe) => {
              setInitialRecipe(recipe);
              setIsModalOpen(true);
            }}
          />
        </section>

        <section className="flex flex-col gap-2.5">
          <h3 className="text-[15px] font-semibold text-on-surface">Neked válogatva</h3>
          <RecipeRecommendations onGenerate={() => setIsModalOpen(true)} />
        </section>
      </div>

      {isModalOpen && (
        <AddMealModal
          onAdd={handleAddBatch}
          initialRecipe={initialRecipe}
          pantryItems={pantryItems}
          onClose={() => {
            setIsModalOpen(false);
            setInitialRecipe(null);
          }}
        />
      )}

      {isCookingOpen && cookingRecipe && (
        <CookingSessionModal
          recipe={cookingRecipe}
          onClose={() => {
            setIsCookingOpen(false);
            setCookingRecipe(null);
          }}
        />
      )}
    </>
  );
}
