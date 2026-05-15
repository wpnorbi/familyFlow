"use client";

import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import { useSchedule } from "@/hooks/useSchedule";
import { DAY_NAMES, getTodayDayIndex } from "@/lib/schedule-store";

const HERO_DAYS: Array<{ short: string; day: number; month: string; active?: boolean }> = [
  { short: "Hét", day: 12, month: "Máj" },
  { short: "Ked", day: 13, month: "Máj" },
  { short: "Sze", day: 14, month: "Máj", active: true },
  { short: "Csü", day: 15, month: "Máj" },
  { short: "Pén", day: 16, month: "Máj" },
  { short: "Szo", day: 17, month: "Máj" },
  { short: "Vas", day: 18, month: "Máj" },
] as const;

const UPCOMING_PROGRAMS = [
  { day: "MÁJ 14", weekday: "Sze", title: "Piacozás a városban", place: "Szombathelyi Piac", time: "09:00 – 11:00", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80" },
  { day: "MÁJ 16", weekday: "Pén", title: "Foci torna", place: "Városi Sportpálya", time: "16:00 – 18:00", image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=900&q=80" },
  { day: "MÁJ 17", weekday: "Szo", title: "Családi piknik", place: "Csónakázó-tó", time: "11:30 – 15:00", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80" },
  { day: "MÁJ 18", weekday: "Vas", title: "Kézműves délelőtt", place: "Otthon", time: "10:00 – 12:00", image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80" },
] as const;

const WEEKEND_IDEAS = [
  { title: "Piknik a szabadban", copy: "Csomagoljunk be és élvezzük a természetet.", tag: "Szabadtéri", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80" },
  { title: "Játszótér kaland", copy: "Mozgás, nevetés, közös élmények.", tag: "Aktív", image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=80" },
  { title: "Állatkerti látogatás", copy: "Felfedezés és tanulás az állatok világáról.", tag: "Kulturális", image: "https://images.unsplash.com/photo-1501706362039-c6e80948bb81?auto=format&fit=crop&w=900&q=80" },
] as const;

const FEATURED_PROGRAMS = [
  { title: "Családi piknik", copy: "Tökéletes egy nap a szabadban.", tag: "Szabadtéri", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80" },
  { title: "Játszótér nap", copy: "Mozgás és móka kicsiknek.", tag: "Aktív", image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=80" },
  { title: "Állatkerti felfedező túra", copy: "Ismerjük meg együtt az állatokat.", tag: "Kulturális", image: "https://images.unsplash.com/photo-1501706362039-c6e80948bb81?auto=format&fit=crop&w=900&q=80" },
  { title: "Benti kreatív délután", copy: "Alkotás, játék, fantázia.", tag: "Otthoni", image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80" },
  { title: "Közös sütés-főzés", copy: "Finom ételek, szép emlékek.", tag: "Otthoni", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80" },
] as const;

const REMINDERS = [
  "Bence sporttáska készítése",
  "Anna rajzfelszerelés ellenőrzése",
  "Piknik takaró behelyezése az autóba",
  "Esőkabát a hétvégére",
] as const;

function formatScheduleTime(time?: string, endTime?: string) {
  if (!time) return "";
  return endTime ? `${time} – ${endTime}` : time;
}

export default function ProgramokDesktopView() {
  const { schedule, hydrated } = useSchedule();
  const todayIndex = getTodayDayIndex();
  const todayEvents = hydrated ? (schedule[todayIndex] ?? []) : [];

  return (
    <div className="mx-auto hidden w-full max-w-[1600px] flex-col gap-5 px-4 py-4 md:flex md:px-6 md:py-5 lg:px-8">
      <WelcomeHeader />

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,251,244,0.98),rgba(246,228,203,0.72))] p-6 shadow-[0_26px_70px_-34px_rgba(61,49,34,0.24)]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url(https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80)" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(41,34,19,0.72),rgba(41,34,19,0.18))]" />

            <div className="relative">
              <h1 className="text-[56px] font-semibold leading-none tracking-[-0.06em] text-[var(--ff-text-inverse)]">Programok</h1>
              <p className="mt-3 text-[20px] text-[rgba(255,249,237,0.92)]">Tervezzünk együtt, több idő jut egymásra.</p>

              <div className="mt-8 flex items-center gap-4">
                <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/92 text-[var(--ff-caramel-strong)] shadow-[0_18px_28px_-18px_rgba(61,49,34,0.28)]">
                  <span className="material-symbols-outlined text-[28px]">arrow_back</span>
                </button>

                <div className="grid flex-1 grid-cols-7 gap-3 rounded-[24px] border border-white/70 bg-[rgba(255,251,244,0.94)] px-5 py-4 shadow-[0_18px_40px_-24px_rgba(61,49,34,0.18)]">
                  {HERO_DAYS.map((item) => (
                    <div
                      key={`${item.short}-${item.day}`}
                      className={`rounded-[18px] px-3 py-2 text-center ${
                        item.active
                          ? "bg-[linear-gradient(145deg,#e7a250,#d98b3c)] text-[var(--ff-text-inverse)] shadow-[0_18px_26px_-18px_rgba(185,130,71,0.38)]"
                          : "text-[var(--ff-text)]"
                      }`}
                    >
                      <p className="text-[13px] font-bold uppercase tracking-[0.08em]">{item.short}</p>
                      <p className="mt-2 text-[34px] font-semibold leading-none">{item.day}</p>
                      <p className="mt-1 text-[15px]">{item.month}</p>
                    </div>
                  ))}
                </div>

                <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/92 text-[var(--ff-caramel-strong)] shadow-[0_18px_28px_-18px_rgba(61,49,34,0.28)]">
                  <span className="material-symbols-outlined text-[28px]">arrow_forward</span>
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="flex items-center gap-4 rounded-full bg-[linear-gradient(135deg,#e7a250,#d98b3c)] px-7 py-4 text-[18px] font-semibold text-[var(--ff-text-inverse)] shadow-[0_20px_32px_-20px_rgba(185,130,71,0.42)]">
                  <span>Program hozzáadása</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--ff-caramel-strong)]">
                    <span className="material-symbols-outlined text-[28px]">add</span>
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-[1.05fr_0.95fr] gap-5">
            <div className="ff-glass-card rounded-[32px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Következő programok</h2>
                <button className="flex items-center gap-2 text-[15px] font-medium text-[var(--ff-text-muted)]">
                  Összes megtekintése
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>

              <div className="space-y-3">
                {UPCOMING_PROGRAMS.map((item) => (
                  <div key={item.title} className="grid grid-cols-[70px_160px_minmax(0,1fr)_90px_42px] items-center gap-4 rounded-[24px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.84)] px-4 py-3">
                    <div className="text-center text-[var(--ff-primary-soft)]">
                      <p className="text-[12px] font-bold uppercase tracking-[0.12em]">{item.day}</p>
                      <p className="mt-1 text-[14px] font-medium">{item.weekday}</p>
                    </div>
                    <div className="h-20 overflow-hidden rounded-[18px]">
                      <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[16px] font-semibold text-[var(--ff-text)]">{item.title}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--ff-text-muted)]">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {item.place}
                      </p>
                    </div>
                    <p className="text-right text-[15px] font-medium text-[var(--ff-text-muted)]">{item.time}</p>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(246,248,236,0.92)] text-[var(--ff-primary-soft)]">
                      <span className="material-symbols-outlined text-[20px]">group</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ff-glass-card rounded-[32px] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Hétvégi ötletek</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {WEEKEND_IDEAS.map((item) => (
                  <article key={item.title} className="overflow-hidden rounded-[24px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.84)]">
                    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                    <div className="px-4 py-4">
                      <h3 className="text-[16px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">{item.title}</h3>
                      <p className="mt-2 min-h-[52px] text-[13px] leading-relaxed text-[var(--ff-text-muted)]">{item.copy}</p>
                      <div className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[var(--ff-primary-soft)]">
                        <span className="material-symbols-outlined text-[18px]">{item.tag === "Aktív" ? "wb_sunny" : "eco"}</span>
                        {item.tag}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <button className="mt-4 flex items-center gap-2 text-[15px] font-medium text-[var(--ff-primary-soft)]">
                További ötletek
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </section>

          <section className="ff-glass-card rounded-[32px] p-5">
            <h2 className="mb-4 text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Kiemelt családi programok</h2>
            <div className="grid grid-cols-5 gap-4">
              {FEATURED_PROGRAMS.map((item) => (
                <article key={item.title} className="overflow-hidden rounded-[24px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.84)]">
                  <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                  <div className="px-4 py-4">
                    <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">{item.title}</h3>
                    <p className="mt-2 min-h-[42px] text-[13px] leading-relaxed text-[var(--ff-text-muted)]">{item.copy}</p>
                    <div className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[var(--ff-primary-soft)]">
                      <span className="material-symbols-outlined text-[18px]">{item.tag === "Aktív" ? "wb_sunny" : item.tag === "Kulturális" ? "eco" : "home"}</span>
                      {item.tag}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="ff-glass-card rounded-[32px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(246,248,236,0.96)] text-[var(--ff-primary-soft)]">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Mai napirend</h2>
            </div>
            <div className="space-y-4">
              {todayEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="grid grid-cols-[60px_10px_minmax(0,1fr)_36px] items-center gap-3">
                  <span className="text-[15px] font-semibold text-[var(--ff-text)]">{formatScheduleTime(event.startTime ?? event.time, event.endTime)}</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--ff-primary-soft)]" />
                  <span className="truncate text-[15px] text-[var(--ff-text-muted)]">{event.label}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,251,244,0.9)] text-[var(--ff-primary-soft)]">
                    <span className="material-symbols-outlined text-[19px]">group</span>
                  </div>
                </div>
              ))}
              {!todayEvents.length && (
                <p className="text-sm text-[var(--ff-text-soft)]">{DAY_NAMES[todayIndex]} napra még nincs menetrendi esemény.</p>
              )}
            </div>
            <button className="mt-5 flex items-center gap-2 rounded-full bg-[rgba(255,251,244,0.92)] px-4 py-3 text-[15px] font-semibold text-[var(--ff-primary-soft)]">
              Teljes napirend
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </section>

          <section className="ff-glass-card rounded-[32px] p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(246,248,236,0.96)] text-[var(--ff-primary-soft)]">
                <span className="material-symbols-outlined text-[22px]">notifications_active</span>
              </div>
              <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Gyors emlékeztetők</h2>
            </div>
            <div className="space-y-4">
              {REMINDERS.map((item, index) => (
                <div key={item} className={`flex items-center gap-3 pb-3 ${index < REMINDERS.length - 1 ? "border-b border-[rgba(74,67,54,0.08)]" : ""}`}>
                  <div className={`h-6 w-6 rounded-full border-2 ${index === 0 ? "border-[var(--ff-primary-soft)] bg-[rgba(124,145,111,0.16)]" : "border-[rgba(74,67,54,0.18)]"}`} />
                  <span className="text-[15px] text-[var(--ff-text-muted)]">{item}</span>
                </div>
              ))}
            </div>
            <button className="mt-5 flex items-center gap-2 rounded-full bg-[rgba(255,251,244,0.92)] px-4 py-3 text-[15px] font-semibold text-[var(--ff-primary-soft)]">
              Új emlékeztető hozzáadása
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
