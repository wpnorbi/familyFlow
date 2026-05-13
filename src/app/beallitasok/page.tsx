import MobileBottomNav from "@/components/MobileBottomNav";
import ScheduleEditor from "@/components/beallitasok/ScheduleEditor";

export const metadata = { title: "Beállítások — CsaládiNexus" };

export default function BeallitasokPage() {
  return (
    <>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-4 pb-32 md:px-6 md:py-5 lg:px-8">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="ff-glass-card flex h-10 w-10 items-center justify-center rounded-[var(--ff-radius-sm)] text-[var(--ff-primary)]">
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--ff-text)]">Beállítások</h1>
          </div>
          <p className="pl-[52px] text-sm text-[var(--ff-text-muted)]">
            Személyre szabhatod a család menetrendjét és az alkalmazás működését.
          </p>
        </header>

        <hr className="border-[var(--ff-card-border)]" />

        <ScheduleEditor />

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="ff-glass-card flex items-start gap-3 rounded-[var(--ff-radius-lg)] px-5 py-4">
            <div className="ff-chip flex h-10 w-10 shrink-0 items-center justify-center text-[var(--ff-primary)]">
              <span className="material-symbols-outlined text-[18px]">info</span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">
                Menetrend használata a dashboardon
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--ff-text)]">
                A menetrend helyben tárolódik, és a dashboard napi ritmus modulja ebből dolgozik.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="ff-glass-card rounded-[var(--ff-radius-lg)] px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">
                Gyors beállítások
              </p>
              <h3 className="mt-2 text-base font-semibold text-[var(--ff-text)]">
                Napi ritmus a dashboardhoz
              </h3>
              <p className="mt-1 text-sm text-[var(--ff-text-muted)]">
                Fix eseményekkel gyorsabban megtelik az irányítópult.
              </p>
            </div>

            <div className="ff-glass-card rounded-[var(--ff-radius-lg)] px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">
                Aktív szabályok
              </p>
              <h3 className="mt-2 text-base font-semibold text-[var(--ff-text)]">
                Ismétlődések és családtagok
              </h3>
              <p className="mt-1 text-sm text-[var(--ff-text-muted)]">
                Az eseményekhez személy és ismétlődés is rendelhető.
              </p>
            </div>
          </div>
        </section>
      </div>

      <MobileBottomNav />
    </>
  );
}
