"use client";

import { useEffect, useState } from "react";
import { loadMealBatches, loadShoppingItems, saveMealBatches, saveShoppingItems } from "@/lib/meal-store";
import { hasMealData } from "@/lib/family-state";
import type { MealBatch } from "@/types/etkezes";

async function saveRemoteMealState(mealBatches: MealBatch[], shoppingItems: string[]) {
  const response = await fetch("/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mealBatches, shoppingItems }),
  });

  if (!response.ok) {
    throw new Error("Meal state save failed.");
  }
}

export function useMealData() {
  const [mealBatches, setMealBatches] = useState<MealBatch[]>([]);
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function hydrate() {
      const localMealBatches = loadMealBatches();
      const localShoppingItems = loadShoppingItems();

      if (!isCancelled) {
        setMealBatches(localMealBatches);
        setShoppingItems(localShoppingItems);
        setHydrated(true);
      }

      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (!response.ok) return;

        const remoteState = await response.json() as {
          mealBatches?: MealBatch[];
          shoppingItems?: string[];
        };

        const remoteMealBatches = Array.isArray(remoteState.mealBatches) ? remoteState.mealBatches : [];
        const remoteShoppingItems = Array.isArray(remoteState.shoppingItems) ? remoteState.shoppingItems : [];
        const remoteHasData = hasMealData(remoteMealBatches, remoteShoppingItems);
        const localHasData = hasMealData(localMealBatches, localShoppingItems);

        if (!remoteHasData && localHasData) {
          await saveRemoteMealState(localMealBatches, localShoppingItems);
          return;
        }

        if (!isCancelled) {
          setMealBatches(remoteMealBatches);
          setShoppingItems(remoteShoppingItems);
        }

        saveMealBatches(remoteMealBatches);
        saveShoppingItems(remoteShoppingItems);
      } catch {
        // Local fallback marad aktív, ha a remote API még nincs kész.
      }
    }

    void hydrate();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function updateMealData(nextMealBatches: MealBatch[], nextShoppingItems: string[]) {
    setMealBatches(nextMealBatches);
    setShoppingItems(nextShoppingItems);
    saveMealBatches(nextMealBatches);
    saveShoppingItems(nextShoppingItems);

    try {
      await saveRemoteMealState(nextMealBatches, nextShoppingItems);
    } catch {
      // Local cache már frissült; remote retry a következő mentésnél történik meg.
    }
  }

  return { mealBatches, shoppingItems, updateMealData, hydrated };
}
