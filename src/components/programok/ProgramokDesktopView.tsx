"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import { useSchedule } from "@/hooks/useSchedule";
import { createClient } from "@/lib/supabase";
import type { ScheduleEvent } from "@/types/schedule";

type ProgramCategory = "családi" | "sport" | "óvoda/iskola" | "házimunka" | "szabadidő" | "egyéb";
type ProgramMood = "Szabadtéri" | "Aktív" | "Kulturális" | "Esős időre" | "Ingyenes" | "Otthoni";

interface ProgramItem {
  id: string;
  title: string;
  place: string;
  date: string;
  startTime: string;
  endTime?: string;
  image: string;
  category: ProgramCategory;
  mood: ProgramMood;
  participants: string[];
  reminder?: string;
  notes?: string;
  indoorOutdoor: "kinti" | "benti";
}

interface ProgramIdea {
  id: string;
  title: string;
  copy: string;
  tag: ProgramMood;
  image: string;
  duration: string;
  age: string;
  indoorOutdoor: "Kinti" | "Benti";
  freeLabel?: string;
}

interface ReminderItem {
  id: string;
  text: string;
  meta?: string;
  done: boolean;
}

const PROGRAM_IMAGES = {
  picnic: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  market: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80",
  football: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80",
  craft: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80",
  zoo: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1200&q=80",
  playground: "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?auto=format&fit=crop&w=1200&q=80",
  baking: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
} as const;

const HERO_IMAGE = PROGRAM_IMAGES.picnic;

const IDEA_LIBRARY: ProgramIdea[] = [
  {
    id: "idea-picnic",
    title: "Piknik a szabadban",
    copy: "Csomagoljunk be, és élvezzük együtt a jó időt.",
    tag: "Szabadtéri",
    image: PROGRAM_IMAGES.picnic,
    duration: "2-3 óra",
    age: "3+",
    indoorOutdoor: "Kinti",
  },
  {
    id: "idea-playground",
    title: "Játszótér kaland",
    copy: "Mozgás, nevetés és közös energiák a délutánra.",
    tag: "Aktív",
    image: PROGRAM_IMAGES.playground,
    duration: "1-2 óra",
    age: "2+",
    indoorOutdoor: "Kinti",
    freeLabel: "Ingyenes",
  },
  {
    id: "idea-zoo",
    title: "Állatkerti látogatás",
    copy: "Felfedezés és tanulás az állatok világáról.",
    tag: "Kulturális",
    image: PROGRAM_IMAGES.zoo,
    duration: "Félnapos",
    age: "4+",
    indoorOutdoor: "Kinti",
  },
  {
    id: "idea-craft",
    title: "Benti kreatív délután",
    copy: "Alkotás, játék és fantázia esős napokra.",
    tag: "Esős időre",
    image: PROGRAM_IMAGES.craft,
    duration: "90 perc",
    age: "3+",
    indoorOutdoor: "Benti",
  },
  {
    id: "idea-baking",
    title: "Közös sütés-főzés",
    copy: "Finom illatok és közös élmények a konyhában.",
    tag: "Otthoni",
    image: PROGRAM_IMAGES.baking,
    duration: "2 óra",
    age: "4+",
    indoorOutdoor: "Benti",
  },
];

const INITIAL_REMINDERS: ReminderItem[] = [
  { id: "r1", text: "Bence sporttáska készítése", meta: "Foci torna", done: true },
  { id: "r2", text: "Anna rajzfelszerelés ellenőrzése", done: false },
  { id: "r3", text: "Piknik takaró behelyezése az autóba", meta: "Hétvégi piknik", done: false },
  { id: "r4", text: "Esőkabát a hétvégére", done: false },
];

function Icon({ name, className = "text-[20px]" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function formatMonthShort(date: Date) {
  return date.toLocaleDateString("hu-HU", { month: "short" }).replace(".", "");
}

function formatLongDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("hu-HU", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function formatTimeRange(startTime: string, endTime?: string) {
  return endTime ? `${startTime} – ${endTime}` : startTime;
}

function getSelectedDayIndex(selectedDate: Date) {
  return (selectedDate.getDay() + 6) % 7;
}

function getMoodIcon(tag: ProgramMood) {
  if (tag === "Aktív") return "directions_run";
  if (tag === "Kulturális") return "museum";
  if (tag === "Esős időre") return "rainy";
  if (tag === "Ingyenes") return "savings";
  if (tag === "Otthoni") return "home";
  return "park";
}

function buildSeedPrograms(referenceWeekStart: Date): ProgramItem[] {
  const makeDate = (offset: number) => toDateKey(addDays(referenceWeekStart, offset));

  return [
    {
      id: "program-market",
      title: "Piacozás",
      place: "Szombathelyi Piac",
      date: makeDate(2),
      startTime: "09:00",
      endTime: "11:00",
      image: PROGRAM_IMAGES.market,
      category: "családi",
      mood: "Ingyenes",
      participants: ["A", "N"],
      reminder: "Vászontáska és kulacs",
      notes: "Friss gyümölcs és hétvégi alapanyagok.",
      indoorOutdoor: "kinti",
    },
    {
      id: "program-football",
      title: "Foci torna",
      place: "Városi Sportpálya",
      date: makeDate(4),
      startTime: "16:00",
      endTime: "18:00",
      image: PROGRAM_IMAGES.football,
      category: "sport",
      mood: "Aktív",
      participants: ["B", "N"],
      reminder: "Kulacs és cserepóló",
      notes: "Érkezzünk 15 perccel hamarabb.",
      indoorOutdoor: "kinti",
    },
    {
      id: "program-picnic",
      title: "Családi piknik",
      place: "Normafa",
      date: makeDate(5),
      startTime: "10:00",
      endTime: "15:00",
      image: PROGRAM_IMAGES.picnic,
      category: "családi",
      mood: "Szabadtéri",
      participants: ["A", "N", "B", "L"],
      reminder: "Pokróc, gyümölcs és társasjáték",
      notes: "Ha esik, mehetünk a gyerekmúzeumba.",
      indoorOutdoor: "kinti",
    },
    {
      id: "program-craft",
      title: "Kézműves délelőtt",
      place: "Otthon",
      date: makeDate(6),
      startTime: "10:00",
      endTime: "12:00",
      image: PROGRAM_IMAGES.craft,
      category: "szabadidő",
      mood: "Esős időre",
      participants: ["A", "B", "L"],
      notes: "Festés és papírvirág készítés.",
      indoorOutdoor: "benti",
    },
  ];
}

function Overlay({
  title,
  children,
  onClose,
  width = "max-w-[520px]",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(20,22,18,0.32)] p-6 backdrop-blur-sm">
      <button className="absolute inset-0" aria-label="Bezárás" onClick={onClose} />
      <div className={`relative w-full ${width} overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(246,235,216,0.95))] shadow-[0_36px_96px_-46px_rgba(36,28,18,0.48)]`}>
        <div className="flex items-center justify-between border-b border-[rgba(170,135,84,0.10)] px-6 py-5">
          <h3 className="text-[22px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,248,232,0.94)] text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(255,242,215,0.99)]"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function NotificationPopover({
  items,
  onClose,
  onSelect,
}: {
  items: Array<{ icon: string; text: string; sub: string; href?: string }>;
  onClose: () => void;
  onSelect: (href?: string) => void;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[320px] overflow-hidden rounded-[24px] border border-[rgba(170,135,84,0.16)] bg-[rgba(255,249,237,0.98)] shadow-[0_28px_62px_-24px_rgba(50,34,14,0.38)] backdrop-blur-[24px]">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h3 className="text-[13px] font-extrabold text-[var(--ff-text)]">Értesítések</h3>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ff-text-muted)] hover:bg-[rgba(61,49,34,0.08)]">
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>
      <ul className="px-2 pb-2">
        {items.map((item) => (
          <li key={item.text}>
            <button
              onClick={() => onSelect(item.href)}
              className="flex w-full items-center gap-3 rounded-[16px] px-2 py-3 text-left transition-colors hover:bg-[rgba(255,245,224,0.88)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(255,240,210,0.96)] text-[var(--ff-caramel-strong)]">
                <Icon name={item.icon} className="text-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-extrabold text-[var(--ff-text)]">{item.text}</p>
                <p className="text-[10.5px] font-semibold text-[var(--ff-text-muted)]">{item.sub}</p>
              </div>
              <Icon name="chevron_right" className="ml-auto shrink-0 text-[16px] text-[var(--ff-text-muted)] opacity-50" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfilePopover({
  onClose,
  onSettings,
  onLogout,
}: {
  onClose: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const items = [
    { icon: "person", label: "Profil", onClick: onSettings },
    { icon: "groups", label: "Családtagok", onClick: onSettings },
    { icon: "settings", label: "Beállítások", onClick: onSettings },
    { icon: "logout", label: "Kijelentkezés", onClick: onLogout, danger: true },
  ];

  return (
    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[240px] overflow-hidden rounded-[24px] border border-[rgba(170,135,84,0.16)] bg-[rgba(255,249,237,0.98)] shadow-[0_28px_62px_-24px_rgba(50,34,14,0.38)] backdrop-blur-[24px]">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h3 className="text-[13px] font-extrabold text-[var(--ff-text)]">Fiók</h3>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ff-text-muted)] hover:bg-[rgba(61,49,34,0.08)]">
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>
      <ul className="px-2 pb-2">
        {items.map((item) => (
          <li key={item.label}>
            <button
              onClick={item.onClick}
              className={`flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-left transition-colors hover:bg-[rgba(255,245,224,0.88)] ${
                item.danger ? "text-[rgba(181,67,48,0.92)]" : "text-[var(--ff-text)]"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                item.danger
                  ? "bg-[rgba(196,74,54,0.12)]"
                  : "bg-[rgba(255,240,210,0.96)] text-[var(--ff-caramel-strong)]"
              }`}>
                <Icon name={item.icon} className="text-[18px]" />
              </span>
              <span className="text-[13px] font-semibold">{item.label}</span>
              <Icon name="chevron_right" className="ml-auto shrink-0 text-[16px] text-[var(--ff-text-muted)] opacity-50" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProgramokDesktopView() {
  const router = useRouter();
  const { schedule, hydrated } = useSchedule();
  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [customPrograms, setCustomPrograms] = useState<ProgramItem[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<ProgramItem | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<ProgramIdea | null>(null);
  const [selectedScheduleItem, setSelectedScheduleItem] = useState<ScheduleEvent | null>(null);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reminders, setReminders] = useState<ReminderItem[]>(INITIAL_REMINDERS);
  const [plannerStep, setPlannerStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedPlannerIdeas, setSelectedPlannerIdeas] = useState<string[]>([]);
  const [savedIdeaIds, setSavedIdeaIds] = useState<string[]>([]);
  const [showSavedIdeasOnly, setShowSavedIdeasOnly] = useState(false);
  const [visiblePlannerIdeaCount, setVisiblePlannerIdeaCount] = useState(4);
  const [programOverrides, setProgramOverrides] = useState<Record<string, ProgramItem>>({});
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const reminderInputRef = useRef<HTMLInputElement | null>(null);

  const seededPrograms = useMemo(() => buildSeedPrograms(startOfWeek(today)), [today]);
  const programs = useMemo(
    () =>
      [...seededPrograms, ...customPrograms].map((program) => programOverrides[program.id] ?? program),
    [customPrograms, programOverrides, seededPrograms],
  );
  const selectedDateKey = toDateKey(selectedDate);
  const selectedDayIndex = getSelectedDayIndex(selectedDate);
  const selectedWeekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);

  const dayPrograms = useMemo(
    () =>
      programs
        .filter((program) => program.date === selectedDateKey)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [programs, selectedDateKey],
  );

  const upcomingPrograms = useMemo(
    () =>
      programs
        .filter((program) => program.date >= selectedDateKey)
        .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
        .slice(0, 4),
    [programs, selectedDateKey],
  );

  const heroProgram = useMemo(() => {
    const selectedProgramMatch = programs.find((program) => program.date === selectedDateKey);
    return selectedProgramMatch ?? programs.find((program) => program.date >= selectedDateKey) ?? programs[0] ?? null;
  }, [programs, selectedDateKey]);
  const visiblePrograms = dayPrograms.length > 0 ? dayPrograms : upcomingPrograms;

  const weekendIdeas = useMemo(() => IDEA_LIBRARY.slice(0, 3), []);
  const featuredIdeas = useMemo(() => IDEA_LIBRARY, []);
  const weeklyOutlook = useMemo(
    () => [
      { icon: "wb_sunny", high: 23, low: 12 },
      { icon: "partly_cloudy_day", high: 21, low: 11 },
      { icon: "partly_cloudy_day", high: 19, low: 10 },
      { icon: "wb_sunny", high: 22, low: 11 },
      { icon: "wb_sunny", high: 23, low: 12 },
      { icon: "wb_sunny", high: 25, low: 13 },
      { icon: "partly_cloudy_day", high: 24, low: 13 },
    ],
    [],
  );

  const selectedSchedule = hydrated ? (schedule[selectedDayIndex] ?? []) : [];
  const isTodaySelected = selectedDateKey === toDateKey(today);
  const scheduleTitle = isTodaySelected
    ? "Mai napirend"
    : `${selectedDate.toLocaleDateString("hu-HU", { weekday: "long" })} napirend`;
  const highlightedScheduleId =
    selectedSchedule.find((event) => {
      const baseTime = event.startTime ?? event.time;
      if (selectedDateKey !== toDateKey(today)) return false;
      return baseTime >= `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;
    })?.id ?? selectedSchedule[0]?.id;

  const notificationItems = useMemo(() => {
    const items: Array<{ icon: string; text: string; sub: string; href?: string }> = [];
    if (heroProgram) {
      items.push({
        icon: "calendar_month",
        text: heroProgram.title,
        sub: `${formatLongDate(heroProgram.date)} • ${formatTimeRange(heroProgram.startTime, heroProgram.endTime)}`,
      });
    }
    if (reminders.some((item) => !item.done)) {
      items.push({
        icon: "notifications_active",
        text: `${reminders.filter((item) => !item.done).length} aktív emlékeztető`,
        sub: "Gyorsan át tudod nézni indulás előtt.",
      });
    }
    if (selectedSchedule.length > 0) {
      items.push({
        icon: "schedule",
        text: isTodaySelected ? "Mai rutin figyelmeztetés" : "Kiválasztott napi rutin",
        sub: `${selectedSchedule[0].label} • ${formatTimeRange(selectedSchedule[0].startTime ?? selectedSchedule[0].time, selectedSchedule[0].endTime)}`,
      });
    }
    return items;
  }, [heroProgram, isTodaySelected, reminders, selectedSchedule]);
  const plannedDaysCount = useMemo(
    () => new Set(programs.map((program) => program.date)).size,
    [programs],
  );
  const pendingReminders = reminders.filter((item) => !item.done);
  const heroWeather = weeklyOutlook[Math.min(selectedDayIndex, weeklyOutlook.length - 1)];
  const plannerSourceIdeas = showSavedIdeasOnly
    ? featuredIdeas.filter((idea) => savedIdeaIds.includes(idea.id))
    : featuredIdeas;
  const selectedPlannerPrograms = plannerSourceIdeas.filter((idea) => selectedPlannerIdeas.includes(idea.id));
  const plannerWeather = weeklyOutlook[Math.min(selectedDayIndex, weeklyOutlook.length - 1)];
  const plannerRecommendedIdeas = plannerSourceIdeas.slice(0, visiblePlannerIdeaCount);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!showNotifications && !showProfileMenu) return;
    const handler = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifications, showProfileMenu]);

  useEffect(() => {
    if (showAddReminder) reminderInputRef.current?.focus();
  }, [showAddReminder]);

  function selectProgramDate(date: Date) {
    setSelectedDate(date);
  }

  function goToPreviousWeek() {
    const next = addDays(weekStart, -7);
    setWeekStart(next);
    setSelectedDate(next);
  }

  function goToNextWeek() {
    const next = addDays(weekStart, 7);
    setWeekStart(next);
    setSelectedDate(next);
  }

  function openAddProgramModal(date?: Date) {
    if (date) setSelectedDate(date);
    setPlannerStep(1);
    setSelectedPlannerIdeas([]);
    setShowAddProgram(true);
  }

  function closeAddProgramPlanner() {
    setShowAddProgram(false);
    setPlannerStep(1);
    setSelectedPlannerIdeas([]);
    setShowSavedIdeasOnly(false);
    setVisiblePlannerIdeaCount(4);
  }

  function openProgramDetails(program: ProgramItem) {
    setSelectedProgram(program);
  }

  function openProgramIdeaDetails(idea: ProgramIdea) {
    setSelectedIdea(idea);
  }

  function saveProgramIdea(idea: ProgramIdea) {
    const isSaved = savedIdeaIds.includes(idea.id);
    setSavedIdeaIds((current) =>
      current.includes(idea.id) ? current.filter((id) => id !== idea.id) : [...current, idea.id],
    );
    setToast(isSaved ? `Mentés eltávolítva: ${idea.title}` : `Ötlet elmentve: ${idea.title}`);
  }

  function addProgramFromIdea(idea: ProgramIdea) {
    setSelectedIdea(null);
    setSelectedPlannerIdeas([idea.id]);
    setVisiblePlannerIdeaCount(4);
    setShowAddProgram(true);
    setPlannerStep(1);
  }

  function openAllPrograms() {
    router.push("/programok?view=list");
  }

  function openProgramIdeas() {
    router.push("/programok?view=ideas");
  }

  function openScheduleItem(item: ScheduleEvent) {
    setSelectedScheduleItem(item);
  }

  function openFullSchedule() {
    router.push("/beallitasok");
  }

  function toggleReminderDone(reminder: ReminderItem) {
    setReminders((current) =>
      current.map((item) => (item.id === reminder.id ? { ...item, done: !item.done } : item)),
    );
    setToast(reminder.done ? "Emlékeztető visszaállítva." : "Emlékeztető kész.");
  }

  function openReminderDetails(reminder: ReminderItem) {
    setShowAddReminder(true);
    setToast(`Emlékeztető megnyitva: ${reminder.text}`);
  }

  function openAddReminderModal() {
    setShowAddReminder(true);
  }

  function openNotifications() {
    setShowNotifications((current) => !current);
    setShowProfileMenu(false);
  }

  function navigateToSettings() {
    setShowNotifications(false);
    setShowProfileMenu(false);
    router.push("/beallitasok");
  }

  function openProfileMenu() {
    setShowProfileMenu((current) => !current);
    setShowNotifications(false);
  }

  function handleNotificationSelect(href?: string) {
    setShowNotifications(false);
    if (href) router.push(href);
  }

  function handleLogout() {
    setShowProfileMenu(false);
    void (async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
    })();
  }

  function handleSubmitAddReminder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("text") || "").trim();
    if (!text) return;
    setReminders((current) => [...current, { id: crypto.randomUUID(), text, done: false }]);
    setShowAddReminder(false);
    setToast("Emlékeztető hozzáadva.");
  }

  function togglePlannerIdea(ideaId: string) {
    setSelectedPlannerIdeas((current) =>
      current.includes(ideaId) ? current.filter((id) => id !== ideaId) : [...current, ideaId],
    );
  }

  function addSelectedProgramsFromPlanner() {
    if (selectedPlannerPrograms.length === 0) {
      setToast("Válassz legalább egy programot.");
      return;
    }

    const nextPrograms = selectedPlannerPrograms.map((idea, index) => ({
      id: crypto.randomUUID(),
      title: idea.title,
      place: idea.indoorOutdoor === "Kinti" ? "Budapest környéke" : "Beltéri helyszín",
      date: selectedDateKey,
      startTime: `${String(10 + index * 2).padStart(2, "0")}:00`,
      endTime: `${String(12 + index * 2).padStart(2, "0")}:00`,
      image: idea.image,
      category: "családi" as ProgramCategory,
      mood: idea.tag,
      participants: ["Anna", "Péter", "Luca"],
      notes: idea.copy,
      indoorOutdoor: idea.indoorOutdoor === "Kinti" ? ("kinti" as const) : ("benti" as const),
    }));

    setCustomPrograms((current) => [...current, ...nextPrograms]);
    closeAddProgramPlanner();
    setToast(`${selectedPlannerPrograms.length} program hozzáadva.`);
  }

  function handleEditProgram(program: ProgramItem) {
    const title = window.prompt("Program neve", program.title);
    if (!title) return;
    const place = window.prompt("Helyszín", program.place);
    if (!place) return;
    const startTime = window.prompt("Kezdés (ÓÓ:PP)", program.startTime);
    if (!startTime) return;
    const endTime = window.prompt("Befejezés (ÓÓ:PP)", program.endTime ?? "");

    setProgramOverrides((current) => ({
      ...current,
      [program.id]: {
        ...program,
        title,
        place,
        startTime,
        endTime: endTime || undefined,
      },
    }));
    setSelectedProgram(null);
    setToast("Program frissítve.");
  }

  return (
    <div className="mx-auto hidden w-full max-w-[1600px] flex-col gap-5 px-4 py-4 md:flex md:px-6 md:py-5 lg:px-8">
      <WelcomeHeader
        description="Programok tervezése"
        actions={
          <>
            <button
              onClick={() => router.push("/programok?view=calendar")}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[rgba(74,67,54,0.10)] bg-[rgba(255,251,244,0.94)] px-5 text-[15px] font-semibold text-[var(--ff-text)] shadow-[0_16px_34px_-26px_rgba(61,49,34,0.26)] transition-colors hover:bg-white"
            >
              <Icon name="calendar_month" className="text-[18px]" />
              Naptár nézet
            </button>
            <div className="relative" ref={notifRef}>
              <button
                onClick={openNotifications}
                aria-label={`Értesítések${notificationItems.length > 0 ? ` — ${notificationItems.length} új` : ""}`}
                aria-expanded={showNotifications}
                className="ff-icon-button relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(216,224,203,0.28)]"
              >
                <Icon name="notifications" className="text-[20px]" />
                {notificationItems.length > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#e8821e] shadow-[0_0_0_1.5px_rgba(248,239,224,0.95)]" />
                ) : null}
              </button>
              {showNotifications ? (
                <NotificationPopover
                  items={notificationItems}
                  onClose={() => setShowNotifications(false)}
                  onSelect={handleNotificationSelect}
                />
              ) : null}
            </div>

            <Link
              href="/beallitasok"
              aria-label="Beállítások"
              className="ff-icon-button flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(216,224,203,0.28)]"
            >
              <Icon name="settings" className="text-[20px]" />
            </Link>

            <div className="relative" ref={profileRef}>
              <button
                onClick={openProfileMenu}
                aria-label="Profil és családi beállítások"
                aria-expanded={showProfileMenu}
                className="ff-icon-button flex items-center gap-2 rounded-full border border-[rgba(74,67,54,0.10)] bg-[rgba(255,251,244,0.94)] px-2.5 py-2 text-[var(--ff-text-muted)] shadow-[0_16px_34px_-26px_rgba(61,49,34,0.26)] transition-colors hover:bg-white"
              >
                <span
                  aria-hidden
                  className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[rgba(238,243,230,0.92)] text-[11px] font-bold text-[var(--ff-primary)] shadow-[0_8px_14px_-10px_rgba(61,49,34,0.22)]"
                >
                  FN
                </span>
                <Icon name="expand_more" className="text-[18px] text-[var(--ff-text-soft)]" />
              </button>
              {showProfileMenu ? (
                <ProfilePopover
                  onClose={() => setShowProfileMenu(false)}
                  onSettings={navigateToSettings}
                  onLogout={handleLogout}
                />
              ) : null}
            </div>
          </>
        }
      />

      {showAddProgram ? (
        <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="ff-glass-card overflow-hidden rounded-[34px] p-0">
              <div className="flex items-center justify-between border-b border-[rgba(74,67,54,0.08)] px-8 py-7">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[rgba(255,244,225,0.92)] text-[var(--ff-caramel-strong)]">
                    <Icon name="calendar_month" className="text-[34px]" />
                  </span>
                  <div>
                    <h1 className="text-[24px] font-semibold tracking-[-0.05em] text-[var(--ff-text)]">Hétvégi programtervező</h1>
                    <p className="mt-1 text-[16px] text-[var(--ff-text-muted)]">Találjuk meg a tökéletes programot a családnak.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSavedIdeasOnly((current) => !current);
                    setVisiblePlannerIdeaCount(4);
                  }}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[rgba(74,67,54,0.10)] bg-[rgba(255,251,244,0.94)] px-5 text-[15px] font-semibold text-[var(--ff-text)]"
                >
                  <Icon name="favorite" className="text-[18px]" />
                  {showSavedIdeasOnly ? "Összes program" : "Mentett programok"}
                </button>
              </div>

              <div className="border-b border-[rgba(74,67,54,0.08)] px-8 py-8">
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { id: 1, label: "Nap" },
                    { id: 2, label: "Időjárás" },
                    { id: 3, label: "Időtartam" },
                    { id: 4, label: "Távolság" },
                    { id: 5, label: "Család-fit" },
                  ].map((item, index) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-[18px] font-bold ${
                          item.id === plannerStep
                            ? "bg-[var(--ff-primary)] text-white"
                            : "border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.94)] text-[var(--ff-text-soft)]"
                        }`}>
                          {item.id}
                        </span>
                        <span className="text-[16px] font-semibold text-[var(--ff-text)]">{item.label}</span>
                      </div>
                      {index < 4 && <span className="h-px flex-1 bg-[rgba(74,67,54,0.10)]" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="rounded-[30px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,255,255,0.92)] p-6">
                  <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Válassz napot</h2>
                  <p className="mt-2 text-[15px] text-[var(--ff-text-muted)]">Melyik napra keresel programot?</p>

                  <div className="mt-8 grid grid-cols-[44px_repeat(5,minmax(0,1fr))_44px] items-center gap-4">
                    <button
                      onClick={goToPreviousWeek}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,248,236,0.92)] text-[var(--ff-text-soft)]"
                    >
                      <Icon name="chevron_left" className="text-[22px]" />
                    </button>
                    {selectedWeekDays.slice(0, 5).map((date, index) => {
                      const active = toDateKey(date) === selectedDateKey;
                      const forecast = weeklyOutlook[index];
                      return (
                        <button
                          key={toDateKey(date)}
                          onClick={() => selectProgramDate(date)}
                          className={`rounded-[24px] border px-5 py-5 text-center transition-all ${
                            active
                              ? "border-[rgba(114,143,87,0.45)] bg-[rgba(244,249,238,0.96)] shadow-[0_18px_34px_-24px_rgba(91,125,66,0.30)]"
                              : "border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)]"
                          }`}
                        >
                          <p className="text-[16px] font-semibold text-[var(--ff-text)]">{date.toLocaleDateString("hu-HU", { weekday: "long" })}</p>
                          <p className="mt-1 text-[14px] text-[var(--ff-text-soft)]">
                            {date.toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}
                          </p>
                          <div className="mt-7 flex items-center justify-center gap-3">
                            <Icon name={forecast?.icon ?? "wb_sunny"} className="text-[28px] text-[#f0a51f]" />
                            <span className="text-[30px] font-semibold tracking-[-0.05em] text-[var(--ff-text)]">{forecast?.high}°</span>
                          </div>
                        </button>
                      );
                    })}
                    <button
                      onClick={goToNextWeek}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,248,236,0.92)] text-[var(--ff-text-soft)]"
                    >
                      <Icon name="chevron_right" className="text-[22px]" />
                    </button>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => {
                        setPlannerStep((current) => (current < 5 ? ((current + 1) as 1 | 2 | 3 | 4 | 5) : current));
                      }}
                      className="inline-flex h-12 items-center gap-3 rounded-full bg-[linear-gradient(135deg,#efa13b,#d68018)] px-8 text-[16px] font-bold text-white shadow-[0_20px_36px_-24px_rgba(210,130,33,0.52)]"
                    >
                      Tovább
                      <Icon name="arrow_forward" className="text-[20px]" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="ff-glass-card rounded-[34px] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Neked ajánlott programok</h2>
                  <span className="text-[14px] font-medium text-[var(--ff-text-soft)]">
                    {selectedDate.toLocaleDateString("hu-HU", { weekday: "long" })} • Beltéri • 2-4 óra • 25 km-en belül • 1-3 éveseknek is jó
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPlannerStep(1);
                    setShowSavedIdeasOnly(false);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[rgba(74,67,54,0.10)] bg-[rgba(255,251,244,0.94)] px-5 text-[15px] font-semibold text-[var(--ff-text)]"
                >
                  <Icon name="tune" className="text-[18px]" />
                  Szűrők módosítása
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {plannerRecommendedIdeas.map((idea) => {
                  const selectedIdea = selectedPlannerIdeas.includes(idea.id);
                  return (
                    <button
                      key={idea.id}
                      onClick={() => togglePlannerIdea(idea.id)}
                      className={`overflow-hidden rounded-[24px] border text-left transition-all ${
                        selectedIdea
                          ? "border-[rgba(114,143,87,0.45)] bg-[rgba(248,251,243,0.98)] shadow-[0_18px_34px_-26px_rgba(91,125,66,0.26)]"
                          : "border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.84)] hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-26px_rgba(61,49,34,0.24)]"
                      }`}
                    >
                      <div className="relative h-44">
                        <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${idea.image})` }} />
                        <span className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-[12px] font-semibold text-[var(--ff-text)]">
                          {idea.indoorOutdoor}
                        </span>
                        <span className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/94 ${selectedIdea ? "text-[var(--ff-caramel-strong)]" : "text-[var(--ff-text-soft)]"}`}>
                          <Icon name={selectedIdea ? "favorite" : "favorite_border"} className="text-[20px]" />
                        </span>
                      </div>
                      <div className="px-4 py-4">
                        <h3 className="text-[18px] font-semibold leading-tight tracking-[-0.04em] text-[var(--ff-text)]">{idea.title}</h3>
                        <p className="mt-2 text-[14px] text-[var(--ff-text-muted)]">{idea.copy}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px] font-medium text-[var(--ff-text-soft)]">
                          <span>{idea.duration}</span>
                          <span>{idea.age}</span>
                          <span>{idea.tag}</span>
                        </div>
                        <p className="mt-3 text-[14px] font-semibold text-[var(--ff-primary)]">Esős időben ideális</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setVisiblePlannerIdeaCount((current) => Math.min(current + 4, plannerSourceIdeas.length))}
                  disabled={visiblePlannerIdeaCount >= plannerSourceIdeas.length}
                  className={`inline-flex h-12 items-center gap-2 rounded-full border border-[rgba(74,67,54,0.10)] bg-[rgba(255,251,244,0.94)] px-6 text-[15px] font-semibold ${
                    visiblePlannerIdeaCount >= plannerSourceIdeas.length ? "cursor-not-allowed text-[var(--ff-text-soft)] opacity-60" : "text-[var(--ff-text-muted)]"
                  }`}
                >
                  További programok megjelenítése
                  <Icon name="expand_more" className="text-[18px]" />
                </button>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-5">
            <section className="ff-glass-card rounded-[34px] p-5">
              <div className="mb-4">
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Időjárás előrejelzés</h2>
                <div className="mt-2 flex items-center gap-2 text-[14px] font-medium text-[var(--ff-text-soft)]">
                  <Icon name="location_on" className="text-[16px]" />
                  Budapest
                </div>
              </div>
              <div className="rounded-[30px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.82)] p-5 text-center">
                <Icon name={plannerWeather.icon} className="text-[92px] text-[#8fb5d8]" />
                <p className="mt-2 text-[18px] font-semibold text-[var(--ff-text)]">{selectedDate.toLocaleDateString("hu-HU", { weekday: "long" })}</p>
                <p className="mt-1 text-[64px] font-semibold leading-none tracking-[-0.06em] text-[var(--ff-text)]">{plannerWeather.high}°</p>
                <p className="mt-2 text-[18px] font-semibold text-[var(--ff-text-muted)]">Eső várható</p>
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[rgba(74,67,54,0.08)] pt-4 text-[14px]">
                  <div>
                    <p className="text-[var(--ff-text-soft)]">Hőérzet</p>
                    <p className="mt-1 font-semibold text-[var(--ff-text)]">{plannerWeather.low}°</p>
                  </div>
                  <div>
                    <p className="text-[var(--ff-text-soft)]">Csapadék</p>
                    <p className="mt-1 font-semibold text-[var(--ff-text)]">70%</p>
                  </div>
                  <div>
                    <p className="text-[var(--ff-text-soft)]">Szél</p>
                    <p className="mt-1 font-semibold text-[var(--ff-text)]">18 km/h</p>
                  </div>
                </div>
                <div className="mt-6 rounded-[24px] bg-[rgba(237,242,248,0.9)] px-4 py-4 text-left">
                  <p className="text-[15px] font-medium text-[var(--ff-text-muted)]">Esős idő várható a nap nagy részében. Beltéri programokat javaslunk.</p>
                </div>
              </div>
            </section>

            <section className="ff-glass-card rounded-[34px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Kijelölt programok</h2>
                <span className="rounded-full bg-[rgba(255,248,236,0.92)] px-3 py-1 text-[13px] font-bold text-[var(--ff-text-soft)]">
                  {selectedPlannerPrograms.length}
                </span>
              </div>

              {selectedPlannerPrograms.length > 0 ? (
                <div className="space-y-3">
                  {selectedPlannerPrograms.map((idea) => (
                    <div key={idea.id} className="flex items-center gap-3 rounded-[22px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.84)] p-3">
                      <div className="h-16 w-16 overflow-hidden rounded-[18px]">
                        <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${idea.image})` }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold text-[var(--ff-text)]">{idea.title}</p>
                        <p className="mt-1 text-[13px] text-[var(--ff-text-soft)]">{idea.duration} • {idea.indoorOutdoor}</p>
                      </div>
                      <button onClick={() => togglePlannerIdea(idea.id)} className="text-[var(--ff-text-soft)]">
                        <Icon name="close" className="text-[18px]" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[rgba(74,67,54,0.12)] bg-[rgba(255,252,244,0.62)] px-6 text-center">
                  <Icon name="calendar_month" className="text-[72px] text-[rgba(111,154,99,0.24)]" />
                  <p className="mt-4 text-[18px] font-semibold text-[var(--ff-text)]">Még nem adtál hozzá programot.</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--ff-text-muted)]">Válassz a javaslatok közül, és add hozzá a napodhoz!</p>
                </div>
              )}

              <button
                onClick={addSelectedProgramsFromPlanner}
                className="mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[linear-gradient(135deg,#efa13b,#d68018)] px-6 text-[18px] font-bold text-white shadow-[0_24px_40px_-22px_rgba(210,130,33,0.62)]"
              >
                Program hozzáadása
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/96 text-[var(--ff-caramel-strong)]">
                  <Icon name="add" className="text-[20px]" />
                </span>
              </button>
            </section>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,251,243,0.98),rgba(246,231,206,0.74))] p-6 shadow-[0_30px_78px_-40px_rgba(61,49,34,0.28)]">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,248,236,0.96)_0%,rgba(255,248,236,0.78)_32%,rgba(255,248,236,0.18)_62%,rgba(255,248,236,0.10)_100%)]" />
            <div className="relative grid grid-cols-[minmax(0,1fr)_240px] gap-6">
              <div className="max-w-[560px] py-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,246,228,0.92)] px-3 py-2 text-[15px] font-semibold text-[var(--ff-caramel-strong)]">
                  <Icon name="wb_sunny" className="text-[18px]" />
                  Hétvégi kilátás
                </div>
                <h1 className="mt-5 max-w-[480px] text-[62px] font-semibold leading-[0.94] tracking-[-0.07em] text-[var(--ff-text)]">
                  Készen álltok a hétvégére?
                </h1>
                <p className="mt-5 max-w-[520px] text-[19px] leading-relaxed text-[var(--ff-text-muted)]">
                  Szombaton napos, kellemes idő várható. Remek alkalom kültéri programokra a családdal.
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <button
                    onClick={() => openAddProgramModal(selectedDate)}
                    className="inline-flex h-14 items-center gap-3 rounded-full bg-[linear-gradient(135deg,#efa13b,#d68018)] px-7 text-[18px] font-bold text-white shadow-[0_24px_40px_-22px_rgba(210,130,33,0.62)] transition-transform hover:-translate-y-0.5"
                  >
                    Program hozzáadása
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/96 text-[var(--ff-caramel-strong)]">
                      <Icon name="add" className="text-[22px]" />
                    </span>
                  </button>
                  <button
                    onClick={openProgramIdeas}
                    className="inline-flex h-14 items-center gap-3 rounded-full border border-[rgba(74,67,54,0.10)] bg-[rgba(239,244,228,0.86)] px-7 text-[18px] font-semibold text-[var(--ff-primary)] shadow-[0_18px_34px_-26px_rgba(61,49,34,0.22)] transition-colors hover:bg-[rgba(239,244,228,0.98)]"
                  >
                    <Icon name="lightbulb" className="text-[21px]" />
                    Ötletek felfedezése
                  </button>
                </div>
              </div>

              <div className="flex items-start justify-end">
                <div className="w-full max-w-[230px] rounded-[30px] border border-white/70 bg-[rgba(255,248,236,0.94)] p-5 shadow-[0_24px_50px_-30px_rgba(61,49,34,0.30)] backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-bold text-[var(--ff-text)]">Budapest</p>
                    <Icon name="location_on" className="text-[18px] text-[var(--ff-text-soft)]" />
                  </div>
                  <div className="mt-5 flex items-start justify-between">
                    <div>
                      <p className="text-[64px] font-semibold leading-none tracking-[-0.06em] text-[var(--ff-text)]">24°</p>
                      <p className="mt-2 text-[18px] font-semibold text-[var(--ff-text-muted)]">Napos</p>
                      <p className="mt-1 text-[15px] text-[var(--ff-text-soft)]">↑ 25°  •  ↓ 13°</p>
                    </div>
                    <Icon name="wb_sunny" className="text-[48px] text-[#f0a51f]" />
                  </div>
                  <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-[22px] border border-[rgba(74,67,54,0.08)] bg-white/70">
                    {selectedWeekDays.slice(4, 7).map((date, index) => (
                      <div key={toDateKey(date)} className="border-l border-[rgba(74,67,54,0.06)] px-3 py-3 first:border-l-0">
                        <p className="text-[13px] font-bold text-[var(--ff-text)]">
                          {date.toLocaleDateString("hu-HU", { weekday: "short" })}
                        </p>
                        <p className="mt-2 text-[18px] font-semibold text-[var(--ff-text)]">
                          {weeklyOutlook[index + 4]?.high}°
                        </p>
                        <Icon name={weeklyOutlook[index + 4]?.icon ?? "wb_sunny"} className="mt-1 text-[18px] text-[#f0a51f]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="ff-glass-card rounded-[34px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Heti áttekintés</h2>
              <span className="rounded-full bg-[rgba(255,248,236,0.88)] px-4 py-2 text-[14px] font-semibold text-[var(--ff-text-muted)]">
                Ma
              </span>
            </div>
            <div className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))_40px] items-center gap-3">
              <button
                onClick={goToPreviousWeek}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-soft)] transition-colors hover:bg-[rgba(255,245,228,0.88)]"
              >
                <Icon name="chevron_left" className="text-[22px]" />
              </button>
              {selectedWeekDays.map((date, index) => {
                const active = toDateKey(date) === selectedDateKey;
                const forecast = weeklyOutlook[index];
                return (
                  <button
                    key={toDateKey(date)}
                    onClick={() => selectProgramDate(date)}
                    className={`rounded-[24px] border px-5 py-4 text-left transition-all ${
                      active
                        ? "border-[rgba(114,143,87,0.45)] bg-[rgba(244,249,238,0.96)] shadow-[0_18px_34px_-24px_rgba(91,125,66,0.30)]"
                        : "border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)] hover:bg-[rgba(255,248,236,0.92)]"
                    }`}
                  >
                    <p className="text-[13px] font-bold text-[var(--ff-text)]">
                      {date.toLocaleDateString("hu-HU", { weekday: "long" })}
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--ff-text-soft)]">
                      {date.toLocaleDateString("hu-HU", { month: "long", day: "numeric" })}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <Icon name={forecast?.icon ?? "wb_sunny"} className="text-[28px] text-[#f0a51f]" />
                      <div className="text-right">
                        <p className="text-[17px] font-semibold text-[var(--ff-text)]">{forecast?.high}°</p>
                        <p className="text-[13px] text-[var(--ff-text-soft)]">{forecast?.low}°</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={goToNextWeek}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-soft)] transition-colors hover:bg-[rgba(255,245,228,0.88)]"
              >
                <Icon name="chevron_right" className="text-[22px]" />
              </button>
            </div>
          </section>

          <section className="ff-glass-card rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Következő programjaink</h2>
              <button onClick={openAllPrograms} className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-text-muted)] hover:text-[var(--ff-primary)]">
                Összes program
                <Icon name="arrow_forward" className="text-[18px]" />
              </button>
            </div>
            <div className="divide-y divide-[rgba(74,67,54,0.08)] overflow-hidden rounded-[28px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.84)]">
              {visiblePrograms.length > 0 ? (
                visiblePrograms.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openProgramDetails(item)}
                    className="grid w-full grid-cols-[88px_112px_minmax(0,1fr)_96px_96px_24px] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[rgba(255,248,236,0.82)]"
                  >
                    <div className="text-[var(--ff-text)]">
                      <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[var(--ff-text-soft)]">
                        {new Date(`${item.date}T12:00:00`).toLocaleDateString("hu-HU", { weekday: "long" })}
                      </p>
                      <p className="mt-1 text-[42px] font-semibold leading-none tracking-[-0.06em]">
                        {new Date(`${item.date}T12:00:00`).getDate()}
                      </p>
                      <p className="mt-1 text-[14px] text-[var(--ff-text-soft)]">
                        {new Date(`${item.date}T12:00:00`).toLocaleDateString("hu-HU", { month: "long" })}
                      </p>
                    </div>
                    <div className="h-[84px] overflow-hidden rounded-[22px]">
                      <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-[var(--ff-text-soft)]">{formatTimeRange(item.startTime, item.endTime)}</p>
                      <h3 className="mt-1 truncate text-[28px] font-semibold tracking-[-0.05em] text-[var(--ff-text)]">{item.title}</h3>
                      <p className="mt-1 truncate text-[16px] text-[var(--ff-text-muted)]">{item.participants.join(", ")}</p>
                    </div>
                    <span className="inline-flex justify-center rounded-full bg-[rgba(233,241,220,0.98)] px-3 py-2 text-[13px] font-semibold text-[var(--ff-primary)]">
                      {item.indoorOutdoor === "kinti" ? "Kültéri" : "Otthon"}
                    </span>
                    <span className="inline-flex justify-center rounded-full bg-[rgba(255,244,225,0.98)] px-3 py-2 text-[13px] font-semibold text-[var(--ff-caramel-strong)]">
                      {item.mood}
                    </span>
                    <Icon name="more_vert" className="text-[20px] text-[var(--ff-text-soft)]" />
                  </button>
                ))
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="text-[15px] font-semibold text-[var(--ff-text)]">Még nincs közelgő program.</p>
                  <button onClick={() => openAddProgramModal(selectedDate)} className="mt-3 text-[14px] font-semibold text-[var(--ff-primary)]">
                    Program hozzáadása
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="ff-glass-card rounded-[34px] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Hétvégi ötletek a családnak</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Összes", "Kültéri", "Beltéri", "Rövid program", "Gyerekbarát"].map((chip, index) => (
                    <span
                      key={chip}
                      className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
                        index === 0
                          ? "bg-[rgba(233,241,220,0.98)] text-[var(--ff-primary)]"
                          : "bg-[rgba(255,252,244,0.82)] text-[var(--ff-text-muted)]"
                      }`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={openProgramIdeas} className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-text-muted)] hover:text-[var(--ff-primary)]">
                További ötletek
                <Icon name="arrow_forward" className="text-[18px]" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {featuredIdeas.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-[24px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.82)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-26px_rgba(61,49,34,0.24)]"
                >
                  <button onClick={() => openProgramIdeaDetails(item)} className="block w-full text-left">
                    <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                    <div className="px-4 py-4">
                      <div className="text-[13px] font-semibold text-[var(--ff-primary-soft)]">
                        {item.indoorOutdoor}  •  {item.tag}
                      </div>
                      <h3 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.05em] text-[var(--ff-text)]">
                        {item.title}
                      </h3>
                      <div className="mt-3 flex items-center gap-3 text-[13px] font-medium text-[var(--ff-text-soft)]">
                        <span>{item.duration}</span>
                        <span className="h-1 w-1 rounded-full bg-[var(--ff-text-soft)]" />
                        <span>{item.freeLabel ?? "Könnyű"}</span>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="ff-glass-card rounded-[34px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-[var(--ff-caramel-strong)]">
                  <Icon name="local_fire_department" className="text-[18px]" />
                  <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Mai napirend</h2>
                </div>
                <p className="mt-2 text-[14px] font-medium text-[var(--ff-text-soft)]">{formatLongDate(selectedDateKey)}</p>
              </div>
            </div>
            <div className="space-y-1">
              {selectedSchedule.length > 0 ? (
                selectedSchedule.slice(0, 5).map((event) => {
                  const highlighted = event.id === highlightedScheduleId;
                  return (
                    <button
                      key={event.id}
                      onClick={() => openScheduleItem(event)}
                      className="grid w-full grid-cols-[54px_34px_minmax(0,1fr)] items-center gap-4 border-t border-[rgba(74,67,54,0.06)] py-4 text-left first:border-t-0 first:pt-1"
                    >
                      <span className="text-[16px] font-semibold text-[var(--ff-text-muted)]">
                        {event.startTime ?? event.time}
                      </span>
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        highlighted ? "bg-[rgba(230,241,218,0.98)] text-[var(--ff-primary)]" : "bg-[rgba(255,244,225,0.88)] text-[var(--ff-caramel-strong)]"
                      }`}>
                        <Icon name={highlighted ? "check_circle" : "event"} className="text-[18px]" />
                      </span>
                      <span className="text-[16px] font-semibold text-[var(--ff-text)]">{event.label}</span>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[15px] font-semibold text-[var(--ff-text)]">Ma nincs rögzített napirend.</p>
                </div>
              )}
            </div>
            <button
              onClick={() => openAddProgramModal(selectedDate)}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[rgba(226,170,93,0.26)] bg-[rgba(255,251,244,0.96)] text-[15px] font-semibold text-[var(--ff-caramel-strong)] transition-colors hover:bg-white"
            >
              <Icon name="add" className="text-[18px]" />
              Esemény hozzáadása
            </button>
          </section>

          <section className="ff-glass-card rounded-[34px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Gyors emlékeztetők</h2>
              <span className="rounded-full bg-[rgba(255,239,212,0.92)] px-3 py-1.5 text-[13px] font-bold text-[var(--ff-caramel-strong)]">
                {pendingReminders.length}
              </span>
            </div>
            <div className="space-y-1">
              {reminders.length > 0 ? (
                reminders.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 border-t border-[rgba(74,67,54,0.06)] py-4 first:border-t-0 first:pt-1">
                    <button
                      onClick={() => toggleReminderDone(item)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors ${
                        item.done
                          ? "border-[rgba(123,157,90,0.42)] bg-[rgba(230,241,218,0.98)] text-[var(--ff-primary)]"
                          : "border-[rgba(74,67,54,0.18)] bg-white/70"
                      }`}
                    >
                      {item.done ? <Icon name="check" className="text-[14px]" /> : null}
                    </button>
                    <button onClick={() => openReminderDetails(item)} className="min-w-0 flex-1 text-left">
                      <span className={`block text-[15px] font-medium ${item.done ? "text-[var(--ff-text-soft)] line-through" : "text-[var(--ff-text)]"}`}>
                        {item.text}
                      </span>
                      <span className="mt-1 block text-[13px] font-medium text-[var(--ff-text-soft)]">
                        {item.meta ?? (item.done ? "Ma" : "Holnap")}
                      </span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[15px] font-semibold text-[var(--ff-text)]">Nincs emlékeztetőd.</p>
                </div>
              )}
            </div>
            <button
              onClick={openAddReminderModal}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[rgba(226,170,93,0.22)] bg-[rgba(255,251,244,0.96)] text-[15px] font-semibold text-[var(--ff-caramel-strong)] transition-colors hover:bg-white"
            >
              <Icon name="add" className="text-[18px]" />
              Emlékeztető hozzáadása
            </button>
          </section>

          <section className="ff-glass-card rounded-[34px] p-5">
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Hasznos tippek</h2>
            <div className="mt-5 overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,rgba(238,244,225,0.92),rgba(250,243,228,0.90))] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[rgba(230,241,218,0.86)] text-[var(--ff-primary)]">
                  <Icon name="checkroom" className="text-[34px]" />
                </div>
                <div>
                  <h3 className="text-[22px] font-semibold leading-tight tracking-[-0.04em] text-[var(--ff-text)]">
                    Réteges öltözködés hétvégére
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--ff-text-muted)]">
                    A reggeli hűvös után délutánra melegebb lesz. Réteges öltözet mindenkinek ajánlott.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-[#d89b42]">
                <span className="h-2.5 w-2.5 rounded-full bg-current" />
                <span className="h-2.5 w-2.5 rounded-full bg-current/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-current/30" />
              </div>
            </div>
          </section>
        </div>
      </div>
      )}

      {selectedProgram && (
        <Overlay title={selectedProgram.title} onClose={() => setSelectedProgram(null)} width="max-w-[720px]">
          <div className="overflow-hidden rounded-[24px]">
            <div className="h-56 bg-cover bg-center" style={{ backgroundImage: `url(${selectedProgram.image})` }} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[20px] bg-[rgba(255,249,237,0.78)] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Mikor</p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--ff-text)]">{formatLongDate(selectedProgram.date)}</p>
              <p className="mt-1 text-[14px] text-[var(--ff-text-muted)]">{formatTimeRange(selectedProgram.startTime, selectedProgram.endTime)}</p>
            </div>
            <div className="rounded-[20px] bg-[rgba(238,243,231,0.72)] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Helyszín</p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--ff-text)]">{selectedProgram.place}</p>
              <p className="mt-1 text-[14px] text-[var(--ff-text-muted)]">{selectedProgram.indoorOutdoor === "kinti" ? "Kinti program" : "Benti program"}</p>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-[15px] font-semibold text-[var(--ff-text)]">Résztvevők</h4>
            <div className="mt-2 flex gap-2">
              {selectedProgram.participants.map((person) => (
                <span key={`${selectedProgram.id}-${person}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,249,237,0.98)] text-[12px] font-bold text-[var(--ff-primary)]">
                  {person}
                </span>
              ))}
            </div>
          </div>
          {selectedProgram.notes ? <p className="mt-4 text-[14px] leading-relaxed text-[var(--ff-text-muted)]">{selectedProgram.notes}</p> : null}
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => handleEditProgram(selectedProgram)} className="ff-button-secondary px-5 py-3 text-sm font-bold">Szerkesztés</button>
            <button onClick={openAddReminderModal} className="ff-button-secondary px-5 py-3 text-sm font-bold">Emlékeztető hozzáadása</button>
            <button
              onClick={() => {
                setCustomPrograms((current) => current.filter((item) => item.id !== selectedProgram.id));
                setSelectedProgram(null);
                setToast("Program törölve.");
              }}
              className="rounded-full bg-[rgba(196,74,54,0.12)] px-5 py-3 text-sm font-bold text-[rgba(181,67,48,0.92)]"
            >
              Törlés
            </button>
          </div>
        </Overlay>
      )}

      {selectedIdea && (
        <Overlay title={selectedIdea.title} onClose={() => setSelectedIdea(null)} width="max-w-[720px]">
          <div className="overflow-hidden rounded-[24px]">
            <div className="h-56 bg-cover bg-center" style={{ backgroundImage: `url(${selectedIdea.image})` }} />
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-[var(--ff-text-muted)]">{selectedIdea.copy}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-[20px] bg-[rgba(255,249,237,0.78)] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Időtartam</p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--ff-text)]">{selectedIdea.duration}</p>
            </div>
            <div className="rounded-[20px] bg-[rgba(238,243,231,0.72)] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Korosztály</p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--ff-text)]">{selectedIdea.age}</p>
            </div>
            <div className="rounded-[20px] bg-[rgba(255,240,227,0.74)] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Tér</p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--ff-text)]">{selectedIdea.indoorOutdoor}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => saveProgramIdea(selectedIdea)} className="ff-button-secondary px-5 py-3 text-sm font-bold">Mentés későbbre</button>
            <button onClick={() => addProgramFromIdea(selectedIdea)} className="ff-button-primary px-5 py-3 text-sm font-bold">Program hozzáadása</button>
          </div>
        </Overlay>
      )}

      {selectedScheduleItem && (
        <Overlay title={selectedScheduleItem.label} onClose={() => setSelectedScheduleItem(null)} width="max-w-[560px]">
          <div className="space-y-3">
            <div className="rounded-[20px] bg-[rgba(255,249,237,0.78)] px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Idő</p>
              <p className="mt-1 text-[15px] font-semibold text-[var(--ff-text)]">
                {formatTimeRange(selectedScheduleItem.startTime ?? selectedScheduleItem.time, selectedScheduleItem.endTime)}
              </p>
            </div>
            <p className="text-[14px] leading-relaxed text-[var(--ff-text-muted)]">
              {selectedScheduleItem.person ? `${selectedScheduleItem.person} programjához kapcsolódik.` : "Napi rutin esemény."}
            </p>
            <div className="flex justify-end">
              <button onClick={openFullSchedule} className="ff-button-secondary px-5 py-3 text-sm font-bold">Teljes napirend</button>
            </div>
          </div>
        </Overlay>
      )}

      {showAddReminder && (
        <Overlay title="Új emlékeztető" onClose={() => setShowAddReminder(false)} width="max-w-[520px]">
          <form onSubmit={handleSubmitAddReminder} className="space-y-4">
            <label className="block text-sm font-semibold text-[var(--ff-text)]">
              Emlékeztető
              <input ref={reminderInputRef} name="text" className="ff-input mt-2 w-full rounded-[18px] px-4 py-3" placeholder="Mit ne felejtsünk el?" />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddReminder(false)} className="ff-button-secondary px-5 py-3 text-sm font-bold">Mégse</button>
              <button type="submit" className="ff-button-primary px-5 py-3 text-sm font-bold">Hozzáadás</button>
            </div>
          </form>
        </Overlay>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-[rgba(31,33,29,0.92)] px-4 py-2 text-[13px] font-medium text-[var(--ff-text-inverse)] shadow-[0_18px_34px_-18px_rgba(20,22,18,0.42)]">
          {toast}
        </div>
      )}
    </div>
  );
}
