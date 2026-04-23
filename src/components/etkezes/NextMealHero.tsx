import type { Recipe, MealBatch } from "@/types/etkezes";

interface NextMealData {
  recipe: Recipe;
  batch: MealBatch;
  nextEatDate: string;
  isCookDay: boolean;
}

interface Props {
  nextMealData: NextMealData | null;
}

const MONTHS = ["jan.", "febr.", "már.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."];

const PROTEIN_ICONS: Record<string, string> = {
  csirke: "egg_alt",
  hal: "set_meal",
  marha: "lunch_dining",
  vegetáriánus: "eco",
  egyéb: "restaurant",
};

const PROTEIN_GRADIENTS: Record<string, string> = {
  csirke: "from-amber-100 via-amber-50 to-orange-50",
  hal: "from-blue-100 via-blue-50 to-cyan-50",
  marha: "from-red-100 via-red-50 to-rose-50",
  vegetáriánus: "from-green-100 via-green-50 to-emerald-50",
  egyéb: "from-purple-100 via-purple-50 to-violet-50",
};

const PROTEIN_ICON_COLORS: Record<string, string> = {
  csirke: "text-amber-400",
  hal: "text-blue-400",
  marha: "text-red-400",
  vegetáriánus: "text-green-400",
  egyéb: "text-purple-400",
};

export default function NextMealHero({ nextMealData }: Props) {
  if (!nextMealData) {
    return (
      <section className="bg-surface-container rounded-2xl p-8 border border-dashed border-surface-variant flex flex-col items-center justify-center text-center min-h-[180px] gap-3">
        <span className="material-symbols-outlined text-4xl text-outline">restaurant</span>
        <div>
          <p className="font-semibold text-on-surface mb-1">Még nincs tervezett kaja ezen a héten</p>
          <p className="text-sm text-on-surface-variant">
            Kattints a &ldquo;Kaja hozzáadása&rdquo; gombra a tervezés megkezdéséhez.
          </p>
        </div>
      </section>
    );
  }

  const { recipe, batch, nextEatDate, isCookDay } = nextMealData;
  const [y, m, d] = nextEatDate.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dateStr = `${MONTHS[dateObj.getMonth()]} ${dateObj.getDate()}.`;

  return (
    <section className="bg-surface-container-lowest rounded-2xl shadow-[0_20px_60px_-15px_rgba(74,93,78,0.08)] overflow-hidden flex flex-col lg:flex-row border border-surface-variant/30 group">
      {/* Vizuális panel */}
      <div
        className={`w-full lg:w-2/5 min-h-[220px] lg:min-h-[260px] relative bg-gradient-to-br ${PROTEIN_GRADIENTS[recipe.protein]} overflow-hidden shrink-0 flex items-center justify-center`}
      >
        <span
          className={`material-symbols-outlined text-[140px] ${PROTEIN_ICON_COLORS[recipe.protein]} opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700`}
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 100" }}
        >
          {PROTEIN_ICONS[recipe.protein]}
        </span>

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
            {isCookDay ? "Ma főzöl" : "Következő"} · {dateStr}
          </span>
        </div>

        {!isCookDay && (
          <div className="absolute bottom-4 left-4 bg-secondary-container/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-on-secondary-container">takeout_dining</span>
            <span className="text-[11px] font-bold text-on-secondary-container">Maradék</span>
          </div>
        )}
      </div>

      {/* Tartalom */}
      <div className="p-7 lg:p-10 flex flex-col justify-center flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-[12px] font-bold ${
              isCookDay
                ? "bg-primary-fixed text-on-primary-fixed-variant"
                : "bg-secondary-fixed text-on-secondary-fixed-variant"
            }`}
          >
            {isCookDay ? `Főzés · ${recipe.duration} perc` : "Maradék"}
          </span>
          {batch.eatDates.length > 1 && isCookDay && (
            <span className="text-outline text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">event_repeat</span>
              {batch.eatDates.length} napra elég
            </span>
          )}
        </div>

        <h2 className="text-2xl lg:text-3xl font-bold text-on-background mb-3 leading-tight">
          {recipe.name}
        </h2>

        <p className="text-on-surface-variant mb-5 leading-relaxed">{recipe.description}</p>

        {isCookDay && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {recipe.ingredients.map((ing) => (
              <span
                key={ing}
                className="px-2.5 py-1 bg-surface-container rounded-full text-[11px] font-medium text-on-surface-variant border border-surface-variant/50"
              >
                {ing}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto rounded-2xl border border-surface-variant/50 bg-white/65 px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-1">
            Következő lépés
          </p>
          <p className="text-sm text-on-surface-variant">
            A teljes recept a tervező felugró ablakában érhető el hozzávalókkal és elkészítési lépésekkel.
          </p>
        </div>
      </div>
    </section>
  );
}
