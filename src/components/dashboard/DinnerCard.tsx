import Link from "next/link";
import { getRecipeImageDataUri } from "@/lib/recipes/recipe-image";
import type { Recipe } from "@/types/etkezes";

interface Props {
  recipe: Recipe | null;
}

export default function DinnerCard({ recipe }: Props) {
  // --- Üres állapot ---
  if (!recipe) {
    return (
      <div className="relative h-full min-h-[500px] rounded-3xl overflow-hidden ambient-shadow border border-dashed border-surface-variant flex flex-col items-center justify-center bg-gradient-to-br from-surface-container-lowest to-surface-container p-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center mb-6">
          <span
            className="material-symbols-outlined text-5xl text-outline"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 100" }}
          >
            restaurant
          </span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-surface-variant text-[11px] font-bold text-outline uppercase tracking-widest mb-4">
          <span className="material-symbols-outlined text-[14px]">wb_twilight</span>
          Mai Étkezés
        </div>
        <h3 className="text-2xl font-bold text-on-surface mb-2">Nincs tervezett kaja</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs mb-8">
          Még nem adtál hozzá mai étkezést. Nyisd meg a heti tervezőt, és adj hozzá egy adagot.
        </p>
        <Link
          href="/etkezes"
          className="px-6 py-3 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(51,69,55,0.25)] flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Vacsora kiválasztása
        </Link>
      </div>
    );
  }

  // --- Feltöltött állapot ---
  return (
    <div className="relative h-full min-h-[500px] rounded-3xl overflow-hidden ambient-shadow group cursor-pointer">
      {/* Háttérkép */}
      {recipe.image ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${recipe.image}')` }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${getRecipeImageDataUri(recipe)}')` }}
        />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Tartalom */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-container/95 backdrop-blur-md text-on-primary-container text-[13px] font-semibold w-max shadow-lg">
            <span className="material-symbols-outlined text-sm">restaurant</span>
            Mai Étkezés
          </div>
        </div>

        <h3 className="text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
          {recipe.name}
        </h3>
        <p className="text-base text-white/80 mb-8 max-w-md">{recipe.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-3 px-4 rounded-[20px] flex items-center gap-3 border border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">timer</span>
            </div>
            <div>
              <p className="text-base font-semibold text-on-surface-variant leading-none mb-0.5">
                {recipe.duration}p
              </p>
              <p className="text-[9px] uppercase tracking-widest text-outline font-bold">
                Elkészítési idő
              </p>
            </div>
          </div>

          <div className="glass-panel p-3 px-4 rounded-[20px] flex items-center gap-3 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
            <div className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">grocery</span>
            </div>
            <div>
              <p className="text-base font-semibold text-white leading-none mb-0.5">
                {recipe.ingredients.length} hozzávaló
              </p>
              <p className="text-[9px] uppercase tracking-widest text-white/60 font-bold">
                {recipe.category}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
