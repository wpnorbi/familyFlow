"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import { useSchedule } from "@/hooks/useSchedule";
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
const PROFILE_AVATAR =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80";
const USER_NAME = "Norbi";

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

const PROGRAM_PRESETS = {
  Játszótér: { title: "Játszótér délután", category: "szabadidő", place: "Közeli játszótér", indoorOutdoor: "kinti" },
  Állatkert: { title: "Állatkerti látogatás", category: "családi", place: "Állatkert", indoorOutdoor: "kinti" },
  Piknik: { title: "Családi piknik", category: "családi", place: "Normafa", indoorOutdoor: "kinti" },
  Bevásárlás: { title: "Bevásárlás", category: "házimunka", place: "Szupermarket", indoorOutdoor: "benti" },
  Sport: { title: "Sport program", category: "sport", place: "Sportpálya", indoorOutdoor: "kinti" },
  "Benti kreatív program": { title: "Benti kreatív program", category: "szabadidő", place: "Otthon", indoorOutdoor: "benti" },
} satisfies Record<string, { title: string; category: ProgramCategory; place: string; indoorOutdoor: "kinti" | "benti" }>;

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
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const programFormRef = useRef<HTMLFormElement | null>(null);
  const reminderInputRef = useRef<HTMLInputElement | null>(null);

  const seededPrograms = useMemo(() => buildSeedPrograms(startOfWeek(today)), [today]);
  const programs = useMemo(() => [...seededPrograms, ...customPrograms], [seededPrograms, customPrograms]);
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
    setShowAddProgram(true);
  }

  function openProgramDetails(program: ProgramItem) {
    setSelectedProgram(program);
  }

  function openProgramIdeaDetails(idea: ProgramIdea) {
    setSelectedIdea(idea);
  }

  function saveProgramIdea(idea: ProgramIdea) {
    setToast(`Ötlet elmentve: ${idea.title}`);
  }

  function addProgramFromIdea(idea: ProgramIdea) {
    setSelectedIdea(null);
    setShowAddProgram(true);
    setToast(`Programötlet kiválasztva: ${idea.title}`);
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
    setToast(`Emlékeztető: ${reminder.text}`);
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
    setToast("Kijelentkezés később köthető be.");
  }

  function handleSubmitAddProgram(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newProgram: ProgramItem = {
      id: crypto.randomUUID(),
      title: String(form.get("title") || "Új program"),
      date: String(form.get("date") || selectedDateKey),
      startTime: String(form.get("startTime") || "10:00"),
      endTime: String(form.get("endTime") || ""),
      place: String(form.get("place") || "Nincs megadva"),
      category: String(form.get("category") || "családi") as ProgramCategory,
      participants: String(form.get("participants") || "A,N").split(",").map((item) => item.trim()).filter(Boolean),
      reminder: String(form.get("reminder") || ""),
      notes: String(form.get("notes") || ""),
      indoorOutdoor: (String(form.get("indoorOutdoor") || "kinti") as "kinti" | "benti"),
      mood: String(form.get("indoorOutdoor") || "kinti") === "benti" ? "Otthoni" : "Szabadtéri",
      image: HERO_IMAGE,
    };
    setCustomPrograms((current) => [...current, newProgram]);
    setSelectedDate(new Date(`${newProgram.date}T12:00:00`));
    setShowAddProgram(false);
    setToast("Program hozzáadva.");
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

  function applyProgramPreset(presetLabel: keyof typeof PROGRAM_PRESETS) {
    const preset = PROGRAM_PRESETS[presetLabel];
    const form = programFormRef.current;
    if (!form) return;

    const titleInput = form.elements.namedItem("title") as HTMLInputElement | null;
    const categoryInput = form.elements.namedItem("category") as HTMLSelectElement | null;
    const placeInput = form.elements.namedItem("place") as HTMLInputElement | null;
    const indoorOutdoorInput = form.elements.namedItem("indoorOutdoor") as HTMLSelectElement | null;

    if (titleInput) titleInput.value = preset.title;
    if (categoryInput) categoryInput.value = preset.category;
    if (placeInput) placeInput.value = preset.place;
    if (indoorOutdoorInput) indoorOutdoorInput.value = preset.indoorOutdoor;

    setToast(`Preset kiválasztva: ${presetLabel}`);
  }

  return (
    <div className="mx-auto hidden w-full max-w-[1600px] flex-col gap-5 px-4 py-4 md:flex md:px-6 md:py-5 lg:px-8">
      <WelcomeHeader
        name={USER_NAME}
        description="Közelgő programok, hétvégi ötletek és napi emlékeztetők egy helyen."
        actions={
          <>
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
                className="ff-icon-button flex items-center gap-2 rounded-full px-2.5 py-2 text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(216,224,203,0.28)]"
              >
                <span
                  aria-hidden
                  className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-cover bg-center text-[11px] font-bold text-[var(--ff-primary)] shadow-[0_8px_14px_-10px_rgba(61,49,34,0.22)]"
                  style={{ backgroundImage: `url(${PROFILE_AVATAR})` }}
                />
                <span className="text-sm font-medium text-[var(--ff-text)]">Profil</span>
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

      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,251,244,0.98),rgba(246,228,203,0.72))] px-6 pb-6 pt-6 shadow-[0_26px_70px_-34px_rgba(61,49,34,0.24)]">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
            <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(36,24,10,0.80),rgba(36,24,10,0.28)_50%,rgba(36,24,10,0.12)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,240,205,0.18),transparent_42%)]" />

            <div className="relative">
              <h1 className="text-[56px] font-semibold leading-none tracking-[-0.06em] text-[var(--ff-text-inverse)]">Programok</h1>
              <p className="mt-3 text-[19px] text-[rgba(255,249,237,0.88)]">Tervezzünk együtt, több idő jut egymásra.</p>

              <div className="mt-6 flex items-center gap-2">
                <button
                  onClick={goToPreviousWeek}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-[var(--ff-caramel-strong)] shadow-[0_8px_18px_-10px_rgba(61,49,34,0.32)] transition-all hover:bg-white hover:scale-105"
                >
                  <Icon name="chevron_left" className="text-[20px]" />
                </button>

                <div className="grid flex-1 grid-cols-7 gap-1 rounded-[20px] border border-white/70 bg-[rgba(255,251,244,0.94)] px-2 py-1.5 shadow-[0_16px_36px_-22px_rgba(61,49,34,0.20)]">
                  {selectedWeekDays.map((date) => {
                    const active = toDateKey(date) === selectedDateKey;
                    const isToday = toDateKey(date) === toDateKey(today);
                    return (
                      <button
                        key={toDateKey(date)}
                        onClick={() => selectProgramDate(date)}
                        className={`rounded-[14px] px-1 py-1.5 text-center transition-all ${
                          active
                            ? "bg-[linear-gradient(145deg,#e7a250,#d98b3c)] text-[var(--ff-text-inverse)] shadow-[0_12px_20px_-12px_rgba(185,130,71,0.46)]"
                            : "text-[var(--ff-text)] hover:bg-[rgba(255,245,228,0.94)]"
                        }`}
                      >
                        <p className="text-[9px] font-bold uppercase tracking-[0.08em] opacity-75">
                          {date.toLocaleDateString("hu-HU", { weekday: "short" })}
                        </p>
                        <p className="mt-0.5 text-[20px] font-semibold leading-none">{date.getDate()}</p>
                        <p className="mt-0.5 text-[10px] opacity-65">{formatMonthShort(date)}</p>
                        {isToday && !active ? (
                          <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-[var(--ff-caramel)]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={goToNextWeek}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-[var(--ff-caramel-strong)] shadow-[0_8px_18px_-10px_rgba(61,49,34,0.32)] transition-all hover:bg-white hover:scale-105"
                >
                  <Icon name="chevron_right" className="text-[20px]" />
                </button>

                <button
                  onClick={() => openAddProgramModal(selectedDate)}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#e7a250,#d98b3c)] px-5 py-2.5 text-[14px] font-bold text-[var(--ff-text-inverse)] shadow-[0_16px_26px_-14px_rgba(185,130,71,0.52)] transition-all hover:brightness-105 hover:-translate-y-px"
                >
                  <Icon name="add_circle" className="text-[18px]" />
                  <span className="whitespace-nowrap">Program hozzáadása</span>
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-[1.05fr_0.95fr] gap-5">
            <div className="ff-glass-card rounded-[32px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Következő programok</h2>
                  <p className="mt-1 text-[13px] text-[var(--ff-text-muted)]">
                    {dayPrograms.length > 0 ? "A kiválasztott nap fő programjai." : "A következő családi állomások innen indulnak."}
                  </p>
                </div>
                <button onClick={openAllPrograms} className="flex items-center gap-2 text-[15px] font-medium text-[var(--ff-text-muted)] hover:text-[var(--ff-primary)]">
                  Összes megtekintése
                  <Icon name="arrow_forward" className="text-[20px]" />
                </button>
              </div>

              <div className="space-y-3">
                {visiblePrograms.length > 0 ? (
                  visiblePrograms.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => openProgramDetails(item)}
                      className="grid w-full grid-cols-[52px_116px_minmax(0,1fr)_82px_64px] items-center gap-3 rounded-[24px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.84)] px-4 py-3 text-left transition-all hover:-translate-y-1 hover:border-[rgba(154,125,77,0.22)] hover:bg-[rgba(255,249,237,0.96)] hover:shadow-[0_22px_40px_-22px_rgba(61,49,34,0.28)]"
                    >
                      <div className="text-center text-[var(--ff-primary-soft)]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.10em]">
                          {new Date(`${item.date}T12:00:00`).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}
                        </p>
                        <p className="mt-1 text-[13px] font-medium">
                          {new Date(`${item.date}T12:00:00`).toLocaleDateString("hu-HU", { weekday: "short" })}
                        </p>
                      </div>
                      <div className="h-[72px] overflow-hidden rounded-[16px]">
                        <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-[16px] font-semibold tracking-[-0.02em] text-[var(--ff-text)]">{item.title}</h3>
                        <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-[var(--ff-text-muted)]">
                          <Icon name="location_on" className="shrink-0 text-[14px]" />
                          <span className="truncate">{item.place}</span>
                        </p>
                      </div>
                      <p className="text-right text-[13px] font-medium leading-snug text-[var(--ff-text-muted)]">{formatTimeRange(item.startTime, item.endTime)}</p>
                      <div className="flex items-center justify-end gap-1">
                        <div className="flex -space-x-2">
                          {item.participants.slice(0, 3).map((person) => (
                            <span key={`${item.id}-${person}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/90 bg-[rgba(255,249,237,0.98)] text-[11px] font-bold text-[var(--ff-primary)]">
                              {person}
                            </span>
                          ))}
                        </div>
                        <Icon name="chevron_right" className="text-[16px] text-[var(--ff-text-soft)]" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[rgba(170,135,84,0.18)] bg-[rgba(255,249,237,0.62)] px-5 py-8 text-center">
                    <p className="text-[15px] font-semibold text-[var(--ff-text)]">Nincs közelgő program.</p>
                    <button onClick={() => openAddProgramModal(selectedDate)} className="mt-3 text-[14px] font-semibold text-[var(--ff-primary)]">
                      Program hozzáadása
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="ff-glass-card rounded-[32px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Hétvégi ötletek</h2>
                  <p className="mt-1 text-[13px] text-[var(--ff-text-muted)]">Készen álló családi ötletek a következő közös napra.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {weekendIdeas.length > 0 ? (
                  weekendIdeas.map((item) => (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-[24px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.84)] transition-all hover:-translate-y-0.5 hover:border-[rgba(154,125,77,0.18)] hover:shadow-[0_18px_32px_-24px_rgba(61,49,34,0.22)]"
                    >
                      <button onClick={() => openProgramIdeaDetails(item)} className="block w-full text-left">
                        <div className="relative h-36 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }}>
                          <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(35,24,12,0.38),transparent)]" />
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[rgba(255,249,237,0.9)] px-2.5 py-1 text-[11px] font-bold text-[var(--ff-primary)]">
                            <Icon name={getMoodIcon(item.tag)} className="text-[14px]" />
                            {item.tag}
                          </span>
                        </div>
                        <div className="px-4 py-4">
                          <h3 className="text-[16px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">{item.title}</h3>
                          <p className="mt-2 line-clamp-2 min-h-[40px] text-[13px] leading-relaxed text-[var(--ff-text-muted)]">{item.copy}</p>
                          <div className="mt-3 flex items-center gap-2 text-[12px] font-medium text-[var(--ff-primary-soft)]">
                            <span>{item.duration}</span>
                            <span className="h-1 w-1 rounded-full bg-[var(--ff-text-soft)]" />
                            <span>{item.indoorOutdoor}</span>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => saveProgramIdea(item)}
                        title="Mentés későbbre"
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,249,237,0.92)] text-[var(--ff-caramel-strong)] shadow-[0_6px_14px_-8px_rgba(61,49,34,0.22)] transition-colors hover:bg-white"
                      >
                        <Icon name="bookmark" className="text-[16px]" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 rounded-[24px] border border-dashed border-[rgba(170,135,84,0.18)] bg-[rgba(255,249,237,0.62)] px-5 py-8 text-center">
                    <p className="text-[15px] font-semibold text-[var(--ff-text)]">Most nincs ajánlott ötlet.</p>
                    <button onClick={openProgramIdeas} className="mt-3 text-[14px] font-semibold text-[var(--ff-primary)]">
                      Mutass új ötleteket
                    </button>
                  </div>
                )}
              </div>

              <button onClick={openProgramIdeas} className="mt-4 flex items-center gap-2 text-[15px] font-medium text-[var(--ff-primary-soft)] hover:text-[var(--ff-primary)]">
                További ötletek
                <Icon name="arrow_forward" className="text-[20px]" />
              </button>
            </div>
          </section>

          <section className="ff-glass-card rounded-[32px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Kiemelt családi programok</h2>
                <p className="mt-1 text-[13px] text-[var(--ff-text-muted)]">Inspiráló ötletek a következő közös napra.</p>
              </div>
              <button onClick={openProgramIdeas} className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--ff-text-muted)] hover:text-[var(--ff-primary)]">
                Könyvtár
                <Icon name="arrow_forward" className="text-[18px]" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {featuredIdeas.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openProgramIdeaDetails(item)}
                  className="overflow-hidden rounded-[20px] border border-[rgba(74,67,54,0.07)] bg-[rgba(255,252,244,0.78)] text-left transition-all hover:-translate-y-0.5 hover:border-[rgba(154,125,77,0.16)] hover:shadow-[0_14px_28px_-18px_rgba(61,49,34,0.22)]"
                >
                  <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                  <div className="px-3 py-3">
                    <h3 className="truncate text-[14px] font-semibold tracking-[-0.02em] text-[var(--ff-text)]">{item.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-[var(--ff-text-muted)]">{item.copy}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-[var(--ff-primary-soft)]">
                      <Icon name={getMoodIcon(item.tag)} className="text-[16px]" />
                      {item.tag}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="ff-glass-card rounded-[32px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(246,248,236,0.96)] text-[var(--ff-primary-soft)]">
                <Icon name="calendar_month" className="text-[22px]" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">{scheduleTitle}</h2>
                <p className="mt-1 text-[13px] text-[var(--ff-text-muted)]">{formatLongDate(selectedDateKey)}</p>
              </div>
            </div>
            <div className="space-y-3">
              {selectedSchedule.length > 0 ? (
                selectedSchedule.slice(0, 5).map((event) => {
                  const highlighted = event.id === highlightedScheduleId;
                  return (
                    <button
                      key={event.id}
                      onClick={() => openScheduleItem(event)}
                      className={`grid w-full grid-cols-[68px_10px_minmax(0,1fr)_36px] items-center gap-3 rounded-[18px] px-2 py-2 text-left transition-colors ${
                        highlighted
                          ? "bg-[linear-gradient(145deg,rgba(246,228,203,0.44),rgba(255,245,226,0.74))]"
                          : "hover:bg-[rgba(255,248,232,0.74)]"
                      }`}
                    >
                      <span className="text-[15px] font-semibold text-[var(--ff-text)]">
                        {formatTimeRange(event.startTime ?? event.time, event.endTime)}
                      </span>
                      <span className={`h-2.5 w-2.5 rounded-full ${highlighted ? "bg-[var(--ff-caramel-strong)]" : "bg-[var(--ff-primary-soft)]"}`} />
                      <span className="min-w-0">
                        <span className={`block truncate text-[15px] ${highlighted ? "font-semibold text-[var(--ff-text)]" : "text-[var(--ff-text-muted)]"}`}>
                          {event.label}
                          {highlighted && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-[rgba(231,162,80,0.22)] px-1.5 py-0.5 align-middle text-[9px] font-extrabold uppercase tracking-[0.06em] text-[var(--ff-caramel-strong)]">
                              most
                            </span>
                          )}
                        </span>
                      </span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,251,244,0.9)] text-[var(--ff-primary-soft)]">
                        <Icon name="group" className="text-[19px]" />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-[rgba(170,135,84,0.18)] bg-[rgba(255,249,237,0.62)] px-5 py-8 text-center">
                  <p className="text-[15px] font-semibold text-[var(--ff-text)]">Ma nincs rögzített napirend.</p>
                  <button onClick={openFullSchedule} className="mt-3 text-[14px] font-semibold text-[var(--ff-primary)]">
                    Napi rutin beállítása
                  </button>
                </div>
              )}
            </div>
            <button onClick={openFullSchedule} className="mt-5 flex items-center gap-2 rounded-full bg-[rgba(255,251,244,0.92)] px-4 py-3 text-[15px] font-semibold text-[var(--ff-primary-soft)] transition-colors hover:bg-[rgba(246,248,236,0.98)]">
              Teljes napirend
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </section>

          <section className="ff-glass-card rounded-[32px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(246,248,236,0.96)] text-[var(--ff-primary-soft)]">
                <Icon name="notifications_active" className="text-[22px]" />
              </div>
              <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Gyors emlékeztetők</h2>
            </div>
            <div className="space-y-3">
              {reminders.length > 0 ? (
                reminders.map((item, index) => (
                  <div
                    key={item.id}
                    className={`rounded-[18px] px-2 py-2 transition-colors hover:bg-[rgba(255,248,232,0.66)] ${index < reminders.length - 1 ? "border-b border-[rgba(74,67,54,0.08)]" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleReminderDone(item)}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        item.done
                          ? "border-[var(--ff-caramel)] bg-[rgba(231,162,80,0.18)] text-[var(--ff-caramel-strong)] shadow-[0_6px_14px_-10px_rgba(185,130,71,0.36)]"
                          : "border-[rgba(74,67,54,0.20)] hover:border-[var(--ff-caramel-soft)] hover:bg-[rgba(255,245,228,0.62)]"
                      }`}
                    >
                      {item.done ? <Icon name="check" className="text-[14px]" /> : null}
                    </button>
                    <button onClick={() => openReminderDetails(item)} className="min-w-0 flex-1 text-left">
                      <span className={`block text-[14px] font-medium ${item.done ? "text-[var(--ff-text-soft)] line-through" : "text-[var(--ff-text)]"}`}>
                        {item.text}
                      </span>
                      {item.meta ? (
                        <span className="mt-1 inline-flex rounded-full bg-[rgba(238,243,230,0.9)] px-2 py-1 text-[11px] font-semibold text-[var(--ff-primary-soft)]">
                          {item.meta}
                        </span>
                      ) : null}
                    </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[rgba(170,135,84,0.18)] bg-[rgba(255,249,237,0.62)] px-5 py-8 text-center">
                  <p className="text-[15px] font-semibold text-[var(--ff-text)]">Nincs gyors emlékeztetőd.</p>
                  <button onClick={openAddReminderModal} className="mt-3 text-[14px] font-semibold text-[var(--ff-primary)]">
                    Emlékeztető hozzáadása
                  </button>
                </div>
              )}
            </div>
            <button onClick={openAddReminderModal} className="mt-5 flex items-center gap-2 rounded-full bg-[rgba(255,251,244,0.92)] px-4 py-3 text-[15px] font-semibold text-[var(--ff-primary-soft)] transition-colors hover:bg-[rgba(246,248,236,0.98)]">
              Új emlékeztető hozzáadása
              <Icon name="arrow_forward" className="text-[18px]" />
            </button>
          </section>
        </div>
      </div>

      {showAddProgram && (
        <Overlay title="Program hozzáadása" onClose={() => setShowAddProgram(false)} width="max-w-[720px]">
          <form ref={programFormRef} onSubmit={handleSubmitAddProgram} className="grid grid-cols-2 gap-4">
            <label className="col-span-2 text-sm font-semibold text-[var(--ff-text)]">
              Program neve
              <input name="title" className="ff-input mt-2 w-full rounded-[18px] px-4 py-3" placeholder="Pl. Játszótér délután" />
            </label>
            <label className="text-sm font-semibold text-[var(--ff-text)]">
              Dátum
              <input name="date" type="date" defaultValue={selectedDateKey} className="ff-input mt-2 w-full rounded-[18px] px-4 py-3" />
            </label>
            <label className="text-sm font-semibold text-[var(--ff-text)]">
              Helyszín
              <input name="place" className="ff-input mt-2 w-full rounded-[18px] px-4 py-3" placeholder="Helyszín" />
            </label>
            <label className="text-sm font-semibold text-[var(--ff-text)]">
              Kezdés
              <input name="startTime" type="time" defaultValue="10:00" className="ff-input mt-2 w-full rounded-[18px] px-4 py-3" />
            </label>
            <label className="text-sm font-semibold text-[var(--ff-text)]">
              Befejezés
              <input name="endTime" type="time" defaultValue="12:00" className="ff-input mt-2 w-full rounded-[18px] px-4 py-3" />
            </label>
            <label className="text-sm font-semibold text-[var(--ff-text)]">
              Kategória
              <select name="category" className="ff-select mt-2 w-full rounded-[18px] px-4 py-3">
                <option>családi</option>
                <option>sport</option>
                <option>óvoda/iskola</option>
                <option>házimunka</option>
                <option>szabadidő</option>
                <option>egyéb</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-[var(--ff-text)]">
              Kinti / benti
              <select name="indoorOutdoor" className="ff-select mt-2 w-full rounded-[18px] px-4 py-3">
                <option value="kinti">Kinti</option>
                <option value="benti">Benti</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-[var(--ff-text)]">
              Résztvevők
              <input name="participants" defaultValue="A,N" className="ff-input mt-2 w-full rounded-[18px] px-4 py-3" placeholder="A, N, B" />
            </label>
            <label className="text-sm font-semibold text-[var(--ff-text)]">
              Emlékeztető
              <input name="reminder" className="ff-input mt-2 w-full rounded-[18px] px-4 py-3" placeholder="Mit hozzunk?" />
            </label>
            <label className="col-span-2 text-sm font-semibold text-[var(--ff-text)]">
              Jegyzet
              <textarea name="notes" rows={3} className="ff-input mt-2 w-full rounded-[18px] px-4 py-3" placeholder="Extra részletek" />
            </label>
            <div className="col-span-2 flex flex-wrap gap-2">
              {(Object.keys(PROGRAM_PRESETS) as Array<keyof typeof PROGRAM_PRESETS>).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyProgramPreset(preset)}
                  className="ff-chip rounded-full px-3 py-2 text-[12px] font-semibold text-[var(--ff-text-muted)]"
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAddProgram(false)} className="ff-button-secondary px-5 py-3 text-sm font-bold">
                Mégse
              </button>
              <button type="submit" className="ff-button-primary px-5 py-3 text-sm font-bold">
                Mentés
              </button>
            </div>
          </form>
        </Overlay>
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
            <button onClick={() => setToast("Szerkesztés később bővíthető.")} className="ff-button-secondary px-5 py-3 text-sm font-bold">Szerkesztés</button>
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
