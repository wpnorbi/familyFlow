"use client";

import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGreetingHeader from "@/components/mobile/MobileGreetingHeader";

const FILTERS = ["Összes", "Száraz", "Hűtött", "Fagyasztott"] as const;
const ITEMS = [
  { name: "Spagetti", amount: "500 g", emoji: "🍝" },
  { name: "Paradicsomszósz", amount: "1 üveg", emoji: "🍅" },
  { name: "Répa", amount: "5 db", emoji: "🥕" },
  { name: "Tojás", amount: "6 db", emoji: "🥚" },
  { name: "Tej", amount: "1 l", emoji: "🥛" },
  { name: "Csirkemell", amount: "2 db", emoji: "🍗" },
];

export default function KamraMobileView() {
  return (
    <div className="relative min-h-screen bg-[var(--ff-bg)] md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,249,237,0.98),transparent_24%),radial-gradient(circle_at_top_right,rgba(238,243,231,0.82),transparent_30%),linear-gradient(180deg,#fffdf8_0%,#f8f2e8_100%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[430px] flex-col px-4 pb-32 pt-4">
        <MobileGreetingHeader showSearch />

        <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
          {FILTERS.map((filter, index) => (
            <button
              key={filter}
              className={`shrink-0 rounded-full px-7 py-3 text-[15px] font-semibold ${
                index === 0
                  ? "bg-[linear-gradient(145deg,rgba(153,165,99,0.98),rgba(129,145,79,0.98))] text-[var(--ff-text-inverse)] shadow-[0_16px_28px_-18px_rgba(61,49,34,0.24)]"
                  : "border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.88)] text-[var(--ff-text)]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <section className="grid grid-cols-3 gap-3.5">
          {ITEMS.map((item) => (
            <div key={item.name} className="rounded-[30px] border border-white/84 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(255,248,235,0.94))] px-3 py-5 text-center shadow-[0_22px_40px_-28px_rgba(61,49,34,0.2)]">
              <div className="mb-4 flex h-[108px] items-center justify-center text-[56px]">{item.emoji}</div>
              <h3 className="text-[14px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">{item.name}</h3>
              <p className="mt-1 text-[13px] text-[var(--ff-text-muted)]">{item.amount}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 flex items-center justify-between rounded-[32px] border border-white/84 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(246,248,236,0.92))] px-4 py-5 shadow-[0_22px_40px_-28px_rgba(61,49,34,0.2)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(221,230,211,0.86)] text-[var(--ff-primary)]">
              <span className="material-symbols-outlined text-[24px]">eco</span>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--ff-text)]">Kamra állapota</h3>
              <p className="mt-1 text-[15px] font-medium text-[var(--ff-primary-soft)]">Minden rendben</p>
              <p className="mt-0.5 text-[13px] text-[var(--ff-text-muted)]">Szépen feltöltve vagy!</p>
            </div>
          </div>

          <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full bg-[conic-gradient(from_220deg,rgba(132,153,79,0.98)_0_85%,rgba(221,230,211,0.72)_85%_100%)] p-[6px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[rgba(255,251,244,0.96)] text-[18px] font-semibold text-[var(--ff-text)]">
              85%
            </div>
          </div>
        </section>

        <button className="mt-6 flex items-center justify-between rounded-[999px] bg-[linear-gradient(145deg,rgba(185,198,141,0.98),rgba(152,169,102,0.98))] px-6 py-5 text-[var(--ff-text-inverse)] shadow-[0_22px_40px_-24px_rgba(61,49,34,0.24)]">
          <span className="flex items-center gap-3 text-[17px] font-semibold">
            <span className="material-symbols-outlined text-[28px]">lightbulb</span>
            Kamra ötletek
          </span>
          <span className="material-symbols-outlined text-[24px]">chevron_right</span>
        </button>
      </main>

      <MobileBottomNav />
    </div>
  );
}
