"use client";

interface MobilePageHeaderProps {
  title: string;
  icon?: string;
  leftIcon?: string;
  rightIcon?: string;
  iconStyle?: "plain" | "badge";
}

function CircleButton({ icon, hidden = false }: { icon?: string; hidden?: boolean }) {
  if (hidden || !icon) {
    return <div className="h-12 w-12" aria-hidden="true" />;
  }

  return (
    <button className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.88)] text-[var(--ff-text-muted)] shadow-[0_12px_24px_-18px_rgba(61,49,34,0.2)] backdrop-blur-[18px]">
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
    </button>
  );
}

export default function MobilePageHeader({
  title,
  icon,
  leftIcon,
  rightIcon,
  iconStyle = "plain",
}: MobilePageHeaderProps) {
  return (
    <header className="pb-4">
      <div className="flex items-start justify-between">
        <CircleButton icon={leftIcon} hidden={!leftIcon} />

        <div className="flex flex-1 flex-col items-center px-4 pt-1 text-center">
          {icon ? (
            iconStyle === "badge" ? (
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,251,244,0.68)] text-[var(--ff-primary)]">
                <span className="material-symbols-outlined text-[30px]">{icon}</span>
              </div>
            ) : (
              <span className="mb-2 material-symbols-outlined text-[36px] text-[var(--ff-primary)]">{icon}</span>
            )
          ) : null}
          <h1 className="text-[31px] font-semibold tracking-[-0.045em] text-[var(--ff-text)]">{title}</h1>
        </div>

        <CircleButton icon={rightIcon} hidden={!rightIcon} />
      </div>
    </header>
  );
}
