"use client";

import Link from "next/link";
import { useMemo } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { useMealData } from "@/hooks/useMealData";
import { useSchedule } from "@/hooks/useSchedule";
import { RECIPES, getBatchRecipe, getBatchesForDate, getUpcomingBatches, getWeekDays, toDateKey } from "@/lib/etkezes-data";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import { getTodayDayIndex } from "@/lib/schedule-store";
import type { MealBatch, Recipe } from "@/types/etkezes";
import type { ScheduleEvent } from "@/types/schedule";

const USER_NAME = "Anna";
const DASHBOARD_HERO_IMAGE = "/images/dashboard/hero-bread.jpg";

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Jó reggelt, ${name}`;
  if (hour < 18) return `Jó napot, ${name}`;
  return `Jó estét, ${name}`;
}

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
  const reminders = events.slice(0, 3);
  return {
    count: reminders.length,
    nextLabel: reminders[0]?.label ?? "Nincs mai teendő",
  };
}

function FocusChip({
  icon,
  label,
  href,
  accent = "sage",
}: {
  icon: string;
  label: string;
  href: string;
  accent?: "sage" | "peach" | "cream";
}) {
  const accentClass = {
    sage: "bg-[rgba(238,243,231,0.98)] text-[var(--ff-primary)]",
    peach: "bg-[rgba(255,240,227,0.98)] text-[var(--ff-caramel-strong)]",
    cream: "bg-[rgba(255,249,237,0.98)] text-[var(--ff-primary)]",
  }[accent];

  return (
    <Link href={href} className={`flex items-center gap-2 rounded-[20px] px-3.5 py-2.5 shadow-[0_12px_22px_-18px_rgba(61,49,34,0.22)] ${accentClass}`}>
      <span className="material-symbols-outlined shrink-0 text-[18px]">{icon}</span>
      <span className="text-[13px] font-medium leading-tight tracking-[-0.01em]">{label}</span>
    </Link>
  );
}

export default function MobileDashboardView() {
  const { mealBatches, shoppingItems, pantryItems, hydrated } = useMealData();
  const { schedule, hydrated: scheduleHydrated } = useSchedule();

  const dashboardData = useMemo(
    () => (hydrated ? getDashboardData(mealBatches) : { todayMeals: [], nextMeal: null as Recipe | null, plannedDaysCount: 0, planningPercent: 0 }),
    [hydrated, mealBatches],
  );

  const todayEvents = scheduleHydrated ? (schedule[getTodayDayIndex()] ?? []) : [];
  const reminderData = getReminderData(todayEvents);

  const todayPrimaryMeal = dashboardData.todayMeals[0] ? getBatchRecipe(dashboardData.todayMeals[0]) ?? null : null;
  const heroRecipe = dashboardData.nextMeal ?? todayPrimaryMeal;
  const heroMealLabel = heroRecipe?.name ?? "Nincs mai ebéd";
  const heroMealCompactLabel = heroMealLabel.length > 18 ? `${heroMealLabel.slice(0, 18).trim()}…` : heroMealLabel;
  const heroKidLabel = heroRecipe
    ? heroRecipe.tags?.includes("gyerekbarát")
      ? "Gyerekbarát"
      : heroRecipe.kidFriendlyNotes
        ? "Családi"
        : heroRecipe.category
    : `${dashboardData.plannedDaysCount}/7 nap`;
  const heroDurationLabel = heroRecipe?.duration ? `${heroRecipe.duration} perc` : `${shoppingItems.length} lista tétel`;
  const heroCtaLabel = todayPrimaryMeal ? "Mai ebéd megnyitása" : "Kaja kiválasztása";
  const openDaysCount = 7 - dashboardData.plannedDaysCount;
  const pantryIdeaCount = rankRecipesForPantry(RECIPES, pantryItems).slice(0, 3).length;
  const pantryStatus = pantryItems.length > 0 ? `${pantryIdeaCount} receptötlet` : "Kamra feltöltése";
  const pantryDescription = pantryItems.length > 0 ? "Otthoni alapanyagokból" : "Adj hozzá alapanyagokat";
  const todayMealStatus = todayPrimaryMeal ? "Betervezve" : "Nincs kiválasztva";
  const compactCardClass =
    "relative overflow-hidden rounded-[30px] border border-white/80 p-3.5 shadow-[0_24px_42px_-28px_rgba(61,49,34,0.22)]";

  return (
    <div className="relative md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,249,237,0.98),transparent_24%),radial-gradient(circle_at_top_right,rgba(238,243,231,0.82),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(246,228,203,0.56),transparent_24%),linear-gradient(180deg,#fffdf8_0%,#f8f2e8_100%)]" />

      <div className="relative mx-auto max-w-[430px] px-4 pb-32 pt-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-full border border-white/80 shadow-[0_12px_24px_-16px_rgba(61,49,34,0.24)]">
              <div className="flex h-12 w-12 items-center justify-center bg-[linear-gradient(145deg,rgba(255,241,230,0.98),rgba(220,229,208,0.88))] text-[var(--ff-primary)]">
                <span className="text-sm font-semibold">A</span>
              </div>
            </div>
            <h1 className="text-[19px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">{getGreeting(USER_NAME)}</h1>
          </div>

          <button className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.88)] text-[var(--ff-text-muted)] shadow-[0_12px_24px_-18px_rgba(61,49,34,0.2)] backdrop-blur-[18px]">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-[var(--ff-caramel)]" />
          </button>
        </div>

        <section className="relative overflow-hidden rounded-[38px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,250,240,0.98),rgba(246,228,203,0.78))] p-4 shadow-[0_30px_64px_-30px_rgba(61,49,34,0.34)]">
          <div className="absolute inset-0">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${DASHBOARD_HERO_IMAGE})` }}
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(68,46,28,0.28),rgba(40,28,18,0.54)),radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_28%)]" />

          <div className="relative">
            <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[rgba(255,248,236,0.98)] [text-shadow:0_1px_10px_rgba(24,16,10,0.35)]">
              <span className="material-symbols-outlined text-[17px] text-[rgba(247,197,108,1)]">wb_twilight</span>
              Mai ritmus
            </p>
            <h2 className="max-w-[13rem] text-[32px] font-semibold leading-[1.02] tracking-[-0.04em] text-[rgba(255,252,246,1)] [text-shadow:0_2px_14px_rgba(24,16,10,0.42)]">
              {todayPrimaryMeal ? "Mai ebéd" : "Mit főzzünk ma?"}
            </h2>
            <p className="mt-2 max-w-[13rem] text-[16px] leading-snug text-[rgba(255,246,234,0.98)] [text-shadow:0_1px_12px_rgba(24,16,10,0.38)]">
              {todayPrimaryMeal ? "Megvan a mai fő étkezés." : "Válassz egy ételt, és indulhat a napi terv."}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { icon: "restaurant", label: heroMealCompactLabel },
                { icon: "sentiment_satisfied", label: heroKidLabel },
                { icon: "schedule", label: heroDurationLabel },
              ].map((item) => (
                <div key={item.label} className="rounded-full border border-white/32 bg-[rgba(255,249,237,0.95)] px-2.5 py-2.5 text-center text-[11px] font-medium text-[var(--ff-text)] shadow-[0_14px_20px_-18px_rgba(61,49,34,0.28)]">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined shrink-0 text-[18px] text-[rgba(31,33,29,0.84)]">{item.icon}</span>
                    <span className="line-clamp-1">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/etkezes"
              className="mt-5 flex items-center justify-between rounded-[32px] bg-[linear-gradient(135deg,#de9c4f,#cb8432)] px-6 py-5 text-[var(--ff-text-inverse)] shadow-[0_20px_36px_-18px_rgba(185,130,71,0.48)]"
            >
              <span className="text-[19px] font-semibold tracking-[-0.02em]">{heroCtaLabel}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#c68437] shadow-[0_12px_22px_-16px_rgba(61,49,34,0.24)]">
                <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
              </span>
            </Link>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <div className={`${compactCardClass} bg-[linear-gradient(145deg,rgba(239,247,233,0.98),rgba(214,229,202,0.9))]`}>
            <div className="absolute left-3 top-3 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(212,230,194,0.88),transparent_70%)]" />
            <div className="relative flex h-full min-h-[138px] flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div className="overflow-hidden rounded-[20px]">
                  {heroRecipe ? (
                    <RecipeImage recipe={heroRecipe} className="h-[62px] w-[62px] object-cover" />
                  ) : (
                    <div className="h-[62px] w-[62px] bg-[linear-gradient(145deg,rgba(221,236,208,0.92),rgba(246,235,216,0.9))]" />
                  )}
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(195,219,178,0.98)] text-[var(--ff-primary)]">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Mai ebéd</h3>
                <p className="mt-0.5 line-clamp-2 text-[16px] font-semibold text-[var(--ff-primary)]">
                  {todayPrimaryMeal?.name ?? todayMealStatus}
                </p>
                <p className="mt-2 text-[12px] font-semibold text-[var(--ff-text-muted)]">
                  {todayPrimaryMeal ? `${todayPrimaryMeal.duration} perc` : "Válassz egy ételt"}
                </p>
              </div>
            </div>
          </div>

          <div className={`${compactCardClass} bg-[linear-gradient(145deg,rgba(255,245,233,0.98),rgba(248,222,194,0.9))]`}>
            <div className="relative flex h-full min-h-[138px] flex-col justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,224,190,0.96)] text-[var(--ff-caramel-strong)] shadow-[0_12px_18px_-16px_rgba(185,130,71,0.42)]">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <div>
                <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Heti terv</h3>
                <p className="mt-1 text-[18px] font-semibold text-[var(--ff-caramel-strong)]">{dashboardData.plannedDaysCount}/7 nap</p>
                <p className="mt-1 text-[13px] font-semibold text-[var(--ff-text-muted)]">
                  {openDaysCount > 0 ? `${openDaysCount} nap még üres` : "Teljes hét megvan"}
                </p>
                <div className="mt-3 h-2.5 rounded-full bg-[rgba(61,49,34,0.08)]">
                  <div className="h-full rounded-full bg-[linear-gradient(135deg,#e7a34e,#c98535)]" style={{ width: `${Math.max(dashboardData.planningPercent, 8)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className={`${compactCardClass} bg-[linear-gradient(145deg,rgba(245,249,239,0.98),rgba(225,236,214,0.88))]`}>
            <div className="flex h-full min-h-[138px] flex-col justify-between gap-3">
              <div className="overflow-hidden rounded-[18px] bg-[linear-gradient(145deg,rgba(255,249,237,0.96),rgba(246,228,203,0.72))] p-3">
                <div className="flex gap-2">
                  {["grain", "nutrition", "cookie"].map((icon) => (
                    <div key={icon} className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(255,252,244,0.88)] text-[var(--ff-caramel-strong)]">
                      <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Kamra ötletek</h3>
                <p className="mt-1 text-[15px] font-medium text-[var(--ff-primary)]">{pantryStatus}</p>
                <p className="mt-1 text-[12px] font-semibold text-[var(--ff-text-muted)]">{pantryDescription}</p>
                <div className="mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(195,219,178,0.96)] text-[var(--ff-primary)]">
                  <span className="material-symbols-outlined text-[18px]">eco</span>
                </div>
              </div>
            </div>
          </div>

          <Link href="/beallitasok" className={`${compactCardClass} bg-[linear-gradient(145deg,rgba(255,246,236,0.98),rgba(248,224,205,0.88))]`}>
            <div className="flex h-full min-h-[138px] flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div className="rounded-[18px] bg-[rgba(255,249,237,0.94)] px-3.5 py-3.5 text-[var(--ff-caramel-strong)] shadow-[0_12px_20px_-18px_rgba(61,49,34,0.24)]">
                  <span className="material-symbols-outlined text-[22px]">sticky_note_2</span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--ff-caramel-strong)]">
                  <span className="material-symbols-outlined text-[18px]">arrow_forward_ios</span>
                </div>
              </div>
              <div>
                <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Emlékeztetők</h3>
                <p className="mt-1 text-[15px] font-medium text-[var(--ff-caramel-strong)]">
                  {reminderData.count > 0 ? `${reminderData.count} teendő vár rád` : "Ma nyugodtabb nap van"}
                </p>
              </div>
            </div>
          </Link>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Gyors választás</h2>
            <Link href="/etkezes" className="flex items-center gap-1 text-[15px] font-medium text-[var(--ff-text-muted)]">
              Összes
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <FocusChip icon="bolt" label="30 perc alatt" href="/etkezes?filter=gyors" accent="sage" />
            <FocusChip icon="sentiment_satisfied" label="Gyerekbarát" href="/etkezes?filter=gyerekbarat" accent="peach" />
            <FocusChip icon="eco" label="Kamrából" href="/etkezes?filter=kamra" accent="cream" />
          </div>
        </section>
      </div>

      <MobileBottomNav />
    </div>
  );
}
