import BeallitasokMobileView from "@/components/beallitasok/BeallitasokMobileView";
import BeallitasokDesktopView from "@/components/beallitasok/BeallitasokDesktopView";

export const metadata = { title: "Beállítások — CsaládiNexus" };

export default function BeallitasokPage() {
  return (
    <>
      <BeallitasokMobileView />

      <BeallitasokDesktopView />
    </>
  );
}
