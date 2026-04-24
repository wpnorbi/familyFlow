"use client";

import { useEffect, useState } from "react";
import { loadMealBatches, loadPantryItems, loadShoppingItems, saveMealBatches, savePantryItems, saveShoppingItems } from "@/lib/meal-store";
import { hasMealData } from "@/lib/family-state";
import type { MealBatch } from "@/types/etkezes";

async function saveRemoteMealState(mealBatches: MealBatch[], shoppingItems: string[], pantryItems: string[]) {
  const response = await fetch("/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mealBatches, shoppingItems, pantryItems }),
  });

  if (!response.ok) {
    throw new Error("Meal state save failed.");
  }
}

export function useMealData() {
  const [mealBatches, setMealBatches] = useState<MealBatch[]>([]);
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function hydrate() {
      const localMealBatches = loadMealBatches();
      const localShoppingItems = loadShoppingItems();
      const localPantryItems = loadPantryItems();

      if (!isCancelled) {
        setMealBatches(localMealBatches);
        setShoppingItems(localShoppingItems);
        setPantryItems(localPantryItems);
        setHydrated(true);
      }

      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (!response.ok) return;

        const remoteState = await response.json() as {
          mealBatches?: MealBatch[];
          shoppingItems?: string[];
          pantryItems?: string[];
        };

        const remoteMealBatches = Array.isArray(remoteState.mealBatches) ? remoteState.mealBatches : [];
        const remoteShoppingItems = Array.isArray(remoteState.shoppingItems) ? remoteState.shoppingItems : [];
        const remotePantryItems = Array.isArray(remoteState.pantryItems) ? remoteState.pantryItems : [];
        const remoteHasData = hasMealData(remoteMealBatches, remoteShoppingItems, remotePantryItems);
        const localHasData = hasMealData(localMealBatches, localShoppingItems, localPantryItems);

        if (!remoteHasData && localHasData) {
          await saveRemoteMealState(localMealBatches, localShoppingItems, localPantryItems);
          return;
        }

        if (!isCancelled) {
          setMealBatches(remoteMealBatches);
          setShoppingItems(remoteShoppingItems);
          setPantryItems(remotePantryItems);
        }

        saveMealBatches(remoteMealBatches);
        saveShoppingItems(remoteShoppingItems);
        savePantryItems(remotePantryItems);
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
      await saveRemoteMealState(nextMealBatches, nextShoppingItems, pantryItems);
    } catch {
      // Local cache már frissült; remote retry a következő mentésnél történik meg.
    }
  }

  async function updatePantryItems(nextPantryItems: string[]) {
    setPantryItems(nextPantryItems);
    savePantryItems(nextPantryItems);

    try {
      await saveRemoteMealState(mealBatches, shoppingItems, nextPantryItems);
    } catch {
      // Local cache már frissült; remote retry a következő mentésnél történik meg.
    }
  }

  return { mealBatches, shoppingItems, pantryItems, updateMealData, updatePantryItems, hydrated };
}
