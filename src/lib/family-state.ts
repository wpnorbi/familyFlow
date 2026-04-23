import { INITIAL_BATCHES } from "@/lib/etkezes-data";
import { DEFAULT_SCHEDULE } from "@/lib/schedule-store";
import type { MealBatch } from "@/types/etkezes";
import type { FamilyAppState } from "@/types/family-state";
import type { ScheduleEvent, WeeklySchedule } from "@/types/schedule";

export const DEFAULT_FAMILY_STATE: FamilyAppState = {
  schedule: DEFAULT_SCHEDULE,
  mealBatches: INITIAL_BATCHES,
  shoppingItems: [],
};

function normalizeSchedule(schedule: unknown): WeeklySchedule {
  if (!schedule || typeof schedule !== "object" || Array.isArray(schedule)) {
    return DEFAULT_SCHEDULE;
  }

  return Object.fromEntries(
    Array.from({ length: 7 }, (_, dayIndex) => {
      const rawEvents = (schedule as Record<string, unknown>)[String(dayIndex)];
      const events = Array.isArray(rawEvents) ? rawEvents : [];

      return [
        dayIndex,
        events.map((event, eventIndex) => normalizeEvent(event, dayIndex, eventIndex)),
      ];
    }),
  ) as WeeklySchedule;
}

function normalizeEvent(event: unknown, dayIndex: number, eventIndex: number): ScheduleEvent {
  const data = event && typeof event === "object" ? (event as Record<string, unknown>) : {};
  const startTime = typeof data.startTime === "string"
    ? data.startTime
    : typeof data.time === "string"
      ? data.time
      : "08:00";

  return {
    id: typeof data.id === "string" ? data.id : `${dayIndex}-${eventIndex}-${startTime}`,
    label: typeof data.label === "string" ? data.label : "Új esemény",
    time: startTime,
    startTime,
    endTime: typeof data.endTime === "string" ? data.endTime : undefined,
    icon: typeof data.icon === "string" ? data.icon : "event",
    recurrence: isValidRecurrence(data.recurrence) ? data.recurrence : "once",
    days: Array.isArray(data.days) ? data.days.filter((day): day is number => typeof day === "number") : [dayIndex],
    seriesId: typeof data.seriesId === "string" ? data.seriesId : (typeof data.id === "string" ? data.id : `${dayIndex}-${eventIndex}`),
    person: typeof data.person === "string" ? data.person : undefined,
    category: typeof data.category === "string" ? data.category : undefined,
  };
}

function isValidRecurrence(value: unknown): value is ScheduleEvent["recurrence"] {
  return value === "once" || value === "daily" || value === "weekdays" || value === "custom";
}

function normalizeMealBatches(input: unknown): MealBatch[] {
  if (!Array.isArray(input)) return INITIAL_BATCHES;

  return input
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `batch-${index}`,
      recipeId: typeof item.recipeId === "string" ? item.recipeId : "",
      recipeSnapshot: item.recipeSnapshot && typeof item.recipeSnapshot === "object"
        ? (item.recipeSnapshot as MealBatch["recipeSnapshot"])
        : undefined,
      cookDate: typeof item.cookDate === "string" ? item.cookDate : "",
      eatDates: Array.isArray(item.eatDates)
        ? item.eatDates.filter((date): date is string => typeof date === "string")
        : [],
    }))
    .filter((batch) => batch.recipeId && batch.cookDate);
}

function normalizeShoppingItems(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is string => typeof item === "string");
}

export function normalizeFamilyState(input: unknown): FamilyAppState {
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  return {
    schedule: normalizeSchedule(data.schedule),
    mealBatches: normalizeMealBatches(data.mealBatches),
    shoppingItems: normalizeShoppingItems(data.shoppingItems),
  };
}

export function mergeFamilyState(
  current: FamilyAppState,
  patch: Partial<FamilyAppState>,
): FamilyAppState {
  return normalizeFamilyState({
    schedule: patch.schedule ?? current.schedule,
    mealBatches: patch.mealBatches ?? current.mealBatches,
    shoppingItems: patch.shoppingItems ?? current.shoppingItems,
  });
}

export function isDefaultSchedule(schedule: WeeklySchedule): boolean {
  return JSON.stringify(normalizeSchedule(schedule)) === JSON.stringify(DEFAULT_SCHEDULE);
}

export function hasMealData(mealBatches: MealBatch[], shoppingItems: string[]): boolean {
  return mealBatches.length > 0 || shoppingItems.length > 0;
}
