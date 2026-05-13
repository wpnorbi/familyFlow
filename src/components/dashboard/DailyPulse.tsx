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
      fill: "bg-[rgba(185,130,71,0.86)]",
      mutedFill: "bg-[rgba(230,168,121,0.34)]",
      ring: "ring-[rgba(185,130,71,0.26)]",
      border: "border-[rgba(185,130,71,0.34)]",
      text: "text-[var(--ff-caramel-strong)]",
    };
  }

  if (hint.includes("bölcsi") || hint.includes("iskola") || hint.includes("gyerek") || hint.includes("school")) {
    return {
      fill: "bg-[rgba(94,113,87,0.9)]",
      mutedFill: "bg-[rgba(124,145,111,0.32)]",
      ring: "ring-[rgba(94,113,87,0.24)]",
      border: "border-[rgba(94,113,87,0.34)]",
      text: "text-[var(--ff-primary)]",
    };
  }

  if (hint.includes("program") || hint.includes("kirándul") || hint.includes("játsz") || hint.includes("directions")) {
    return {
      fill: "bg-[rgba(230,168,121,0.84)]",
      mutedFill: "bg-[rgba(246,196,154,0.42)]",
      ring: "ring-[rgba(230,168,121,0.28)]",
      border: "border-[rgba(185,130,71,0.28)]",
      text: "text-[var(--ff-caramel-strong)]",
    };
  }

  if (hint.includes("pihen") || hint.includes("este") || hint.includes("alv") || hint.includes("bedtime")) {
    return {
      fill: "bg-[rgba(95,109,87,0.8)]",
      mutedFill: "bg-[rgba(124,145,111,0.28)]",
      ring: "ring-[rgba(95,109,87,0.24)]",
      border: "border-[rgba(95,109,87,0.32)]",
      text: "text-[var(--ff-primary-strong)]",
    };
  }

  return {
    fill: "bg-[rgba(55,67,50,0.84)]",
    mutedFill: "bg-[rgba(55,67,50,0.24)]",
    ring: "ring-[rgba(55,67,50,0.22)]",
    border: "border-[rgba(55,67,50,0.3)]",
    text: "text-[var(--ff-primary)]",
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
    <div className="relative z-10 mt-4 border-t border-[var(--ff-card-border)] pt-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--ff-text-soft)]">
          Mai idővonal
        </p>
        <span className="ff-chip inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[var(--ff-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ff-primary)]" />
          {now ? formatTime(now) : "--:--"}
        </span>
      </div>

      <div className="relative h-9 overflow-hidden rounded-[var(--ff-radius-md)] border border-[var(--ff-glass-border)] bg-[rgba(255,255,255,0.45)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        {[0, 25, 50, 75, 100].map((position) => (
          <span
            key={position}
            className="absolute top-0 bottom-0 w-px bg-[rgba(111,106,96,0.12)]"
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
                  "absolute top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-white shadow-sm ring-2 ring-white",
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
                  <span className="absolute -right-2 -top-2 min-w-4 h-4 rounded-full bg-[var(--ff-primary-strong)] px-1 text-center text-[9px] font-bold leading-4 text-[var(--ff-text-inverse)] ring-1 ring-white">
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
                "absolute bottom-1 top-1 flex items-center justify-center overflow-visible rounded-full border text-white shadow-sm",
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
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ff-primary-strong)] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[var(--ff-text-inverse)]">
                  most
                </span>
              )}
              {hidden.length > 0 && (
                <span className="absolute -right-2 -top-1 min-w-4 h-4 rounded-full bg-[var(--ff-primary-strong)] px-1 text-center text-[9px] font-bold leading-4 text-[var(--ff-text-inverse)] ring-1 ring-white">
                  +{hidden.length}
                </span>
              )}
            </div>
          );
        })}

        <div
          className="absolute top-0.5 bottom-0.5 w-0.5 rounded-full bg-[var(--ff-primary)] shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
          style={{ left: `${nowPosition}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-1.5 grid grid-cols-5 text-[10px] font-semibold tabular-nums text-[var(--ff-text-soft)]">
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
    <div className="ff-glass-card-strong relative w-full overflow-hidden rounded-[var(--ff-radius-xl)] px-5 py-5">
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/4 rounded-full bg-[rgba(124,145,111,0.16)] blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-0 h-32 w-32 rounded-full bg-[rgba(230,168,121,0.14)] blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex shrink-0 items-start gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-2.5 h-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ff-primary)] opacity-40" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--ff-primary)]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ff-primary)]">
              Jelenleg
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-[40px] font-bold leading-none tracking-tight text-[var(--ff-text)] tabular-nums">
                {timeStr}
              </span>
              <span className="ff-chip hidden px-3 py-1 text-sm font-medium sm:inline-flex">
                {blockLabel}
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[var(--ff-text-muted)] sm:hidden">{blockLabel}</p>
          </div>
        </div>

        <div className="hidden h-10 w-px shrink-0 bg-[var(--ff-card-border)] lg:block" />

        <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
          {nextEvent ? (
            <>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--ff-radius-md)] bg-[var(--ff-primary-glass)] text-[var(--ff-primary)] shadow-[var(--ff-shadow-soft)]">
                  <span className="material-symbols-outlined text-[18px]">{nextEvent.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ff-text-soft)]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ff-caramel)]" />
                    Következő
                  </p>
                  <p className="truncate text-[15px] font-semibold text-[var(--ff-text)]">
                    {nextEvent.label}
                    <span className="ml-2 font-normal text-[var(--ff-text-muted)]">{nextEvent.time}</span>
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden h-2 w-28 overflow-hidden rounded-full bg-[rgba(255,255,255,0.45)] sm:block">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(135deg,var(--ff-primary-soft),var(--ff-primary))]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="ff-button-primary whitespace-nowrap px-3 py-1.5 text-[11px] font-bold">
                  {countdown}
                </span>
              </div>
            </>
          ) : (
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--ff-radius-md)] bg-[rgba(255,255,255,0.45)] text-[var(--ff-text-soft)] shadow-[var(--ff-shadow-soft)]">
                <span className="material-symbols-outlined text-[18px]">nightlight</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ff-text-soft)]">
                  Ma
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[var(--ff-text-muted)] truncate">
                    {todayEvents.length === 0 ? "Nincs beállítva menetrend" : "Nincs több esemény"}
                  </p>
                  {todayEvents.length === 0 && (
                    <Link
                      href="/beallitasok"
                      className="ff-button-primary inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold transition-colors hover:brightness-[1.03]"
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

      <TimelineOverview events={todayEvents} now={now} />
    </div>
  );
}
