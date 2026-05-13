import Link from "next/link";

interface Props {
  upcomingMeals: { label: string; meal: string }[];
}

export default function MealsStrip({ upcomingMeals }: Props) {
  if (upcomingMeals.length === 0) {
    return (
      <div className="ff-glass-card flex w-full flex-col gap-4 rounded-[var(--ff-radius-lg)] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ff-text-soft)]">Mai fókusz</p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--ff-text-muted)]">
            Válassz vacsorát, adj hozzá programot, vagy nézd meg a kamrát.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/etkezes"
            className="ff-button-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:brightness-[1.03]"
          >
            Vacsora kiválasztása
          </Link>
          <Link
            href="/programok"
            className="ff-button-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[rgba(255,240,227,0.72)]"
          >
            Program hozzáadása
          </Link>
          <Link
            href="/kamra"
            className="ff-button-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[rgba(238,243,230,0.7)]"
          >
            Kamra megnyitása
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-glass-card flex w-full flex-col gap-4 rounded-[var(--ff-radius-lg)] p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ff-text-soft)]">Következő étkezések</p>
        <div className="flex flex-wrap items-center gap-2">
        {upcomingMeals.map(({ label, meal }) => (
          <div
            key={label}
              className="ff-chip flex items-center gap-2 px-4 py-2 transition-colors hover:bg-[rgba(216,224,203,0.4)] cursor-pointer"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ff-text-soft)]">
              {label}
            </span>
            <span className="text-sm font-bold text-[var(--ff-text)]">— {meal}</span>
          </div>
        ))}
        </div>
      </div>

      <Link
        href="/etkezes"
        className="mr-2 inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-4 py-2 text-sm font-bold text-[var(--ff-primary)] transition-colors hover:text-[var(--ff-primary-strong)]"
      >
        Teljes heti terv
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </Link>
    </div>
  );
}
