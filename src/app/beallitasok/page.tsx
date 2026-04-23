import ScheduleEditor from "@/components/beallitasok/ScheduleEditor";

export const metadata = { title: "Beállítások — CsaládiNexus" };

export default function BeallitasokPage() {
  return (
    <div className="px-4 md:px-6 lg:px-8 py-4 md:py-5 max-w-[1400px] mx-auto w-full flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Beállítások</h1>
        </div>
        <p className="text-sm text-outline pl-[52px]">
          Személyre szabhatod a család menetrendjét és az alkalmazás működését.
        </p>
      </header>

      <hr className="border-surface-variant/60" />

      <ScheduleEditor />
    </div>
  );
}
