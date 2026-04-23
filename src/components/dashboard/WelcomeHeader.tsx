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
    <div className="flex items-center justify-between w-full">
      <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2">
        {greeting}, Nexus
        <span className="text-outline/40 font-light">—</span>
        <span className="text-outline font-medium">
          {dayName}, {month} {day}.
        </span>
      </h2>

      <div className="hidden md:flex items-center gap-2">
        <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors ambient-shadow cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>
        <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors ambient-shadow cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
        <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-error hover:bg-error-container transition-colors ambient-shadow cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </div>
  );
}
