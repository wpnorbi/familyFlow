"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSchedule } from "@/hooks/useSchedule";
import { getTodayDayIndex } from "@/lib/schedule-store";
import type { ScheduleEvent } from "@/types/schedule";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getTimeBlock(hour: number): string {
  if (hour >= 6 && hour < 9) return "Reggeli készülődés";
  if (hour >= 9 && hour < 12) return "Délelőtti blokk";
  if (hour >= 12 && hour < 13) return "Ebédidő";
  if (hour >= 13 && hour < 15) return "Csendes pihenő / Munka blokk";
  if (hour >= 15 && hour < 17) return "Iskolás időszak";
  if (hour >= 17 && hour < 19) return "Délutáni tevékenységek";
  if (hour >= 19 && hour < 21) return "Vacsoraidő";
  if (hour >= 21 && hour < 23) return "Esti levezetés";
  return "Éjszakai nyugalom";
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getStartTime(event: ScheduleEvent): string {
  return event.startTime ?? event.time;
}

function getEventTitle(event: ScheduleEvent): string {
  return [event.label, event.person].filter(Boolean).join(" – ");
}

function getEventTimeLabel(event: ScheduleEvent): string {
  const startTime = getStartTime(event);
  return event.endTime ? `${startTime}–${event.endTime}` : startTime;
}

function formatCountdown(minutesLeft: number): string {
  if (minutesLeft < 60) return `${minutesLeft} perc múlva`;
  const hours = Math.floor(minutesLeft / 60);
  const mins = minutesLeft % 60;
  if (mins === 0) return `${hours} óra múlva`;
  return `${hours} ó ${mins} p múlva`;
}

function getEventEndMinutes(event: ScheduleEvent): number {
  return event.endTime ? timeToMinutes(event.endTime) : timeToMinutes(getStartTime(event));
}

function getEventAccent(event: ScheduleEvent) {
  const hint = `${event.category ?? ""} ${event.label} ${event.icon}`.toLowerCase();

  if (hint.includes("étkez") || hint.includes("vacsora") || hint.includes("ebéd") || hint.includes("restaurant")) {
    return {
      fill: "bg-secondary/78",
      mutedFill: "bg-secondary/28",
      ring: "ring-secondary/25",
      border: "border-secondary/35",
      text: "text-secondary",
    };
  }

  if (hint.includes("bölcsi") || hint.includes("iskola") || hint.includes("gyerek") || hint.includes("school")) {
    return {
      fill: "bg-primary-container/86",
      mutedFill: "bg-primary-container/30",
      ring: "ring-primary-container/25",
      border: "border-primary-container/40",
      text: "text-primary-container",
    };
  }

  if (hint.includes("program") || hint.includes("kirándul") || hint.includes("játsz") || hint.includes("directions")) {
    return {
      fill: "bg-secondary-container/85",
      mutedFill: "bg-secondary-container/32",
      ring: "ring-secondary-container/30",
      border: "border-secondary-container/45",
      text: "text-secondary",
    };
  }

  if (hint.includes("pihen") || hint.includes("este") || hint.includes("alv") || hint.includes("bedtime")) {
    return {
      fill: "bg-tertiary-container/85",
      mutedFill: "bg-tertiary-container/30",
      ring: "ring-tertiary-container/25",
      border: "border-tertiary-container/40",
      text: "text-tertiary",
    };
  }

  return {
    fill: "bg-primary/78",
    mutedFill: "bg-primary/24",
    ring: "ring-primary/20",
    border: "border-primary/30",
    text: "text-primary",
  };
}

function getTimelineState(event: ScheduleEvent, nowMinutes: number, nextStartMinutes: number | null) {
  const startMinutes = timeToMinutes(getStartTime(event));
  const endMinutes = getEventEndMinutes(event);
  const effectiveEndMinutes = Math.max(endMinutes, startMinutes + 1);

  if (startMinutes <= nowMinutes && nowMinutes < effectiveEndMinutes) return "current";
  if (nextStartMinutes !== null && startMinutes === nextStartMinutes) return "next";
  if (effectiveEndMinutes <= nowMinutes) return "past";
  return "future";
}

interface DynamicEventData {
  currentEvent: ScheduleEvent | null;
  nextEvent:
    | {
        label: string;
        time: string;
        icon: string;
      }
    | null;
  progressPercent: number;
  countdown: string;
}

function computeEventData(events: ScheduleEvent[], now: Date): DynamicEventData {
  if (events.length === 0) {
    return { currentEvent: null, nextEvent: null, progressPercent: 0, countdown: "" };
  }

  const sorted = [...events].sort((a, b) => timeToMinutes(getStartTime(a)) - timeToMinutes(getStartTime(b)));
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const currentEvent =
    sorted.find((event) => {
      if (!event.endTime) return false;
      return timeToMinutes(getStartTime(event)) <= nowMinutes && nowMinutes < timeToMinutes(event.endTime);
    }) ?? null;

  if (currentEvent?.endTime) {
    const startMinutes = timeToMinutes(getStartTime(currentEvent));
    const endMinutes = timeToMinutes(currentEvent.endTime);
    const total = endMinutes - startMinutes;
    const elapsed = nowMinutes - startMinutes;

    return {
      currentEvent,
      nextEvent: {
        label: `${getEventTitle(currentEvent)} vége`,
        time: currentEvent.endTime,
        icon: currentEvent.icon,
      },
      progressPercent: total > 0 ? Math.round((elapsed / total) * 100) : 0,
      countdown: formatCountdown(endMinutes - nowMinutes),
    };
  }

  const nextEvent = sorted.find((e) => timeToMinutes(getStartTime(e)) > nowMinutes) ?? null;

  if (!nextEvent) {
    return { currentEvent: null, nextEvent: null, progressPercent: 100, countdown: "" };
  }

  const nextMinutes = timeToMinutes(getStartTime(nextEvent));
  const prevEvents = sorted.filter((e) => timeToMinutes(getStartTime(e)) <= nowMinutes);
  const prevMinutes =
    prevEvents.length > 0 ? timeToMinutes(prevEvents[prevEvents.length - 1].endTime ?? getStartTime(prevEvents[prevEvents.length - 1])) : 0;

  const total = nextMinutes - prevMinutes;
  const elapsed = nowMinutes - prevMinutes;
  const progressPercent = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const countdown = formatCountdown(nextMinutes - nowMinutes);

  return {
    currentEvent: null,
    nextEvent: {
      label: getEventTitle(nextEvent),
      time: getStartTime(nextEvent),
      icon: nextEvent.icon,
    },
    progressPercent,
    countdown,
  };
}

function TimelineOverview({
  events,
  now,
}: {
  events: ScheduleEvent[];
  now: Date | null;
}) {
  const sortedEvents = [...events].sort((a, b) => timeToMinutes(getStartTime(a)) - timeToMinutes(getStartTime(b)));
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : 0;
  const nowPosition = Math.min(100, Math.max(0, (nowMinutes / 1440) * 100));
  const nextStartMinutes =
    sortedEvents.map((event) => timeToMinutes(getStartTime(event))).find((minutes) => minutes > nowMinutes) ?? null;
  const visibleEvents: ScheduleEvent[] = [];
  const groupedEvents: { event: ScheduleEvent; hidden: ScheduleEvent[] }[] = [];

  for (const event of sortedEvents) {
    const startMinutes = timeToMinutes(getStartTime(event));
    const endMinutes = getEventEndMinutes(event);
    const effectiveEndMinutes = Math.max(endMinutes, startMinutes + 12);
    const overlappingIndex = visibleEvents.findIndex((visibleEvent) => {
      const visibleStartMinutes = timeToMinutes(getStartTime(visibleEvent));
      const visibleEndMinutes = Math.max(getEventEndMinutes(visibleEvent), visibleStartMinutes + 12);
      return startMinutes < visibleEndMinutes && effectiveEndMinutes > visibleStartMinutes;
    });

    if (overlappingIndex === -1) {
      visibleEvents.push(event);
      groupedEvents.push({ event, hidden: [] });
    } else {
      groupedEvents[overlappingIndex].hidden.push(event);
    }
  }

  return (
    <div className="relative z-10 mt-3 pt-3 border-t border-surface-variant/40">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <p className="text-[10px] uppercase tracking-widest text-outline font-bold">
          Mai idővonal
        </p>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {now ? formatTime(now) : "--:--"}
        </span>
      </div>

      <div className="relative h-7 rounded-xl bg-gradient-to-r from-surface-container-low via-white to-surface-container-low border border-surface-variant/60 overflow-hidden">
        {[0, 25, 50, 75, 100].map((position) => (
          <span
            key={position}
            className="absolute top-0 bottom-0 w-px bg-surface-variant/70"
            style={{ left: `${position}%` }}
          />
        ))}

        {groupedEvents.map(({ event, hidden }) => {
          const startMinutes = timeToMinutes(getStartTime(event));
          const endMinutes = getEventEndMinutes(event);
          const isDuration = endMinutes > startMinutes;
          const left = (startMinutes / 1440) * 100;
          const width = Math.max(((endMinutes - startMinutes) / 1440) * 100, 3);
          const title = [event, ...hidden]
            .map((item) => `${getEventTimeLabel(item)} — ${getEventTitle(item)}`)
            .join("\n");
          const accent = getEventAccent(event);
          const state = getTimelineState(event, nowMinutes, nextStartMinutes);
          const isPast = state === "past";
          const isCurrent = state === "current";
          const isNext = state === "next";
          const commonStateClass = [
            isPast ? "opacity-35 saturate-50" : "opacity-90",
            isCurrent ? `ring-2 ${accent.ring} shadow-[0_0_16px_rgba(51,69,55,0.22)] opacity-100` : "",
            isNext ? "ring-1 ring-white/80 opacity-100" : "",
          ].join(" ");

          if (!isDuration) {
            return (
              <div
                key={event.id}
                className={[
                  "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-white shadow-sm flex items-center justify-center ring-2 ring-white border",
                  accent.fill,
                  accent.border,
                  commonStateClass,
                ].join(" ")}
                style={{ left: `${left}%` }}
                title={title}
                aria-label={title}
              >
                <span className="material-symbols-outlined text-[12px]">{event.icon}</span>
                {hidden.length > 0 && (
                  <span className="absolute -right-2 -top-2 min-w-4 h-4 px-1 rounded-full bg-on-surface text-white text-[9px] font-bold leading-4 text-center ring-1 ring-white">
                    +{hidden.length}
                  </span>
                )}
              </div>
            );
          }

          return (
            <div
              key={event.id}
              className={[
                "absolute top-1 bottom-1 rounded-full text-white shadow-sm flex items-center justify-center overflow-visible border",
                isPast ? accent.mutedFill : accent.fill,
                accent.border,
                commonStateClass,
              ].join(" ")}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={title}
              aria-label={title}
            >
              <span className="material-symbols-outlined text-[11px] shrink-0">{event.icon}</span>
              {isCurrent && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-on-surface px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                  most
                </span>
              )}
              {hidden.length > 0 && (
                <span className="absolute -right-2 -top-1 min-w-4 h-4 px-1 rounded-full bg-on-surface text-white text-[9px] font-bold leading-4 text-center ring-1 ring-white">
                  +{hidden.length}
                </span>
              )}
            </div>
          );
        })}

        <div
          className="absolute top-0.5 bottom-0.5 w-0.5 bg-on-surface rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
          style={{ left: `${nowPosition}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="grid grid-cols-5 text-[9px] text-outline/60 font-semibold tabular-nums mt-1">
        <span>00</span>
        <span className="text-center">06</span>
        <span className="text-center">12</span>
        <span className="text-center">18</span>
        <span className="text-right">24</span>
      </div>
    </div>
  );
}

export default function DailyPulse() {
  const [now, setNow] = useState<Date | null>(null);
  const { schedule, hydrated } = useSchedule();

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, []);

  const timeStr = now ? formatTime(now) : "--:--";
  const todayIndex = getTodayDayIndex();
  const todayEvents = hydrated ? (schedule[todayIndex] ?? []) : [];
  const { currentEvent, nextEvent, progressPercent, countdown } = now
    ? computeEventData(todayEvents, now)
    : { currentEvent: null, nextEvent: null, progressPercent: 0, countdown: "" };
  const blockLabel = currentEvent ? getEventTitle(currentEvent) : now ? getTimeBlock(now.getHours()) : "…";

  return (
    <div className="w-full relative rounded-2xl px-5 py-4 ambient-shadow border border-surface-variant/50 overflow-hidden bg-gradient-to-br from-white to-surface-container-lowest">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        {/* Bal: Jelenleg */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-2.5 h-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Jelenleg
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-on-surface tracking-tight tabular-nums leading-none">
              {timeStr}
            </span>
            <span className="text-sm font-medium text-outline hidden sm:block">{blockLabel}</span>
          </div>
        </div>

        {/* Elválasztó */}
        <div className="hidden lg:block h-8 w-px bg-surface-variant shrink-0" />

        {/* Jobb: Következő esemény */}
        <div className="flex-1 flex items-center justify-between gap-4 min-w-0">
          {nextEvent ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">{nextEvent.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-outline font-bold flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                    Következő
                  </p>
                  <p className="text-sm font-semibold text-on-surface truncate">
                    {nextEvent.label}
                    <span className="text-outline font-normal ml-2">{nextEvent.time}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24 h-1.5 bg-surface-variant/60 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="px-2.5 py-1 bg-primary rounded-full text-white text-[11px] font-bold shadow-sm shadow-primary/20 whitespace-nowrap">
                  {countdown}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-[10px] bg-surface-variant/60 text-outline flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">nightlight</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-0.5">
                  Ma
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-outline truncate">
                    {todayEvents.length === 0 ? "Nincs beállítva menetrend" : "Nincs több esemény"}
                  </p>
                  {todayEvents.length === 0 && (
                    <Link
                      href="/beallitasok"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-white text-[11px] font-bold hover:bg-primary-container transition-colors"
                    >
                      Menetrend beállítása
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobil: blokk label külön sorban */}
      <p className="sm:hidden text-xs font-medium text-outline mt-2 pl-[calc(2.5rem+1rem)]">
        {blockLabel}
      </p>

      <TimelineOverview events={todayEvents} now={now} />
    </div>
  );
}
