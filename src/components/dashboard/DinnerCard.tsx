import Link from "next/link";
import { getRecipeImageDataUri } from "@/lib/recipes/recipe-image";
import type { Recipe } from "@/types/etkezes";

interface Props {
  recipe: Recipe | null;
}

export default function DinnerCard({ recipe }: Props) {
  if (!recipe) {
    return (
      <div className="ff-glass-card-sage relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden rounded-[var(--ff-radius-xl)] p-6">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-[rgba(124,145,111,0.18)] blur-3xl" />
        <div className="relative z-10">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="ff-chip inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]">
              <span className="material-symbols-outlined text-[14px]">wb_twilight</span>
              Mai étkezés
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[var(--ff-radius-md)] bg-[var(--ff-sage-light)] text-[var(--ff-primary)] shadow-[var(--ff-shadow-soft)]">
              <span className="material-symbols-outlined text-[24px]">restaurant</span>
            </div>
          </div>
          <h3 className="text-[30px] font-semibold tracking-tight text-[var(--ff-text)]">Nincs tervezett vacsora</h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--ff-text-muted)]">
            Válassz egy gyors vacsorát estére, és indulhat a heti terv.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Gyors vacsora", "Maradékokból", "Heti terv"].map((hint) => (
              <span
                key={hint}
                className="ff-chip px-3 py-1.5 text-xs font-medium"
              >
                {hint}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/etkezes"
            className="ff-button-primary inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all hover:brightness-[1.03]"
          >
            <span className="material-symbols-outlined text-[18px]">restaurant_menu</span>
            Vacsora kiválasztása
          </Link>
          <Link
            href="/kamra"
            className="ff-button-secondary inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors hover:bg-[rgba(238,243,230,0.65)]"
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Kamra átnézése
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative h-full min-h-[380px] cursor-pointer overflow-hidden rounded-[var(--ff-radius-xl)] border border-[var(--ff-glass-border)] shadow-[var(--ff-shadow-card)]">
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,249,237,0.04),rgba(55,67,50,0.08))]" />

      <div className="absolute inset-0 flex flex-col justify-end p-7">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex w-max items-center gap-2 rounded-full bg-[rgba(255,249,237,0.22)] px-4 py-2 text-[13px] font-semibold text-[var(--ff-text-inverse)] shadow-lg backdrop-blur-md">
            <span className="material-symbols-outlined text-sm">restaurant</span>
            Mai Étkezés
          </div>
        </div>

        <h3 className="mb-2 text-4xl font-bold leading-tight text-white lg:text-5xl">
          {recipe.name}
        </h3>
        <p className="mb-8 max-w-md text-base text-white/80">{recipe.description}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel flex items-center gap-3 rounded-[20px] border border-white/30 p-3 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(238,243,230,0.72)] text-[var(--ff-primary)]">
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

          <div className="glass-panel flex items-center gap-3 rounded-[20px] border border-white/20 p-3 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
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
