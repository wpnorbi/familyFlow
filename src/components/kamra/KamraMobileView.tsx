"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MobileBottomNav from "@/components/MobileBottomNav";

// ─── Data ─────────────────────────────────────────────────────────────────────

type ItemStatus = "ok" | "low" | "out";
type FilterId = "osszes" | "szaraz" | "hutott" | "fagyaszto";

interface PantryItem {
  id: string;
  name: string;
  amount: string;
  emoji: string;
  status: ItemStatus;
}

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "osszes",     label: "Összes"    },
  { id: "szaraz",     label: "Száraz"    },
  { id: "hutott",     label: "Hűtött"    },
  { id: "fagyaszto",  label: "Fagyasztó" },
];

const ALL_ITEMS: PantryItem[] = [
  { id: "1", name: "Paradicsom",  amount: "1 üveg", emoji: "🍅", status: "ok"  },
  { id: "2", name: "Spagetti",    amount: "500 g",  emoji: "🍝", status: "ok"  },
  { id: "3", name: "Répa",        amount: "5 db",   emoji: "🥕", status: "ok"  },
  { id: "4", name: "Tojás",       amount: "6 db",   emoji: "🥚", status: "low" },
  { id: "5", name: "Tej",         amount: "1 l",    emoji: "🥛", status: "ok"  },
  { id: "6", name: "Csirkemell",  amount: "2 db",   emoji: "🍗", status: "low" },
  { id: "7", name: "Liszt",       amount: "1 kg",   emoji: "🌾", status: "ok"  },
  { id: "8", name: "Olívaolaj",   amount: "500 ml", emoji: "🫒", status: "ok"  },
  { id: "9", name: "Fokhagyma",   amount: "1 fej",  emoji: "🧄", status: "ok"  },
  { id: "10",name: "Sajt",        amount: "200 g",  emoji: "🧀", status: "low" },
  { id: "11",name: "Rizs",        amount: "500 g",  emoji: "🍚", status: "ok"  },
  { id: "12",name: "Vaj",         amount: "125 g",  emoji: "🧈", status: "ok"  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ItemStatus }) {
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F0E0] px-2.5 py-1 text-[11px] font-semibold text-[#3B5C33]">
        Van otthon
        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
      </span>
    );
  }
  if (status === "low") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF3E0] px-2.5 py-1 text-[11px] font-semibold text-[#B87040]">
        Kevés
        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FDE8E8] px-2.5 py-1 text-[11px] font-semibold text-[#C0392B]">
      Elfogyott
    </span>
  );
}

function PantryCard({ item }: { item: PantryItem }) {
  return (
    <div className="rounded-[20px] bg-white p-3.5 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#F5F0E8] text-[32px]">
          {item.emoji}
        </div>
        <button className="text-[#9A8E82]">
          <span className="material-symbols-outlined text-[18px]">more_vert</span>
        </button>
      </div>
      <h4 className="mt-2.5 text-[14px] font-semibold text-[#1C1916]">{item.name}</h4>
      <p className="mt-0.5 text-[12px] text-[#9A8E82]">{item.amount}</p>
      <div className="mt-2">
        <StatusBadge status={item.status} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function KamraMobileView() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterId>("osszes");
  const [showReminder, setShowReminder] = useState(true);

  const items = ALL_ITEMS;
  const pantryStatus = 85;

  return (
    <div className="relative min-h-screen bg-[#F7F3EE] md:hidden">
      <main
        className="flex min-h-screen flex-col px-4 pt-5"
        style={{ paddingBottom: "calc(120px + env(safe-area-inset-bottom, 0px))" }}
      >

        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3B5C33] text-[14px] font-bold text-white">
            N
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-bold text-[#1C1916]">Jó napot, Norbi!</h1>
            <p className="text-[12px] text-[#9A8E82]">Kezdjünk valami finomat.</p>
          </div>
          <div className="flex items-center gap-2">
            {["search", "notifications", "settings"].map((icon) => (
              <button
                key={icon}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.08)]"
              >
                <span className="material-symbols-outlined text-[20px] text-[#5A4E44]">{icon}</span>
              </button>
            ))}
          </div>
        </header>

        {/* ── Filter tabs ──────────────────────────────────────────── */}
        <div className="mb-5 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
                activeFilter === f.id
                  ? "bg-[#3B5C33] text-white shadow-[0_4px_12px_rgba(59,92,51,0.28)]"
                  : "bg-white text-[#5A4E44] shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Quick action cards ───────────────────────────────────── */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <button className="flex items-center justify-between rounded-[20px] bg-white p-4 text-left shadow-[0_1px_8px_rgba(0,0,0,0.06)] active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#E8EEE0]">
                <span className="material-symbols-outlined text-[22px] text-[#3B5C33]">barcode_scanner</span>
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#1C1916]">Vonalkód</p>
                <p className="text-[13px] font-bold text-[#1C1916]">beolvasása</p>
                <p className="mt-1 text-[11px] text-[#9A8E82]">Termék gyors hozzáadása</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#9A8E82]">chevron_right</span>
          </button>

          <button className="flex items-center justify-between rounded-[20px] bg-white p-4 text-left shadow-[0_1px_8px_rgba(0,0,0,0.06)] active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#F5E8DC]">
                <span className="material-symbols-outlined text-[22px] text-[#B87040]">autorenew</span>
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#1C1916]">Kamra</p>
                <p className="text-[13px] font-bold text-[#1C1916]">frissítése</p>
                <p className="mt-1 text-[11px] text-[#9A8E82]">Készleted naprakészen tartása</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#9A8E82]">chevron_right</span>
          </button>
        </div>

        {/* ── Kamra állapota ───────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between rounded-[20px] bg-white p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F0E0]">
              <span className="material-symbols-outlined text-[22px] text-[#3B5C33]">eco</span>
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1C1916]">Kamra állapota</h3>
              <p className="mt-0.5 text-[13px] font-semibold text-[#3B5C33]">Minden rendben</p>
              <p className="mt-0.5 text-[11px] text-[#9A8E82]">Szépen feltöltve vagy!</p>
              <p className="text-[11px] text-[#9A8E82]">Jó úton haladsz.</p>
            </div>
          </div>

          {/* Circular progress */}
          <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="30" stroke="#E8EEE0" strokeWidth="6" />
              <circle
                cx="36" cy="36" r="30"
                stroke="#3B5C33"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - pantryStatus / 100)}`}
                transform="rotate(-90 36 36)"
              />
            </svg>
            <div className="text-center">
              <p className="text-[16px] font-bold text-[#1C1916]">{pantryStatus}%</p>
              <p className="text-[9px] text-[#9A8E82]">Jó állapot</p>
            </div>
          </div>
        </div>

        {/* ── Emlékeztető banner ───────────────────────────────────── */}
        {showReminder && (
          <div className="mb-5 flex items-start gap-3 rounded-[20px] bg-white p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF3E0]">
              <span className="material-symbols-outlined text-[20px] text-[#B87040]">shopping_basket</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#B87040]">Emlékeztető</p>
              <p className="mt-0.5 text-[13px] font-semibold leading-snug text-[#1C1916]">
                Csütörtöki bevásárlás előtt frissítsd a kamrát.
              </p>
              <p className="mt-0.5 text-[12px] text-[#9A8E82]">Így elkerülheted a felesleges vásárlást.</p>
            </div>
            <button
              onClick={() => setShowReminder(false)}
              className="mt-0.5 shrink-0 text-[#9A8E82]"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* ── Hozzávalók grid ──────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-[#1C1916]">
              Hozzávalók ({items.length})
            </h2>
            <button className="flex items-center gap-1 text-[12px] text-[#9A8E82]">
              Alacsony készlet előre
              <span className="material-symbols-outlined text-[16px]">swap_vert</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <PantryCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </main>

      {/* ── Sticky bottom CTA ─────────────────────────────────────── */}
      <div
        className="fixed inset-x-4 z-40"
        style={{ bottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          onClick={() => router.push("/etkezes")}
          className="flex w-full items-center justify-between rounded-full bg-[#3B5C33] px-5 py-4 shadow-[0_8px_24px_rgba(59,92,51,0.36)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.18)]">
              <span className="material-symbols-outlined text-[20px] text-white">lightbulb</span>
            </div>
            <div className="text-left">
              <p className="text-[15px] font-bold text-white">Kamra ötletek</p>
              <p className="text-[11px] text-[rgba(255,255,255,0.72)]">Receptek a meglévő hozzávalóidból</p>
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.18)]">
            <span className="material-symbols-outlined text-[20px] text-white">chevron_right</span>
          </div>
        </button>
      </div>

      <MobileBottomNav />
    </div>
  );
}
