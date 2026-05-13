import Link from "next/link";

interface Props {
  nextProgram: {
    title: string;
    label: string;
    time: string;
    icon: string;
  } | null;
}

export default function WeekendCard({ nextProgram }: Props) {
  if (nextProgram) {
    return (
      <div className="ff-glass-card-warm relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden rounded-[var(--ff-radius-xl)] p-6">
        <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 translate-x-1/3 translate-y-1/3 rounded-full bg-[rgba(230,168,121,0.24)] blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(185,130,71,0.16)] bg-[rgba(255,240,227,0.7)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ff-caramel-strong)]">
            <span className="material-symbols-outlined text-[14px]">{nextProgram.icon}</span>
            Következő program
          </div>
          <h3 className="mt-4 text-[28px] font-semibold tracking-tight text-[var(--ff-text)]">{nextProgram.title}</h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--ff-text-muted)]">
            A következő családi program már a naptárban van. Innen gyorsan tovább tudsz lépni a teljes heti nézetre.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="ff-chip px-3 py-1.5 text-sm font-semibold text-[var(--ff-text)] shadow-sm">
              {nextProgram.label}
            </span>
            <span className="ff-chip px-3 py-1.5 text-sm font-medium">
              {nextProgram.time}
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-6 flex items-center gap-3">
          <Link
            href="/programok"
            className="ff-button-warm inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors hover:brightness-[1.03]"
          >
            <span className="material-symbols-outlined text-[18px]">event_available</span>
            Program megnyitása
          </Link>
          <Link
            href="/programok"
            className="ff-button-secondary inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors hover:bg-[rgba(255,240,227,0.72)]"
          >
            Hétvége szerkesztése
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-glass-card-warm relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden rounded-[var(--ff-radius-xl)] p-6">
      <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 translate-x-1/3 translate-y-1/3 rounded-full bg-[rgba(230,168,121,0.22)] blur-3xl" />
      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(185,130,71,0.16)] bg-[rgba(255,240,227,0.72)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ff-caramel-strong)]">
            <span className="material-symbols-outlined text-[14px]">event</span>
            Hétvégi program
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--ff-radius-md)] bg-[var(--ff-peach-light)] text-[var(--ff-caramel-strong)] shadow-[var(--ff-shadow-soft)]">
            <span className="material-symbols-outlined text-[24px]">hiking</span>
          </div>
        </div>
        <h3 className="text-[30px] font-semibold tracking-tight text-[var(--ff-text)]">Még üres a hétvége</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--ff-text-muted)]">
          Adj hozzá egy közös programot, hogy legyen mit várni.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {["Rövid kiruccanás", "Családi program", "Benti terv esőre"].map((hint) => (
            <span
              key={hint}
              className="ff-chip px-3 py-1.5 text-xs font-medium text-[var(--ff-caramel-strong)]"
            >
              {hint}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/programok"
          className="ff-button-warm inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors hover:brightness-[1.03]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Program hozzáadása
        </Link>
        <Link
          href="/programok"
          className="ff-button-secondary inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors hover:bg-[rgba(255,240,227,0.72)]"
        >
          Hétvégi ötletek
        </Link>
      </div>
    </div>
  );
}
