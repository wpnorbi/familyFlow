"use client";

import Link from "next/link";
import { getBatchRecipe, getBatchesForDate, getUpcomingBatches, getWeekDays, toDateKey } from "@/lib/etkezes-data";
import type { MealBatch, Recipe } from "@/types/etkezes";
import DinnerCard from "@/components/dashboard/DinnerCard";
import MealsStrip from "@/components/dashboard/MealsStrip";
import WeekendCard from "@/components/dashboard/WeekendCard";
import { useMealData } from "@/hooks/useMealData";
import { useSchedule } from "@/hooks/useSchedule";
import { DAY_NAMES, getTodayDayIndex } from "@/lib/schedule-store";
import type { ScheduleEvent } from "@/types/schedule";

function getDashboardData(batches: MealBatch[]) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const weekDays = getWeekDays();

  const todayBatches = getBatchesForDate(batches, todayKey);
  const todayMeal = todayBatches.length > 0 ? (getBatchRecipe(todayBatches[0]) ?? null) : null;

  const upcoming = getUpcomingBatches(batches, todayKey, 3);
  const upcomingMeals = upcoming
    .map(({ batch, nextEatDate }) => {
      const recipe = getBatchRecipe(batch);
      const day = weekDays.find((d) => d.dateKey === nextEatDate);
      const label = nextEatDate === todayKey ? "Ma" : (day?.name ?? nextEatDate);
      return { label, meal: recipe?.name ?? "" };
    })
    .filter((item) => item.meal);

  const plannedDaysCount = weekDays.filter((day) => getBatchesForDate(batches, day.dateKey).length > 0).length;

  return { todayMeal, upcomingMeals, plannedDaysCount, openDaysCount: weekDays.length - plannedDaysCount };
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function getProgramData(events: ScheduleEvent[]) {
  const informativeIcons = new Set(["event", "directions_run", "sports_soccer", "piano", "cake", "favorite", "flight"]);
  const nextProgram = events
    .filter((event) => informativeIcons.has(event.icon))
    .sort((a, b) => timeToMinutes((a.startTime ?? a.time)) - timeToMinutes((b.startTime ?? b.time)))[0];

  if (!nextProgram) return null;

  return {
    title: nextProgram.label,
    label: DAY_NAMES[getTodayDayIndex()],
    time: nextProgram.startTime ?? nextProgram.time,
    icon: nextProgram.icon,
  };
}

function WidgetCard({
  eyebrow,
  title,
  description,
  icon,
  accent = "green",
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  accent?: "green" | "sand" | "rose";
  children?: React.ReactNode;
}) {
  const accentClasses = {
    green: "bg-[var(--ff-sage-light)] text-[var(--ff-primary)]",
    sand: "bg-[var(--ff-caramel-light)] text-[var(--ff-caramel-strong)]",
    rose: "bg-[var(--ff-peach-soft)] text-[var(--ff-caramel-strong)]",
  };

  return (
    <div className="ff-glass-card rounded-[var(--ff-radius-lg)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ff-text-soft)]">{eyebrow}</p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--ff-text)]">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-text-muted)]">{description}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-[var(--ff-radius-md)] shadow-[var(--ff-shadow-soft)] ${accentClasses[accent]}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export default function DashboardMeals() {
  const { mealBatches: batches, shoppingItems, pantryItems, hydrated } = useMealData();
  const { schedule, hydrated: scheduleHydrated } = useSchedule();

  const { todayMeal, upcomingMeals, plannedDaysCount, openDaysCount } = hydrated
    ? getDashboardData(batches)
    : { todayMeal: null as Recipe | null, upcomingMeals: [], plannedDaysCount: 0, openDaysCount: 7 };
  const todayEvents = scheduleHydrated ? (schedule[getTodayDayIndex()] ?? []) : [];
  const nextProgram = getProgramData(todayEvents);
  const reminderItems = todayEvents.slice(0, 3).map((event) => ({
    id: event.id,
    time: event.startTime ?? event.time,
    label: event.label,
  }));
  const planningPercent = Math.round((plannedDaysCount / 7) * 100);

  return (
    <div className="flex flex-col gap-5">
      <MealsStrip upcomingMeals={upcomingMeals} />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_0.95fr]">
        <DinnerCard recipe={todayMeal} />
        <WeekendCard nextProgram={nextProgram} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4 md:grid-cols-2">
        <WidgetCard
          eyebrow="Heti terv"
          title={`${plannedDaysCount} / 7 nap megtervezve`}
          description={
            plannedDaysCount === 0
              ? "Válassz vacsorát, és indulhat a heti terv."
              : `${openDaysCount} nap még nyitott ezen a héten.`
          }
          icon="calendar_month"
        >
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.45)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(135deg,var(--ff-primary-soft),var(--ff-primary))]"
              style={{ width: `${planningPercent}%` }}
            />
          </div>
          <Link href="/etkezes" className="text-sm font-semibold text-[var(--ff-primary)]">
            Heti terv megnyitása
          </Link>
        </WidgetCard>

        <WidgetCard
          eyebrow="Kamra"
          title={shoppingItems.length > 0 ? `${shoppingItems.length} beszerzendő tétel` : "Nyugodt készletállapot"}
          description={
            shoppingItems.length > 0
              ? `Hiányzik: ${shoppingItems.slice(0, 2).join(", ")}`
              : pantryItems.length > 0
                ? `${pantryItems.length} alapanyag már a kamrában van.`
                : "Adj hozzá pár alapélelmiszert a kezdéshez."
          }
          icon="inventory_2"
          accent={shoppingItems.length > 0 ? "rose" : "green"}
        >
          <Link href="/kamra" className="text-sm font-semibold text-[var(--ff-primary)]">
            Kamra és lista megnyitása
          </Link>
        </WidgetCard>

        <WidgetCard
          eyebrow="Gyors lépés"
          title="Töltsd fel a központot"
          description="Kezdd egy étkezéssel vagy programmal."
          icon="add_circle"
          accent="sand"
        >
          <div className="flex flex-wrap gap-2">
            <Link href="/etkezes" className="ff-button-primary rounded-full px-4 py-2 text-sm font-semibold">
              Étkezés
            </Link>
            <Link href="/programok" className="ff-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
              Program
            </Link>
            <Link href="/beallitasok" className="ff-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
              Menetrend
            </Link>
          </div>
        </WidgetCard>

        <WidgetCard
          eyebrow="Mai emlékeztetők"
          title={reminderItems.length > 0 ? `${reminderItems.length} mai állomás` : "Adj ritmust a napnak"}
          description={
            reminderItems.length > 0
              ? "A nap fő pontjai egy helyen."
              : "A napi menetrend itt jelenik meg."
          }
          icon="checklist"
        >
          <div className="space-y-2">
            {reminderItems.length > 0 ? (
              reminderItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-[var(--ff-radius-md)] border border-[var(--ff-card-border)] bg-[rgba(255,251,244,0.72)] px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-[var(--ff-text)]">{item.label}</span>
                  <span className="text-sm font-semibold text-[var(--ff-text-muted)]">{item.time}</span>
                </div>
              ))
            ) : (
              <div className="rounded-[var(--ff-radius-md)] border border-dashed border-[var(--ff-card-border)] bg-[rgba(255,251,244,0.72)] px-3 py-3 text-sm text-[var(--ff-text-muted)]">
                Állíts be egy napi ritmust a beállításoknál.
              </div>
            )}
          </div>
        </WidgetCard>
      </section>
    </div>
  );
}
