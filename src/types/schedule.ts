export type ScheduleRecurrence = "once" | "daily" | "weekdays" | "custom";

export interface ScheduleEvent {
  id: string;
  label: string;
  time: string; // Legacy alias for startTime, "HH:MM"
  startTime?: string; // "HH:MM"
  endTime?: string; // "HH:MM"
  icon: string; // Material Symbol neve
  recurrence?: ScheduleRecurrence;
  days?: number[];
  seriesId?: string;
  person?: string;
  category?: string;
}

// 0 = Hétfő, 1 = Kedd, 2 = Szerda, 3 = Csütörtök, 4 = Péntek, 5 = Szombat, 6 = Vasárnap
export type WeeklySchedule = Record<number, ScheduleEvent[]>;
