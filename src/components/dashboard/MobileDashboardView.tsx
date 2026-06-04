"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import MobileGreetingHeader from "@/components/mobile/MobileGreetingHeader";
import { useMealData } from "@/hooks/useMealData";
import { useSchedule } from "@/hooks/useSchedule";
import { isDefaultSchedule } from "@/lib/family-state";
import { getBatchRecipe, getBatchesForDate, getUpcomingBatches, getWeekDays, toDateKey } from "@/lib/etkezes-data";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import { getTodayDayIndex } from "@/lib/schedule-store";
import type { MealBatch, Recipe } from "@/types/etkezes";
import type { ScheduleEvent } from "@/types/schedule";

const DASHBOARD_HERO_IMAGE = "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80";
const WEEKEND_IMAGE = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80";
const ROUTINE_LABELS = new Set(["Ébredés", "Iskola", "Vacsora", "Lefekvés", "Ebéd", "Szabadidő"]);

function getDashboardData(batches: MealBatch[]) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const weekDays = getWeekDays();
  const todayMeals = getBatchesForDate(batches, todayKey);
  const upcoming = getUpcomingBatches(batches, todayKey, 3);
  const nextMeal = upcoming[0] ? getBatchRecipe(upcoming[0].batch) ?? null : null;
  const plannedDaysCount = weekDays.filter((day) => getBatchesForDate(batches, day.dateKey).length > 0).length;

  return {
    todayMeals,
    nextMeal,
    plannedDaysCount,
    planningPercent: Math.round((plannedDaysCount / 7) * 100),
  };
}

function getReminderData(events: ScheduleEvent[]) {
  const reminders = events
    .filter((event) => getEventState(event) !== "done")
    .slice(0, 4);
  return {
    count: reminders.length,
    nextLabel: reminders[0]?.label ?? "Nincs mai teendő",
    reminders,
  };
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getEventStartTime(event: ScheduleEvent) {
  return event.startTime ?? event.time;
}

function formatEventTime(event: ScheduleEvent) {
  const startTime = getEventStartTime(event);
  return event.endTime ? `${startTime} – ${event.endTime}` : startTime;
}

function getEventState(event: ScheduleEvent) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(getEventStartTime(event));
  const endMinutes = event.endTime ? timeToMinutes(event.endTime) : startMinutes + 45;

  if (currentMinutes >= endMinutes) return "done";
  if (currentMinutes >= startMinutes) return "current";
  return "upcoming";
}

function isWeekendHighlight(event: ScheduleEvent) {
  if (event.category === "Program") return true;
  if (["event", "cake", "flight", "directions_run", "sports_soccer", "piano", "favorite"].includes(event.icon)) return true;
  return !ROUTINE_LABELS.has(event.label);
}

function getShoppingEmoji(item: string) {
  const value = item.toLowerCase();
  if (value.includes("paprika")) return "🫑";
  if (value.includes("paradicsom")) return "🍅";
  if (value.includes("csirke")) return "🍗";
  if (value.includes("tej")) return "🥛";
  return "🛒";
}

function getHeroHeadline(missingLunches: number, plannedDaysCount: number) {
  if (missingLunches > 0) {
    return `${missingLunches} ebéd még hiányzik`;
  }
  if (plannedDaysCount === 0) {
    return "Még nincs kész a heted";
  }
  if (plannedDaysCount < 7) {
    return "Még nincs kész a heted";
  }
  return "A heti terv összeállt";
}

function getHeroSubline(missingLunches: number, shoppingMissingCount: number) {
  if (missingLunches > 0) {
    return "Egy gyors döntés, és közelebb lesz a teljes heti terv.";
  }
  if (shoppingMissingCount > 0) {
    return "A terv megvan, most a hiányzó hozzávalókra érdemes figyelni.";
  }
  return "Minden fontos családi információ egy helyen.";
}

// ─── Notification bottom sheet ────────────────────────────────────────────────

interface NotifItem {
  icon: string;
  text: string;
  sub: string;
  href: string;
}

function NotificationSheet({
  items,
  onClose,
}: {
  items: NotifItem[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal aria-label="Értesítések">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(20,10,2,0.45)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-[28px] border-t border-[rgba(170,135,84,0.16)] bg-[rgba(255,249,237,0.99)] shadow-[0_-16px_48px_-20px_rgba(50,30,10,0.28)] backdrop-blur-[24px]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        {/* Handle */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[rgba(61,49,34,0.18)]" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h3 className="text-[17px] font-extrabold text-[var(--ff-text)]">Értesítések</h3>
          <button
            onClick={onClose}
            aria-label="Bezárás"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(61,49,34,0.08)] transition-colors active:bg-[rgba(61,49,34,0.16)]"
          >
            <span className="material-symbols-outlined text-[18px] text-[var(--ff-text-muted)]">close</span>
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-5 pb-10 pt-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(210,228,192,0.92)] text-[var(--ff-primary)]">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </span>
            <p className="text-[14px] font-bold text-[var(--ff-text-muted)]">Nincs új értesítés.</p>
          </div>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-[rgba(170,135,84,0.10)] overflow-y-auto px-3 pb-4">
            {items.map((item) => (
              <li key={item.text}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-[18px] px-2 py-4 transition-colors active:bg-[rgba(255,245,224,0.88)]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[rgba(255,238,208,0.97)] text-[var(--ff-caramel-strong)]">
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-extrabold text-[var(--ff-text)]">{item.text}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[var(--ff-text-muted)]">{item.sub}</p>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-[var(--ff-text-muted)] opacity-50">chevron_right</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MobileDashboardView() {
  const { mealBatches, shoppingItems, pantryItems, hydrated } = useMealData();
  const { schedule, hydrated: scheduleHydrated } = useSchedule();

  const [showNotifSheet, setShowNotifSheet] = useState(false);

  const dashboardData = useMemo(
    () =>
      hydrated
        ? getDashboardData(mealBatches)
        : { todayMeals: [], nextMeal: null as Recipe | null, plannedDaysCount: 0, planningPercent: 0 },
    [hydrated, mealBatches],
  );

  const hasCustomSchedule = scheduleHydrated && !isDefaultSchedule(schedule);
  const todayEvents = hasCustomSchedule ? (schedule[getTodayDayIndex()] ?? []) : [];
  const reminderData = getReminderData(todayEvents);

  const todayPrimaryMeal = dashboardData.todayMeals[0] ? getBatchRecipe(dashboardData.todayMeals[0]) ?? null : null;
  const weekendEvents = hasCustomSchedule ? [...(schedule[5] ?? []), ...(schedule[6] ?? [])] : [];
  const nextWeekendEvent = weekendEvents.find(isWeekendHighlight) ?? null;
  const shoppingPreview = shoppingItems.slice(0, 3);
  const extraShoppingCount = Math.max(0, shoppingItems.length - shoppingPreview.length);
  const pantryCards = pantryItems.slice(0, 2).map((item, index) => ({
    title: item,
    note: index === 0 ? "Nyilvántartva a kamrában" : "Elérhető alapanyag",
    icon: index === 0 ? "🥫" : "🥣",
  }));
  const allTodayRows = todayEvents
    .slice()
    .sort((a, b) => timeToMinutes(getEventStartTime(a)) - timeToMinutes(getEventStartTime(b)))
    .slice(0, 4)
    .map((event) => ({
      label: event.label,
      time: formatEventTime(event),
      state: getEventState(event),
    }));
  const todoRows = allTodayRows.filter((item) => item.state !== "done");
  const completedTodoCount = allTodayRows.filter((item) => item.state === "done").length;
  const totalTodoCount = allTodayRows.length;
  const heroMealMissing = Math.max(0, 1 - dashboardData.todayMeals.length);
  const heroShoppingMissing = shoppingItems.length;
  const weekendDateLabel = nextWeekendEvent ? "Hétvége" : null;
  const heroHeadline = getHeroHeadline(heroMealMissing, dashboardData.plannedDaysCount);
  const heroSubline = getHeroSubline(heroMealMissing, heroShoppingMissing);
  const nextTodo = todoRows.find((item) => item.state === "current" || item.state === "upcoming") ?? null;
  const shoppingSummary = shoppingItems.length
    ? `Legfontosabbak: ${shoppingItems.slice(0, 3).join(", ")}`
    : "Most nincs hiányzó tétel a listán.";
  const pantrySummaryCount = pantryItems.length;

  // Build notification items from live state
  const notifItems = useMemo<NotifItem[]>(() => {
    const items: NotifItem[] = [];
    if (reminderData.count > 0)
      items.push({ icon: "event", text: `${reminderData.count} emlékeztető ma`, sub: reminderData.nextLabel, href: "/programok" });
    if (dashboardData.plannedDaysCount < 7)
      items.push({ icon: "restaurant", text: `${7 - dashboardData.plannedDaysCount} nap nincs tervezve`, sub: "Egészítsd ki a heti tervet", href: "/etkezes" });
    if (shoppingItems.length > 0)
      items.push({ icon: "shopping_basket", text: `${shoppingItems.length} tétel hiányzik`, sub: "Tekintsd át a bevásárlólistát", href: "/etkezes" });
    return items;
  }, [reminderData, dashboardData.plannedDaysCount, shoppingItems.length]);

  return (
    <div className="relative md:hidden">
      {/* Page background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,249,237,0.98),transparent_24%),radial-gradient(circle_at_top_right,rgba(238,243,231,0.82),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(246,228,203,0.56),transparent_24%),linear-gradient(180deg,#fffdf8_0%,#f8f2e8_100%)]" />

      {/* Scrollable content */}
      <div className="relative mx-auto max-w-[430px] px-4" style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom, 0px))" }}>
        <MobileGreetingHeader
          mode="greeting"
          subtitle="Gyors családi áttekintés"
          onNotificationClick={() => setShowNotifSheet(true)}
          notifCount={notifItems.length}
        />

        <section className="relative overflow-hidden rounded-[30px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.94)] shadow-[0_24px_44px_-28px_rgba(36,20,6,0.34)]">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${todayPrimaryMeal?.image ?? DASHBOARD_HERO_IMAGE})` }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(22,14,8,0.24),rgba(22,14,8,0.54)_48%,rgba(22,14,8,0.76)_100%)]" />
          <div className="relative px-5 pb-5 pt-4.5">
            <p className="flex items-center gap-2 text-[13px] font-bold text-[rgba(255,211,118,0.96)]">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Heti állapot
            </p>
            <h2 className="mt-4 max-w-[260px] text-[26px] font-semibold leading-tight tracking-[-0.05em] text-white">
              {heroHeadline}
            </h2>
            <p className="mt-2 max-w-[270px] text-[14px] leading-relaxed text-[rgba(255,244,231,0.9)]">
              {heroSubline}
            </p>

            <div className="mt-4 rounded-[26px] bg-[rgba(255,251,244,0.96)] p-4 shadow-[0_16px_28px_-20px_rgba(36,20,6,0.28)]">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,239,212,0.9)] text-[var(--ff-caramel-strong)]">
                    <span className="material-symbols-outlined text-[18px]">restaurant</span>
                  </span>
                  <p className="mt-2 text-[24px] font-semibold leading-none tracking-[-0.05em] text-[var(--ff-text)]">{heroMealMissing}</p>
                  <p className="mt-1 text-[12px] leading-4 text-[var(--ff-text-soft)]">ebéd hiányzik</p>
                </div>
                <div className="border-x border-[rgba(74,67,54,0.08)] text-center">
                  <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(230,241,218,0.9)] text-[var(--ff-primary)]">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  </span>
                  <p className="mt-2 text-[24px] font-semibold leading-none tracking-[-0.05em] text-[var(--ff-text)]">{dashboardData.plannedDaysCount}/7</p>
                  <p className="mt-1 text-[12px] leading-4 text-[var(--ff-text-soft)]">nap megtervezve</p>
                </div>
                <div className="text-center">
                  <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,236,230,0.9)] text-[#d56f4b]">
                    <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                  </span>
                  <p className="mt-2 text-[24px] font-semibold leading-none tracking-[-0.05em] text-[var(--ff-text)]">{heroShoppingMissing}</p>
                  <p className="mt-1 text-[12px] leading-4 text-[var(--ff-text-soft)]">hozzávaló hiányzik</p>
                </div>
              </div>

              <Link
                href="/etkezes"
                className="mt-3.5 flex items-center justify-between rounded-full bg-[linear-gradient(135deg,#eea433,#d6841e)] px-5 py-3.5 text-white shadow-[0_16px_28px_-18px_rgba(210,130,33,0.48)]"
              >
                <span className="flex-1 text-center text-[17px] font-bold tracking-[-0.02em]">
                  {dashboardData.todayMeals.length > 0 ? "Heti terv megnyitása" : "Ebéd választása"}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#cf7f1e]">
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </span>
              </Link>
            </div>
          </div>
        </section>

        <Link
          href="/programok"
          className="mt-4 block overflow-hidden rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.96)] p-4.5 shadow-[0_16px_30px_-24px_rgba(61,49,34,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(230,241,218,0.96)] text-[var(--ff-primary)]">
                <span className="material-symbols-outlined text-[22px]">check_circle</span>
              </span>
              <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Mai teendők</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[rgba(233,241,220,0.98)] px-3 py-1 text-[14px] font-semibold text-[var(--ff-primary)]">
                {hasCustomSchedule ? `${completedTodoCount}/${totalTodoCount} kész` : "Nincs rutin"}
              </span>
              <span className="material-symbols-outlined text-[20px] text-[var(--ff-text-soft)]">chevron_right</span>
            </div>
          </div>

          {!hasCustomSchedule || totalTodoCount === 0 ? (
            <div className="mt-4 rounded-[22px] bg-[rgba(255,248,236,0.82)] px-4 py-5 text-center">
              <p className="text-[15px] font-semibold text-[var(--ff-text)]">Még nincs beállítva semmi.</p>
              <p className="mt-1 text-[13px] text-[var(--ff-text-soft)]">A napi rutin eseményeit a Beállítások oldalon tudod felvenni.</p>
            </div>
          ) : todoRows.length === 0 ? (
            <div className="mt-4 rounded-[22px] bg-[rgba(233,241,220,0.82)] px-4 py-5 text-center">
              <p className="text-[15px] font-semibold text-[var(--ff-text)]">Mára minden kész.</p>
              <p className="mt-1 text-[13px] text-[var(--ff-text-soft)]">A mai teendőid mind lezárultak.</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-[rgba(74,67,54,0.08)]">
              {nextTodo && (
                <div className="mb-3 rounded-[18px] bg-[rgba(255,248,236,0.9)] px-3.5 py-3">
                  <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--ff-caramel-strong)]">Következő</p>
                  <p className="mt-1 text-[15px] font-semibold text-[var(--ff-text)]">{nextTodo.label}</p>
                </div>
              )}
              {todoRows.map((item) => (
                <div key={`${item.label}-${item.time}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    item.state === "done"
                      ? "bg-[rgba(230,241,218,0.98)] text-[var(--ff-primary)]"
                      : "border border-[rgba(170,135,84,0.22)] bg-white text-transparent"
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">{item.state === "done" ? "check" : "radio_button_unchecked"}</span>
                  </span>
                  <span className={`flex-1 text-[16px] ${
                    item.state === "done" ? "text-[var(--ff-text-soft)] line-through" : "text-[var(--ff-text)]"
                  }`}>
                    {item.label}
                  </span>
                  {item.state === "current" ? (
                    <span className="rounded-full bg-[rgba(255,239,212,0.86)] px-2.5 py-0.5 text-[10px] font-bold tracking-[0.08em] text-[var(--ff-caramel-strong)]">
                      MOST
                    </span>
                  ) : null}
                  <span className="text-[15px] font-medium text-[var(--ff-text-soft)]">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </Link>

        <Link
          href="/etkezes"
          className="mt-4 block overflow-hidden rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.96)] p-4.5 shadow-[0_16px_30px_-24px_rgba(61,49,34,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(233,241,220,0.96)] text-[var(--ff-primary)]">
                <span className="material-symbols-outlined text-[22px]">shopping_basket</span>
              </span>
              <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Bevásárlólista</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[rgba(233,241,220,0.98)] px-3 py-1 text-[14px] font-semibold text-[var(--ff-primary)]">
                {shoppingItems.length} hiányzik
              </span>
              <span className="material-symbols-outlined text-[20px] text-[var(--ff-text-soft)]">chevron_right</span>
            </div>
          </div>

          {shoppingPreview.length === 0 ? (
            <div className="mt-4 rounded-[22px] bg-[rgba(255,248,236,0.82)] px-4 py-5 text-center">
              <p className="text-[15px] font-semibold text-[var(--ff-text)]">Nincs hiányzó tétel.</p>
              <p className="mt-1 text-[13px] text-[var(--ff-text-soft)]">A bevásárlólista jelenleg üres.</p>
            </div>
          ) : (
            <>
              <div className="mt-3 rounded-[18px] bg-[rgba(255,248,236,0.9)] px-3.5 py-3">
                <p className="text-[15px] font-semibold text-[var(--ff-text)]">{shoppingItems.length} hiányzó tétel</p>
                <p className="mt-1 text-[13px] text-[var(--ff-text-soft)]">{shoppingSummary}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
              {shoppingPreview.map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,248,236,0.94)] px-3.5 py-2.5 text-[14px] font-medium text-[var(--ff-text)]">
                  <span>{getShoppingEmoji(item)}</span>
                  {item}
                </span>
              ))}
              {extraShoppingCount > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,248,236,0.94)] px-3.5 py-2.5 text-[14px] font-medium text-[var(--ff-text-soft)]">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  +{extraShoppingCount} további
                </span>
              )}
              </div>
            </>
          )}
        </Link>

        <Link
          href="/programok"
          className="mt-4 block overflow-hidden rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.96)] p-4.5 shadow-[0_16px_30px_-24px_rgba(61,49,34,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(233,241,220,0.96)] text-[var(--ff-primary)]">
                <span className="material-symbols-outlined text-[22px]">event</span>
              </span>
              <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Hétvégi program</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[rgba(233,241,220,0.98)] px-3 py-1 text-[14px] font-semibold text-[var(--ff-primary)]">
                {nextWeekendEvent ? weekendDateLabel : "Nincs terv"}
              </span>
              <span className="material-symbols-outlined text-[20px] text-[var(--ff-text-soft)]">chevron_right</span>
            </div>
          </div>

          {!nextWeekendEvent ? (
            <div className="mt-4 rounded-[22px] bg-[rgba(255,248,236,0.82)] px-4 py-5 text-center">
              <p className="text-[15px] font-semibold text-[var(--ff-text)]">Még nincs hétvégi program.</p>
              <p className="mt-1 text-[13px] text-[var(--ff-text-soft)]">Adj hozzá egy közös eseményt a Programok oldalon.</p>
            </div>
          ) : (
            <div className="mt-4 flex gap-4">
              <div className="h-[88px] w-[132px] shrink-0 overflow-hidden rounded-[18px]">
                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${WEEKEND_IMAGE})` }} />
              </div>
              <div className="min-w-0">
                <p className="text-[21px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">
                  {nextWeekendEvent.label}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-[15px] text-[var(--ff-text-soft)]">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {formatEventTime(nextWeekendEvent)}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[14px] text-[var(--ff-text-muted)]">
                  {nextWeekendEvent.category ? (
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">event</span>{nextWeekendEvent.category}</span>
                  ) : null}
                  {nextWeekendEvent.person ? (
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">groups</span>{nextWeekendEvent.person}</span>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </Link>

        <Link
          href="/kamra"
          className="mt-4 block overflow-hidden rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.96)] p-4.5 shadow-[0_16px_30px_-24px_rgba(61,49,34,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(255,239,212,0.96)] text-[var(--ff-caramel-strong)]">
                <span className="material-symbols-outlined text-[22px]">inventory_2</span>
              </span>
              <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Kamra</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[rgba(255,239,212,0.98)] px-3 py-1 text-[14px] font-semibold text-[var(--ff-caramel-strong)]">
                {pantrySummaryCount} tétel
              </span>
              <span className="material-symbols-outlined text-[20px] text-[var(--ff-text-soft)]">chevron_right</span>
            </div>
          </div>

          {pantryCards.length === 0 ? (
            <div className="mt-4 rounded-[22px] bg-[rgba(255,248,236,0.82)] px-4 py-5 text-center">
              <p className="text-[15px] font-semibold text-[var(--ff-text)]">Még nincs beállítva semmi.</p>
              <p className="mt-1 text-[13px] text-[var(--ff-text-soft)]">A kamrában még nincs rögzített alapanyag.</p>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {pantryCards.map((item) => (
                <div key={item.title} className="rounded-[20px] bg-[rgba(255,248,236,0.94)] p-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[24px] shadow-[0_8px_18px_-12px_rgba(61,49,34,0.18)]">
                    {item.icon}
                  </div>
                  <p className="mt-2.5 text-[15px] font-semibold leading-tight text-[var(--ff-text)]">{item.title}</p>
                  <p className="mt-1 text-[13px] text-[var(--ff-text-soft)]">{item.note}</p>
                </div>
              ))}
            </div>
          )}
        </Link>
      </div>

      {/* Notification bottom sheet */}
      {showNotifSheet && (
        <NotificationSheet
          items={notifItems}
          onClose={() => setShowNotifSheet(false)}
        />
      )}
    </div>
  );
}
