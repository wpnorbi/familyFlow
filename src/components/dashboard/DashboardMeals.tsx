"use client";

import { useEffect, useState } from "react";
import { getBatchRecipe, getBatchesForDate, getUpcomingBatches, getWeekDays, toDateKey } from "@/lib/etkezes-data";
import { loadMealBatches } from "@/lib/meal-store";
import type { MealBatch, Recipe } from "@/types/etkezes";
import DinnerCard from "@/components/dashboard/DinnerCard";
import MealsStrip from "@/components/dashboard/MealsStrip";
import WeekendCard from "@/components/dashboard/WeekendCard";

function getDashboardData(batches: MealBatch[]) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const weekDays = getWeekDays();

  const todayBatches = getBatchesForDate(batches, todayKey);
  const todayMeal = todayBatches.length > 0 ? (getBatchRecipe(todayBatches[0]) ?? null) : null;

  const upcoming = getUpcomingBatches(batches, todayKey, 3);
  const upcomingMeals = upcoming
    .map(({ batch, nextEatDate }) => {
      const recipe = getBatchRecipe(batch);
      const day = weekDays.find((d) => d.dateKey === nextEatDate);
      const label = nextEatDate === todayKey ? "Ma" : (day?.name ?? nextEatDate);
      return { label, meal: recipe?.name ?? "" };
    })
    .filter((item) => item.meal);

  return { todayMeal, upcomingMeals };
}

export default function DashboardMeals() {
  const [batches, setBatches] = useState<MealBatch[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBatches(loadMealBatches());
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const { todayMeal, upcomingMeals } = hydrated
    ? getDashboardData(batches)
    : { todayMeal: null as Recipe | null, upcomingMeals: [] };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DinnerCard recipe={todayMeal} />
        <WeekendCard />
      </div>

      <MealsStrip upcomingMeals={upcomingMeals} />
    </>
  );
}
