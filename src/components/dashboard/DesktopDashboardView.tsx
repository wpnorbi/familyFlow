"use client";

import Link from "next/link";
import { useMemo } from "react";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { useMealData } from "@/hooks/useMealData";
import { useSchedule } from "@/hooks/useSchedule";
import {
  RECIPES,
  getBatchRecipe,
  getBatchesForDate,
  getUpcomingBatches,
  getWeekDays,
  toDateKey,
} from "@/lib/etkezes-data";
import { getTodayDayIndex } from "@/lib/schedule-store";
import type { MealBatch, Recipe } from "@/types/etkezes";
import type { ScheduleEvent } from "@/types/schedule";

const USER_NAME = "Anna";
const HERO_IMAGE = "/images/dashboard/hero-kitchen.jpg";

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
  const upcoming = getUpcomingBatches(batches, todayKey, 4);
  const plannedDaysCount = weekDays.filter((day) => getBatchesForDate(batches, day.dateKey).length > 0).length;
  const nextMeal = upcoming[0] ? getBatchRecipe(upcoming[0].batch) ?? null : null;

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
    label: reminders[0]?.label ?? "Nincs sürgős teendő",
  };
}

function DesktopIcon({ name, className = "text-[22px]" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function HeroFilter({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-2 rounded-full border border-white/35 bg-[rgba(255,250,239,0.94)] px-5 py-3 text-[13px] font-semibold text-[var(--ff-text)] shadow-[0_16px_30px_-22px_rgba(36,24,12,0.45)]">
      <DesktopIcon name={icon} className="text-[20px] text-[var(--ff-primary)]" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function QuickTile({ icon, label, tone = "sage" }: { icon: string; label: string; tone?: "sage" | "peach" | "cream" | "warm" }) {
  const tones = {
    sage: "bg-[rgba(223,235,211,0.98)] text-[var(--ff-primary)] shadow-[inset_0_0_0_1px_rgba(94,113,87,0.08)]",
    peach: "bg-[rgba(255,224,204,0.98)] text-[var(--ff-caramel-strong)] shadow-[inset_0_0_0_1px_rgba(154,99,49,0.08)]",
    cream: "bg-[rgba(255,246,226,0.98)] text-[var(--ff-primary)] shadow-[inset_0_0_0_1px_rgba(185,130,71,0.08)]",
    warm: "bg-[rgba(246,220,180,0.98)] text-[var(--ff-caramel-strong)] shadow-[inset_0_0_0_1px_rgba(154,99,49,0.1)]",
  };

  return (
    <button className={`flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-[16px] px-2.5 py-2.5 text-center transition-transform hover:-translate-y-0.5 ${tones[tone]}`}>
      <DesktopIcon name={icon} className="text-[26px]" />
      <span className="text-[11px] font-extrabold leading-tight text-[var(--ff-text)]">{label}</span>
    </button>
  );
}

function StatCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <div className={`relative min-h-[108px] overflow-hidden rounded-[22px] border border-white/70 p-3 shadow-[0_20px_38px_-32px_rgba(61,49,34,0.24)] ${className}`}>
      {children}
    </div>
  );
}

function MiniAvatar({ label, image }: { label: string; image?: string }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-[rgba(255,249,237,0.94)] text-[10px] font-extrabold text-[var(--ff-primary)] shadow-[0_6px_12px_-10px_rgba(61,49,34,0.28)]">
      {image ? (
        <span
          aria-label={label}
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
      ) : (
        label
      )}
    </div>
  );
}

function MealIdeaCard({ recipe }: { recipe: Recipe }) {
  const tags = recipe.tags ?? [];
  const isKidFriendly = tags.includes("gyerekbarát") || tags.includes("család");

  return (
    <article className="overflow-hidden rounded-[17px] bg-[rgba(255,250,241,0.84)] shadow-[0_18px_36px_-30px_rgba(61,49,34,0.24)]">
      <RecipeImage recipe={recipe} className="h-[116px] w-full object-cover 2xl:h-[132px]" />
      <div className="px-4 pb-3 pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-[14px] font-extrabold tracking-[-0.02em] text-[var(--ff-text)]">{recipe.name}</h3>
          <button className="mt-0.5 text-[var(--ff-text-muted)]">
            <DesktopIcon name="bookmark" className="text-[18px]" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-semibold text-[var(--ff-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <DesktopIcon name="schedule" className="text-[15px]" />
            {recipe.duration} perc
          </span>
          <span className="inline-flex items-center gap-1">
            <DesktopIcon name="sentiment_satisfied" className="text-[15px]" />
            {isKidFriendly ? "Gyerekbarát" : recipe.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <DesktopIcon name="calendar_month" className="text-[15px]" />
            2 napra
          </span>
        </div>
      </div>
    </article>
  );
}

export default function DesktopDashboardView() {
  const { mealBatches, shoppingItems, hydrated } = useMealData();
  const { schedule, hydrated: scheduleHydrated } = useSchedule();

  const dashboardData = useMemo(
    () =>
      hydrated
        ? getDashboardData(mealBatches)
        : { todayMeals: [], nextMeal: null as Recipe | null, plannedDaysCount: 0, planningPercent: 0 },
    [hydrated, mealBatches],
  );

  const todayEvents = scheduleHydrated ? (schedule[getTodayDayIndex()] ?? []) : [];
  const reminderData = getReminderData(todayEvents);
  const weekendCount = scheduleHydrated ? [5, 6].reduce((sum, day) => sum + (schedule[day]?.length ?? 0), 0) : 0;
  const todayPrimaryMeal = dashboardData.todayMeals[0] ? getBatchRecipe(dashboardData.todayMeals[0]) ?? null : null;
  const heroRecipe = dashboardData.nextMeal ?? todayPrimaryMeal;
  const pantryStatus = shoppingItems.length > 0 ? `${shoppingItems.length} tétel hiányzik` : "Minden rendben";
  const mealProgress = `${Math.min(dashboardData.todayMeals.length, 3)}/3 kész`;
  const featuredRecipes = [
    heroRecipe,
    RECIPES.find((recipe) => recipe.id === "sajtos-omlett"),
    RECIPES.find((recipe) => recipe.id === "gombaleves"),
  ].filter(Boolean) as Recipe[];
  const fallbackRecipes = RECIPES.filter((recipe) => ["teszta", "sajtos-omlett", "gombaleves"].includes(recipe.id));
  const mealIdeas = featuredRecipes.length >= 3 ? featuredRecipes.slice(0, 3) : fallbackRecipes;

  return (
    <div className="hidden min-h-screen w-full px-2.5 py-2.5 md:block">
      <div className="mx-auto grid min-h-[calc(100vh-20px)] max-w-[1780px] grid-cols-[minmax(0,2fr)_minmax(310px,1fr)] gap-5 rounded-[32px] bg-[rgba(255,252,246,0.62)] px-6 py-6 shadow-[0_34px_100px_-62px_rgba(61,49,34,0.42)] backdrop-blur-[20px] 2xl:grid-cols-[minmax(0,2fr)_minmax(380px,1fr)] 2xl:gap-6 2xl:px-7 2xl:py-7">
        <section className="min-w-0">
          <header className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                aria-label="Anna"
                className="h-12 w-12 overflow-hidden rounded-full border border-white/80 bg-[linear-gradient(145deg,rgba(255,241,230,0.98),rgba(220,229,208,0.88))] bg-cover bg-center shadow-[0_14px_28px_-18px_rgba(61,49,34,0.28)]"
                style={{
                  backgroundImage:
                    "url(https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80)",
                }}
              />
              <h1 className="text-[19px] font-extrabold tracking-[-0.02em] text-[var(--ff-text)]">{getGreeting(USER_NAME)}</h1>
            </div>
          </header>

          <section className="relative min-h-[326px] overflow-hidden rounded-[24px] bg-[var(--ff-primary)] px-8 py-7 text-white shadow-[0_28px_58px_-32px_rgba(61,49,34,0.5)] 2xl:min-h-[355px] 2xl:px-9 2xl:py-8">
            <div className="absolute inset-0">
              <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(40,25,12,0.78)_0%,rgba(50,31,13,0.46)_47%,rgba(38,24,10,0.14)_100%)]" />
            <div className="relative flex min-h-[270px] flex-col justify-between 2xl:min-h-[292px]">
              <div>
                <p className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[rgba(255,246,230,0.96)]">
                  <DesktopIcon name="wb_twilight" className="text-[22px] text-[#f0ae1c]" />
                  Mai ritmus
                </p>
                <h2 className="max-w-[520px] text-[48px] font-extrabold leading-[0.96] tracking-[-0.055em] text-[rgba(255,252,246,1)] 2xl:text-[56px]">
                  Mit főzzünk ma?
                </h2>
                <p className="mt-4 max-w-[360px] text-[19px] font-medium leading-snug text-[rgba(255,244,228,0.96)] 2xl:mt-5 2xl:text-[21px]">
                  Pár gyors döntés, és mutatjuk az ötleteket.
                </p>
              </div>

              <div className="flex items-center gap-3 2xl:gap-4">
                <div className="grid min-w-0 flex-1 grid-cols-4 gap-2.5 2xl:gap-3">
                  <HeroFilter icon="bolt" label="Gyors vacsora" />
                  <HeroFilter icon="sentiment_satisfied" label="Gyerekbarát" />
                  <HeroFilter icon="schedule" label="30 perc" />
                  <HeroFilter icon="calendar_month" label="2 napra" />
                </div>
                <Link
                  href="/etkezes"
                  className="flex min-w-[260px] items-center justify-between rounded-full bg-[linear-gradient(135deg,#e39b3d,#c97f2a)] py-3 pl-7 pr-2.5 text-[16px] font-extrabold text-[var(--ff-text-inverse)] shadow-[0_20px_40px_-22px_rgba(185,130,71,0.7)] 2xl:min-w-[330px] 2xl:py-3.5 2xl:pl-8 2xl:text-[17px]"
                >
                  Kaja kiválasztása
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#be7628]">
                    <DesktopIcon name="arrow_forward" className="text-[23px]" />
                  </span>
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-[1.06fr_0.92fr_0.92fr_1.12fr] gap-3 2xl:mt-5 2xl:gap-4">
            <StatCard className="bg-[linear-gradient(145deg,rgba(236,244,226,0.98),rgba(214,228,196,0.86))]">
              <div className="flex h-full items-center gap-3">
                <div className="h-[78px] w-[88px] shrink-0 overflow-hidden rounded-[20px] 2xl:h-[94px] 2xl:w-[120px] 2xl:rounded-[26px]">
                  {heroRecipe ? (
                    <RecipeImage recipe={heroRecipe} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: "url(/images/dashboard/hero-bread.jpg)" }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex justify-end">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(184,207,159,0.95)] text-[var(--ff-primary)]">
                      <DesktopIcon name="check" className="text-[18px]" />
                    </span>
                  </div>
                  <h3 className="text-[13px] font-extrabold leading-tight text-[var(--ff-text)] 2xl:text-[15px]">Mai étkezések</h3>
                  <p className="mt-1 text-[13px] font-extrabold text-[var(--ff-primary)] 2xl:text-[15px]">{mealProgress}</p>
                  <div className="mt-3 h-2 rounded-full bg-[rgba(61,49,34,0.08)] 2xl:mt-5 2xl:h-2.5">
                    <div className="h-full rounded-full bg-[linear-gradient(135deg,var(--ff-primary-soft),var(--ff-primary))]" style={{ width: `${Math.max(dashboardData.planningPercent / 2.3, 28)}%` }} />
                  </div>
                </div>
              </div>
            </StatCard>

            <StatCard className="bg-[linear-gradient(145deg,rgba(255,244,232,0.98),rgba(248,222,193,0.86))]">
              <div className="flex h-full flex-col justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[rgba(255,224,190,0.96)] text-[var(--ff-caramel-strong)] 2xl:h-11 2xl:w-11">
                  <DesktopIcon name="calendar_month" className="text-[20px]" />
                </span>
                <div>
                  <h3 className="text-[13px] font-extrabold text-[var(--ff-text)] 2xl:text-[15px]">Hétvégi terv</h3>
                  <p className="mt-1 text-[12px] font-bold text-[var(--ff-caramel-strong)] 2xl:text-[13px]">
                    {weekendCount > 0 ? "Készülünk" : "Még szervezzük"}
                  </p>
                  <div className="mt-2 flex items-center 2xl:mt-3">
                    <MiniAvatar label="A" image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" />
                    <div className="-ml-2"><MiniAvatar label="N" /></div>
                    <div className="-ml-2"><MiniAvatar label="B" /></div>
                    <div className="-ml-2"><MiniAvatar label="M" /></div>
                    <span className="ml-2 text-[11px] font-extrabold text-[var(--ff-text-muted)]">+2</span>
                  </div>
                </div>
              </div>
            </StatCard>

            <StatCard className="bg-[linear-gradient(145deg,rgba(255,250,242,0.98),rgba(244,232,211,0.86))]">
              <div className="flex h-full items-center gap-3">
                <div className="flex h-[70px] w-[64px] shrink-0 items-center justify-center rounded-[16px] bg-[rgba(255,249,237,0.74)] text-[var(--ff-caramel-strong)] 2xl:h-[92px] 2xl:w-[92px]">
                  <DesktopIcon name="inventory_2" className="text-[34px] 2xl:text-[46px]" />
                </div>
                <div>
                  <h3 className="text-[13px] font-extrabold text-[var(--ff-text)] 2xl:text-[15px]">Kamra</h3>
                  <p className="mt-1 text-[12px] font-bold text-[var(--ff-primary)]">{pantryStatus}</p>
                  <span className="mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(195,219,178,0.96)] text-[var(--ff-primary)] 2xl:mt-4 2xl:h-9 2xl:w-9">
                    <DesktopIcon name="eco" className="text-[18px]" />
                  </span>
                </div>
              </div>
            </StatCard>

            <Link href="/beallitasok" className="block">
              <StatCard className="h-full bg-[linear-gradient(145deg,rgba(255,244,232,0.98),rgba(248,222,193,0.82))]">
                <div className="flex h-full items-center justify-between gap-3">
                  <div className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-[17px] bg-[rgba(255,249,237,0.76)] text-[var(--ff-caramel-strong)] 2xl:h-[90px] 2xl:w-[90px]">
                    <DesktopIcon name="sticky_note_2" className="text-[32px] 2xl:text-[42px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-extrabold text-[var(--ff-text)] 2xl:text-[15px]">Emlékeztetők</h3>
                    <p className="mt-1 line-clamp-2 text-[11px] font-bold text-[var(--ff-caramel-strong)] 2xl:text-[12px]">
                      {reminderData.count > 0 ? `${reminderData.count} teendő vár rád` : reminderData.label}
                    </p>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--ff-caramel-strong)] 2xl:h-9 2xl:w-9">
                    <DesktopIcon name="chevron_right" className="text-[20px]" />
                  </span>
                </div>
              </StatCard>
            </Link>
          </section>

          <section className="mt-5 2xl:mt-7">
            <div className="mb-3 flex items-center justify-between 2xl:mb-4">
              <h2 className="text-[20px] font-extrabold tracking-[-0.03em] text-[var(--ff-text)]">Mai ötletek</h2>
              <Link href="/etkezes" className="flex items-center gap-1 text-[12px] font-bold text-[var(--ff-text-muted)]">
                Összes megtekintése
                <DesktopIcon name="chevron_right" className="text-[17px]" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 2xl:gap-6">
              {mealIdeas.map((recipe) => (
                <MealIdeaCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </section>
        </section>

        <aside className="min-w-0 space-y-5 2xl:space-y-6">
          <div className="flex justify-end">
            <button className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.86)] text-[var(--ff-text)] shadow-[0_14px_28px_-20px_rgba(61,49,34,0.25)]">
              <DesktopIcon name="notifications" className="text-[22px]" />
              <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-[#ed872d]" />
            </button>
          </div>

          <section className="rounded-[30px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,244,224,0.9),rgba(249,231,199,0.78))] p-5 shadow-[0_22px_52px_-34px_rgba(61,49,34,0.24)] 2xl:rounded-[34px] 2xl:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-extrabold tracking-[-0.01em] text-[var(--ff-text)] 2xl:mb-5">
              <DesktopIcon name="flare" className="text-[20px] text-[var(--ff-primary)]" />
              Gyors választás
            </h2>
            <div className="grid grid-cols-4 gap-2.5 2xl:gap-3">
              <QuickTile icon="bolt" label="Gyors vacsora" tone="sage" />
              <QuickTile icon="sentiment_satisfied" label="Gyerekbarát" tone="peach" />
              <QuickTile icon="inventory_2" label="Kamrából" tone="cream" />
              <QuickTile icon="schedule" label="30 perc alatt" tone="warm" />
              <QuickTile icon="calendar_month" label="2 napra" tone="warm" />
              <QuickTile icon="eco" label="Egyszerű" tone="sage" />
              <QuickTile icon="ramen_dining" label="Tészta" tone="cream" />
              <QuickTile icon="soup_kitchen" label="Leves" tone="peach" />
            </div>
            <Link
              href="/etkezes"
              className="mt-5 flex items-center justify-between rounded-full bg-[linear-gradient(135deg,#e79e38,#ca7a20)] py-3 pl-7 pr-2.5 text-[15px] font-extrabold text-[var(--ff-text-inverse)] shadow-[0_18px_34px_-22px_rgba(185,130,71,0.7)] 2xl:mt-6 2xl:py-3.5 2xl:pl-8 2xl:text-[16px]"
            >
              Mutasd az ötleteket
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#be7628]">
                <DesktopIcon name="arrow_forward" className="text-[23px]" />
              </span>
            </Link>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-[linear-gradient(145deg,rgba(241,232,209,0.86),rgba(232,226,207,0.72))] p-5 shadow-[0_22px_52px_-38px_rgba(61,49,34,0.2)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold text-[var(--ff-text)]">Mai fókusz</h2>
              <Link href="/etkezes" className="flex items-center gap-2 text-[11px] font-bold text-[var(--ff-text-muted)]">
                Testreszabás
                <DesktopIcon name="tune" className="text-[17px]" />
              </Link>
            </div>

            <div className="space-y-3">
              {[
                ["bolt", "Gyors vacsora"],
                ["sentiment_satisfied", "Gyerekbarát ötletek"],
                ["eco", "Egyszerű alapanyagok"],
              ].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-3 rounded-[18px] bg-[rgba(255,252,246,0.82)] px-4 py-3 shadow-[0_12px_22px_-20px_rgba(61,49,34,0.16)]">
                  <DesktopIcon name={icon} className="text-[22px] text-[var(--ff-primary)]" />
                  <span className="text-[12px] font-extrabold leading-tight text-[var(--ff-text)]">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 rounded-[20px] bg-[rgba(255,252,246,0.78)] px-4 py-4 shadow-[0_12px_22px_-20px_rgba(61,49,34,0.16)]">
              <DesktopIcon name="spa" className="text-[32px] text-[var(--ff-primary)]" />
              <p className="text-[12px] font-extrabold leading-snug text-[var(--ff-text-muted)]">
                A közös étkezés apró pillanatai nagy emlékeket teremtenek.
              </p>
              <span className="ml-auto text-[42px] leading-none text-[#f1b071]">♡</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
