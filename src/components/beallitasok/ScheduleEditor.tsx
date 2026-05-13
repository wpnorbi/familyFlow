"use client";

import { useState } from "react";
import { useSchedule } from "@/hooks/useSchedule";
import { getTodayDayIndex, DAY_NAMES, DAY_SHORT, ICON_OPTIONS } from "@/lib/schedule-store";
import type { ScheduleEvent, ScheduleRecurrence, WeeklySchedule } from "@/types/schedule";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [0, 1, 2, 3, 4];

const RECURRENCE_OPTIONS: { value: ScheduleRecurrence; label: string }[] = [
  { value: "once", label: "Egyszeri" },
  { value: "daily", label: "Minden nap" },
  { value: "weekdays", label: "Hétköznap" },
  { value: "custom", label: "Egyedi napok" },
];

const CATEGORY_OPTIONS = ["", "Étkezés", "Bölcsi", "Program", "Otthon", "Munka"];

function getStartTime(event: ScheduleEvent): string {
  return event.startTime ?? event.time;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function sortByTime(events: ScheduleEvent[]): ScheduleEvent[] {
  return [...events].sort((a, b) => timeToMinutes(getStartTime(a)) - timeToMinutes(getStartTime(b)));
}

function formatEventTime(event: ScheduleEvent): string {
  const startTime = getStartTime(event);
  return event.endTime ? `${startTime}–${event.endTime}` : startTime;
}

function getEventTitle(event: ScheduleEvent): string {
  return [event.label, event.person].filter(Boolean).join(" – ");
}

function getRecurrenceLabel(event: ScheduleEvent): string {
  if (event.recurrence === "daily") return "Minden nap";
  if (event.recurrence === "weekdays") return "Hétköznap";
  if (event.recurrence === "custom") return (event.days ?? []).map((day) => DAY_SHORT[day]).join(", ");
  return "Egyszeri";
}

function getTargetDays(recurrence: ScheduleRecurrence, selectedDay: number, customDays: number[]): number[] {
  if (recurrence === "daily") return ALL_DAYS;
  if (recurrence === "weekdays") return WEEKDAYS;
  if (recurrence === "custom") return customDays.length > 0 ? customDays : [selectedDay];
  return [selectedDay];
}

function removeEventSeries(schedule: WeeklySchedule, event: ScheduleEvent): WeeklySchedule {
  const seriesId = event.seriesId ?? event.id;
  return Object.fromEntries(
    ALL_DAYS.map((day) => [
      day,
      (schedule[day] ?? []).filter((item) => (item.seriesId ?? item.id) !== seriesId),
    ]),
  ) as WeeklySchedule;
}

export default function ScheduleEditor() {
  const todayIndex = getTodayDayIndex();
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const { schedule, updateSchedule, hydrated } = useSchedule();

  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [startTime, setStartTime] = useState("07:00");
  const [hasEndTime, setHasEndTime] = useState(false);
  const [endTime, setEndTime] = useState("08:00");
  const [icon, setIcon] = useState("event");
  const [label, setLabel] = useState("");
  const [person, setPerson] = useState("");
  const [category, setCategory] = useState("");
  const [recurrence, setRecurrence] = useState<ScheduleRecurrence>("once");
  const [customDays, setCustomDays] = useState<number[]>([todayIndex]);

  const events = hydrated ? (schedule[selectedDay] ?? []) : [];
  const isEditing = editingEvent !== null;

  function resetForm() {
    setEditingEvent(null);
    setStartTime("07:00");
    setHasEndTime(false);
    setEndTime("08:00");
    setIcon("event");
    setLabel("");
    setPerson("");
    setCategory("");
    setRecurrence("once");
    setCustomDays([selectedDay]);
  }

  function handleDelete(event: ScheduleEvent) {
    updateSchedule(removeEventSeries(schedule, event));
    if ((editingEvent?.seriesId ?? editingEvent?.id) === (event.seriesId ?? event.id)) {
      resetForm();
    }
  }

  function handleEdit(event: ScheduleEvent) {
    setEditingEvent(event);
    setStartTime(getStartTime(event));
    setHasEndTime(Boolean(event.endTime));
    setEndTime(event.endTime ?? getStartTime(event));
    setIcon(event.icon);
    setLabel(event.label);
    setPerson(event.person ?? "");
    setCategory(event.category ?? "");
    setRecurrence(event.recurrence ?? "once");
    setCustomDays(event.days ?? [selectedDay]);
  }

  function handleSave() {
    if (!label.trim()) return;

    const days = getTargetDays(recurrence, selectedDay, customDays);
    const seriesId = editingEvent?.seriesId ?? editingEvent?.id ?? `series-${Date.now()}`;
    const baseSchedule = editingEvent ? removeEventSeries(schedule, editingEvent) : schedule;
    const cleanEndTime = hasEndTime && endTime > startTime ? endTime : undefined;

    const next = { ...baseSchedule };
    for (const day of days) {
      const event: ScheduleEvent = {
        id: `${seriesId}-${day}`,
        seriesId,
        time: startTime,
        startTime,
        endTime: cleanEndTime,
        icon,
        label: label.trim(),
        person: person.trim() || undefined,
        category: category || undefined,
        recurrence,
        days,
      };
      next[day] = sortByTime([...(next[day] ?? []), event]);
    }

    updateSchedule(next);
    resetForm();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
  }

  function toggleCustomDay(day: number) {
    setCustomDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort(),
    );
  }

  function handleSelectDay(day: number) {
    setSelectedDay(day);
    if (!isEditing) setCustomDays([day]);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--ff-text)]">Napi menetrend</h2>
        <p className="mt-1 text-sm text-[var(--ff-text-muted)]">
          A dashboard napi ritmusa ezekből az eseményekből épül fel.
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {DAY_SHORT.map((short, i) => {
          const isToday = i === todayIndex;
          const isSelected = i === selectedDay;
          return (
            <button
              key={i}
              onClick={() => handleSelectDay(i)}
              className={[
                "px-3 py-1.5 rounded-xl text-sm font-semibold transition-all",
                isSelected
                  ? "ff-button-primary text-white shadow-sm"
                  : isToday
                    ? "bg-[var(--ff-primary-muted)] text-[var(--ff-primary)] ring-1 ring-[var(--ff-primary-glass)]"
                    : "ff-glass-card-subtle text-[var(--ff-text-muted)] hover:bg-[rgba(255,252,244,0.9)]",
              ].join(" ")}
            >
              {short}
              {isToday && !isSelected && (
                <span className="ml-1 text-[9px] font-bold uppercase tracking-widest opacity-70">
                  ma
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="ff-glass-card overflow-hidden rounded-[var(--ff-radius-lg)]">
          <div className="flex items-center justify-between border-b border-[var(--ff-card-border)] bg-[rgba(255,251,244,0.72)] px-5 py-3">
            <span className="text-sm font-semibold text-[var(--ff-text)]">{DAY_NAMES[selectedDay]}</span>
            <span className="text-xs text-[var(--ff-text-soft)]">{events.length} esemény</span>
          </div>

          {!hydrated ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--ff-text-soft)]">Betöltés…</div>
          ) : events.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <span className="material-symbols-outlined mb-2 block text-[32px] text-[var(--ff-text-soft)]">
                event_busy
              </span>
              <p className="text-sm text-[var(--ff-text-muted)]">Erre a napra még nincs esemény.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--ff-card-border)]">
              {sortByTime(events).map((event) => (
                <li
                  key={event.id}
                  className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[rgba(255,252,244,0.62)]"
                >
                  <span className="w-24 shrink-0 text-sm font-bold tabular-nums text-[var(--ff-text-soft)]">
                    {formatEventTime(event)}
                  </span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--ff-primary-glass)] text-[var(--ff-primary)]">
                    <span className="material-symbols-outlined text-[16px]">{event.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--ff-text)]">{getEventTitle(event)}</p>
                    <p className="truncate text-[11px] text-[var(--ff-text-soft)]">
                      {[event.category, getRecurrenceLabel(event)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleEdit(event)}
                      className="rounded-lg p-1.5 text-[var(--ff-text-soft)] transition-all hover:bg-[var(--ff-primary-muted)] hover:text-[var(--ff-primary)] cursor-pointer"
                      aria-label="Szerkesztés"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      className="rounded-lg p-1.5 text-[var(--ff-text-soft)] transition-all hover:bg-[var(--ff-peach-soft)] hover:text-[var(--ff-caramel-strong)] cursor-pointer"
                      aria-label="Törlés"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ff-glass-card overflow-hidden rounded-[var(--ff-radius-lg)]">
          <div className="flex items-center justify-between border-b border-[var(--ff-card-border)] bg-[rgba(255,251,244,0.72)] px-5 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ff-text-soft)]">
                {isEditing ? "Esemény szerkesztése" : "Esemény hozzáadása"}
              </p>
              <p className="mt-1 text-xs text-[var(--ff-text-muted)]">
                {isEditing ? "Frissítsd a napi ritmus egyik fix pontját." : "Adj hozzá egy fix pontot a család napjához."}
              </p>
            </div>
            {isEditing && (
              <button onClick={resetForm} className="text-xs font-semibold text-[var(--ff-text-muted)] hover:text-[var(--ff-primary)] cursor-pointer">
                Mégse
              </button>
            )}
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ff-text-soft)]">
                Megnevezés
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="pl. Bölcsi"
                maxLength={40}
                className="ff-input px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ff-text-soft)]">
                  Kezdés
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="ff-input px-3 py-2 text-sm font-semibold tabular-nums"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ff-text-soft)]">
                  Ikon
                </label>
                <div className="relative">
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="ff-select w-full appearance-none py-2 pl-9 pr-8 text-sm cursor-pointer"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[var(--ff-primary)] pointer-events-none">
                    {icon}
                  </span>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[14px] text-[var(--ff-text-soft)] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            <label className="ff-glass-card-subtle flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 cursor-pointer">
              <span>
                <span className="block text-sm font-semibold text-[var(--ff-text)]">Ez egy időtartam esemény</span>
                <span className="block text-xs text-[var(--ff-text-soft)]">Befejezési idő megadása</span>
              </span>
              <input
                type="checkbox"
                checked={hasEndTime}
                onChange={(e) => setHasEndTime(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>

            {hasEndTime && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ff-text-soft)]">
                  Befejezés
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime}
                  className="ff-input px-3 py-2 text-sm font-semibold tabular-nums"
                />
                {endTime <= startTime && (
                  <span className="text-[11px] text-error">A befejezés legyen később, mint a kezdés.</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ff-text-soft)]">
                  Személy
                </label>
                <input
                  type="text"
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  placeholder="pl. Luca"
                  maxLength={24}
                  className="ff-input px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ff-text-soft)]">
                  Kategória
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="ff-select px-3 py-2 text-sm"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option || "empty"} value={option}>
                      {option || "Nincs"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ff-text-soft)]">
                Ismétlődés
              </label>
              <div className="grid grid-cols-2 gap-2">
                {RECURRENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRecurrence(option.value)}
                    className={[
                      "px-3 py-2 rounded-xl text-xs font-semibold transition-all border",
                      recurrence === option.value
                        ? "ff-button-primary border-transparent text-white"
                        : "ff-button-secondary text-[var(--ff-text-muted)] hover:bg-[rgba(255,252,244,0.9)]",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {recurrence === "custom" && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-wider font-semibold text-[var(--ff-text-soft)]">
                  Napok kiválasztása
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_SHORT.map((day, index) => (
                    <button
                      key={day}
                      onClick={() => toggleCustomDay(index)}
                      className={[
                        "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        customDays.includes(index)
                          ? "ff-button-warm text-white"
                          : "ff-chip text-[var(--ff-text-muted)] hover:bg-[rgba(255,240,227,0.72)]",
                      ].join(" ")}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!label.trim() || (hasEndTime && endTime <= startTime)}
              className="ff-button-primary px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:shadow-none disabled:bg-[rgba(94,113,87,0.35)] disabled:text-[rgba(255,249,237,0.85)] disabled:opacity-100"
            >
              {isEditing ? "Mentés" : "Hozzáadás"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
