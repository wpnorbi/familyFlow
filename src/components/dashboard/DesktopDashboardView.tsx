"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { useMealData } from "@/hooks/useMealData";
import { useSchedule } from "@/hooks/useSchedule";
import {
  getBatchRecipe,
  getBatchesForDate,
  getUpcomingBatches,
  getWeekDays,
  toDateKey,
} from "@/lib/etkezes-data";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import { getRecipeMealTypeLabel, isQuickRecipe } from "@/lib/recipes/recipe-taxonomy";
import { getUserImportedRecipes } from "@/lib/recipes/user-import.provider";
import { getTodayDayIndex } from "@/lib/schedule-store";
import type { MealBatch, Recipe } from "@/types/etkezes";
import type { ScheduleEvent } from "@/types/schedule";

const ALL_RECIPES = Array.from(
  new Map(getUserImportedRecipes().map((recipe) => [recipe.id, recipe])).values(),
);
const FOOD_HERO_RECIPE = ALL_RECIPES.find((recipe) => recipe.image) ?? ALL_RECIPES[0];
const DEFAULT_HERO_IMAGE = FOOD_HERO_RECIPE?.image ?? "/images/dashboard/hero-kitchen.jpg";

interface DashboardSnapshot {
  nextMeal: Recipe | null;
  todayMeals: MealBatch[];
  plannedDaysCount: number;
  todayKey: string;
  weekDays: ReturnType<typeof getWeekDays>;
}

interface NotifItem {
  icon: string;
  text: string;
  sub: string;
  href: string;
}

function getDashboardSnapshot(batches: MealBatch[]): DashboardSnapshot {
  const today = new Date();
  const todayKey = toDateKey(today);
  const weekDays = getWeekDays();
  const upcoming = getUpcomingBatches(batches, todayKey, 4);
  const nextMeal = upcoming[0] ? getBatchRecipe(upcoming[0].batch) ?? null : null;

  return {
    nextMeal,
    todayMeals: getBatchesForDate(batches, todayKey),
    plannedDaysCount: weekDays.filter((day) => getBatchesForDate(batches, day.dateKey).length > 0).length,
    todayKey,
    weekDays,
  };
}

function getReminderData(events: ScheduleEvent[]) {
  return events.slice(0, 3);
}

function Icon({ name, className = "text-[20px]" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function NotificationPopover({
  items,
  onClose,
}: {
  items: NotifItem[];
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Értesítések"
      className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] overflow-hidden rounded-[22px] border border-[rgba(170,135,84,0.18)] bg-[rgba(255,249,237,0.98)] shadow-[0_24px_56px_-24px_rgba(50,34,14,0.38)] backdrop-blur-[24px]"
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h3 className="text-[13px] font-extrabold text-[var(--ff-text)]">Értesítések</h3>
        <button
          onClick={onClose}
          aria-label="Bezárás"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ff-text-muted)] hover:bg-[rgba(61,49,34,0.08)]"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 pb-5 pt-3 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(210,228,192,0.92)] text-[var(--ff-primary)]">
            <Icon name="check_circle" className="text-[22px]" />
          </span>
          <p className="text-[12px] font-bold text-[var(--ff-text-muted)]">Nincs új értesítés.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[rgba(170,135,84,0.08)] px-2 pb-2">
          {items.map((item) => (
            <li key={item.text}>
              <Link
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-[14px] px-2 py-3 transition-colors hover:bg-[rgba(255,245,224,0.88)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(255,240,210,0.96)] text-[var(--ff-caramel-strong)]">
                  <Icon name={item.icon} className="text-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-extrabold text-[var(--ff-text)]">{item.text}</p>
                  <p className="text-[10.5px] font-semibold text-[var(--ff-text-muted)]">{item.sub}</p>
                </div>
                <Icon name="chevron_right" className="ml-auto shrink-0 text-[16px] text-[var(--ff-text-muted)] opacity-50" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.94)] p-5 shadow-[0_24px_50px_-34px_rgba(61,49,34,0.18)] ${className}`}
    >
      {children}
    </section>
  );
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("hu-HU", { month: "long", day: "numeric" });
}

export default function DesktopDashboardView() {
  const { mealBatches, shoppingItems, pantryItems, hydrated } = useMealData();
  const { schedule, hydrated: scheduleHydrated } = useSchedule();

  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNotifPopover) return;
    const handler = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifPopover]);

  const snapshot = useMemo(
    () =>
      hydrated
        ? getDashboardSnapshot(mealBatches)
        : {
            nextMeal: null,
            todayMeals: [],
            plannedDaysCount: 0,
            todayKey: toDateKey(new Date()),
            weekDays: getWeekDays(),
          },
    [hydrated, mealBatches],
  );

  const todayEvents = scheduleHydrated ? schedule[getTodayDayIndex()] ?? [] : [];
  const reminders = getReminderData(todayEvents);
  const completedReminders = reminders.slice(1);
  const pendingReminder = reminders[0] ?? null;
  const shoppingMissingCount = shoppingItems.length;
  const pantryMatches = useMemo(
    () => rankRecipesForPantry(ALL_RECIPES.slice(0, 40), pantryItems).slice(0, 3),
    [pantryItems],
  );

  const plannedRatio = Math.round((snapshot.plannedDaysCount / 7) * 100);
  const missingLunchCount = Math.max(1, 3 - snapshot.todayMeals.length);
  const quickMeal = snapshot.nextMeal ?? ALL_RECIPES.find((recipe) => recipe.image) ?? ALL_RECIPES[0];
  const mainHeroImage = quickMeal?.image ?? DEFAULT_HERO_IMAGE;
  const weekendEvents = scheduleHydrated ? [...(schedule[5] ?? []), ...(schedule[6] ?? [])] : [];
  const nextWeekendEvent = weekendEvents[0];
  const weekdayStates = snapshot.weekDays.map((day) => ({
    day,
    planned: getBatchesForDate(mealBatches, day.dateKey).length > 0,
  }));

  const suggestedRecipe = pantryMatches[0]?.recipe ?? quickMeal;
  const recommendationStrip = useMemo(() => {
    const base = ALL_RECIPES.filter((recipe) => recipe.image);
    return base.slice(0, 5);
  }, []);

  const notifItems = useMemo<NotifItem[]>(() => {
    const items: NotifItem[] = [];
    if (pendingReminder) {
      items.push({
        icon: "checklist",
        text: `${pendingReminder.label}`,
        sub: "Mai teendő",
        href: "/programok",
      });
    }
    if (shoppingMissingCount > 0) {
      items.push({
        icon: "shopping_cart",
        text: `${shoppingMissingCount} hozzávaló hiányzik`,
        sub: "Bevásárlólista frissítése",
        href: "/etkezes",
      });
    }
    if (snapshot.plannedDaysCount < 7) {
      items.push({
        icon: "calendar_month",
        text: `${7 - snapshot.plannedDaysCount} nap még üres`,
        sub: "Folytasd a heti tervet",
        href: "/etkezes",
      });
    }
    return items;
  }, [pendingReminder, shoppingMissingCount, snapshot.plannedDaysCount]);

  return (
    <div className="hidden min-h-screen w-full px-3 py-3 md:block">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1780px] flex-col rounded-[32px] bg-[linear-gradient(180deg,rgba(246,235,216,0.78)_0%,rgba(248,240,226,0.86)_15%,rgba(250,244,234,0.92)_40%)] px-6 py-6 shadow-[0_44px_120px_-72px_rgba(50,34,14,0.56),inset_0_0_0_1px_rgba(175,140,88,0.13)] backdrop-blur-[22px] 2xl:px-8 2xl:py-7">
        <WelcomeHeader
          description="Így áll a család - gyors áttekintés és következő lépések."
          actions={
            <>
              <Link
                href="/etkezes"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(170,135,84,0.16)] bg-[rgba(255,248,232,0.94)] px-5 py-3 text-[15px] font-bold text-[var(--ff-text)] shadow-[0_10px_20px_-14px_rgba(61,49,34,0.2)]"
              >
                <Icon name="add_task" className="text-[20px]" />
                Új étkezés
              </Link>
              <Link
                href="/etkezes"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(170,135,84,0.16)] bg-[rgba(255,248,232,0.94)] px-5 py-3 text-[15px] font-bold text-[var(--ff-text)] shadow-[0_10px_20px_-14px_rgba(61,49,34,0.2)]"
              >
                <Icon name="calendar_month" className="text-[20px]" />
                Heti terv
              </Link>

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifPopover((value) => !value)}
                  aria-label={`Értesítések${notifItems.length > 0 ? ` — ${notifItems.length} új` : ""}`}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(170,135,84,0.16)] bg-[rgba(255,248,232,0.94)] text-[var(--ff-text)] shadow-[0_10px_20px_-14px_rgba(61,49,34,0.2)]"
                >
                  <Icon name="notifications" className="text-[21px]" />
                  {notifItems.length > 0 && (
                    <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#e8821e] shadow-[0_0_0_1.5px_rgba(248,239,224,0.95)]" />
                  )}
                </button>
                {showNotifPopover && <NotificationPopover items={notifItems} onClose={() => setShowNotifPopover(false)} />}
              </div>
            </>
          }
        />

        <div className="grid flex-1 grid-cols-[minmax(0,1fr)_420px] gap-5 2xl:gap-6">
          <section className="min-w-0">
            <section className="relative overflow-hidden rounded-[30px] border border-[rgba(170,135,84,0.12)] bg-[linear-gradient(135deg,#1f3a2d,#294535)] p-8 text-white shadow-[0_30px_64px_-36px_rgba(36,20,6,0.52)]">
              <div className="absolute inset-y-0 right-0 w-[34%]">
                <div
                  className="h-full w-full bg-cover bg-center opacity-95"
                  style={{ backgroundImage: `url(${mainHeroImage})` }}
                />
              </div>
              <div className="relative max-w-[68%]">
                <p className="flex items-center gap-2 text-[15px] font-bold text-[rgba(255,241,220,0.92)]">
                  <Icon name="auto_awesome" className="text-[20px] text-[#f5c36b]" />
                  Mai családi áttekintés
                </p>

                <div className="mt-8 grid grid-cols-3 gap-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(255,255,255,0.12)]">
                      <Icon name="restaurant" className="text-[26px] text-[rgba(241,245,236,0.95)]" />
                    </span>
                    <div>
                      <p className="text-[18px] font-bold leading-none">{missingLunchCount} ebéd</p>
                      <p className="mt-2 text-[14px] text-[rgba(241,245,236,0.82)]">még hiányzik</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(226,173,74,0.26)]">
                      <Icon name="calendar_month" className="text-[26px] text-[#f3c56d]" />
                    </span>
                    <div>
                      <p className="text-[18px] font-bold leading-none">{snapshot.plannedDaysCount} / 7 nap</p>
                      <p className="mt-2 text-[14px] text-[rgba(241,245,236,0.82)]">megtervezve</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(137,177,93,0.24)]">
                      <Icon name="shopping_cart" className="text-[26px] text-[#9fc96f]" />
                    </span>
                    <div>
                      <p className="text-[18px] font-bold leading-none">{shoppingMissingCount} hozzávaló</p>
                      <p className="mt-2 text-[14px] text-[rgba(241,245,236,0.82)]">hiányzik</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-white/14 pt-6">
                  <p className="flex items-center gap-2 text-[15px] font-medium text-[rgba(255,241,220,0.9)]">
                    <Icon name="wb_incandescent" className="text-[20px] text-[#f5c36b]" />
                    Tipp: Tervezd meg a hét ebédjeit 10 perc alatt!
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <Link
                    href="/etkezes"
                    className="inline-flex items-center gap-3 rounded-full bg-[linear-gradient(135deg,#eea433,#d6841e)] px-8 py-4 text-[18px] font-bold text-white shadow-[0_24px_48px_-24px_rgba(200,118,28,0.68)]"
                  >
                    Ebéd választása
                    <Icon name="arrow_forward" className="text-[22px]" />
                  </Link>
                  <Link
                    href="/etkezes"
                    className="inline-flex items-center gap-3 rounded-full bg-[rgba(255,255,255,0.14)] px-8 py-4 text-[18px] font-bold text-[rgba(245,248,242,0.96)]"
                  >
                    <Icon name="calendar_month" className="text-[20px]" />
                    Heti terv folytatása
                  </Link>
                </div>
              </div>
            </section>

            <div className="mt-5 grid grid-cols-[1.1fr_1fr_0.9fr_1.05fr] gap-4">
              <Card>
                <p className="flex items-center gap-2 text-[15px] font-bold text-[var(--ff-text)]">
                  <Icon name="monitoring" className="text-[20px] text-[var(--ff-primary)]" />
                  Heti étkezés állapot
                </p>
                <div className="mt-6 flex items-center gap-5">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[conic-gradient(var(--ff-primary)_0deg,var(--ff-primary)_205deg,rgba(225,221,210,0.72)_205deg)]">
                    <div className="flex h-22 w-22 items-center justify-center rounded-full bg-[rgba(255,252,245,0.96)] text-[30px] font-extrabold text-[var(--ff-text)]">
                      {plannedRatio}%
                    </div>
                  </div>
                  <div>
                    <p className="text-[18px] font-bold text-[var(--ff-text)]">{snapshot.plannedDaysCount} / 7 nap</p>
                    <p className="mt-2 text-[16px] font-medium text-[var(--ff-text-muted)]">megtervezve</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between text-[13px] font-semibold text-[var(--ff-text-muted)]">
                  {weekdayStates.map(({ day, planned }) => (
                    <div key={day.dateKey} className="flex flex-col items-center gap-2">
                      <span>{day.shortName}</span>
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full ${
                          planned ? "bg-[rgba(225,235,210,0.96)] text-[var(--ff-primary)]" : "border border-[rgba(170,135,84,0.18)] bg-white text-[var(--ff-text-soft)]"
                        }`}
                      >
                        {planned ? <Icon name="check" className="text-[16px]" /> : null}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/etkezes" className="mt-7 inline-flex items-center gap-2 text-[16px] font-semibold text-[var(--ff-text-muted)]">
                  Heti terv megnyitása
                  <Icon name="arrow_forward" className="text-[20px]" />
                </Link>
              </Card>

              <Card className="relative">
                <p className="flex items-center gap-2 text-[15px] font-bold text-[var(--ff-text)]">
                  <Icon name="event" className="text-[20px] text-[var(--ff-primary)]" />
                  Hétvégi program
                </p>
                <div className="mt-6">
                  <p className="text-[22px] font-bold text-[var(--ff-text)]">
                    {nextWeekendEvent ? nextWeekendEvent.label : "Szombat 25."}
                  </p>
                  <p className="mt-1 text-[18px] font-medium text-[var(--ff-text-muted)]">
                    {nextWeekendEvent?.category ?? "Családi piknik"}
                  </p>
                  <div className="mt-5 space-y-3 text-[15px] font-medium text-[var(--ff-text-muted)]">
                    <p className="flex items-center gap-2">
                      <Icon name="partly_cloudy_day" className="text-[20px] text-[var(--ff-caramel-strong)]" />
                      22° • Részben felhős
                    </p>
                    <p className="flex items-center gap-2">
                      <Icon name="location_on" className="text-[20px] text-[var(--ff-caramel-strong)]" />
                      Normafa • 10:00 - 15:00
                    </p>
                  </div>
                </div>
                <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-36 bg-[radial-gradient(circle_at_bottom_right,rgba(220,196,138,0.36),transparent_58%)]" />
                <Link href="/programok" className="mt-7 inline-flex items-center gap-2 text-[16px] font-semibold text-[var(--ff-text-muted)]">
                  Programok megnyitása
                  <Icon name="arrow_forward" className="text-[20px]" />
                </Link>
              </Card>

              <Card>
                <p className="flex items-center gap-2 text-[15px] font-bold text-[var(--ff-text)]">
                  <Icon name="inventory_2" className="text-[20px] text-[var(--ff-primary)]" />
                  Kamra frissítés
                </p>
                <div className="mt-8">
                  <p className="text-[20px] font-bold text-[var(--ff-text)]">2 napja</p>
                  <p className="mt-2 text-[16px] font-medium text-[var(--ff-text-muted)]">utoljára frissítve</p>
                  <p className="mt-10 text-[18px] font-bold text-[var(--ff-text)]">{Math.max(pantryItems.length, 39)} alapanyag</p>
                  <p className="mt-2 text-[15px] font-medium text-[var(--ff-text-muted)]">rendben</p>
                </div>
                <Link href="/kamra" className="mt-8 inline-flex items-center gap-2 text-[16px] font-semibold text-[var(--ff-text-muted)]">
                  Kamra frissítése
                  <Icon name="arrow_forward" className="text-[20px]" />
                </Link>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-[15px] font-bold text-[var(--ff-text)]">
                    <Icon name="notifications_active" className="text-[20px] text-[var(--ff-primary)]" />
                    Gyors emlékeztetők
                  </p>
                  <span className="rounded-full bg-[rgba(255,230,196,0.96)] px-3 py-1 text-[13px] font-bold text-[var(--ff-caramel-strong)]">
                    {reminders.length}
                  </span>
                </div>
                <div className="mt-6 space-y-5">
                  {reminders.length > 0 ? (
                    reminders.map((reminder, index) => (
                      <div key={`${reminder.id}-${index}`} className="flex gap-3">
                        <span
                          className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                            index === 0
                              ? "border border-[rgba(185,130,71,0.28)] bg-white text-[var(--ff-caramel-strong)]"
                              : "bg-[rgba(225,235,210,0.96)] text-[var(--ff-primary)]"
                          }`}
                        >
                          <Icon name={index === 0 ? "radio_button_unchecked" : "check"} className="text-[18px]" />
                        </span>
                        <div>
                          <p className="text-[16px] font-semibold text-[var(--ff-text)]">{reminder.label}</p>
                          <p className="mt-1 text-[14px] text-[var(--ff-text-muted)]">
                            {index === 0 ? "Hamarosan" : "Kész"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[15px] font-medium text-[var(--ff-text-muted)]">Nincs mai emlékeztető.</p>
                  )}
                </div>
                <Link href="/programok" className="mt-8 inline-flex items-center gap-2 text-[16px] font-semibold text-[var(--ff-text-muted)]">
                  Összes emlékeztető
                  <Icon name="arrow_forward" className="text-[20px]" />
                </Link>
              </Card>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_1.1fr] gap-4">
              <Card>
                <p className="flex items-center gap-2 text-[15px] font-bold text-[var(--ff-text)]">
                  <Icon name="schedule" className="text-[20px] text-[var(--ff-primary)]" />
                  Ma - idővonal
                </p>
                <div className="mt-6 space-y-5">
                  {[
                    { time: "07:00", label: "Ébredés", color: "bg-[var(--ff-primary)]" },
                    { time: "08:00 - 15:30", label: "Iskola", color: "bg-[var(--ff-primary)]" },
                    { time: "18:30", label: "Vacsora", color: "bg-[var(--ff-caramel-strong)]", badge: "MOST" },
                    { time: "21:00", label: "Lefekvés", color: "bg-[var(--ff-primary)]" },
                  ].map((item) => (
                    <div key={item.time} className="grid grid-cols-[100px_14px_1fr] items-center gap-4">
                      <span className="text-[18px] font-bold text-[var(--ff-text)]">{item.time}</span>
                      <span className={`h-3 w-3 rounded-full ${item.color}`} />
                      <div className="flex items-center gap-3">
                        <span className={`text-[18px] font-semibold ${item.badge ? "text-[var(--ff-caramel-strong)]" : "text-[var(--ff-text-muted)]"}`}>
                          {item.label}
                        </span>
                        {item.badge ? (
                          <span className="rounded-full bg-[rgba(255,230,196,0.96)] px-3 py-1 text-[12px] font-bold text-[var(--ff-caramel-strong)]">
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="grid grid-cols-[1fr_1.1fr] gap-5">
                <div>
                  <div className="overflow-hidden rounded-[22px]">
                    <div
                      className="h-[220px] w-full bg-cover bg-center"
                      style={{
                        backgroundImage:
                          "url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80)",
                      }}
                    />
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-[18px] font-semibold text-[var(--ff-caramel-strong)]">
                    <Icon name="favorite" className="text-[20px]" />
                    A közös étkezések apró pillanatai nagy emlékeket teremtenek.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-[15px] font-bold text-[var(--ff-text)]">
                      <Icon name="auto_awesome" className="text-[20px] text-[var(--ff-primary)]" />
                      Okos javaslat
                    </p>
                  </div>

                  {suggestedRecipe && (
                    <div className="grid grid-cols-[120px_1fr] gap-4 rounded-[22px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,249,239,0.72)] p-4">
                      <div className="overflow-hidden rounded-[18px]">
                        <RecipeImage recipe={suggestedRecipe} className="h-[120px] w-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[24px] font-bold leading-tight tracking-[-0.04em] text-[var(--ff-text)]">
                          {suggestedRecipe.name}
                        </p>
                        <p className="mt-2 text-[15px] font-semibold text-[var(--ff-caramel-strong)]">Ma ajánlott</p>
                        <p className="mt-2 text-[15px] leading-snug text-[var(--ff-text-muted)]">
                          Gyors, kedvelt, és a kamrádban már több hozzávaló is megvan.
                        </p>
                        <div className="mt-4 flex items-center gap-3 text-[14px] font-medium text-[var(--ff-text-muted)]">
                          <span>{suggestedRecipe.duration} perc</span>
                          <span>•</span>
                          <span>{getRecipeMealTypeLabel(suggestedRecipe)}</span>
                        </div>
                        <Link
                          href="/etkezes"
                          className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(170,135,84,0.14)] bg-white px-5 py-3 text-[16px] font-bold text-[var(--ff-text)]"
                        >
                          Kiválasztom
                          <Icon name="arrow_forward" className="text-[20px]" />
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="rounded-[22px] bg-[linear-gradient(135deg,rgba(236,245,225,0.96),rgba(244,249,234,0.94))] p-5">
                    <p className="flex items-center gap-2 text-[16px] font-bold text-[var(--ff-primary)]">
                      <Icon name="calendar_month" className="text-[20px]" />
                      Tervezd meg vasárnapra is az ebédet!
                    </p>
                    <p className="mt-3 text-[15px] leading-snug text-[var(--ff-text-muted)]">
                      Egy perc, ami sok időt spórol a hétvégén.
                    </p>
                    <Link
                      href="/etkezes"
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-[rgba(225,235,210,0.96)] px-5 py-3 text-[16px] font-bold text-[var(--ff-primary)]"
                    >
                      Hétvégi terv
                      <Icon name="arrow_forward" className="text-[20px]" />
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <aside className="flex min-w-0 flex-col gap-5">
            <Card>
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[16px] font-bold text-[var(--ff-text)]">
                  <Icon name="task_alt" className="text-[20px] text-[var(--ff-primary)]" />
                  Mai teendők
                </p>
                <span className="rounded-full bg-[rgba(225,235,210,0.96)] px-3 py-1 text-[14px] font-bold text-[var(--ff-primary)]">
                  {Math.max(reminders.length, 3)}
                </span>
              </div>

              <div className="mt-6 space-y-5">
                <div className="flex gap-3">
                  <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(185,130,71,0.28)] bg-white text-[var(--ff-caramel-strong)]">
                    <Icon name="radio_button_unchecked" className="text-[18px]" />
                  </span>
                  <div>
                    <p className="text-[18px] font-semibold text-[var(--ff-text)]">Ebéd kiválasztása</p>
                    <p className="mt-1 text-[15px] text-[var(--ff-text-muted)]">1 ebéd még hiányzik</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(225,235,210,0.96)] text-[var(--ff-primary)]">
                    <Icon name="check" className="text-[18px]" />
                  </span>
                  <div>
                    <p className="text-[18px] font-semibold text-[var(--ff-text)]">Kamra frissítése</p>
                    <p className="mt-1 text-[15px] text-[var(--ff-text-muted)]">Utolsó frissítés: tegnap 18:30</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(225,235,210,0.96)] text-[var(--ff-primary)]">
                    <Icon name="check" className="text-[18px]" />
                  </span>
                  <div>
                    <p className="text-[18px] font-semibold text-[var(--ff-text)]">
                      {pendingReminder?.label ?? "Foci torna"}
                    </p>
                    <p className="mt-1 text-[15px] text-[var(--ff-text-muted)]">16:00 - Városi Sportpálya</p>
                  </div>
                </div>
              </div>

              <Link href="/programok" className="mt-7 inline-flex items-center gap-2 text-[18px] font-semibold text-[var(--ff-text-muted)]">
                Összes teendő megnyitása
                <Icon name="arrow_forward" className="text-[22px]" />
              </Link>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[16px] font-bold text-[var(--ff-text)]">
                  <Icon name="shopping_cart" className="text-[20px] text-[var(--ff-primary)]" />
                  Bevásárlólista
                </p>
                <span className="rounded-full bg-[rgba(225,235,210,0.96)] px-3 py-1 text-[14px] font-bold text-[var(--ff-primary)]">
                  {Math.max(shoppingMissingCount, 3)}
                </span>
              </div>
              <div className="mt-5">
                <p className="text-[28px] font-bold text-[var(--ff-caramel-strong)]">{Math.max(shoppingMissingCount, 3)} hozzávaló hiányzik</p>
                <p className="mt-2 text-[18px] font-medium text-[var(--ff-text)]">{Math.max(shoppingItems.length, 7)} tétel a listán</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {["tomato", "nutrition", "water_bottle", "add"].map((icon, index) => (
                  <span
                    key={`${icon}-${index}`}
                    className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,248,232,0.82)] text-[var(--ff-caramel-strong)]"
                  >
                    <Icon name={icon} className="text-[28px]" />
                  </span>
                ))}
              </div>
              <Link href="/bevasarlas" className="mt-7 inline-flex items-center gap-2 text-[18px] font-semibold text-[var(--ff-text-muted)]">
                Lista megnyitása
                <Icon name="arrow_forward" className="text-[22px]" />
              </Link>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[16px] font-bold text-[var(--ff-text)]">
                  <Icon name="kitchen" className="text-[20px] text-[var(--ff-caramel-strong)]" />
                  Kamra figyelmeztetés
                </p>
                <span className="rounded-full bg-[rgba(255,230,196,0.96)] px-3 py-1 text-[14px] font-bold text-[var(--ff-caramel-strong)]">
                  2
                </span>
              </div>
              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(255,248,232,0.92)] text-[var(--ff-caramel-strong)]">
                    <Icon name="water_bottle" className="text-[22px]" />
                  </span>
                  <div>
                    <p className="text-[18px] font-semibold text-[var(--ff-text)]">Tej</p>
                    <p className="mt-1 text-[15px] text-[var(--ff-caramel-strong)]">Kitogyóban</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(255,248,232,0.92)] text-[var(--ff-caramel-strong)]">
                    <Icon name="grocery" className="text-[22px]" />
                  </span>
                  <div>
                    <p className="text-[18px] font-semibold text-[var(--ff-text)]">Paradicsom konzerv</p>
                    <p className="mt-1 text-[15px] text-[var(--ff-caramel-strong)]">Kevés</p>
                  </div>
                </div>
              </div>
              <Link href="/kamra" className="mt-7 inline-flex items-center gap-2 text-[18px] font-semibold text-[var(--ff-text-muted)]">
                Kamra megnyitása
                <Icon name="arrow_forward" className="text-[22px]" />
              </Link>
            </Card>
          </aside>
        </div>

        <section className="mt-5">
          <div className="grid grid-cols-5 gap-4">
            {recommendationStrip.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/etkezes?recipe=${recipe.id}`}
                className="overflow-hidden rounded-[24px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.94)] shadow-[0_18px_36px_-28px_rgba(61,49,34,0.2)]"
              >
                <div className="h-[150px] overflow-hidden">
                  <RecipeImage recipe={recipe} className="h-full w-full object-cover" />
                </div>
                <div className="px-4 pb-4 pt-3">
                  <h3 className="line-clamp-2 text-[18px] font-bold leading-tight tracking-[-0.03em] text-[var(--ff-text)]">
                    {recipe.name}
                  </h3>
                  <div className="mt-3 flex items-center gap-2 text-[14px] font-medium text-[var(--ff-text-muted)]">
                    <span>{recipe.duration} perc</span>
                    <span>•</span>
                    <span>{isQuickRecipe(recipe) ? "Gyors" : getRecipeMealTypeLabel(recipe)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
