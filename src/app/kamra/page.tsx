import KamraDesktopView from "@/components/kamra/KamraDesktopView";
import KamraMobileView from "@/components/kamra/KamraMobileView";

export const metadata = { title: "Kamra — CsaládiNexus" };

export default function KamraPage() {
  return (
    <>
      <KamraMobileView />

      <div className="hidden md:block">
        <KamraDesktopView />
      </div>
    </>
  );
}
