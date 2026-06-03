"use client";

import Link from "next/link";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGreetingHeader from "@/components/mobile/MobileGreetingHeader";

const WEATHER_DAYS = [
  { label: "Ma", icon: "partly_cloudy_day", high: 22, low: 10, active: true },
  { label: "Sz", icon: "cloud", high: 20, low: 9 },
  { label: "V", icon: "wb_sunny", high: 21, low: 11 },
  { label: "H", icon: "cloud", high: 19, low: 9 },
  { label: "K", icon: "rainy", high: 18, low: 8 },
  { label: "Sze", icon: "partly_cloudy_day", high: 17, low: 7 },
  { label: "Cs", icon: "wb_sunny", high: 20, low: 9 },
];

const UPCOMING_PROGRAMS = [
  {
    dateTop: "MÁJ.",
    dateNumber: "31.",
    dateBottom: "Szo",
    title: "Családi piknik",
    time: "10:00 – 14:00",
    tags: ["Kültéri", "Gyerekbarát"],
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  },
  {
    dateTop: "JÚN.",
    dateNumber: "1.",
    dateBottom: "V",
    title: "Jump Aréna",
    time: "15:00 – 17:00",
    tags: ["Beltéri", "Gyerekbarát"],
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=80",
  },
  {
    dateTop: "JÚN.",
    dateNumber: "2.",
    dateBottom: "H",
    title: "Helytörténeti múzeum",
    time: "11:00 – 12:30",
    tags: ["Beltéri", "Kulturális"],
    image: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=80",
  },
];

const WEEKEND_IDEAS = [
  {
    title: "Kirándulás a hegyekben",
    distance: "30 km tőletek",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Kajakozás a tónál",
    distance: "45 km tőletek",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Termelői piac látogatás",
    distance: "10 km tőletek",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Állatkerti kirándulás",
    distance: "25 km tőletek",
    image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=900&q=80",
  },
];

const REMINDERS = [
  { label: "Sátor és hálózsák előkészítése", date: "Máj. 30.", done: false },
  { label: "Fürdőruha és törölköző bekészítése", date: "Máj. 31.", done: false },
  { label: "Töltő és powerbank ellenőrzése", date: "Ma", done: true },
];

function Icon({ name, className = "text-[20px]" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function ProgramokMobileView() {
  return (
    <div className="relative min-h-screen bg-[var(--ff-bg)] md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,249,237,0.98),transparent_26%),radial-gradient(circle_at_top_right,rgba(238,243,231,0.8),transparent_28%),linear-gradient(180deg,#fffdf8_0%,#f8f2e8_100%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[430px] flex-col px-4 pb-32 pt-4">
        <MobileGreetingHeader />

        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.05em] text-[var(--ff-text)]">Programok</h1>

        <section className="relative mt-4 overflow-hidden rounded-[30px] border border-[rgba(170,135,84,0.14)] shadow-[0_28px_60px_-28px_rgba(36,20,6,0.42)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80)" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(34,22,10,0.78)_0%,rgba(34,22,10,0.48)_44%,rgba(34,22,10,0.18)_100%)]" />

          <div className="relative px-5 pb-5 pt-6">
            <h2 className="max-w-[220px] text-[26px] font-semibold leading-[1.05] tracking-[-0.05em] text-white">
              Készen álltok a hétvégére?
            </h2>
            <p className="mt-3 max-w-[220px] text-[15px] leading-relaxed text-[rgba(255,244,231,0.92)]">
              Tervezzetek közösen, töltsétek meg a hétvégét élményekkel.
            </p>

            <div className="mt-5 inline-flex items-center gap-3 rounded-[22px] bg-[rgba(255,251,244,0.94)] px-4 py-3 shadow-[0_18px_36px_-24px_rgba(36,20,6,0.28)]">
              <Icon name="partly_cloudy_day" className="text-[28px] text-[#f0a51f]" />
              <div>
                <p className="text-[18px] font-semibold text-[var(--ff-text)]">22°C</p>
                <p className="text-[14px] text-[var(--ff-text-soft)]">Enyhén felhős</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                href="/programok?view=planner"
                className="flex items-center justify-center gap-3 rounded-full bg-[linear-gradient(135deg,#eea433,#d6841e)] px-4 py-4 text-[18px] font-bold text-white shadow-[0_18px_36px_-20px_rgba(210,130,33,0.56)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#cf7f1e]">
                  <Icon name="add" className="text-[20px]" />
                </span>
                Program hozzáadása
              </Link>
              <Link
                href="/programok?view=ideas"
                className="flex items-center justify-center gap-3 rounded-full bg-[rgba(255,251,244,0.96)] px-4 py-4 text-[18px] font-semibold text-[var(--ff-text)]"
              >
                <Icon name="explore" className="text-[22px] text-[var(--ff-primary)]" />
                Ötletek felfedezése
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.96)] px-3 py-4 shadow-[0_18px_36px_-24px_rgba(61,49,34,0.20)]">
          <div className="grid grid-cols-7 gap-1">
            {WEATHER_DAYS.map((day) => (
              <button
                key={`${day.label}-${day.high}`}
                className={`rounded-[20px] px-1 py-3 text-center ${
                  day.active ? "bg-[rgba(233,241,220,0.94)]" : ""
                }`}
              >
                <p className="text-[14px] font-semibold text-[var(--ff-text)]">{day.label}</p>
                <Icon name={day.icon} className={`mt-2 text-[24px] ${day.icon === "wb_sunny" ? "text-[#f0a51f]" : "text-[var(--ff-text-soft)]"}`} />
                <p className="mt-1 text-[18px] font-semibold text-[var(--ff-text)]">{day.high}°</p>
                <p className="mt-1 text-[14px] text-[var(--ff-text-soft)]">{day.low}°</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Következő programjaink</h2>
            <Link href="/programok?view=list" className="flex items-center gap-1 text-[14px] font-semibold text-[var(--ff-primary)]">
              Összes megtekintése
              <Icon name="chevron_right" className="text-[18px]" />
            </Link>
          </div>

          <div className="space-y-3">
            {UPCOMING_PROGRAMS.map((item) => (
              <Link
                key={item.title}
                href="/programok?view=list"
                className="grid grid-cols-[64px_92px_minmax(0,1fr)_20px] items-center gap-3 rounded-[24px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.96)] p-3 shadow-[0_18px_36px_-24px_rgba(61,49,34,0.20)]"
              >
                <div className="text-center text-[var(--ff-text)]">
                  <p className="text-[13px] font-bold text-[var(--ff-text-soft)]">{item.dateTop}</p>
                  <p className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.05em]">{item.dateNumber}</p>
                  <p className="mt-1 text-[14px] text-[var(--ff-text-soft)]">{item.dateBottom}</p>
                </div>
                <div className="h-[78px] overflow-hidden rounded-[18px]">
                  <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-semibold leading-tight text-[var(--ff-text)]">{item.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-[14px] text-[var(--ff-text-soft)]">
                    <Icon name="schedule" className="text-[16px]" />
                    {item.time}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                          tag === "Kültéri" || tag === "Gyerekbarát"
                            ? "bg-[rgba(233,241,220,0.98)] text-[var(--ff-primary)]"
                            : "bg-[rgba(255,239,212,0.96)] text-[var(--ff-caramel-strong)]"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Icon name="chevron_right" className="text-[20px] text-[var(--ff-text-soft)]" />
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Hétvégi ötletek a családnak</h2>
            <Link href="/programok?view=ideas" className="flex items-center gap-1 text-[14px] font-semibold text-[var(--ff-primary)]">
              További ötletek
              <Icon name="chevron_right" className="text-[18px]" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {WEEKEND_IDEAS.map((item) => (
              <Link
                key={item.title}
                href="/programok?view=ideas"
                className="overflow-hidden rounded-[24px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.96)] shadow-[0_18px_36px_-24px_rgba(61,49,34,0.20)]"
              >
                <div className="h-[108px] bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                <div className="px-3 py-3">
                  <h3 className="text-[16px] font-semibold leading-tight text-[var(--ff-text)]">{item.title}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-[14px] text-[var(--ff-text-soft)]">
                    <Icon name="location_on" className="text-[16px]" />
                    {item.distance}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-[rgba(170,135,84,0.12)] bg-[rgba(255,252,245,0.96)] px-4 py-4 shadow-[0_18px_36px_-24px_rgba(61,49,34,0.20)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Gyors emlékeztetők</h2>
            <Link href="/programok?view=reminders" className="flex items-center gap-1 text-[14px] font-semibold text-[var(--ff-primary)]">
              Összes
              <Icon name="chevron_right" className="text-[18px]" />
            </Link>
          </div>

          <div className="divide-y divide-[rgba(74,67,54,0.08)]">
            {REMINDERS.map((item) => (
              <Link key={item.label} href="/programok?view=reminders" className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  item.done ? "bg-[rgba(230,241,218,0.98)] text-[var(--ff-primary)]" : "border border-[rgba(170,135,84,0.22)] bg-white text-transparent"
                }`}>
                  <Icon name={item.done ? "check" : "radio_button_unchecked"} className="text-[16px]" />
                </span>
                <span className={`flex-1 text-[16px] ${item.done ? "text-[var(--ff-text-soft)] line-through" : "text-[var(--ff-text)]"}`}>
                  {item.label}
                </span>
                <span className="flex items-center gap-1.5 text-[14px] text-[var(--ff-text-soft)]">
                  <Icon name="calendar_month" className="text-[16px]" />
                  {item.date}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
}
