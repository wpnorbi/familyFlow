import Link from "next/link";

// Nincs még program implementálva — üres állapot
export default function WeekendCard() {
  return (
    <div className="relative h-full min-h-[500px] rounded-3xl overflow-hidden ambient-shadow border border-dashed border-surface-variant flex flex-col items-center justify-center bg-gradient-to-br from-surface-container-lowest to-surface-container p-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center mb-6">
        <span
          className="material-symbols-outlined text-5xl text-outline"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 100" }}
        >
          hiking
        </span>
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-surface-variant text-[11px] font-bold text-outline uppercase tracking-widest mb-4">
        <span className="material-symbols-outlined text-[14px]">event</span>
        Hétvégi Program
      </div>
      <h3 className="text-2xl font-bold text-on-surface mb-2">Nincs program tervezve</h3>
      <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs mb-8">
        Még nem terveztél hétvégi programot. Adj hozzá egy kalandot a famíliával.
      </p>
      <Link
        href="/programok"
        className="px-6 py-3 rounded-full bg-surface-container-high text-on-surface-variant text-sm font-bold hover:bg-surface-variant transition-all border border-surface-variant flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Program hozzáadása
      </Link>
    </div>
  );
}
