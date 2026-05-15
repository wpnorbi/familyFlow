"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import RecipeImage from "@/components/etkezes/RecipeImage";
import {
  MEAL_TYPE_OPTIONS,
  PROTEIN_OPTIONS,
  TIME_BUCKET_OPTIONS,
  getRecipeMealTypeLabel,
  isKidFriendlyRecipe,
  isQuickRecipe,
  type RecipeMealType,
  type RecipeTimeBucket,
} from "@/lib/recipes/recipe-taxonomy";
import type { Recipe } from "@/types/etkezes";

interface Props {
  initialCatalog: Recipe[];
  onBack: () => void;
  onViewRecipe: (recipe: Recipe) => void;
}

function Icon({ name, className = "text-[18px]" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-bold transition-all ${
        active
          ? "border-[var(--ff-primary)] bg-[var(--ff-primary)] text-[var(--ff-text-inverse)] shadow-[0_14px_26px_-20px_rgba(55,67,50,0.42)]"
          : "border-[rgba(74,67,54,0.1)] bg-[rgba(255,251,244,0.76)] text-[var(--ff-text-muted)] hover:border-[rgba(55,67,50,0.2)]"
      }`}
    >
      {children}
    </button>
  );
}

function RecipeLibraryCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  const kidFriendly = isKidFriendlyRecipe(recipe);
  const quick = isQuickRecipe(recipe);

  return (
    <button
      onClick={onClick}
      className="group overflow-hidden rounded-[24px] border border-white/72 bg-[rgba(255,250,241,0.88)] text-left shadow-[0_22px_48px_-36px_rgba(61,49,34,0.26)] transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_54px_-34px_rgba(61,49,34,0.34)]"
    >
      <div className="relative h-[168px] overflow-hidden">
        <RecipeImage recipe={recipe} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(31,22,14,0.02),rgba(31,22,14,0.42))]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {kidFriendly && (
            <span className="rounded-full bg-[rgba(255,240,227,0.92)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--ff-caramel-strong)]">
              Gyerekbarát
            </span>
          )}
          {quick && (
            <span className="rounded-full bg-[rgba(238,243,231,0.92)] px-2.5 py-1 text-[10px] font-extrabold text-[var(--ff-primary)]">
              Gyors
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[40px] text-[16px] font-extrabold leading-tight text-[var(--ff-text)]">{recipe.name}</h3>
        <p className="mt-2 line-clamp-2 min-h-[36px] text-[12px] font-medium leading-relaxed text-[var(--ff-text-muted)]">{recipe.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-[var(--ff-text-muted)]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,251,244,0.82)] px-2.5 py-1.5">
            <Icon name="schedule" className="text-[14px]" />
            {recipe.duration} perc
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,251,244,0.82)] px-2.5 py-1.5">
            <Icon name="restaurant" className="text-[14px]" />
            {getRecipeMealTypeLabel(recipe)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,251,244,0.82)] px-2.5 py-1.5">
            <Icon name="lunch_dining" className="text-[14px]" />
            {recipe.protein}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function RecipeLibraryView({ initialCatalog, onBack, onViewRecipe }: Props) {
  const [search, setSearch] = useState("");
  const [protein, setProtein] = useState<Recipe["protein"] | "mind">("mind");
  const [mealType, setMealType] = useState<RecipeMealType | "mind">("mind");
  const [timeBucket, setTimeBucket] = useState<RecipeTimeBucket | "mind">("mind");
  const [quickOnly, setQuickOnly] = useState(false);
  const [childFriendly, setChildFriendly] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>(initialCatalog);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxDuration = useMemo(() => {
    if (timeBucket === "short") return "20";
    if (timeBucket === "medium") return "50";
    return "Infinity";
  }, [timeBucket]);

  const activeFilterCount = [
    search.trim(),
    protein !== "mind",
    mealType !== "mind",
    timeBucket !== "mind",
    quickOnly,
    childFriendly,
  ].filter(Boolean).length;

  function resetFilters() {
    setSearch("");
    setProtein("mind");
    setMealType("mind");
    setTimeBucket("mind");
    setQuickOnly(false);
    setChildFriendly(false);
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search,
        protein,
        mealType,
        timeBucket,
        quickOnly: String(quickOnly),
        childFriendly: String(childFriendly),
        maxDuration,
        category: "mind",
        tag: "mind",
        limit: "all",
      });

      try {
        const response = await fetch(`/api/recipes/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Recipe library fetch failed.");

        const payload = await response.json() as { recipes?: Recipe[] };
        if (!controller.signal.aborted) {
          setRecipes(Array.isArray(payload.recipes) ? payload.recipes : []);
        }
      } catch (fetchError: unknown) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError("Most nem sikerült frissíteni a recepttárat.");
        setRecipes(initialCatalog);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [childFriendly, initialCatalog, maxDuration, mealType, protein, quickOnly, search, timeBucket]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--ff-bg)] px-4 pb-28 pt-5 md:px-8 md:pb-8 md:pt-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,249,237,0.94),transparent_30%),radial-gradient(circle_at_top_right,rgba(238,243,231,0.78),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,240,227,0.66),transparent_26%)]" />
      <div className="relative mx-auto max-w-7xl">
        <header className="rounded-[34px] border border-white/72 bg-[linear-gradient(145deg,rgba(255,252,244,0.96),rgba(246,235,216,0.78))] px-5 py-5 shadow-[0_28px_60px_-40px_rgba(61,49,34,0.28)] md:px-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <button
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-[rgba(255,251,244,0.82)] px-3 py-2 text-[12px] font-bold text-[var(--ff-text-muted)]"
              >
                <Icon name="arrow_back" className="text-[16px]" />
                Heti terv
              </button>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ff-text-soft)]">Recepttár</p>
              <h1 className="mt-2 text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--ff-text)] md:text-[46px]">
                Böngéssz a receptek között
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ff-text-muted)]">
                Keresés és szűrés gyerekbarát, gyors, hús, ételtípus és idő alapján.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-[rgba(255,251,244,0.72)] px-5 py-4 text-center md:min-w-[190px]">
              <p className="text-[34px] font-semibold leading-none text-[var(--ff-primary)]">{recipes.length}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">
                találat
              </p>
            </div>
          </div>
        </header>

        <section className="mt-4 rounded-[30px] border border-white/72 bg-[rgba(255,252,244,0.78)] p-4 shadow-[0_22px_54px_-42px_rgba(61,49,34,0.24)]">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.6fr)]">
            <label className="flex items-center gap-2 rounded-[22px] border border-[rgba(74,67,54,0.1)] bg-[rgba(255,251,244,0.9)] px-4 py-3">
              <Icon name="search" className="text-[18px] text-[var(--ff-text-soft)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Keresés név vagy hozzávaló alapján"
                className="w-full bg-transparent text-sm font-semibold text-[var(--ff-text)] placeholder:text-[var(--ff-text-soft)] focus:outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <FilterButton active={childFriendly} onClick={() => setChildFriendly((value) => !value)}>
                Gyerekbarát
              </FilterButton>
              <FilterButton active={quickOnly} onClick={() => setQuickOnly((value) => !value)}>
                Gyors
              </FilterButton>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="rounded-full border border-[rgba(185,130,71,0.18)] bg-[rgba(255,240,227,0.74)] px-3.5 py-2 text-[12px] font-bold text-[var(--ff-caramel-strong)]"
                >
                  Szűrők törlése
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <FilterButton active={protein === "mind"} onClick={() => setProtein("mind")}>Minden hús</FilterButton>
            {PROTEIN_OPTIONS.map((option) => (
              <FilterButton key={option.value} active={protein === option.value} onClick={() => setProtein(option.value)}>
                {option.label}
              </FilterButton>
            ))}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <FilterButton active={mealType === "mind"} onClick={() => setMealType("mind")}>Minden típus</FilterButton>
            {MEAL_TYPE_OPTIONS.map((option) => (
              <FilterButton key={option.value} active={mealType === option.value} onClick={() => setMealType(option.value)}>
                {option.label}
              </FilterButton>
            ))}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <FilterButton active={timeBucket === "mind"} onClick={() => setTimeBucket("mind")}>Bármennyi idő</FilterButton>
            {TIME_BUCKET_OPTIONS.map((option) => (
              <FilterButton key={option.value} active={timeBucket === option.value} onClick={() => setTimeBucket(option.value)}>
                {option.label}
              </FilterButton>
            ))}
          </div>
        </section>

        {error && (
          <div className="mt-4 rounded-[22px] border border-[rgba(185,130,71,0.2)] bg-[rgba(255,240,227,0.72)] px-4 py-3 text-sm font-semibold text-[var(--ff-caramel-strong)]">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <div key={index} className="h-[330px] animate-pulse rounded-[24px] bg-[rgba(255,251,244,0.72)]" />
            ))}
          </div>
        ) : recipes.length > 0 ? (
          <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeLibraryCard key={recipe.id} recipe={recipe} onClick={() => onViewRecipe(recipe)} />
            ))}
          </section>
        ) : (
          <section className="mt-5 rounded-[30px] border border-white/72 bg-[rgba(255,251,244,0.78)] px-5 py-14 text-center">
            <Icon name="search_off" className="text-[42px] text-[var(--ff-text-soft)]" />
            <h2 className="mt-3 text-xl font-semibold text-[var(--ff-text)]">Nincs találat</h2>
            <p className="mt-2 text-sm text-[var(--ff-text-muted)]">Próbálj kevesebb szűrőt vagy más keresést.</p>
            <button onClick={resetFilters} className="ff-button-primary mt-5 px-5 py-3 text-sm font-bold">
              Szűrők törlése
            </button>
          </section>
        )}
      </div>
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}
