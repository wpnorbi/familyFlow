import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import DailyPulse from "@/components/dashboard/DailyPulse";
import DashboardMeals from "@/components/dashboard/DashboardMeals";

export const metadata = {
  title: "Irányítópult — CsaládiNexus",
};

export default function IranyitopultPage() {
  return (
    <>
      <header className="flex justify-between items-center w-full px-6 h-14 sticky top-0 z-40 bg-white/70 backdrop-blur-md shadow-[0_4px_20px_rgb(74,93,78,0.05)] md:hidden">
        <h1 className="text-lg font-bold text-primary-container tracking-tight">
          CsaládiNexus
        </h1>
        <div className="flex gap-2">
          <button className="text-on-surface-variant hover:bg-stone-100/50 p-2 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 py-4 md:py-5 max-w-[1400px] mx-auto w-full flex flex-col gap-5">
        <WelcomeHeader />
        <DailyPulse />
        <DashboardMeals />
      </div>
    </>
  );
}
