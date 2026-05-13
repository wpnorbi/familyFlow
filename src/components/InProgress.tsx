import MobileBottomNav from "@/components/MobileBottomNav";

interface InProgressProps {
  title: string;
  icon: string;
  description?: string;
}

export default function InProgress({
  title,
  icon,
  description = "Ez a szekció hamarosan elérhető lesz.",
}: InProgressProps) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 p-6 pb-32 md:p-8 lg:p-10">
        <div className="flex items-center gap-4">
          <div className="ff-glass-card flex h-12 w-12 items-center justify-center rounded-[var(--ff-radius-md)] text-[var(--ff-primary)]">
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--ff-text)] md:text-3xl">{title}</h1>
        </div>

        <div className="flex min-h-[60vh] flex-1 items-center justify-center">
          <div className="ff-glass-card-warm mx-auto max-w-xl rounded-[var(--ff-radius-xl)] px-8 py-10 text-center">
            <div className="ff-glass-card mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[30px] text-[var(--ff-caramel-strong)]">
              <span
                className="material-symbols-outlined text-5xl"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
              >
                {icon}
              </span>
            </div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[rgba(255,240,227,0.74)] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--ff-caramel-strong)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--ff-caramel)]"></span>
              Folyamatban
            </div>

            <h2 className="mb-3 text-2xl font-semibold text-[var(--ff-text)]">{title}</h2>
            <p className="leading-relaxed text-[var(--ff-text-muted)]">{description}</p>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--ff-text-muted)]">
              A vizuális rendszer már készen áll hozzá: amint ez a modul elkészül, ugyanabba a meleg, üveges Family Flow környezetbe illeszkedik.
            </p>

            <div className="mt-10 flex items-center justify-center gap-2 text-sm text-[var(--ff-text-soft)]">
              <span className="material-symbols-outlined text-[18px]">construction</span>
              <span>A fejlesztés aktívan zajlik</span>
            </div>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </>
  );
}
