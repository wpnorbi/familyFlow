"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { createClient } from "@/lib/supabase";

import AddMealModal from "./AddMealModal";
import CookingSessionModal from "./CookingSessionModal";
import EtkezesMobileView from "./EtkezesMobileView";
import DesktopEtkezesView from "./DesktopEtkezesView";
import RecipeDetailModal from "./RecipeDetailModal";
import RecipeLibraryView from "./RecipeLibraryView";
import RecipePreviewSheet from "./RecipePreviewSheet";
import ScheduleSheet from "./ScheduleSheet";
import MealSuccessSheet, { type MealSuccessData } from "./MealSuccessSheet";

function getNextBatch(batches: MealBatch[], todayKey: string) {
  const upcoming = getUpcomingBatches(batches, todayKey, 1);
  if (!upcoming.length) return null;
  const { batch, nextEatDate } = upcoming[0];
  const recipe = getBatchRecipe(batch);
  if (!recipe) return null;
  return { recipe, batch, nextEatDate, isCookDay: batch.cookDate === nextEatDate };
}

function resolveDisplayName(input: {
  email?: string | null;
  userMetadata?: Record<string, unknown> | null;
}) {
  const metadata = input.userMetadata ?? {};
  const candidates = [
    metadata.full_name,
    metadata.display_name,
    metadata.name,
    [metadata.first_name, metadata.last_name].filter((part) => typeof part === "string" && part.trim().length > 0).join(" "),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  if (input.email) {
    return input.email.split("@")[0]?.trim() || "Felhasználó";
  }

  return "Felhasználó";
}

export default function EtkezesClient() {
  const router = useRouter();
  const { mealBatches: batches, shoppingItems, pantryItems, updateMealData, hydrated } =
    useMealData();
  const [weekDays] = useState<WeekDay[]>(() => getWeekDays());

  // Modal/sheet state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCookingOpen, setIsCookingOpen] = useState(false);
  const [initialRecipe, setInitialRecipe] = useState<Recipe | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [scheduleRecipe, setScheduleRecipe] = useState<Recipe | null>(null);
  const [successData, setSuccessData] = useState<MealSuccessData | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [selectedPlannerDay, setSelectedPlannerDay] = useState<WeekDay | null>(null);
  const [displayName, setDisplayName] = useState("Felhasználó");

  // Catalog & view
  const [catalog, setCatalog] = useState<Recipe[]>([]);
  const [viewMode, setViewMode] = useState<"planner" | "recipes">("planner");

  const todayKey = toDateKey(new Date());
  const nextMealData = getNextBatch(batches, todayKey);
  const plannedDaysCount = weekDays.filter(
    (day) => getBatchesForDate(batches, day.dateKey).length > 0,
  ).length;
  const openDaysCount = weekDays.length - plannedDaysCount;

  function openAddMeal(day?: WeekDay) {
    setSelectedPlannerDay(day ?? null);
    setInitialRecipe(null);
    setIsModalOpen(true);
  }

  // ── Data operations ────────────────────────────────────────────────────────

  const handleAddBatch = async (batchData: Omit<MealBatch, "id">) => {
    const id = crypto.randomUUID();
    const nextBatches = [...batches, { id, ...batchData }];

    const recipe = batchData.recipeSnapshot;
    let nextShoppingItems = shoppingItems;

    if (recipe) {
      const existing = new Set(shoppingItems);
      const pantryMatch = rankRecipesForPantry([recipe], pantryItems)[0];
      const missing = pantryMatch?.missingIngredients ?? recipe.ingredients;
      const toAdd = missing.filter((item) => !existing.has(item));
      nextShoppingItems = toAdd.length ? [...shoppingItems, ...toAdd] : shoppingItems;
    }

    await updateMealData(nextBatches, nextShoppingItems);
  };

  const handleRemoveBatch = async (batchId: string) => {
    await updateMealData(
      batches.filter((b) => b.id !== batchId),
      shoppingItems,
    );
  };

  // ── Schedule confirmation (used by both ScheduleSheet and RecipeDetailModal) ──

  function handleConfirmSchedule(recipe: Recipe, startDate: string, days: number) {
    const eatDates: string[] = [];
    const base = new Date(`${startDate}T12:00:00`);
    for (let i = 0; i < days; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      eatDates.push(toDateKey(d));
    }

    const allIngredients = recipe.ingredientGroups?.length
      ? recipe.ingredientGroups.flatMap((g) => g.items)
      : recipe.ingredients;
    const pantryMatch = rankRecipesForPantry([recipe], pantryItems)[0];
    const missing = pantryMatch?.missingIngredients ?? allIngredients;
    const atHomeCount = allIngredients.length - missing.length;

    void handleAddBatch({
      recipeId: recipe.id,
      recipeSnapshot: recipe,
      cookDate: eatDates[0],
      eatDates,
    });

    setScheduleRecipe(null);
    setPreviewRecipe(null);
    setDetailRecipe(null);

    setSuccessData({
      recipeName: recipe.name,
      startDate: eatDates[0],
      endDate: eatDates[eatDates.length - 1],
      daysCount: days,
      shoppingAdded: missing.length,
      atHomeCount,
    });
  }

  function handleQuickAdd(recipe: Recipe) {
    setPreviewRecipe(null);
    setScheduleRecipe(recipe);
  }

  function handleToggleBookmark(recipe: Recipe) {
    setBookmarkedIds((cur) => {
      const has = cur.includes(recipe.id);
      return has ? cur.filter((id) => id !== recipe.id) : [...cur, recipe.id];
    });
  }

  function closeSuccess() {
    setSuccessData(null);
    router.push("/etkezes");
  }

  // ── Keyboard shortcut ──────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setScheduleRecipe(null);
        setPreviewRecipe(null);
        setSuccessData(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Catalog load ───────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          "/api/recipes/search?protein=mind&maxDuration=Infinity&search=&category=mind&tag=mind&limit=all",
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const payload = (await res.json()) as { recipes?: Recipe[] };
        if (!cancelled && Array.isArray(payload.recipes)) setCatalog(payload.recipes);
      } catch {
        // Catalog unavailable — silent fail.
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUserProfile() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || cancelled) return;

        const nextName = resolveDisplayName({
          email: data.user?.email,
          userMetadata: data.user?.user_metadata ?? null,
        });

        if (!cancelled) {
          setDisplayName(nextName);
        }
      } catch {
        // Keep fallback label.
      }
    }

    void loadUserProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────

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
          {/* ── Mobile view ─────────────────────────────────────── */}
          <EtkezesMobileView
            displayName={displayName}
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
            onViewRecipe={(recipe) => setPreviewRecipe(recipe)}
            onQuickAdd={handleQuickAdd}
            onGenerateIdeas={() => setIsModalOpen(true)}
            onConfirmQuickSchedule={handleConfirmSchedule}
          />

          {/* ── Desktop view ─────────────────────────────────────── */}
          <div className="hidden md:block">
            {!hydrated && (
              <div className="ff-glass-card fixed left-1/2 top-5 z-60 -translate-x-1/2 rounded-(--ff-radius-md) px-4 py-3 text-sm text-(--ff-text-soft)">
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
              onAddMeal={openAddMeal}
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

      {/* ── Desktop: AddMealModal (full wizard) ─────────────────── */}
      {isModalOpen && (
        <AddMealModal
          onAdd={handleAddBatch}
          initialRecipe={initialRecipe}
          initialDay={selectedPlannerDay}
          pantryItems={pantryItems}
          onClose={() => {
            setIsModalOpen(false);
            setInitialRecipe(null);
            setSelectedPlannerDay(null);
          }}
        />
      )}

      {/* ── Cooking session ──────────────────────────────────────── */}
      {isCookingOpen && cookingRecipe && (
        <CookingSessionModal
          recipe={cookingRecipe}
          onClose={() => {
            setIsCookingOpen(false);
            setCookingRecipe(null);
          }}
        />
      )}

      {/* ── Desktop: Recipe detail modal ─────────────────────────── */}
      {detailRecipe && (
        <RecipeDetailModal
          recipe={detailRecipe}
          onClose={() => setDetailRecipe(null)}
          onPlan={(recipe) => {
            setDetailRecipe(null);
            setInitialRecipe(recipe);
            setIsModalOpen(true);
          }}
          onQuickSchedule={(recipe) => {
            setDetailRecipe(null);
            setScheduleRecipe(recipe);
          }}
          onStartCooking={(recipe) => {
            setDetailRecipe(null);
            setCookingRecipe(recipe);
            setIsCookingOpen(true);
          }}
        />
      )}

      {/* ── Mobile: Recipe preview sheet ─────────────────────────── */}
      {previewRecipe && (
        <RecipePreviewSheet
          recipe={previewRecipe}
          bookmarked={bookmarkedIds.includes(previewRecipe.id)}
          pantryItems={pantryItems}
          onClose={() => setPreviewRecipe(null)}
          onSchedule={(recipe) => {
            setPreviewRecipe(null);
            setScheduleRecipe(recipe);
          }}
          onStartCooking={(recipe) => {
            setPreviewRecipe(null);
            setCookingRecipe(recipe);
            setIsCookingOpen(true);
          }}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {/* ── Mobile: Schedule sheet ────────────────────────────────── */}
      {scheduleRecipe && (
        <ScheduleSheet
          recipe={scheduleRecipe}
          batches={batches}
          pantryItems={pantryItems}
          onClose={() => setScheduleRecipe(null)}
          onConfirm={handleConfirmSchedule}
        />
      )}

      {/* ── Mobile: Success confirmation ─────────────────────────── */}
      {successData && (
        <MealSuccessSheet
          data={successData}
          onViewPlan={closeSuccess}
        />
      )}
    </>
  );
}
