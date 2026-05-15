import ProgramokDesktopView from "@/components/programok/ProgramokDesktopView";
import ProgramokMobileView from "@/components/programok/ProgramokMobileView";

export const metadata = { title: "Programok — CsaládiNexus" };

export default function ProgramokPage() {
  return (
    <>
      <ProgramokMobileView />

      <div className="hidden md:block">
        <ProgramokDesktopView />
      </div>
    </>
  );
}
