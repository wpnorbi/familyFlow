"use client";

import { useEffect, useState } from "react";
import type { ScheduleEvent, WeeklySchedule } from "@/types/schedule";
import { loadSchedule, saveSchedule } from "@/lib/schedule-store";
import { isDefaultSchedule } from "@/lib/family-state";

export function useSchedule() {
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function hydrate() {
      const localSchedule = loadSchedule();

      if (!isCancelled) {
        setSchedule(localSchedule);
        setHydrated(true);
      }

      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (!response.ok) return;

        const remoteState = await response.json() as { schedule?: WeeklySchedule };
        const remoteSchedule = remoteState.schedule ?? localSchedule;

        if (isDefaultSchedule(remoteSchedule) && !isDefaultSchedule(localSchedule)) {
          await fetch("/api/state", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schedule: localSchedule }),
          });
          return;
        }

        if (!isCancelled) {
          setSchedule(remoteSchedule);
        }

        saveSchedule(remoteSchedule);
      } catch {
        // Local fallback marad aktív, ha a remote API még nincs kész.
      }
    }

    void hydrate();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function saveRemoteSchedule(next: WeeklySchedule) {
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedule: next }),
    });

    if (!response.ok) {
      throw new Error("Schedule save failed.");
    }
  }

  function updateDay(dayIndex: number, events: ScheduleEvent[]) {
    const next = { ...schedule, [dayIndex]: events };
    void updateSchedule(next);
  }

  async function updateSchedule(next: WeeklySchedule) {
    setSchedule(next);
    saveSchedule(next);

    try {
      await saveRemoteSchedule(next);
    } catch {
      // Local cache már frissült; a következő mentés újrapróbálja.
    }
  }

  return { schedule, updateDay, updateSchedule, hydrated };
}
