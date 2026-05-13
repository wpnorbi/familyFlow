import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import DailyPulse from "@/components/dashboard/DailyPulse";
import DashboardMeals from "@/components/dashboard/DashboardMeals";
import MobileDashboardView from "@/components/dashboard/MobileDashboardView";

export const metadata = {
  title: "Irányítópult — CsaládiNexus",
};

export default function IranyitopultPage() {
  return (
    <>
      <MobileDashboardView />

      <div className="mx-auto hidden w-full max-w-[1400px] flex-col gap-5 px-4 py-4 md:flex md:px-6 md:py-5 lg:px-8">
        <WelcomeHeader />
        <DailyPulse />
        <DashboardMeals />
      </div>
    </>
  );
}
