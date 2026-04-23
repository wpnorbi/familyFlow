import type { MealBatch } from "@/types/etkezes";
import { INITIAL_BATCHES } from "@/lib/etkezes-data";

const BATCHES_STORAGE_KEY = "familyflow_meal_batches";
const SHOPPING_STORAGE_KEY = "familyflow_shopping_items";

export function loadMealBatches(): MealBatch[] {
  if (typeof window === "undefined") return INITIAL_BATCHES;
  try {
    const raw = localStorage.getItem(BATCHES_STORAGE_KEY);
    if (!raw) return INITIAL_BATCHES;
    return JSON.parse(raw) as MealBatch[];
  } catch {
    return INITIAL_BATCHES;
  }
}

export function saveMealBatches(batches: MealBatch[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BATCHES_STORAGE_KEY, JSON.stringify(batches));
}

export function loadShoppingItems(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHOPPING_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveShoppingItems(items: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(items));
}
