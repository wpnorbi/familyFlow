"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGreetingHeader from "@/components/mobile/MobileGreetingHeader";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { useMealData } from "@/hooks/useMealData";
import { useSchedule } from "@/hooks/useSchedule";
import { getBatchRecipe, getBatchesForDate, getUpcomingBatches, getWeekDays, toDateKey } from "@/lib/etkezes-data";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
import { getUserImportedRecipes } from "@/lib/recipes/user-import.provider";
import { getTodayDayIndex } from "@/lib/schedule-store";
import type { MealBatch, Recipe } from "@/types/etkezes";
import type { ScheduleEvent } from "@/types/schedule";

const DASHBOARD_HERO_IMAGE = "/images/dashboard/hero-bread.jpg";
const LIDL_RECIPES = getUserImportedRecipes();

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

// ─── Quick tile — navigates to /etkezes with filter param ─────────────────────

function QuickTile({
  icon,
  label,
  href,
  bg,
  iconColor,
}: {
  icon: string;
  label: string;
  href: string;
  bg: string;
  iconColor: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-[24px] border border-[rgba(0,0,0,0.05)] px-2 py-3 text-center shadow-[0_6px_16px_-10px_rgba(61,49,34,0.22)] transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ff-primary) focus-visible:ring-offset-2 ${bg}`}
    >
      <span className={`material-symbols-outlined text-[26px] ${iconColor}`}>{icon}</span>
      <span className="text-[12px] font-extrabold leading-tight tracking-tight text-[var(--ff-text)]">{label}</span>
    </Link>
  );
}

// ─── Navigable summary card wrapper ──────────────────────────────────────────

function NavCard({
  href,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`relative block overflow-hidden rounded-[28px] border border-[rgba(170,140,90,0.14)] p-4 shadow-[0_18px_36px_-24px_rgba(61,49,34,0.24)] transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ff-primary) focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </Link>
  );
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

  const todayEvents = scheduleHydrated ? (schedule[getTodayDayIndex()] ?? []) : [];
  const reminderData = getReminderData(todayEvents);

  const todayPrimaryMeal = dashboardData.todayMeals[0] ? getBatchRecipe(dashboardData.todayMeals[0]) ?? null : null;
  const heroCtaHref = todayPrimaryMeal ? `/etkezes?recipe=${todayPrimaryMeal.id}` : "/etkezes";
  const heroCtaLabel = todayPrimaryMeal ? "Mai ebéd megnyitása" : "Kaja kiválasztása";
  const openDaysCount = 7 - dashboardData.plannedDaysCount;
  const pantryIdeaCount = rankRecipesForPantry(LIDL_RECIPES, pantryItems).slice(0, 3).length;
  const pantryStatus = pantryItems.length > 0 ? `${pantryIdeaCount} receptötlet` : "Feltöltésre vár";
  const pantryDescription = pantryItems.length > 0 ? "Otthoni alapanyagokból" : "Adj hozzá alapanyagokat";
  const todayMealStatus = todayPrimaryMeal ? "Betervezve" : "Nincs kiválasztva";

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
      <div
        className="relative mx-auto max-w-[430px] px-4 pt-5"
        style={{ paddingBottom: "calc(120px + env(safe-area-inset-bottom, 0px))" }}
      >
        <MobileGreetingHeader
          onNotificationClick={() => setShowNotifSheet(true)}
          notifCount={notifItems.length}
        />

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[36px] shadow-[0_28px_58px_-28px_rgba(36,20,6,0.52)]">
          <div className="absolute inset-0">
            <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${DASHBOARD_HERO_IMAGE})` }} />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(170deg,rgba(24,12,4,0.30)_0%,rgba(32,18,6,0.56)_55%,rgba(28,14,4,0.80)_100%)]" />

          <div className="relative px-5 pb-5 pt-5">
            <p className="mb-3 flex items-center gap-1.5 text-[12.5px] font-bold text-[rgba(255,240,205,0.88)]">
              <span className="material-symbols-outlined text-[16px] text-[#f0ae1c]">wb_twilight</span>
              Mai ritmus
            </p>
            <h2 className="text-[34px] font-extrabold leading-[1.00] tracking-[-0.044em] text-[rgba(255,252,244,1)] [text-shadow:0_2px_18px_rgba(20,10,2,0.50)]">
              {todayPrimaryMeal ? "Mai ebéd" : "Mit főzzünk\nma?"}
            </h2>
            <p className="mt-2.5 max-w-[220px] text-[15px] font-medium leading-snug text-[rgba(255,242,222,0.90)] [text-shadow:0_1px_10px_rgba(20,10,2,0.38)]">
              {todayPrimaryMeal ? "Megvan a mai fő étkezés." : "Válassz egy ételt, és indulhat a napi terv."}
            </p>

            {/* Hero CTA */}
            <Link
              href={heroCtaHref}
              aria-label={heroCtaLabel}
              className="mt-5 flex items-center justify-between rounded-[26px] bg-[linear-gradient(135deg,#e09a3e,#c98030)] px-5 py-4 text-white shadow-[0_18px_36px_-16px_rgba(180,115,30,0.58)] transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(28,14,4,0.7)]"
            >
              <span className="text-[18px] font-extrabold tracking-[-0.025em]">{heroCtaLabel}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#c07826] shadow-[0_8px_18px_-10px_rgba(61,49,34,0.24)]">
                <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
              </span>
            </Link>
          </div>
        </section>

        {/* ── GYORS VÁLASZTÁS ───────────────────────────────────────────────── */}
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[20px] font-extrabold tracking-[-0.03em] text-[var(--ff-text)]">Gyors választás</h2>
            <Link
              href="/etkezes"
              className="flex items-center gap-0.5 text-[13px] font-bold text-[var(--ff-text-muted)] transition-opacity active:opacity-60"
            >
              Összes
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <QuickTile icon="bolt"               label="30 perc alatt" href="/etkezes?filter=gyors"       bg="bg-[rgba(212,230,194,0.97)]" iconColor="text-[var(--ff-primary)]"        />
            <QuickTile icon="sentiment_satisfied" label="Gyerekbarát"  href="/etkezes?filter=gyerekbarat" bg="bg-[rgba(255,216,192,0.97)]" iconColor="text-[var(--ff-caramel-strong)]" />
            <QuickTile icon="inventory_2"         label="Kamrából"     href="/etkezes?filter=kamra"        bg="bg-[rgba(255,238,210,0.97)]" iconColor="text-[var(--ff-primary)]"        />
            <QuickTile icon="calendar_month"      label="2 napra"      href="/etkezes?filter=tobbnap"      bg="bg-[rgba(244,214,168,0.97)]" iconColor="text-[var(--ff-caramel-strong)]" />
          </div>
        </section>

        {/* ── SUMMARY CARDS 2×2 ─────────────────────────────────────────────── */}
        <section className="mt-4 grid grid-cols-2 gap-3">

          {/* Card 1: Mai ebéd → /etkezes */}
          <NavCard
            href={heroCtaHref}
            ariaLabel={todayPrimaryMeal ? `Mai ebéd: ${todayPrimaryMeal.name}` : "Étkezés kiválasztása"}
            className="bg-[linear-gradient(150deg,rgba(230,244,214,0.98),rgba(206,226,186,0.92))]"
          >
            <div className="flex min-h-[132px] flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div className="overflow-hidden rounded-[16px] shadow-[0_6px_14px_-8px_rgba(61,49,34,0.24)]">
                  {todayPrimaryMeal ? (
                    <RecipeImage recipe={todayPrimaryMeal} className="h-[56px] w-[56px] object-cover" />
                  ) : (
                    <div className="flex h-[56px] w-[56px] items-center justify-center rounded-[16px] bg-[rgba(195,220,172,0.70)]">
                      <span className="material-symbols-outlined text-[28px] text-[var(--ff-primary)] opacity-60">restaurant</span>
                    </div>
                  )}
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(180,210,154,0.98)] text-[var(--ff-primary)]">
                  <span className="material-symbols-outlined text-[17px]">check</span>
                </span>
              </div>
              <div>
                <h3 className="text-[15px] font-extrabold tracking-[-0.025em] text-[var(--ff-text)]">Mai ebéd</h3>
                <p className="mt-0.5 line-clamp-1 text-[14px] font-bold text-[var(--ff-primary)]">
                  {todayPrimaryMeal?.name ?? todayMealStatus}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[var(--ff-text-muted)]">
                  {todayPrimaryMeal ? `${todayPrimaryMeal.duration} perc` : "Válassz egy ételt"}
                </p>
              </div>
            </div>
          </NavCard>

          {/* Card 2: Heti terv → /etkezes */}
          <NavCard
            href="/etkezes"
            ariaLabel="Heti étkezésterv megnyitása"
            className="bg-[linear-gradient(150deg,rgba(255,238,218,0.98),rgba(246,216,186,0.92))]"
          >
            <div className="flex min-h-[132px] flex-col justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(255,216,178,0.97)] text-[var(--ff-caramel-strong)] shadow-[0_4px_10px_-6px_rgba(61,49,34,0.18)]">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </span>
              <div>
                <h3 className="text-[15px] font-extrabold tracking-[-0.025em] text-[var(--ff-text)]">Heti terv</h3>
                <p className="mt-0.5 text-[18px] font-extrabold text-[var(--ff-caramel-strong)]">
                  {dashboardData.plannedDaysCount}/7 nap
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[var(--ff-text-muted)]">
                  {openDaysCount > 0 ? `${openDaysCount} nap még üres` : "Teljes hét megvan"}
                </p>
                <div className="mt-2.5 h-2 rounded-full bg-[rgba(61,49,34,0.10)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(135deg,#e7a34e,#c98535)]"
                    style={{ width: `${Math.max(dashboardData.planningPercent, 6)}%` }}
                  />
                </div>
              </div>
            </div>
          </NavCard>

          {/* Card 3: Kamra → /kamra */}
          <NavCard
            href="/kamra"
            ariaLabel="Kamra ötletek megnyitása"
            className="bg-[linear-gradient(150deg,rgba(240,248,230,0.98),rgba(218,234,204,0.90))]"
          >
            <div className="flex min-h-[132px] flex-col justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(200,224,178,0.97)] text-[var(--ff-primary)] shadow-[0_4px_10px_-6px_rgba(61,49,34,0.18)]">
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              </span>
              <div>
                <h3 className="text-[15px] font-extrabold tracking-[-0.025em] text-[var(--ff-text)]">Kamra ötletek</h3>
                <p className="mt-0.5 text-[14px] font-bold text-[var(--ff-primary)]">{pantryStatus}</p>
                <p className="mt-1 text-[11px] font-semibold text-[var(--ff-text-muted)]">{pantryDescription}</p>
              </div>
            </div>
          </NavCard>

          {/* Card 4: Emlékeztetők → /programok */}
          <NavCard
            href="/programok"
            ariaLabel="Emlékeztetők és programok megnyitása"
            className="bg-[linear-gradient(150deg,rgba(255,240,224,0.98),rgba(246,220,196,0.90))]"
          >
            <div className="flex min-h-[132px] flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(255,222,190,0.97)] text-[var(--ff-caramel-strong)] shadow-[0_4px_10px_-6px_rgba(61,49,34,0.18)]">
                  <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,248,234,0.94)] text-[var(--ff-caramel-strong)]">
                  <span className="material-symbols-outlined text-[17px]">arrow_forward_ios</span>
                </span>
              </div>
              <div>
                <h3 className="text-[15px] font-extrabold tracking-[-0.025em] text-[var(--ff-text)]">Emlékeztetők</h3>
                <p className="mt-0.5 text-[14px] font-bold text-[var(--ff-caramel-strong)]">
                  {reminderData.count > 0 ? `${reminderData.count} teendő vár` : "Ma nyugodtabb nap"}
                </p>
                {reminderData.count > 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-[var(--ff-text-muted)]">Ma még rád vár</p>
                )}
              </div>
            </div>
          </NavCard>
        </section>
      </div>

      <MobileBottomNav />

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
