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
import EtkezesMobileView from "./EtkezesMobileView";

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
      <EtkezesMobileView
        nextMealData={nextMealData}
        weekDays={weekDays}
        batches={batches}
        shoppingItems={shoppingItems}
        pantryItems={pantryItems}
        catalog={catalog}
        onAddMeal={() => setIsModalOpen(true)}
        onStartCooking={(recipe) => {
          setCookingRecipe(recipe);
          setIsCookingOpen(true);
        }}
        onViewRecipe={(recipe) => {
          setInitialRecipe(recipe);
          setIsModalOpen(true);
        }}
        onGenerateIdeas={() => setIsModalOpen(true)}
      />

      <div className="mx-auto hidden w-full min-w-0 max-w-[1400px] flex-col gap-4 overflow-x-hidden px-4 py-4 md:flex md:px-5 lg:px-6">
        {!hydrated && (
          <div className="ff-glass-card rounded-[var(--ff-radius-md)] px-4 py-3 text-sm text-[var(--ff-text-soft)]">
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
          <PantryIdeasPanel
            pantryItems={pantryItems}
            catalog={catalog}
            onUpdatePantryItems={updatePantryItems}
            onChooseRecipe={(recipe) => {
              setInitialRecipe(recipe);
              setIsModalOpen(true);
            }}
          />

          <Link
            href="/bevasarlas"
            className="ff-glass-card-warm group relative overflow-hidden rounded-[30px] px-5 py-5 transition-colors hover:bg-[linear-gradient(180deg,rgba(255,243,238,0.84),rgba(255,249,246,0.94))]"
          >
            <div className="absolute -right-5 -top-5 size-24 rounded-full bg-[rgba(220,164,134,0.12)] blur-xl" />
            <div className="relative z-10 flex h-full flex-col gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ff-text-soft)]">Bevásárlás</p>
                <div className="mt-3 flex items-start gap-3">
                  <div className="rounded-[16px] border border-[rgba(185,130,71,0.18)] bg-[rgba(255,249,240,0.48)] p-2 text-[var(--ff-caramel-strong)] shadow-[0_10px_20px_-18px_rgba(154,99,49,0.4)]">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_basket</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[20px] font-semibold tracking-tight text-[var(--ff-text)]">{shoppingItems.length} tétel hiányzik</h3>
                    <p className="mt-1 text-[11px] leading-snug text-[var(--ff-text-muted)]">A heti főzésekhez.</p>
                  </div>
                </div>
              </div>

              <div className="ff-button-secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-semibold text-[var(--ff-caramel-strong)] transition-colors group-hover:bg-[rgba(148,95,63,0.13)] cursor-pointer">
                Lista megnyitása
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </div>
            </div>
          </Link>
        </section>

        <section className="flex flex-col gap-2.5">
          <h3 className="text-[16px] font-semibold tracking-tight text-[var(--ff-text)]">Neked válogatva</h3>
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
