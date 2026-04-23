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
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-on-surface">Napi menetrend</h2>
        <p className="text-sm text-outline mt-1">
          Pontesemények és időtartamok egy helyen — a dashboard „Mai ritmus” modulja ebből dolgozik.
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
                  ? "bg-primary text-white shadow-sm"
                  : isToday
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
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
        <div className="rounded-2xl border border-surface-variant/50 bg-white overflow-hidden ambient-shadow">
          <div className="px-5 py-3 bg-surface-container-low border-b border-surface-variant/40 flex items-center justify-between">
            <span className="text-sm font-bold text-on-surface">{DAY_NAMES[selectedDay]}</span>
            <span className="text-xs text-outline">{events.length} esemény</span>
          </div>

          {!hydrated ? (
            <div className="px-5 py-8 text-center text-sm text-outline">Betöltés…</div>
          ) : events.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <span className="material-symbols-outlined text-[32px] text-outline/40 block mb-2">
                event_busy
              </span>
              <p className="text-sm text-outline">Erre a napra még nincs esemény.</p>
            </div>
          ) : (
            <ul className="divide-y divide-surface-variant/30">
              {sortByTime(events).map((event) => (
                <li
                  key={event.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-container-low/60 transition-colors group"
                >
                  <span className="text-sm font-bold text-outline tabular-nums w-24 shrink-0">
                    {formatEventTime(event)}
                  </span>
                  <div className="w-8 h-8 rounded-[9px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">{event.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{getEventTitle(event)}</p>
                    <p className="text-[11px] text-outline truncate">
                      {[event.category, getRecurrenceLabel(event)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(event)}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-all"
                      aria-label="Szerkesztés"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-all"
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

        <div className="rounded-2xl border border-surface-variant/50 bg-white ambient-shadow overflow-hidden">
          <div className="px-5 py-3 bg-surface-container-low border-b border-surface-variant/40 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
              {isEditing ? "Esemény szerkesztése" : "Esemény hozzáadása"}
            </p>
            {isEditing && (
              <button onClick={resetForm} className="text-xs font-semibold text-outline hover:text-primary">
                Mégse
              </button>
            )}
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                Megnevezés
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="pl. Bölcsi"
                maxLength={40}
                className="px-3 py-2 rounded-xl border border-surface-variant bg-white text-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                  Kezdés
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-surface-variant bg-white text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                  Ikon
                </label>
                <div className="relative">
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full appearance-none pl-9 pr-8 py-2 rounded-xl border border-surface-variant bg-white text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined text-[16px] text-primary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {icon}
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-outline absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-surface-variant bg-surface-container-lowest px-3 py-2.5 cursor-pointer">
              <span>
                <span className="block text-sm font-semibold text-on-surface">Ez egy időtartam esemény</span>
                <span className="block text-xs text-outline">Befejezési idő megadása</span>
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
                <label className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                  Befejezés
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime}
                  className="px-3 py-2 rounded-xl border border-surface-variant bg-white text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
                />
                {endTime <= startTime && (
                  <span className="text-[11px] text-error">A befejezés legyen később, mint a kezdés.</span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                  Személy
                </label>
                <input
                  type="text"
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  placeholder="pl. Luca"
                  maxLength={24}
                  className="px-3 py-2 rounded-xl border border-surface-variant bg-white text-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-outline uppercase tracking-wider font-semibold">
                  Kategória
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-surface-variant bg-white text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
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
              <label className="text-[10px] text-outline uppercase tracking-wider font-semibold">
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
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-on-surface-variant border-surface-variant hover:bg-surface-container-low",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {recurrence === "custom" && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-outline uppercase tracking-wider font-semibold">
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
                          ? "bg-secondary text-white"
                          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
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
              className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isEditing ? "Mentés" : "Hozzáadás"}
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-outline/70 flex items-start gap-1.5">
        <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">info</span>
        A menetrend a böngészőben tárolódik. Az időtartam eseményeknél a dashboard felismeri, ha
        éppen folyamatban van egy blokk, és a befejezést kezeli következő mérföldkőként.
      </p>
    </div>
  );
}
