"use client";

import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGreetingHeader from "@/components/mobile/MobileGreetingHeader";

const DAYS = [
  { short: "H", day: "20", active: false },
  { short: "K", day: "21", active: true },
  { short: "Sz", day: "22", active: false },
  { short: "Cs", day: "23", active: false },
  { short: "P", day: "24", active: false },
  { short: "Sz", day: "25", active: false },
  { short: "V", day: "26", active: false },
];

const TODAY_PROGRAMS = [
  { time: "08:30", icon: "self_improvement", title: "Jóga óra", meta: "Sport • 60 perc", people: ["A", "N", "B"] },
  { time: "14:00", icon: "sports_soccer", title: "Bence fociedzése", meta: "Sport • 90 perc", people: ["B", "N"] },
  { time: "17:30", icon: "shopping_cart", title: "Bevásárlás", meta: "Feladat • 45 perc", people: ["N"] },
  { time: "19:00", icon: "restaurant", title: "Családi vacsora", meta: "Család • 60 perc", people: ["A", "N", "B"] },
];

export default function ProgramokMobileView() {
  return (
    <div className="relative min-h-screen bg-[var(--ff-bg)] md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,249,237,0.98),transparent_26%),radial-gradient(circle_at_top_right,rgba(238,243,231,0.8),transparent_28%),linear-gradient(180deg,#fffdf8_0%,#f8f2e8_100%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[430px] flex-col px-4 pb-32 pt-4">
        <MobileGreetingHeader />

        <section className="mb-4">
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Május</h2>
            <span className="material-symbols-outlined text-[22px] text-[var(--ff-text-muted)]">calendar_month</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((item) => (
              <button
                key={`${item.short}-${item.day}`}
                className={`flex flex-col items-center rounded-[24px] px-1 py-2 text-center ${
                  item.active
                    ? "bg-[linear-gradient(145deg,rgba(126,145,79,0.98),rgba(111,130,68,0.98))] text-[var(--ff-text-inverse)] shadow-[0_18px_28px_-18px_rgba(61,49,34,0.24)]"
                    : "text-[var(--ff-text)]"
                }`}
              >
                <span className="text-[12px] font-medium">{item.short}</span>
                <span className="mt-1 text-[17px] font-semibold">{item.day}</span>
                <span className={`mt-2 h-2 w-2 rounded-full ${item.active ? "bg-[rgba(255,249,237,0.92)] shadow-[0_0_0_4px_rgba(255,249,237,0.18)]" : "bg-[rgba(124,145,111,0.92)]"}`} />
              </button>
            ))}
          </div>
        </section>

        <section className="relative mb-6 overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,250,240,0.98),rgba(246,228,203,0.74))] px-5 py-4 text-[var(--ff-text-inverse)] shadow-[0_28px_60px_-28px_rgba(61,49,34,0.32)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80)" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(70,82,44,0.74),rgba(70,82,44,0.16))]" />

          <div className="relative min-h-[235px]">
            <span className="inline-flex rounded-full bg-[rgba(116,136,78,0.76)] px-3 py-1.5 text-[12px] font-semibold text-[rgba(255,249,237,0.96)]">
              Következő esemény
            </span>
            <h3 className="mt-4 max-w-[12rem] text-[27px] font-semibold leading-[1.08] tracking-[-0.04em]">Hétvégi piknik a Normafán</h3>
            <div className="mt-5 space-y-2 text-[13px] text-[rgba(255,249,237,0.96)]">
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">calendar_today</span>Május 24. (szombat)</p>
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">schedule</span>10:00 – 15:00</p>
            </div>
            <button className="absolute bottom-1 right-1 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--ff-primary)] shadow-[0_18px_28px_-18px_rgba(61,49,34,0.28)]">
              <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Mai programok</h2>
          <div className="relative pl-5">
            <div className="absolute left-[9px] top-5 bottom-5 w-px border-l border-dashed border-[rgba(124,145,111,0.28)]" />

            <div className="flex flex-col gap-4">
              {TODAY_PROGRAMS.map((item, index) => (
                <div key={item.time} className="relative flex items-center gap-3">
                  <div className={`absolute left-[-20px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full border-2 ${index === 0 ? "border-[var(--ff-primary)] bg-[rgba(124,145,111,0.18)]" : "border-[rgba(124,145,111,0.9)] bg-[var(--ff-bg-cream)]"}`} />
                  <div className="w-[58px] shrink-0 text-[16px] font-semibold text-[var(--ff-text)]">{item.time}</div>
                  <div className="flex flex-1 items-center gap-3 rounded-[28px] border border-white/86 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(255,248,235,0.94))] px-4 py-4 shadow-[0_22px_40px_-28px_rgba(61,49,34,0.2)]">
                    <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(145deg,rgba(240,245,230,0.98),rgba(255,249,237,0.9))] text-[var(--ff-primary)]">
                      <span className="material-symbols-outlined text-[28px]">{item.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[16px] font-semibold text-[var(--ff-text)]">{item.title}</h3>
                      <p className="mt-1 text-[13px] font-medium text-[var(--ff-primary-soft)]">{item.meta}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">
                        {item.people.map((person) => (
                          <div key={`${item.time}-${person}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-[linear-gradient(145deg,rgba(255,249,237,0.98),rgba(238,243,231,0.92))] text-[10px] font-bold text-[var(--ff-primary)]">
                            {person}
                          </div>
                        ))}
                      </div>
                      <span className="material-symbols-outlined text-[20px] text-[var(--ff-text-soft)]">chevron_right</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <button className="mt-7 rounded-[999px] bg-[linear-gradient(145deg,rgba(255,243,226,0.96),rgba(255,236,205,0.92))] px-5 py-[18px] text-[18px] font-semibold text-[var(--ff-caramel-strong)] shadow-[0_22px_36px_-24px_rgba(185,130,71,0.24)]">
          <span className="mr-2 text-[24px] align-middle">+</span>
          Program hozzáadása
        </button>
      </main>

      <MobileBottomNav />
    </div>
  );
}
