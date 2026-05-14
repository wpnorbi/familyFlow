import MobileDashboardView from "@/components/dashboard/MobileDashboardView";
import DesktopDashboardView from "@/components/dashboard/DesktopDashboardView";

export const metadata = {
  title: "Irányítópult — CsaládiNexus",
};

export default function IranyitopultPage() {
  return (
    <>
      <MobileDashboardView />
      <DesktopDashboardView />
    </>
  );
}
