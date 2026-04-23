"use client";

import { useEffect, useState } from "react";
import type { ScheduleEvent, WeeklySchedule } from "@/types/schedule";
import { loadSchedule, saveSchedule } from "@/lib/schedule-store";

export function useSchedule() {
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSchedule(loadSchedule());
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function updateDay(dayIndex: number, events: ScheduleEvent[]) {
    const next = { ...schedule, [dayIndex]: events };
    setSchedule(next);
    saveSchedule(next);
  }

  function updateSchedule(next: WeeklySchedule) {
    setSchedule(next);
    saveSchedule(next);
  }

  return { schedule, updateDay, updateSchedule, hydrated };
}
