interface InProgressProps {
  title: string;
  icon: string;
  description?: string;
}

export default function InProgress({
  title,
  icon,
  description = "Ez a szekció hamarosan elérhető lesz.",
}: InProgressProps) {
  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
      {/* Fejléc */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface">{title}</h1>
      </div>

      {/* Folyamatban kártya */}
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 rounded-3xl bg-surface-container mx-auto mb-8 flex items-center justify-center ambient-shadow">
            <span
              className="material-symbols-outlined text-5xl text-primary-container"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
            >
              {icon}
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container/40 text-on-secondary-container text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            Folyamatban
          </div>

          <h2 className="text-2xl font-bold text-on-surface mb-3">{title}</h2>
          <p className="text-on-surface-variant leading-relaxed">{description}</p>

          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-outline">
            <span className="material-symbols-outlined text-[18px]">construction</span>
            <span>A fejlesztés aktívan zajlik</span>
          </div>
        </div>
      </div>
    </div>
  );
}
