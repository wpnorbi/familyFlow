"use client";

interface MobileGreetingHeaderProps {
  name?: string;
  showNotifications?: boolean;
  showSearch?: boolean;
}

function ActionButton({ icon, dot = false }: { icon: string; dot?: boolean }) {
  return (
    <button className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.88)] text-[var(--ff-text-muted)] shadow-[0_12px_24px_-18px_rgba(61,49,34,0.2)] backdrop-blur-[18px]">
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
      {dot ? <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-[var(--ff-caramel)]" /> : null}
    </button>
  );
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Jó reggelt, ${name}`;
  if (hour < 18) return `Jó napot, ${name}`;
  return `Jó estét, ${name}`;
}

export default function MobileGreetingHeader({
  name = "Norbi",
  showNotifications = true,
  showSearch = false,
}: MobileGreetingHeaderProps) {
  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="overflow-hidden rounded-full border border-white/80 shadow-[0_12px_24px_-16px_rgba(61,49,34,0.24)]">
          <div className="flex h-12 w-12 items-center justify-center bg-[linear-gradient(145deg,rgba(255,241,230,0.98),rgba(220,229,208,0.88))] text-[var(--ff-primary)]">
            <span className="text-sm font-semibold">N</span>
          </div>
        </div>
        <h1 className="text-[19px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">{getGreeting(name)}</h1>
      </div>

      <div className="flex items-center gap-2">
        {showSearch ? <ActionButton icon="search" /> : null}
        {showNotifications ? <ActionButton icon="notifications" dot /> : null}
      </div>
    </header>
  );
}
