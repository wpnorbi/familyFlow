import type { ScheduleEvent, WeeklySchedule } from "@/types/schedule";

const STORAGE_KEY = "familyflow_schedule";

function makeEvent(
  id: string,
  startTime: string,
  icon: string,
  label: string,
  endTime?: string,
): ScheduleEvent {
  return {
    id,
    time: startTime,
    startTime,
    endTime,
    icon,
    label,
    recurrence: "once",
  };
}

const WEEKDAY_DEFAULT: ScheduleEvent[] = [
  makeEvent("wd-1", "07:00", "wb_sunny", "Ébredés"),
  makeEvent("wd-2", "08:00", "school", "Iskola", "15:30"),
  makeEvent("wd-4", "18:30", "restaurant", "Vacsora"),
  makeEvent("wd-5", "21:00", "bedtime", "Lefekvés"),
];

const WEEKEND_DEFAULT: ScheduleEvent[] = [
  makeEvent("we-1", "08:30", "wb_sunny", "Ébredés"),
  makeEvent("we-2", "12:30", "restaurant", "Ebéd"),
  makeEvent("we-3", "14:00", "directions_run", "Szabadidő"),
  makeEvent("we-4", "19:00", "restaurant", "Vacsora"),
  makeEvent("we-5", "22:00", "bedtime", "Lefekvés"),
];

export const DEFAULT_SCHEDULE: WeeklySchedule = {
  0: WEEKDAY_DEFAULT.map((e) => ({ ...e, id: `mon-${e.id}` })),
  1: WEEKDAY_DEFAULT.map((e) => ({ ...e, id: `tue-${e.id}` })),
  2: WEEKDAY_DEFAULT.map((e) => ({ ...e, id: `wed-${e.id}` })),
  3: WEEKDAY_DEFAULT.map((e) => ({ ...e, id: `thu-${e.id}` })),
  4: WEEKDAY_DEFAULT.map((e) => ({ ...e, id: `fri-${e.id}` })),
  5: WEEKEND_DEFAULT.map((e) => ({ ...e, id: `sat-${e.id}` })),
  6: WEEKEND_DEFAULT.map((e) => ({ ...e, id: `sun-${e.id}` })),
};

export function loadSchedule(): WeeklySchedule {
  if (typeof window === "undefined") return DEFAULT_SCHEDULE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE;
    return normalizeSchedule(JSON.parse(raw) as WeeklySchedule);
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

export function saveSchedule(schedule: WeeklySchedule): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
}

// JS getDay(): 0=vasárnap, 1=hétfő, ..., 6=szombat
// A mi rendszerünk: 0=hétfő, ..., 5=szombat, 6=vasárnap
export function getTodayDayIndex(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export const ICON_OPTIONS = [
  { value: "wb_sunny", label: "Nap / Ébredés" },
  { value: "bedtime", label: "Lefekvés" },
  { value: "school", label: "Iskola" },
  { value: "restaurant", label: "Étkezés" },
  { value: "directions_run", label: "Mozgás / Szabadidő" },
  { value: "sports_soccer", label: "Sport" },
  { value: "piano", label: "Zene" },
  { value: "local_hospital", label: "Orvos" },
  { value: "shopping_cart", label: "Bevásárlás" },
  { value: "work", label: "Munka" },
  { value: "cake", label: "Születésnap / Ünnep" },
  { value: "flight", label: "Utazás" },
  { value: "home", label: "Otthon" },
  { value: "favorite", label: "Egyéb fontos" },
  { value: "event", label: "Esemény" },
];

export const DAY_NAMES = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];
export const DAY_SHORT = ["Hét", "Kedd", "Szer", "Csüt", "Pén", "Szo", "Vas"];

function normalizeSchedule(schedule: WeeklySchedule): WeeklySchedule {
  return Object.fromEntries(
    Object.entries(schedule).map(([dayIndex, events]) => [
      dayIndex,
      (events ?? []).map((event) => ({
        ...event,
        time: event.startTime ?? event.time,
        startTime: event.startTime ?? event.time,
        recurrence: event.recurrence ?? "once",
        days: event.days ?? [Number(dayIndex)],
        seriesId: event.seriesId ?? event.id,
      })),
    ]),
  ) as WeeklySchedule;
}
