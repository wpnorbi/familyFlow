"use client";

import { useState, useEffect } from "react";
import {
  getWeekDays,
  toDateKey,
  getBatchRecipe,
  getUpcomingBatches,
} from "@/lib/etkezes-data";
import type { MealBatch, WeekDay } from "@/types/etkezes";
import { useMealData } from "@/hooks/useMealData";

import NextMealHero from "./NextMealHero";
import WeekPlanner from "./WeekPlanner";
import ShoppingNeeds from "./ShoppingNeeds";
import RecipeRecommendations from "./RecipeRecommendations";
import AddMealModal from "./AddMealModal";

function getNextBatch(batches: MealBatch[], todayKey: string) {
  const upcoming = getUpcomingBatches(batches, todayKey, 1);
  if (!upcoming.length) return null;
  const { batch, nextEatDate } = upcoming[0];
  const recipe = getBatchRecipe(batch);
  if (!recipe) return null;
  return { recipe, batch, nextEatDate, isCookDay: batch.cookDate === nextEatDate };
}

export default function EtkezesClient() {
  const { mealBatches: batches, shoppingItems, updateMealData, hydrated } = useMealData();
  const [weekDays] = useState<WeekDay[]>(() => getWeekDays());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayKey = toDateKey(new Date());
  const nextMealData = getNextBatch(batches, todayKey);

  const handleAddBatch = async (batchData: Omit<MealBatch, "id">) => {
    const id = crypto.randomUUID();
    const nextBatches = [...batches, { id, ...batchData }];

    const recipe = batchData.recipeSnapshot;
    let nextShoppingItems = shoppingItems;

    if (recipe) {
      const existing = new Set(shoppingItems);
      const toAdd = recipe.ingredients.filter((item) => !existing.has(item));
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

  return (
    <>
      <div className="px-4 md:px-6 lg:px-8 py-5 max-w-[1400px] mx-auto w-full flex flex-col gap-7">
        {/* Fejléc */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-background mb-1">Heti Tervező</h1>
            <p className="text-on-surface-variant">
              Szervezd meg a família étkezéseit, maradékok kihasználásával.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-primary/90 transition-opacity flex items-center gap-2 shadow-[0_4px_14px_rgba(51,69,55,0.25)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Kaja hozzáadása
          </button>
        </div>

        {!hydrated && (
          <div className="rounded-2xl border border-surface-variant/50 bg-white px-4 py-3 text-sm text-outline">
            Adatok betöltése…
          </div>
        )}

        {/* Hero */}
        <NextMealHero nextMealData={nextMealData} />

        {/* Rács: heti terv + bevásárlás */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="font-semibold text-lg text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-surface-tint">calendar_month</span>
              Heti Áttekintés
            </h3>
            <WeekPlanner
              weekDays={weekDays}
              batches={batches}
              onAddBatch={() => setIsModalOpen(true)}
              onRemoveBatch={handleRemoveBatch}
            />
          </div>

          <div className="lg:col-span-1 flex flex-col gap-4">
            <h3 className="font-semibold text-lg text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">shopping_cart</span>
              Bevásárlás
            </h3>
            <ShoppingNeeds items={shoppingItems} />
          </div>
        </div>

        {/* Receptajánlók */}
        <RecipeRecommendations />
      </div>

      {isModalOpen && (
        <AddMealModal
          onAdd={handleAddBatch}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
