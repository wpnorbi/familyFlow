import { RECIPES } from "@/lib/etkezes-data";

const FEATURED_IDS = ["csirke-curry", "lazac", "steak", "teszta"];

const PROTEIN_ICONS: Record<string, string> = {
  csirke: "egg_alt",
  hal: "set_meal",
  marha: "lunch_dining",
  vegetáriánus: "eco",
  egyéb: "restaurant",
};

const PROTEIN_GRADIENTS: Record<string, string> = {
  csirke: "from-amber-100 to-amber-200",
  hal: "from-blue-100 to-blue-200",
  marha: "from-red-100 to-red-200",
  vegetáriánus: "from-green-100 to-green-200",
  egyéb: "from-purple-100 to-purple-200",
};

const PROTEIN_ICON_COLORS: Record<string, string> = {
  csirke: "text-amber-500",
  hal: "text-blue-500",
  marha: "text-red-500",
  vegetáriánus: "text-green-500",
  egyéb: "text-purple-500",
};

const PROTEIN_LABELS: Record<string, string> = {
  csirke: "Csirke",
  hal: "Hal",
  marha: "Marha",
  vegetáriánus: "Vegetáriánus",
  egyéb: "Egyéb",
};

export default function RecipeRecommendations() {
  const featured = FEATURED_IDS
    .map((id) => RECIPES.find((r) => r.id === id))
    .filter((r): r is (typeof RECIPES)[number] => r !== undefined);

  return (
    <section>
      <div className="flex items-end justify-between mb-5">
        <h3 className="text-xl font-bold text-on-background">Mit főzzünk legközelebb?</h3>
        <a href="#" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
          Összes recept
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {featured.map((recipe) => (
          <div key={recipe.id} className="group cursor-pointer">
            <div
              className={`aspect-[4/5] rounded-2xl mb-3 relative bg-gradient-to-br ${PROTEIN_GRADIENTS[recipe.protein]} flex items-center justify-center overflow-hidden border border-surface-variant/30 group-hover:shadow-lg transition-shadow`}
            >
              <span
                className={`material-symbols-outlined text-[90px] ${PROTEIN_ICON_COLORS[recipe.protein]} opacity-25 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500`}
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 100" }}
              >
                {PROTEIN_ICONS[recipe.protein]}
              </span>

              {/* Időbadge */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[13px] text-surface-tint">timer</span>
                <span className="text-xs font-bold text-on-background">{recipe.duration} p</span>
              </div>

              {/* Protein badge */}
              <div className={`absolute bottom-3 left-3 bg-gradient-to-r ${PROTEIN_GRADIENTS[recipe.protein]} px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-white/50`}>
                <span className={`material-symbols-outlined text-[13px] ${PROTEIN_ICON_COLORS[recipe.protein]}`}>
                  {PROTEIN_ICONS[recipe.protein]}
                </span>
                <span className={`text-xs font-bold ${PROTEIN_ICON_COLORS[recipe.protein]}`}>
                  {PROTEIN_LABELS[recipe.protein]}
                </span>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-end justify-end p-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white text-[18px]">add</span>
                </div>
              </div>
            </div>

            <h4 className="font-semibold text-on-background mb-1 leading-snug group-hover:text-primary transition-colors text-sm">
              {recipe.name}
            </h4>
            <p className="text-xs text-outline">{recipe.category}</p>
          </div>
        ))}

        {/* AI javaslat */}
        <div className="group cursor-pointer">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-3 relative bg-surface-container flex items-center justify-center border-2 border-dashed border-outline-variant hover:bg-surface-container-high transition-colors">
            <div className="text-center p-6">
              <span className="material-symbols-outlined text-4xl text-primary mb-2 block">auto_awesome</span>
              <h4 className="font-semibold text-on-background mb-2 text-sm">Generálj újat</h4>
              <p className="text-xs text-outline leading-relaxed">
                Bízd a mesterséges intelligenciára a tervezést a kamrád alapján.
              </p>
            </div>
          </div>
          <p className="font-semibold text-on-surface-variant text-sm">AI Javaslat</p>
          <p className="text-xs text-outline">Kamra alapján</p>
        </div>
      </div>
    </section>
  );
}
