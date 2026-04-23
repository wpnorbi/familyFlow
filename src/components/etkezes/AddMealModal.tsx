"use client";

import { useEffect, useState } from "react";
import { RECIPES, toDateKey } from "@/lib/etkezes-data";
import type { MealBatch, Recipe } from "@/types/etkezes";

const TIME_FILTERS = [
  { label: "Villám", sublabel: "< 15 perc", max: 15, icon: "bolt" },
  { label: "Közepes", sublabel: "< 30 perc", max: 30, icon: "timer" },
  { label: "Hosszabb", sublabel: "< 60 perc", max: 60, icon: "hourglass_bottom" },
  { label: "Bármennyi", sublabel: "Nincs limit", max: Infinity, icon: "all_inclusive" },
];

const PROTEIN_FILTERS: { label: string; value: Recipe["protein"] | "mind"; icon: string }[] = [
  { label: "Csirke", value: "csirke", icon: "egg_alt" },
  { label: "Hal", value: "hal", icon: "set_meal" },
  { label: "Marha", value: "marha", icon: "lunch_dining" },
  { label: "Sertés", value: "sertés", icon: "nutrition" },
  { label: "Vegetáriánus", value: "vegetáriánus", icon: "eco" },
  { label: "Egyéb", value: "egyéb", icon: "restaurant" },
  { label: "Mind", value: "mind", icon: "all_inclusive" },
];

const PROTEIN_GRADIENTS: Record<Recipe["protein"], string> = {
  csirke: "from-amber-50 via-orange-50 to-amber-100",
  hal: "from-sky-50 via-cyan-50 to-blue-100",
  marha: "from-rose-50 via-red-50 to-orange-100",
  sertés: "from-pink-50 via-rose-50 to-red-100",
  vegetáriánus: "from-green-50 via-emerald-50 to-lime-100",
  egyéb: "from-violet-50 via-fuchsia-50 to-purple-100",
};

const PROTEIN_ICON_COLORS: Record<Recipe["protein"], string> = {
  csirke: "text-amber-700",
  hal: "text-sky-700",
  marha: "text-rose-700",
  sertés: "text-pink-700",
  vegetáriánus: "text-emerald-700",
  egyéb: "text-violet-700",
};

const PROTEIN_ICONS: Record<Recipe["protein"], string> = {
  csirke: "egg_alt",
  hal: "set_meal",
  marha: "lunch_dining",
  sertés: "nutrition",
  vegetáriánus: "eco",
  egyéb: "restaurant",
};

interface Props {
  onAdd: (batch: Omit<MealBatch, "id">) => void | Promise<void>;
  onClose: () => void;
}

function getCookDateOptions() {
  const today = new Date();
  const dayNames = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const label = i === 0 ? "Ma" : i === 1 ? "Holnap" : i === 2 ? "Holnapután" : dayNames[date.getDay()];
    return { dateKey: toDateKey(date), label };
  });
}

function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d + n);
  return toDateKey(date);
}

function getProteinLabel(protein: Recipe["protein"]) {
  return PROTEIN_FILTERS.find((item) => item.value === protein)?.label ?? protein;
}

function scaleIngredientLabel(ingredient: string, days: number): string {
  return days > 1 ? `${ingredient} ×${days}` : ingredient;
}

function buildPlannedRecipeSnapshot(recipe: Recipe, days: number): Recipe {
  const baseServings = recipe.servings ?? 4;

  return {
    ...recipe,
    ingredients: recipe.ingredients.map((ingredient) => scaleIngredientLabel(ingredient, days)),
    servings: baseServings * days,
    description:
      days > 1
        ? `${recipe.description} Ez a terv ${days} napra van skálázva.`
        : recipe.description,
  };
}

function getRecipeCategories(): string[] {
  return Array.from(new Set(RECIPES.map((recipe) => recipe.category)));
}

function getRecipeTags(): string[] {
  return Array.from(new Set(RECIPES.flatMap((recipe) => recipe.tags ?? [])));
}

function matchesRecipe(recipe: Recipe, searchTerm: string, category: string, tag: string, maxDuration: number, protein: Recipe["protein"] | "mind") {
  const normalizedQuery = searchTerm.trim().toLowerCase();
  const searchable = [
    recipe.name,
    recipe.description,
    recipe.category,
    ...recipe.ingredients,
    ...(recipe.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const timeOk = recipe.duration <= maxDuration;
  const proteinOk = protein === "mind" || recipe.protein === protein;
  const categoryOk = category === "mind" || recipe.category === category;
  const tagOk = tag === "mind" || (recipe.tags ?? []).includes(tag);
  const searchOk = !normalizedQuery || searchable.includes(normalizedQuery);

  return timeOk && proteinOk && categoryOk && tagOk && searchOk;
}

function RecipeArt({ recipe, compact = false }: { recipe: Recipe; compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${PROTEIN_GRADIENTS[recipe.protein]} ${compact ? "h-20 w-20" : "h-64"} border border-white/70`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.75),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.45),transparent_40%)]" />
      <div className="absolute right-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-on-surface shadow-sm">
        {recipe.duration} perc
      </div>
      <div className="absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-on-surface shadow-sm">
        {recipe.category}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`material-symbols-outlined ${PROTEIN_ICON_COLORS[recipe.protein]} ${compact ? "text-[38px]" : "text-[92px]"} opacity-80`}
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
        >
          {PROTEIN_ICONS[recipe.protein]}
        </span>
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <div className="rounded-2xl bg-white/70 px-3 py-2 backdrop-blur-sm shadow-sm">
          <p className={`font-semibold text-on-surface ${compact ? "text-[11px] line-clamp-2" : "text-sm"}`}>
            {recipe.name}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AddMealModal({ onAdd, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [timeFilter, setTimeFilter] = useState<number>(Infinity);
  const [proteinFilter, setProteinFilter] = useState<Recipe["protein"] | "mind">("mind");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("mind");
  const [tagFilter, setTagFilter] = useState<string>("mind");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [cookDateKey, setCookDateKey] = useState<string>(getCookDateOptions()[0].dateKey);
  const [eatDays, setEatDays] = useState<number>(1);
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>(RECIPES);
  const [availableCategories, setAvailableCategories] = useState<string[]>(getRecipeCategories());
  const [availableTags, setAvailableTags] = useState<string[]>(getRecipeTags());
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [usedFallbackResults, setUsedFallbackResults] = useState(false);
  const [exactMatchCount, setExactMatchCount] = useState(0);

  const fallbackRecipes = RECIPES.filter((recipe) =>
    matchesRecipe(recipe, searchTerm, categoryFilter, tagFilter, timeFilter, proteinFilter),
  );
  const filtered = recipesError ? fallbackRecipes : availableRecipes;
  const visibleRecipes = filtered.slice(0, visibleRecipeCount);
  const cookDateOptions = getCookDateOptions();
  const eatDates = Array.from({ length: eatDays }, (_, i) => addDays(cookDateKey, i));
  const plannedRecipe = selected ? buildPlannedRecipeSnapshot(selected, eatDays) : null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        if (previewRecipe) {
          setPreviewRecipe(null);
          return;
        }
        onClose();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSubmitting, onClose, previewRecipe]);

  async function handleConfirm() {
    if (!selected || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        recipeId: selected.id,
        recipeSnapshot: plannedRecipe ?? selected,
        cookDate: cookDateKey,
        eatDates,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetRecipeFilters() {
    setSelected(null);
    setPreviewRecipe(null);
    setVisibleRecipeCount(20);
  }

  useEffect(() => {
    if (step !== 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoadingRecipes(true);
      setRecipesError(null);

      const params = new URLSearchParams({
        protein: proteinFilter,
        maxDuration: String(timeFilter),
        search: searchTerm,
        category: categoryFilter,
        tag: tagFilter,
      });

      try {
        const response = await fetch(`/api/recipes/search?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Recipe fetch failed.");
        }

        const payload = await response.json() as {
          recipes?: Recipe[];
          categories?: string[];
          tags?: string[];
          exactMatchCount?: number;
          usedFallback?: boolean;
        };

        if (controller.signal.aborted) return;

        setAvailableRecipes(Array.isArray(payload.recipes) ? payload.recipes : []);
        setAvailableCategories(Array.isArray(payload.categories) ? payload.categories : getRecipeCategories());
        setAvailableTags(Array.isArray(payload.tags) ? payload.tags : getRecipeTags());
        setExactMatchCount(typeof payload.exactMatchCount === "number" ? payload.exactMatchCount : 0);
        setUsedFallbackResults(Boolean(payload.usedFallback));
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRecipesError("A magyar receptforrás most nem elérhető, a helyi recepteket mutatjuk.");
        setAvailableRecipes(RECIPES);
        setAvailableCategories(getRecipeCategories());
        setAvailableTags(getRecipeTags());
        setExactMatchCount(fallbackRecipes.length);
        setUsedFallbackResults(false);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingRecipes(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [step, proteinFilter, timeFilter, searchTerm, categoryFilter, tagFilter]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-6xl h-[min(92vh,860px)] rounded-[32px] bg-surface-container-lowest shadow-[0_28px_90px_-24px_rgba(20,25,20,0.45)] border border-white/70 overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-surface-variant/50 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-outline font-bold mb-2">
                Étkezéstervező
              </p>
              <h2 className="text-2xl font-bold text-on-surface">Mit főzünk és hány napra?</h2>
              <p className="text-sm text-outline mt-1">
                Válassz receptet, szűrj gyorsan, és nézd meg a teljes elkészítést helyben.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? "bg-primary" : "bg-surface-variant"
                } ${s === step ? "w-8" : "w-4"}`}
              />
            ))}
            <span className="text-[11px] text-outline ml-1">{step}/3</span>
          </div>
        </div>

        {step === 1 && (
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            <div>
              <p className="text-sm font-bold text-on-surface mb-3">Mennyi időd van főzni?</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {TIME_FILTERS.map((filter) => {
                  const active = timeFilter === filter.max;
                  return (
                    <button
                      key={filter.label}
                      onClick={() => {
                        setTimeFilter(filter.max);
                        resetRecipeFilters();
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        active
                          ? "bg-primary-container text-on-primary-container border-primary-container shadow-sm"
                          : "bg-surface-container-low border-surface-variant/50 text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[22px] ${active ? "" : "text-outline"}`}>
                        {filter.icon}
                      </span>
                      <span className="text-xs font-bold leading-none">{filter.label}</span>
                      <span className={`text-[10px] leading-none ${active ? "opacity-80" : "text-outline"}`}>
                        {filter.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-on-surface mb-3">Milyen fehérje legyen?</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {PROTEIN_FILTERS.map((filter) => {
                  const active = proteinFilter === filter.value;
                  return (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setProteinFilter(filter.value);
                        resetRecipeFilters();
                      }}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        active
                          ? "bg-primary-container text-on-primary-container border-primary-container shadow-sm"
                          : "bg-surface-container-low border-surface-variant/50 text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${active ? "" : "text-outline"}`}>
                        {filter.icon}
                      </span>
                      <span className="text-sm font-semibold">{filter.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-surface-variant/40 bg-gradient-to-br from-surface-container-low to-white px-5 py-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">menu_book</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-on-surface">
                    A következő lépésben már a saját receptlistádból választasz.
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    Lesz kereső, kategória- és címkeszűrő, és a Megnézem gombban rögtön ott lesz a hozzávalólista meg az elkészítés.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">
                  {filtered.length} recept
                  {timeFilter < Infinity && ` · ≤ ${timeFilter} perc`}
                  {proteinFilter !== "mind" && ` · ${getProteinLabel(proteinFilter)}`}
                </p>
                <h3 className="text-lg font-bold text-on-surface">Szűrd le gyorsan, ami tényleg szóba jöhet</h3>
                {usedFallbackResults && (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {exactMatchCount} pontos találat volt, ezért közeli receptekkel töltöttük fel a listát.
                  </p>
                )}
              </div>
              <div className="w-full lg:w-[320px]">
                <label className="sr-only" htmlFor="recipe-search">Recept keresése</label>
                <div className="flex items-center gap-2 rounded-2xl border border-surface-variant/50 bg-surface-container-low px-3 py-2.5">
                  <span className="material-symbols-outlined text-outline text-[18px]">search</span>
                  <input
                    id="recipe-search"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setVisibleRecipeCount(20);
                    }}
                    placeholder="Keresés név, hozzávaló vagy tag alapján"
                    className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-outline">Kategória</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setCategoryFilter("mind");
                      setVisibleRecipeCount(20);
                    }}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                      categoryFilter === "mind"
                        ? "bg-primary text-white border-primary"
                        : "bg-surface-container-low border-surface-variant/50 text-on-surface-variant"
                    }`}
                  >
                    Mind
                  </button>
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setCategoryFilter(category);
                        setVisibleRecipeCount(20);
                      }}
                      className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                        categoryFilter === category
                          ? "bg-primary text-white border-primary"
                          : "bg-surface-container-low border-surface-variant/50 text-on-surface-variant"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-outline">Gyors szűrők</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setTagFilter("mind");
                      setVisibleRecipeCount(20);
                    }}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                      tagFilter === "mind"
                        ? "bg-secondary text-white border-secondary"
                        : "bg-surface-container-low border-surface-variant/50 text-on-surface-variant"
                    }`}
                  >
                    Minden címke
                  </button>
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setTagFilter(tag);
                        setVisibleRecipeCount(20);
                      }}
                      className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                        tagFilter === tag
                          ? "bg-secondary text-white border-secondary"
                          : "bg-surface-container-low border-surface-variant/50 text-on-surface-variant"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {recipesError && (
              <div className="rounded-2xl border border-secondary-fixed-dim/40 bg-secondary-fixed/25 px-4 py-3 text-sm text-on-surface-variant">
                {recipesError}
              </div>
            )}

            {isLoadingRecipes ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="h-[156px] rounded-3xl bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-14 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-outline mb-2 block">search_off</span>
                <p className="text-sm">Nincs recept ezekkel a szűrőkkel.</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("mind");
                    setTagFilter("mind");
                  }}
                  className="mt-3 text-primary text-sm font-semibold cursor-pointer"
                >
                  Szűrők törlése
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {visibleRecipes.map((recipe) => {
                  const isSelected = selected?.id === recipe.id;
                  return (
                    <article
                      key={recipe.id}
                      className={`flex gap-3 p-3 rounded-3xl border transition-all ${
                        isSelected
                          ? "bg-primary-container/25 border-primary-container shadow-sm"
                          : "bg-surface-container-low border-surface-variant/40 hover:border-primary-container/40 hover:bg-surface-container"
                      }`}
                    >
                      <button
                        onClick={() => setPreviewRecipe(recipe)}
                        className="shrink-0"
                        aria-label={`${recipe.name} részletei`}
                      >
                        <RecipeArt recipe={recipe} compact />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-on-surface border border-surface-variant/40">
                            {recipe.duration} perc
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-on-surface border border-surface-variant/40">
                            {recipe.category}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-on-surface border border-surface-variant/40">
                            {getProteinLabel(recipe.protein)}
                          </span>
                        </div>

                        <button
                          onClick={() => setPreviewRecipe(recipe)}
                          className={`text-left text-sm font-semibold leading-snug mb-1.5 hover:text-primary ${isSelected ? "text-primary" : "text-on-surface"}`}
                        >
                          {recipe.name}
                        </button>

                        <p className="text-xs text-on-surface-variant line-clamp-2 mb-2.5">
                          {recipe.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {recipe.ingredients.slice(0, 4).map((ingredient) => (
                            <span
                              key={ingredient}
                              className="rounded-full bg-secondary-fixed/25 px-2.5 py-1 text-[11px] font-medium text-on-surface border border-secondary-fixed-dim/40"
                            >
                              {ingredient}
                            </span>
                          ))}
                          {recipe.ingredients.length > 4 && (
                            <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-medium text-outline border border-surface-variant/40">
                              +{recipe.ingredients.length - 4}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setPreviewRecipe(recipe)}
                            className="rounded-full border border-surface-variant px-3.5 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
                          >
                            Megnézem
                          </button>
                          <button
                            onClick={() => setSelected(recipe)}
                            className={`rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-primary/10 text-primary hover:bg-primary/15"
                            }`}
                          >
                            {isSelected ? "Kiválasztva" : "Ezt főzném"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {visibleRecipes.length < filtered.length && (
                  <button
                    onClick={() => setVisibleRecipeCount((count) => count + 20)}
                    className="xl:col-span-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                  >
                    További receptek mutatása ({filtered.length - visibleRecipes.length} maradt)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && selected && (
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            <div className={`flex items-center gap-3 p-3 rounded-3xl bg-gradient-to-br ${PROTEIN_GRADIENTS[selected.protein]} border border-surface-variant/20`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/70">
                <span className={`material-symbols-outlined text-[22px] ${PROTEIN_ICON_COLORS[selected.protein]}`}>
                  {PROTEIN_ICONS[selected.protein]}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-on-surface text-sm">{selected.name}</p>
                <p className="text-[11px] text-outline">
                  {selected.duration} perc · {(plannedRecipe?.ingredients.length ?? selected.ingredients.length)} hozzávaló · {selected.instructions.length} lépés
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-on-surface mb-3">Mikor főzöd?</p>
              <div className="flex flex-wrap gap-2">
                {cookDateOptions.slice(0, 5).map((opt) => (
                  <button
                    key={opt.dateKey}
                    onClick={() => setCookDateKey(opt.dateKey)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
                      cookDateKey === opt.dateKey
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-surface-container-low border-surface-variant/50 text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-on-surface mb-3">Hány napra szól?</p>
              <div className="grid grid-cols-4 gap-2 max-w-md">
                {[1, 2, 3, 4].map((days) => (
                  <button
                    key={days}
                    onClick={() => setEatDays(days)}
                    className={`rounded-2xl border px-3 py-3 text-center transition-all cursor-pointer ${
                      eatDays === days
                        ? "bg-primary-container text-on-primary-container border-primary-container shadow-sm"
                        : "bg-surface-container-low border-surface-variant/50 text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <span className="block text-base font-bold">{days}</span>
                    <span className="block text-[11px] mt-0.5">{days === 1 ? "nap" : "nap"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-surface-container-low border border-surface-variant/40 p-4 flex flex-col gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-1">Főzés napja</p>
                <p className="text-sm font-semibold text-on-surface">{cookDateKey}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-1">Ekkor eszitek</p>
                <p className="text-sm text-on-surface-variant">
                  {eatDates.join(", ")}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-2">Bevásárlólistára kerül</p>
                <div className="flex flex-wrap gap-1.5">
                  {(plannedRecipe?.ingredients ?? selected.ingredients).map((ingredient) => (
                    <span
                      key={ingredient}
                      className="px-3 py-1 bg-secondary-fixed/30 text-on-surface text-xs font-medium rounded-full border border-secondary-fixed-dim/40"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-on-surface-variant">
                  {eatDays} napra tervezve, kb. {plannedRecipe?.servings ?? selected.servings ?? 4} adaggal.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-surface-variant/50 shrink-0 flex items-center justify-between gap-3">
          {step === 1 && (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant border border-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Mégse
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-full text-sm font-bold bg-primary text-white shadow-[0_4px_14px_rgba(51,69,55,0.3)] hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-2"
              >
                Receptet választok
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant border border-surface-variant hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Vissza
              </button>
              <div className="flex items-center gap-3">
                {selected && (
                  <p className="text-sm text-on-surface-variant hidden sm:block">
                    Kiválasztva: <span className="font-semibold text-on-surface">{selected.name}</span>
                  </p>
                )}
                <button
                  onClick={() => selected && setStep(3)}
                  disabled={!selected}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                    selected
                      ? "bg-primary text-white shadow-[0_4px_14px_rgba(51,69,55,0.3)] hover:bg-primary/90 cursor-pointer"
                      : "bg-surface-container text-outline cursor-not-allowed"
                  }`}
                >
                  Tovább
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-on-surface-variant border border-surface-variant hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Vissza
              </button>
              <button
                onClick={() => void handleConfirm()}
                disabled={isSubmitting}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isSubmitting
                    ? "bg-primary/60 text-white"
                    : "bg-primary text-white shadow-[0_4px_14px_rgba(51,69,55,0.3)] hover:bg-primary/90"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                {isSubmitting ? "Mentés..." : "Hozzáadás"}
              </button>
            </>
          )}
        </div>
      </div>

      {previewRecipe && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setPreviewRecipe(null)}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-4xl max-h-[88vh] overflow-hidden rounded-3xl bg-surface-container-lowest shadow-[0_24px_70px_-18px_rgba(27,28,26,0.35)] border border-white/70 flex flex-col">
            <div className="relative shrink-0 p-5 border-b border-surface-variant/40">
              <button
                onClick={() => setPreviewRecipe(null)}
                className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/90 text-on-surface shadow-sm flex items-center justify-center hover:bg-white"
                aria-label="Előnézet bezárása"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] items-end">
                <RecipeArt recipe={previewRecipe} />
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                      {previewRecipe.duration} perc
                    </span>
                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-bold text-on-surface border border-surface-variant/40">
                      {previewRecipe.category}
                    </span>
                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-bold text-on-surface border border-surface-variant/40">
                      {getProteinLabel(previewRecipe.protein)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface">{previewRecipe.name}</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {previewRecipe.description}
                  </p>
                  {previewRecipe.tags && previewRecipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {previewRecipe.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-secondary-fixed/20 px-2.5 py-1 text-[11px] font-semibold text-on-surface border border-secondary-fixed-dim/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto p-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-3">
                  Elkészítés
                </p>
                <ol className="flex flex-col gap-3">
                  {previewRecipe.instructions.map((stepText, index) => (
                    <li key={stepText} className="flex gap-3 rounded-2xl border border-surface-variant/40 bg-surface-container-low px-4 py-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-on-surface">{stepText}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-surface-variant/40 bg-surface-container-low p-4">
                  <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-3">
                    Hozzávalók
                  </p>
                  <ul className="space-y-2">
                    {previewRecipe.ingredients.map((ingredient) => (
                      <li key={ingredient} className="flex items-center gap-2 text-sm text-on-surface">
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-surface-variant/40 bg-gradient-to-br from-white to-surface-container-low p-4">
                  <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-2">
                    Gyors összefoglaló
                  </p>
                  <div className="space-y-2 text-sm text-on-surface-variant">
                    <p>{previewRecipe.duration} perc alatt elkészíthető.</p>
                    <p>{previewRecipe.ingredients.length} alapanyag kell hozzá.</p>
                    <p>{previewRecipe.instructions.length} lépéses recept, külső oldal nélkül.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-surface-variant/40 p-5 flex items-center justify-between gap-3">
              <button
                onClick={() => setPreviewRecipe(null)}
                className="rounded-full border border-surface-variant px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Bezárás
              </button>
              <button
                onClick={() => {
                  setSelected(previewRecipe);
                  setPreviewRecipe(null);
                }}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(51,69,55,0.3)] hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[17px]">check</span>
                Ezt választom
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
