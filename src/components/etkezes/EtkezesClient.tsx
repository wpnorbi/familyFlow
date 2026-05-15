"use client";

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

import AddMealModal from "./AddMealModal";
import CookingSessionModal from "./CookingSessionModal";
import EtkezesMobileView from "./EtkezesMobileView";
import DesktopEtkezesView from "./DesktopEtkezesView";
import RecipeDetailModal from "./RecipeDetailModal";
import RecipeLibraryView from "./RecipeLibraryView";

function getNextBatch(batches: MealBatch[], todayKey: string) {
  const upcoming = getUpcomingBatches(batches, todayKey, 1);
  if (!upcoming.length) return null;
  const { batch, nextEatDate } = upcoming[0];
  const recipe = getBatchRecipe(batch);
  if (!recipe) return null;
  return { recipe, batch, nextEatDate, isCookDay: batch.cookDate === nextEatDate };
}

export default function EtkezesClient() {
  const { mealBatches: batches, shoppingItems, pantryItems, updateMealData, hydrated } = useMealData();
  const [weekDays] = useState<WeekDay[]>(() => getWeekDays());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCookingOpen, setIsCookingOpen] = useState(false);
  const [initialRecipe, setInitialRecipe] = useState<Recipe | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);
  const [catalog, setCatalog] = useState<Recipe[]>([]);
  const [viewMode, setViewMode] = useState<"planner" | "recipes">("planner");

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
      {viewMode === "recipes" ? (
        <RecipeLibraryView
          initialCatalog={catalog}
          onBack={() => setViewMode("planner")}
          onViewRecipe={(recipe) => setDetailRecipe(recipe)}
        />
      ) : (
        <>
          <EtkezesMobileView
            nextMealData={nextMealData}
            weekDays={weekDays}
            batches={batches}
            shoppingItems={shoppingItems}
            pantryItems={pantryItems}
            catalog={catalog}
            onAddMeal={() => setIsModalOpen(true)}
            onOpenRecipeLibrary={() => setViewMode("recipes")}
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

          <div className="hidden md:block">
            {!hydrated && (
              <div className="ff-glass-card fixed left-1/2 top-5 z-[60] -translate-x-1/2 rounded-[var(--ff-radius-md)] px-4 py-3 text-sm text-[var(--ff-text-soft)]">
                Adatok betöltése...
              </div>
            )}

            <DesktopEtkezesView
              nextMealData={nextMealData}
              weekDays={weekDays}
              batches={batches}
              catalog={catalog}
              pantryItems={pantryItems}
              shoppingItems={shoppingItems}
              plannedDaysCount={plannedDaysCount}
              openDaysCount={openDaysCount}
              onAddMeal={() => setIsModalOpen(true)}
              onOpenRecipeLibrary={() => setViewMode("recipes")}
              onRemoveBatch={handleRemoveBatch}
              onStartCooking={(recipe) => {
                setCookingRecipe(recipe);
                setIsCookingOpen(true);
              }}
              onViewRecipe={(recipe) => {
                setInitialRecipe(recipe);
                setIsModalOpen(true);
              }}
            />
          </div>
        </>
      )}

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

      {detailRecipe && (
        <RecipeDetailModal
          recipe={detailRecipe}
          onClose={() => setDetailRecipe(null)}
          onPlan={(recipe) => {
            setDetailRecipe(null);
            setInitialRecipe(recipe);
            setIsModalOpen(true);
          }}
          onStartCooking={(recipe) => {
            setDetailRecipe(null);
            setCookingRecipe(recipe);
            setIsCookingOpen(true);
          }}
        />
      )}
    </>
  );
}
