"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getRecipeMealTypeLabel, isKidFriendlyRecipe } from "@/lib/recipes/recipe-taxonomy";
import { getUserImportedRecipes } from "@/lib/recipes/user-import.provider";
import { getTodayDayIndex } from "@/lib/schedule-store";
import type { MealBatch, Recipe } from "@/types/etkezes";
import type { ScheduleEvent } from "@/types/schedule";

const USER_NAME = "Anna";
const HERO_IMAGE = "/images/dashboard/hero-kitchen.jpg";
const LIDL_RECIPES = getUserImportedRecipes();

function getHeroImage(): string {
  const h = new Date().getHours();
  const d = new Date().getDay();
  if (d === 0 || d === 6) return HERO_IMAGE;
  if (h < 10) return HERO_IMAGE;
  if (h >= 18) return HERO_IMAGE;
  return HERO_IMAGE;
}

function getGreeting(name: string) {
  const h = new Date().getHours();
  if (h < 12) return `Jó reggelt, ${name}!`;
  if (h < 18) return `Jó napot, ${name}!`;
  return `Jó estét, ${name}!`;
}

function getHeroContext(): { label: string; icon: string } {
  const h = new Date().getHours();
  const d = new Date().getDay();
  if (d === 0 || d === 6) return { label: "Hétvégi főzés", icon: "weekend" };
  if (h < 10) return { label: "Reggeli tervek", icon: "wb_sunny" };
  if (h < 14) return { label: "Ebéd fókusz", icon: "lunch_dining" };
  if (h < 18) return { label: "Mai ritmus", icon: "wb_twilight" };
  return { label: "Vacsoraidő", icon: "dinner_dining" };
}

function getHeroSubtitle(): string {
  const h = new Date().getHours();
  const d = new Date().getDay();
  if (d === 0 || d === 6) return "Hétvégi főzés — kicsit több idő, kicsit több élvezet.";
  if (h < 10) return "Tervezzük meg a mai napot együtt.";
  if (h < 14) return "Mit teszünk ma az asztalra? Pár kattintás, és kész.";
  return "Vacsoraválasztás ideje — gyorsan, könnyedén.";
}

function getDashboardData(batches: MealBatch[]) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const weekDays = getWeekDays();
  const todayMeals = getBatchesForDate(batches, todayKey);
  const upcoming = getUpcomingBatches(batches, todayKey, 4);
  const plannedDaysCount = weekDays.filter(
    (day) => getBatchesForDate(batches, day.dateKey).length > 0
  ).length;
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
    items: reminders,
  };
}

// ─── Shared icon ─────────────────────────────────────────────────────────────

function Icon({ name, className = "text-[22px]" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

// ─── QuickTile — toggleable filter tile ───────────────────────────────────────

type QuickTone = "sage" | "peach" | "cream" | "warm";

const QUICK_TILE_BASE: Record<QuickTone, string> = {
  sage:  "bg-[rgba(210,228,192,0.97)] border-[rgba(90,112,80,0.15)] hover:bg-[rgba(198,220,178,0.99)] shadow-[0_6px_18px_-12px_rgba(61,49,34,0.22),inset_0_0_0_1px_rgba(90,112,80,0.09)]",
  peach: "bg-[rgba(255,214,186,0.97)] border-[rgba(154,95,44,0.15)] hover:bg-[rgba(255,204,172,0.99)] shadow-[0_6px_18px_-12px_rgba(61,49,34,0.20),inset_0_0_0_1px_rgba(154,95,44,0.09)]",
  cream: "bg-[rgba(255,237,205,0.97)] border-[rgba(185,126,65,0.15)] hover:bg-[rgba(255,228,188,0.99)] shadow-[0_6px_18px_-12px_rgba(61,49,34,0.20),inset_0_0_0_1px_rgba(185,126,65,0.09)]",
  warm:  "bg-[rgba(244,212,162,0.97)] border-[rgba(154,95,44,0.18)] hover:bg-[rgba(240,204,148,0.99)] shadow-[0_6px_18px_-12px_rgba(61,49,34,0.22),inset_0_0_0_1px_rgba(154,95,44,0.12)]",
};

const QUICK_TILE_SELECTED: Record<QuickTone, string> = {
  sage:  "bg-[rgba(150,192,114,0.99)] border-[rgba(70,96,56,0.45)] shadow-[0_8px_22px_-10px_rgba(55,80,45,0.36),inset_0_0_0_1.5px_rgba(70,96,56,0.20)]",
  peach: "bg-[rgba(238,170,124,0.99)] border-[rgba(154,95,44,0.45)] shadow-[0_8px_22px_-10px_rgba(140,80,30,0.32),inset_0_0_0_1.5px_rgba(154,95,44,0.22)]",
  cream: "bg-[rgba(238,202,138,0.99)] border-[rgba(185,126,65,0.45)] shadow-[0_8px_22px_-10px_rgba(160,105,40,0.30),inset_0_0_0_1.5px_rgba(185,126,65,0.22)]",
  warm:  "bg-[rgba(222,184,94,0.99)]  border-[rgba(154,95,44,0.50)]  shadow-[0_8px_22px_-10px_rgba(140,80,30,0.34),inset_0_0_0_1.5px_rgba(154,95,44,0.25)]",
};

function QuickTile({
  icon,
  label,
  tone = "sage",
  selected = false,
  onToggle,
}: {
  icon: string;
  label: string;
  tone?: QuickTone;
  selected?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      title={label}
      className={`relative flex min-h-[94px] flex-col items-center justify-center gap-2 rounded-[18px] border px-2 py-3 text-center transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2 ${
        selected ? QUICK_TILE_SELECTED[tone] : QUICK_TILE_BASE[tone]
      }`}
    >
      {selected && (
        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ff-primary)] text-white">
          <Icon name="check" className="text-[11px]" />
        </span>
      )}
      <Icon name={icon} className="text-[26px] text-[var(--ff-primary)]" />
      <span className="text-[11px] font-extrabold leading-tight tracking-tight text-[var(--ff-text)]">
        {label}
      </span>
    </button>
  );
}

// ─── SummaryCard — optionally navigable ───────────────────────────────────────

function SummaryCard({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className: string;
  href?: string;
}) {
  const cls = [
    "relative overflow-hidden rounded-[24px] border border-[rgba(170,135,84,0.16)] p-5 shadow-[0_24px_48px_-34px_rgba(61,49,34,0.32)] transition-all 2xl:p-6",
    href ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_30px_56px_-32px_rgba(61,49,34,0.40)]" : "",
    className,
  ].join(" ");

  const inner = <div className={cls}>{children}</div>;
  return href ? (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2 rounded-[24px]">
      {inner}
    </Link>
  ) : inner;
}

// ─── MiniAvatar ───────────────────────────────────────────────────────────────

function MiniAvatar({ label, image }: { label: string; image?: string }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-[rgba(255,246,230,0.92)] bg-[rgba(252,240,220,0.98)] text-[10px] font-extrabold text-[var(--ff-primary)] shadow-[0_3px_8px_-5px_rgba(61,49,34,0.28)]">
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

// ─── MealIdeaCard — clickable recipe card ─────────────────────────────────────

function MealIdeaCard({ recipe }: { recipe: Recipe }) {
  const isKidFriendly = isKidFriendlyRecipe(recipe);

  return (
    <Link
      href={`/etkezes?recipe=${recipe.id}`}
      className="group block overflow-hidden rounded-[20px] border border-[rgba(170,135,84,0.13)] bg-[rgba(255,249,235,0.97)] shadow-[0_16px_36px_-26px_rgba(61,49,34,0.26)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_22px_46px_-26px_rgba(61,49,34,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
    >
      <RecipeImage recipe={recipe} className="h-[122px] w-full object-cover 2xl:h-[140px]" />
      <div className="px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-[14px] font-extrabold tracking-[-0.022em] text-[var(--ff-text)]">
            {recipe.name}
          </h3>
          <button
            aria-label={`${recipe.name} mentése`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); /* TODO: bookmark */ }}
            className="mt-0.5 text-[var(--ff-text-muted)] opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:opacity-100"
          >
            <Icon name="bookmark" className="text-[18px]" />
          </button>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10.5px] font-semibold text-[var(--ff-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <Icon name="schedule" className="text-[14px]" />
            {recipe.duration} perc
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="sentiment_satisfied" className="text-[14px]" />
            {isKidFriendly ? "Gyerekbarát" : getRecipeMealTypeLabel(recipe)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="calendar_month" className="text-[14px]" />
            2 napra
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Notification popover ─────────────────────────────────────────────────────

interface NotifItem {
  icon: string;
  text: string;
  sub: string;
  href: string;
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
      className="absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] overflow-hidden rounded-[22px] border border-[rgba(170,135,84,0.18)] bg-[rgba(255,249,237,0.98)] shadow-[0_24px_56px_-24px_rgba(50,34,14,0.38)] backdrop-blur-[24px]"
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

// ─── Focus items config ───────────────────────────────────────────────────────

const FOCUS_ITEMS: { icon: string; label: string; bg: string; filter: string }[] = [
  { icon: "bolt",             label: "Gyors vacsora",      bg: "bg-[rgba(215,232,196,0.97)] border-[rgba(90,112,80,0.13)]",   filter: "gyors"      },
  { icon: "sentiment_satisfied", label: "Gyerekbarát ötletek", bg: "bg-[rgba(255,218,190,0.97)] border-[rgba(154,95,44,0.13)]", filter: "gyerekbarat" },
  { icon: "eco",              label: "Egyszerű alapanyagok", bg: "bg-[rgba(255,238,208,0.97)] border-[rgba(185,126,65,0.13)]", filter: "egyszeru"   },
];

// ─── Tile definitions ─────────────────────────────────────────────────────────

const QUICK_TILES: { icon: string; label: string; tone: QuickTone; filter: string }[] = [
  { icon: "bolt",               label: "Gyors vacsora", tone: "sage",  filter: "gyors"       },
  { icon: "sentiment_satisfied", label: "Gyerekbarát",  tone: "peach", filter: "gyerekbarat"  },
  { icon: "inventory_2",        label: "Kamrából",      tone: "cream", filter: "kamra"        },
  { icon: "schedule",           label: "30 perc",       tone: "warm",  filter: "30perc"       },
  { icon: "calendar_month",     label: "2 napra",       tone: "warm",  filter: "2nap"         },
  { icon: "eco",                label: "Egyszerű",      tone: "sage",  filter: "egyszeru"     },
  { icon: "ramen_dining",       label: "Tészta",        tone: "cream", filter: "teszta"       },
  { icon: "soup_kitchen",       label: "Leves",         tone: "peach", filter: "leves"        },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function DesktopDashboardView() {
  const { mealBatches, shoppingItems, hydrated } = useMealData();
  const { schedule, hydrated: scheduleHydrated } = useSchedule();

  // ── Interactive state ──────────────────────────────────────────────────────
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notification popover on outside click
  useEffect(() => {
    if (!showNotifPopover) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifPopover]);

  const toggleFilter = useCallback((filter: string) => {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  }, []);

  // Build CTA href from selected filters
  const ctaHref = selectedFilters.size > 0
    ? `/etkezes?filter=${[...selectedFilters].join(",")}`
    : "/etkezes";

  // ── Dashboard data ─────────────────────────────────────────────────────────
  const dashboardData = useMemo(
    () =>
      hydrated
        ? getDashboardData(mealBatches)
        : { todayMeals: [], nextMeal: null as Recipe | null, plannedDaysCount: 0, planningPercent: 0 },
    [hydrated, mealBatches]
  );

  const todayEvents = scheduleHydrated ? (schedule[getTodayDayIndex()] ?? []) : [];
  const reminderData = getReminderData(todayEvents);
  const weekendCount = scheduleHydrated
    ? [5, 6].reduce((sum, day) => sum + (schedule[day]?.length ?? 0), 0)
    : 0;
  const todayPrimaryMeal = dashboardData.todayMeals[0]
    ? getBatchRecipe(dashboardData.todayMeals[0]) ?? null
    : null;
  const heroRecipe = dashboardData.nextMeal ?? todayPrimaryMeal;
  const pantryOk = shoppingItems.length === 0;
  const mealCount = Math.min(dashboardData.todayMeals.length, 3);
  const progressPct = Math.max((mealCount / 3) * 100, 10);
  const heroCtx = getHeroContext();
  const heroImage = getHeroImage();

  // Meal ideas: Lidl only (working images), kid-friendly + fast first
  const mealIdeas = useMemo(
    () =>
      LIDL_RECIPES.filter((r) => r.image && r.sourceName === "Lidl Konyha")
        .sort((a, b) => {
          const aK = Number(isKidFriendlyRecipe(a)), bK = Number(isKidFriendlyRecipe(b));
          const aQ = Number(a.duration <= 30), bQ = Number(b.duration <= 30);
          return bK - aK || bQ - aQ || a.duration - b.duration || a.name.localeCompare(b.name, "hu");
        })
        .slice(0, 3),
    []
  );

  // Notification items built from live state
  const notifItems = useMemo<NotifItem[]>(() => {
    const items: NotifItem[] = [];
    if (reminderData.count > 0)
      items.push({ icon: "event", text: `${reminderData.count} emlékeztető ma`, sub: reminderData.label, href: "/programok" });
    if (dashboardData.plannedDaysCount < 7)
      items.push({ icon: "restaurant", text: `${7 - dashboardData.plannedDaysCount} nap nincs tervezve`, sub: "Egészítsd ki a heti tervet", href: "/etkezes" });
    if (!pantryOk)
      items.push({ icon: "shopping_basket", text: `${shoppingItems.length} tétel hiányzik`, sub: "Tekintsd át a bevásárlólistát", href: "/etkezes" });
    return items;
  }, [reminderData, dashboardData.plannedDaysCount, pantryOk, shoppingItems.length]);

  return (
    <div className="hidden min-h-screen w-full px-3 py-3 md:block">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1780px] flex-col rounded-[32px] bg-[linear-gradient(180deg,rgba(246,235,216,0.78)_0%,rgba(248,240,226,0.86)_15%,rgba(250,244,234,0.92)_40%)] px-6 py-6 shadow-[0_44px_120px_-72px_rgba(50,34,14,0.56),inset_0_0_0_1px_rgba(175,140,88,0.13)] backdrop-blur-[22px] 2xl:px-8 2xl:py-7">

        {/* ══ FULL-WIDTH HEADER ══════════════════════════════════════════════════ */}
        <header className="mb-5 flex items-center justify-between gap-4 2xl:mb-6">
          {/* Avatar + greeting — links to profile/settings */}
          <Link
            href="/beallitasok"
            className="flex items-center gap-3.5 rounded-[20px] px-1 py-1 transition-colors hover:bg-[rgba(255,248,232,0.60)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
            aria-label="Profil és beállítások"
          >
            <div
              aria-hidden
              className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[rgba(255,246,228,0.9)] bg-cover bg-center shadow-[0_10px_24px_-14px_rgba(61,49,34,0.32)]"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80)",
              }}
            />
            <h1 className="text-[19px] font-extrabold tracking-[-0.025em] text-[var(--ff-text)]">
              {getGreeting(USER_NAME)}
            </h1>
          </Link>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Notification bell + popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifPopover((v) => !v)}
                aria-label={`Értesítések${notifItems.length > 0 ? ` — ${notifItems.length} új` : ""}`}
                aria-expanded={showNotifPopover}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(170,135,84,0.16)] bg-[rgba(255,248,232,0.94)] text-[var(--ff-text)] shadow-[0_8px_18px_-12px_rgba(61,49,34,0.22)] transition-all hover:bg-[rgba(255,243,218,0.99)] hover:shadow-[0_10px_22px_-12px_rgba(61,49,34,0.30)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
              >
                <Icon name="notifications" className="text-[20px]" />
                {notifItems.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#e8821e] shadow-[0_0_0_1.5px_rgba(248,239,224,0.95)]" />
                )}
              </button>
              {showNotifPopover && (
                <NotificationPopover
                  items={notifItems}
                  onClose={() => setShowNotifPopover(false)}
                />
              )}
            </div>

            {/* Settings */}
            <Link
              href="/beallitasok"
              aria-label="Beállítások"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(170,135,84,0.16)] bg-[rgba(255,248,232,0.94)] text-[var(--ff-text)] shadow-[0_8px_18px_-12px_rgba(61,49,34,0.22)] transition-all hover:bg-[rgba(255,243,218,0.99)] hover:shadow-[0_10px_22px_-12px_rgba(61,49,34,0.30)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-2"
            >
              <Icon name="settings" className="text-[20px]" />
            </Link>
          </div>
        </header>

        {/* ══ TWO-COLUMN GRID ════════════════════════════════════════════════════ */}
        <div className="grid flex-1 grid-cols-[minmax(0,2fr)_minmax(310px,1fr)] gap-5 2xl:grid-cols-[minmax(0,2fr)_minmax(380px,1fr)] 2xl:gap-6">

          {/* ══ LEFT COLUMN ══════════════════════════════════════════════════════ */}
          <section className="min-w-0">

            {/* ── Hero ────────────────────────────────────────────────────────── */}
            <section className="relative min-h-[310px] overflow-hidden rounded-[26px] shadow-[0_32px_68px_-38px_rgba(36,20,6,0.58)] 2xl:min-h-[342px]">
              <div className="absolute inset-0">
                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(28,14,4,0.88)_0%,rgba(44,24,6,0.54)_44%,rgba(26,12,2,0.18)_100%)]" />

              <div className="relative flex min-h-[310px] flex-col justify-between px-8 py-7 2xl:min-h-[342px] 2xl:px-10 2xl:py-9">
                <p className="flex items-center gap-2 text-[13px] font-bold text-[rgba(255,234,190,0.88)]">
                  <Icon name={heroCtx.icon} className="text-[20px] text-[#f0ae1c]" />
                  {heroCtx.label}
                </p>

                <div>
                  <h2 className="max-w-[460px] text-[46px] font-extrabold leading-[0.93] tracking-[-0.055em] text-[rgba(255,252,242,1)] 2xl:text-[54px]">
                    Mit főzzünk<br />ma?
                  </h2>
                  <p className="mt-4 max-w-[340px] text-[17px] font-medium leading-snug text-[rgba(255,238,212,0.90)] 2xl:mt-5 2xl:max-w-[380px] 2xl:text-[18px]">
                    {getHeroSubtitle()}
                  </p>

                  {/* CTA — routes to /etkezes */}
                  <Link
                    href="/etkezes"
                    aria-label="Kaja kiválasztása — Étkezések oldal"
                    className="mt-6 inline-flex w-fit items-center justify-between gap-5 rounded-full bg-[linear-gradient(135deg,#e8a040,#cc7c22)] py-3 pl-7 pr-2.5 text-[15px] font-extrabold text-white shadow-[0_22px_48px_-24px_rgba(200,118,28,0.78)] transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_56px_-22px_rgba(200,118,28,0.90)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(40,20,5,0.6)] 2xl:py-3.5 2xl:pl-8 2xl:text-[16px]"
                  >
                    Kaja kiválasztása
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#c07826]">
                      <Icon name="arrow_forward" className="text-[22px]" />
                    </span>
                  </Link>
                </div>
              </div>
            </section>

            {/* ── Summary cards ───────────────────────────────────────────────── */}
            <section className="mt-4 grid grid-cols-3 gap-4 2xl:mt-5 2xl:gap-5">

              {/* Card 1: Mai étkezések → /etkezes */}
              <SummaryCard href="/etkezes" className="bg-[linear-gradient(150deg,rgba(224,240,208,0.98),rgba(200,222,178,0.90))]">
                <div className="flex h-full gap-3.5">
                  <div className="h-[88px] w-[90px] shrink-0 overflow-hidden rounded-[18px] shadow-[0_8px_20px_-10px_rgba(61,49,34,0.26)] 2xl:h-[104px] 2xl:w-[108px]">
                    {heroRecipe ? (
                      <RecipeImage recipe={heroRecipe} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: "url(/images/dashboard/hero-bread.jpg)" }} />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-[13px] font-extrabold leading-tight tracking-tight text-[var(--ff-text)] 2xl:text-[14px]">
                        Mai étkezések
                      </h3>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(162,200,136,0.96)] text-[var(--ff-primary)]">
                        <Icon name="check" className="text-[15px]" />
                      </span>
                    </div>
                    <p className="text-[18px] font-extrabold text-[var(--ff-primary)] 2xl:text-[20px]">
                      {mealCount}/3 étkezés
                    </p>
                    <div>
                      <div className="mb-1.5 flex justify-between text-[10px] font-bold text-[rgba(61,49,34,0.42)]">
                        <span>Haladás</span>
                        <span>{Math.round(progressPct)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[rgba(61,49,34,0.10)]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(135deg,var(--ff-primary-soft),var(--ff-primary))]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SummaryCard>

              {/* Card 2: Hétvégi terv → /programok */}
              <SummaryCard href="/programok" className="bg-[linear-gradient(150deg,rgba(255,236,214,0.98),rgba(246,214,182,0.90))]">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(255,214,174,0.97)] text-[var(--ff-caramel-strong)] shadow-[0_4px_10px_-6px_rgba(61,49,34,0.20)]">
                      <Icon name="calendar_month" className="text-[20px]" />
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${weekendCount > 0 ? "bg-[rgba(255,206,158,0.97)] text-[var(--ff-caramel-strong)]" : "bg-[rgba(61,49,34,0.08)] text-[var(--ff-text-muted)]"}`}>
                      {weekendCount > 0 ? "Tervezett" : "Üres"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[var(--ff-text)] 2xl:text-[14px]">Hétvégi terv</h3>
                    <p className="mt-1 text-[11.5px] font-bold text-[var(--ff-caramel-strong)]">
                      {weekendCount > 0 ? "Készülünk a hétvégére" : "Még nincs megtervezve"}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <MiniAvatar label="A" image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" />
                    <div className="-ml-1.5"><MiniAvatar label="N" /></div>
                    <div className="-ml-1.5"><MiniAvatar label="B" /></div>
                    <div className="-ml-1.5"><MiniAvatar label="M" /></div>
                    <span className="ml-2 text-[10.5px] font-extrabold text-[var(--ff-text-muted)]">+2</span>
                  </div>
                </div>
              </SummaryCard>

              {/* Card 3: Kamra & Teendők → /kamra */}
              <SummaryCard href="/kamra" className="bg-[linear-gradient(150deg,rgba(255,244,226,0.98),rgba(244,228,200,0.90))]">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[rgba(255,230,196,0.97)] text-[var(--ff-caramel-strong)] shadow-[0_4px_10px_-6px_rgba(61,49,34,0.20)]">
                      <Icon name="inventory_2" className="text-[20px]" />
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${pantryOk ? "bg-[rgba(174,210,148,0.85)] text-[var(--ff-primary)]" : "bg-[rgba(255,206,158,0.97)] text-[var(--ff-caramel-strong)]"}`}>
                      {pantryOk ? "Rendben" : `${shoppingItems.length} hiányzik`}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-extrabold text-[var(--ff-text)] 2xl:text-[14px]">Kamra & Teendők</h3>
                    <p className="mt-1 text-[11.5px] font-bold text-[var(--ff-text-muted)]">
                      {reminderData.count > 0 ? `${reminderData.count} emlékeztető vár` : reminderData.label}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-extrabold text-[var(--ff-caramel-strong)] opacity-75">
                    <Icon name="chevron_right" className="text-[15px]" />
                    Részletek
                  </span>
                </div>
              </SummaryCard>
            </section>

            {/* ── Mai ötletek ──────────────────────────────────────────────────── */}
            <section className="mt-5 2xl:mt-7">
              <div className="mb-4 flex items-center justify-between 2xl:mb-5">
                <h2 className="text-[19px] font-extrabold tracking-[-0.03em] text-[var(--ff-text)]">Mai ötletek</h2>
                <Link href="/etkezes" className="flex items-center gap-1 text-[12px] font-bold text-[var(--ff-text-muted)] transition-opacity hover:opacity-70">
                  Összes megtekintése
                  <Icon name="chevron_right" className="text-[16px]" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4 2xl:gap-5">
                {mealIdeas.map((recipe) => (
                  <MealIdeaCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </section>
          </section>

          {/* ══ RIGHT COLUMN ═════════════════════════════════════════════════════ */}
          <aside className="min-w-0 flex flex-col gap-5 2xl:gap-6">

            {/* ── Gyors választás — toggleable filter tiles ─────────────────────── */}
            <section className="rounded-[28px] border border-[rgba(170,135,84,0.18)] bg-[linear-gradient(150deg,rgba(255,240,212,0.97),rgba(247,224,188,0.90))] p-5 shadow-[0_26px_58px_-40px_rgba(61,49,34,0.34)] 2xl:rounded-4xl 2xl:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 text-[15px] font-extrabold tracking-[-0.01em] text-[var(--ff-text)] 2xl:text-[16px]">
                  <Icon name="flare" className="text-[20px] text-[var(--ff-primary)]" />
                  Gyors választás
                </h2>
                {selectedFilters.size > 0 && (
                  <button
                    onClick={() => setSelectedFilters(new Set())}
                    className="text-[10px] font-extrabold text-[var(--ff-text-muted)] hover:text-[var(--ff-primary)] transition-colors"
                    aria-label="Szűrők törlése"
                  >
                    Törlés ({selectedFilters.size})
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2.5 2xl:gap-3">
                {QUICK_TILES.map(({ icon, label, tone, filter }) => (
                  <QuickTile
                    key={filter}
                    icon={icon}
                    label={label}
                    tone={tone}
                    selected={selectedFilters.has(filter)}
                    onToggle={() => toggleFilter(filter)}
                  />
                ))}
              </div>
              <Link
                href={ctaHref}
                className="mt-5 flex items-center justify-between rounded-full bg-[linear-gradient(135deg,#e79e38,#ca7a20)] py-3 pl-7 pr-2.5 text-[15px] font-extrabold text-white shadow-[0_20px_38px_-24px_rgba(185,126,35,0.78)] transition-all hover:-translate-y-0.5 hover:shadow-[0_26px_46px_-22px_rgba(185,126,35,0.90)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e79e38] focus-visible:ring-offset-2 2xl:mt-6 2xl:py-3.5 2xl:pl-8 2xl:text-[16px]"
                aria-label={selectedFilters.size > 0 ? `Receptek mutatása — ${[...selectedFilters].join(", ")}` : "Receptek mutatása"}
              >
                {selectedFilters.size > 0 ? `${selectedFilters.size} szűrővel` : "Mutasd az ötleteket"}
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#be7628]">
                  <Icon name="arrow_forward" className="text-[22px]" />
                </span>
              </Link>
            </section>

            {/* ── Mai fókusz ────────────────────────────────────────────────────── */}
            <section className="flex flex-1 flex-col rounded-[28px] border border-[rgba(195,148,70,0.22)] bg-[linear-gradient(150deg,rgba(246,232,204,0.99),rgba(234,214,174,0.94))] p-5 shadow-[0_26px_58px_-42px_rgba(61,49,34,0.32)] 2xl:rounded-4xl 2xl:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 text-[15px] font-extrabold text-[var(--ff-text)] 2xl:text-[16px]">
                  <Icon name="local_fire_department" className="text-[20px] text-[#d08030]" />
                  Mai fókusz
                </h2>
                <Link href="/etkezes" className="flex items-center gap-1 text-[11px] font-bold text-[var(--ff-text-muted)] transition-opacity hover:opacity-70">
                  Testreszabás
                  <Icon name="tune" className="text-[16px]" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {FOCUS_ITEMS.map(({ icon, label, bg, filter }) => (
                  <Link
                    key={filter}
                    href={`/etkezes?filter=${filter}`}
                    className={`flex items-center gap-3 rounded-[16px] border px-4 py-3 shadow-[0_5px_14px_-10px_rgba(61,49,34,0.20)] transition-all hover:-translate-y-px hover:shadow-[0_8px_18px_-10px_rgba(61,49,34,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ff-primary)] focus-visible:ring-offset-1 ${bg}`}
                  >
                    <Icon name={icon} className="text-[20px] text-[var(--ff-primary)]" />
                    <span className="text-[12px] font-extrabold text-[var(--ff-text)]">{label}</span>
                    <Icon name="chevron_right" className="ml-auto text-[16px] text-[var(--ff-text-muted)] opacity-50" />
                  </Link>
                ))}
              </div>

              {/* Motivational widget */}
              <div className="mt-auto pt-4 overflow-hidden rounded-[20px] border border-[rgba(195,140,60,0.24)] bg-[linear-gradient(138deg,rgba(255,220,164,0.98),rgba(248,202,136,0.94))] shadow-[0_10px_24px_-14px_rgba(140,88,20,0.32)]">
                <div className="px-4 pb-3 pt-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 select-none text-[26px] leading-none">♡</span>
                    <p className="text-[11.5px] font-bold leading-snug text-[rgba(72,44,12,0.80)]">
                      A közös étkezés apró pillanatai nagy emlékeket teremtenek.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[rgba(170,110,30,0.16)] px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Icon name="spa" className="text-[15px] text-[#b86e18]" />
                    <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-[#a86218]">
                      Family Flow
                    </span>
                  </div>
                  <Link
                    href="/etkezes"
                    className="rounded-full bg-[rgba(100,58,10,0.12)] px-3 py-1.5 text-[10px] font-extrabold text-[rgba(80,46,8,0.72)] transition-colors hover:bg-[rgba(100,58,10,0.22)]"
                  >
                    Ötleteket kérek →
                  </Link>
                </div>
              </div>
            </section>
          </aside>

        </div>{/* end two-column grid */}
      </div>
    </div>
  );
}
