import InProgress from "@/components/InProgress";

export const metadata = { title: "Kamra — CsaládiNexus" };

export default function KamraPage() {
  return (
    <InProgress
      title="Kamrakészlet"
      icon="inventory_2"
      description="Lejáratok figyelése, készletszintek, vonalkód-olvasás és maradékkezelés — hamarosan elérhető."
    />
  );
}
