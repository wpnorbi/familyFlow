import Link from "next/link";

interface Props {
  upcomingMeals: { label: string; meal: string }[];
}

export default function MealsStrip({ upcomingMeals }: Props) {
  // --- Üres állapot ---
  if (upcomingMeals.length === 0) {
    return (
      <div className="w-full flex items-center justify-between gap-4 p-4 pl-5 rounded-[2rem] bg-surface border border-dashed border-surface-variant ambient-shadow">
        <div className="flex items-center gap-3 text-outline">
          <span className="material-symbols-outlined text-[20px]">event_busy</span>
          <span className="text-sm font-medium">Ezen a héten még nincs tervezett étkezés</span>
        </div>
        <Link
          href="/etkezes"
          className="px-4 py-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 mr-2 whitespace-nowrap shrink-0"
        >
          Tervezés most
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    );
  }

  // --- Feltöltött állapot ---
  return (
    <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4 p-2 pl-4 rounded-[2rem] bg-surface border border-surface-variant/50 ambient-shadow">
      <div className="flex flex-wrap items-center gap-2">
        {upcomingMeals.map(({ label, meal }) => (
          <div
            key={label}
            className="px-4 py-2 bg-surface-container-low rounded-full flex items-center gap-2 border border-surface-variant/30 hover:bg-surface-variant/50 cursor-pointer transition-colors"
          >
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
              {label}
            </span>
            <span className="text-sm font-bold text-on-surface">— {meal}</span>
          </div>
        ))}
      </div>

      <Link
        href="/etkezes"
        className="px-4 py-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 mr-2 whitespace-nowrap shrink-0"
      >
        Teljes heti terv
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </Link>
    </div>
  );
}
