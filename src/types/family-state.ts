import type { MealBatch } from "@/types/etkezes";
import type { WeeklySchedule } from "@/types/schedule";

export interface FamilyAppState {
  schedule: WeeklySchedule;
  mealBatches: MealBatch[];
  shoppingItems: string[];
  pantryItems: string[];
}
