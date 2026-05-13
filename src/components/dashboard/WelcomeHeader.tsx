import ThemeToggle from "@/components/ThemeToggle";

const DAYS_HU = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
const MONTHS_HU = [
  "jan.", "febr.", "már.", "ápr.", "máj.", "jún.",
  "júl.", "aug.", "szept.", "okt.", "nov.", "dec.",
];

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Jó reggelt";
  if (hour >= 12 && hour < 18) return "Jó napot";
  if (hour >= 18 && hour < 22) return "Jó estét";
  return "Jó éjszakát";
}

export default function WelcomeHeader() {
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dayName = DAYS_HU[now.getDay()];
  const month = MONTHS_HU[now.getMonth()];
  const day = now.getDate();

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-[22px] font-semibold tracking-tight text-[var(--ff-text)]">
          {greeting}, Nexus
        </h2>
        <p className="mt-1 text-sm text-[var(--ff-text-muted)]">
          {dayName}, {month} {day}. Ma itt látod a család ritmusát, az étkezéseket és a következő lépéseket.
        </p>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <button className="ff-icon-button flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(216,224,203,0.28)] cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>
        <ThemeToggle
          iconOnly
          className="ff-icon-button flex h-10 w-10 items-center justify-center rounded-full text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(216,224,203,0.28)] cursor-pointer"
        />
        <button className="ff-icon-button flex items-center gap-2 rounded-full px-2.5 py-2 text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(216,224,203,0.28)] cursor-pointer">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ff-primary-glass)] text-[11px] font-bold text-[var(--ff-primary)]">
            FN
          </span>
          <span className="text-sm font-medium text-[var(--ff-text)]">Profil</span>
          <span className="material-symbols-outlined text-[18px] text-[var(--ff-text-soft)]">expand_more</span>
        </button>
      </div>
    </div>
  );
}
