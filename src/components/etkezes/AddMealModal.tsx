"use client";

import { useEffect, useState, type ReactNode } from "react";
import RecipeImage from "@/components/etkezes/RecipeImage";
import { RECIPES, toDateKey } from "@/lib/etkezes-data";
import { rankRecipesForPantry } from "@/lib/recipes/pantry-match";
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

const FLOW_STEPS = [
  { id: 1, eyebrow: "Hangolás", title: "Szűrés" },
  { id: 2, eyebrow: "Választás", title: "Recept" },
  { id: 3, eyebrow: "Tervezés", title: "Ütemezés" },
] as const;

interface Props {
  onAdd: (batch: Omit<MealBatch, "id">) => void | Promise<void>;
  onClose: () => void;
  initialRecipe?: Recipe | null;
  pantryItems?: string[];
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

function isChildFriendly(recipe: Recipe): boolean {
  return (recipe.tags ?? []).includes("gyerekbarát");
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

function matchesRecipe(
  recipe: Recipe,
  searchTerm: string,
  category: string,
  tag: string,
  maxDuration: number,
  protein: Recipe["protein"] | "mind",
  childFriendlyOnly: boolean,
) {
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

  const childFriendlyOk = !childFriendlyOnly || isChildFriendly(recipe);

  return timeOk && proteinOk && categoryOk && tagOk && searchOk && childFriendlyOk;
}

function getPrimaryReason(recipe: Recipe, pantryItems: string[]): string {
  const pantryMatch = rankRecipesForPantry([recipe], pantryItems)[0];
  const missingCount = pantryMatch?.missingIngredients.length ?? recipe.ingredients.length;

  if (missingCount === 0) return "Minden megvan hozzá";
  if (missingCount <= 2) return `Csak ${missingCount} hozzávaló hiányzik`;
  if (recipe.duration <= 20) return "20 perc alatt kész";
  if (isChildFriendly(recipe)) return "Gyerekbarát kedvenc";
  if ((recipe.tags ?? []).includes("gyors")) return "Gyors hétköznapi vacsora";
  if (recipe.servings && recipe.servings >= 4) return "Több adagra is jó választás";
  return "Most könnyen beilleszthető a heti tervbe";
}

function getSecondaryReason(recipe: Recipe, pantryItems: string[]): string {
  const pantryMatch = rankRecipesForPantry([recipe], pantryItems)[0];
  const missingCount = pantryMatch?.missingIngredients.length ?? recipe.ingredients.length;

  if (recipe.duration <= 20) return "Gyors megoldás egy sűrű napra";
  if (isChildFriendly(recipe)) return "Szívesen eszik a gyerekek is";
  if (missingCount === 0) return "Nem kell miatta külön boltba menni";
  if (missingCount <= 2) return "Kevés plusz beszerzéssel megfőzhető";
  return recipe.description;
}

function getDisplayTags(recipe: Recipe): string[] {
  const tags = recipe.tags ?? [];
  const preferred = tags.filter((tag) => ["gyerekbarát", "gyors", "egészséges", "család", "kamrabarát"].includes(tag));
  const fallback = [recipe.category, getProteinLabel(recipe.protein), ...tags];
  return Array.from(new Set([...preferred, ...fallback])).slice(0, 2);
}

function FlowSection({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,246,242,0.94))] px-5 py-5 shadow-[0_18px_40px_-34px_rgba(34,27,19,0.35)] sm:px-6">
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-outline">{label}</p>
        <h3 className="mt-2 text-lg font-semibold text-on-surface">{title}</h3>
        {description && <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function AddMealModal({ onAdd, onClose, initialRecipe = null, pantryItems = [] }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(initialRecipe ? 3 : 1);
  const [timeFilter, setTimeFilter] = useState<number>(Infinity);
  const [proteinFilter, setProteinFilter] = useState<Recipe["protein"] | "mind">("mind");
  const [childFriendlyOnly, setChildFriendlyOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("mind");
  const [tagFilter, setTagFilter] = useState<string>("mind");
  const [selected, setSelected] = useState<Recipe | null>(initialRecipe);
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
    matchesRecipe(recipe, searchTerm, categoryFilter, tagFilter, timeFilter, proteinFilter, childFriendlyOnly),
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
        childFriendly: String(childFriendlyOnly),
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
  }, [step, proteinFilter, timeFilter, searchTerm, categoryFilter, tagFilter, childFriendlyOnly]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_38%),rgba(14,18,15,0.42)] p-0 backdrop-blur-md sm:p-3 md:p-6">
      <div className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-none border-0 bg-[linear-gradient(180deg,rgba(253,251,248,0.99),rgba(248,244,239,0.98))] shadow-[0_32px_100px_-26px_rgba(20,25,20,0.48)] sm:h-[min(92vh,860px)] sm:rounded-[36px] sm:border sm:border-white/70">
        <div className="shrink-0 border-b border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.3))] px-6 pb-5 pt-6 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-outline">
                Étkezéstervező
              </p>
              <h2 className="text-2xl font-bold text-on-surface sm:text-[30px]">Mit főzünk és hány napra?</h2>
              <p className="mt-1 text-sm leading-relaxed text-outline">
                Egy finom, gyors tervezési flow: szűrés, választás, részletek, majd heti terv.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-on-surface-variant shadow-sm transition-colors hover:bg-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            {FLOW_STEPS.map((flowStep) => (
              <div
                key={flowStep.id}
                className={`rounded-[24px] border px-3 py-3 transition-all ${
                  flowStep.id === step
                    ? "border-primary/20 bg-primary/[0.08] shadow-[0_16px_30px_-24px_rgba(51,69,55,0.45)]"
                    : flowStep.id < step
                      ? "border-primary/10 bg-white/85"
                      : "border-white/70 bg-white/55"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      flowStep.id === step
                        ? "bg-primary text-white"
                        : flowStep.id < step
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-container text-outline"
                    }`}
                  >
                    {flowStep.id < step ? "✓" : flowStep.id}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-outline">{flowStep.eyebrow}</p>
                    <p className="text-sm font-semibold text-on-surface">{flowStep.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
            <FlowSection
              label="Első lépés"
              title="Mennyi időd van most főzni?"
              description="Válaszd ki a tempót, és a rendszer ehhez igazítja az ajánlható recepteket."
            >
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                {TIME_FILTERS.map((filter) => {
                  const active = timeFilter === filter.max;
                  return (
                    <button
                      key={filter.label}
                      onClick={() => {
                        setTimeFilter(filter.max);
                        resetRecipeFilters();
                      }}
                      className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-[24px] border p-4 text-center transition-all ${
                        active
                          ? "border-primary/20 bg-[linear-gradient(180deg,rgba(74,93,78,0.96),rgba(57,75,61,0.98))] text-white shadow-[0_18px_35px_-24px_rgba(51,69,55,0.75)]"
                          : "border-surface-variant/40 bg-white/78 text-on-surface-variant hover:bg-white"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[22px] ${active ? "text-white" : "text-outline"}`}>
                        {filter.icon}
                      </span>
                      <span className="text-xs font-bold leading-none">{filter.label}</span>
                      <span className={`text-[10px] leading-none ${active ? "text-white/72" : "text-outline"}`}>
                        {filter.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </FlowSection>

            <FlowSection
              label="Második szűkítés"
              title="Milyen irányba induljunk?"
              description="Nem űrlapot töltesz ki, csak kijelölöd a hangulatot és a fő irányt."
            >
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                {PROTEIN_FILTERS.map((filter) => {
                  const active = proteinFilter === filter.value;
                  return (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setProteinFilter(filter.value);
                        resetRecipeFilters();
                      }}
                      className={`flex cursor-pointer items-center gap-3 rounded-[24px] border px-4 py-3.5 text-left transition-all ${
                        active
                          ? "border-primary/20 bg-primary/[0.08] text-on-surface shadow-[0_18px_35px_-28px_rgba(51,69,55,0.5)]"
                          : "border-surface-variant/40 bg-white/78 text-on-surface-variant hover:bg-white"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${active ? "text-primary" : "text-outline"}`}>
                        {filter.icon}
                      </span>
                      <span className="text-sm font-semibold">{filter.label}</span>
                    </button>
                  );
                })}
              </div>
            </FlowSection>

            <FlowSection
              label="Hangolás"
              title="Kinek főzünk most?"
              description="Ha fontos, hogy gyerekbarát legyen, itt egy mozdulattal szűkíthetsz."
            >
              <button
                onClick={() => {
                  setChildFriendlyOnly((value) => !value);
                  resetRecipeFilters();
                }}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-[26px] border px-4 py-4 text-left transition-all sm:max-w-sm ${
                  childFriendlyOnly
                    ? "border-secondary/15 bg-[linear-gradient(180deg,rgba(254,162,126,0.24),rgba(255,219,206,0.45))] text-on-secondary-container shadow-[0_16px_34px_-28px_rgba(146,75,45,0.5)]"
                    : "border-surface-variant/40 bg-white/78 text-on-surface-variant hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[20px] ${childFriendlyOnly ? "" : "text-outline"}`}>
                    child_care
                  </span>
                  <div>
                    <span className="block text-sm font-semibold">Gyerekbarát</span>
                    <span className="block text-[11px] opacity-75">Kifejezetten gyerekeknek való receptek</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px]">
                  {childFriendlyOnly ? "check_circle" : "radio_button_unchecked"}
                </span>
              </button>
            </FlowSection>

            <div className="rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,245,238,0.94))] px-5 py-5 shadow-[0_20px_40px_-34px_rgba(146,75,45,0.35)]">
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
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
            <div className="rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,246,242,0.94))] px-5 py-5 shadow-[0_18px_40px_-34px_rgba(34,27,19,0.35)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">
                  {filtered.length} recept
                  {timeFilter < Infinity && ` · ≤ ${timeFilter} perc`}
                  {proteinFilter !== "mind" && ` · ${getProteinLabel(proteinFilter)}`}
                  {childFriendlyOnly && " · gyerekbarát"}
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
                <div className="flex items-center gap-2 rounded-[22px] border border-surface-variant/40 bg-white/82 px-3.5 py-3">
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
            </div>

            <div className="rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(249,246,242,0.93))] px-5 py-5 shadow-[0_18px_40px_-34px_rgba(34,27,19,0.35)]">
            <div className="flex flex-col gap-4">
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
                    setChildFriendlyOnly(false);
                  }}
                  className="mt-3 text-primary text-sm font-semibold cursor-pointer"
                >
                  Szűrők törlése
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {visibleRecipes.map((recipe) => {
                  const isSelected = selected?.id === recipe.id;
                  const pantryMatch = rankRecipesForPantry([recipe], pantryItems)[0];
                  const missingCount = pantryMatch?.missingIngredients.length ?? recipe.ingredients.length;
                  const primaryReason = getPrimaryReason(recipe, pantryItems);
                  const secondaryReason = getSecondaryReason(recipe, pantryItems);
                  const displayTags = getDisplayTags(recipe);
                  return (
                    <article
                      key={recipe.id}
                      className={`group overflow-hidden rounded-[30px] border transition-all duration-300 ${
                        isSelected
                          ? "border-primary/35 bg-[linear-gradient(180deg,rgba(255,248,238,0.98),rgba(250,244,238,0.98))] shadow-[0_24px_50px_-28px_rgba(120,72,18,0.45)]"
                          : "border-surface-variant/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,246,242,0.96))] shadow-[0_18px_40px_-30px_rgba(34,27,19,0.38)] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_28px_50px_-28px_rgba(120,72,18,0.35)]"
                      }`}
                    >
                      <button
                        onClick={() => setPreviewRecipe(recipe)}
                        className="relative block h-[228px] w-full overflow-hidden"
                        aria-label={`${recipe.name} részletei`}
                      >
                        <RecipeImage
                          recipe={recipe}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,12,9,0.04),rgba(16,12,9,0.1)_40%,rgba(16,12,9,0.62)_100%)]" />
                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-bold text-on-surface shadow-sm">
                            {recipe.duration} perc
                          </span>
                          <span className="rounded-full bg-white/82 px-3 py-1.5 text-[11px] font-semibold text-on-surface shadow-sm">
                            {missingCount === 0 ? "Minden megvan" : `${missingCount} hiányzik`}
                          </span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                          <div className="max-w-[90%] rounded-[24px] bg-white/18 p-4 text-left backdrop-blur-md">
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/72">
                              Miért jó most
                            </p>
                            <p className="mt-2 text-lg font-semibold leading-tight text-white">
                              {primaryReason}
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
                        <div className="space-y-2">
                          <button
                            onClick={() => setPreviewRecipe(recipe)}
                            className={`text-left text-xl font-semibold leading-tight transition-colors hover:text-primary ${isSelected ? "text-primary" : "text-on-surface"}`}
                          >
                            {recipe.name}
                          </button>
                          <p className="text-sm leading-relaxed text-on-surface-variant line-clamp-2">
                            {recipe.description}
                          </p>
                        </div>

                        <div className="rounded-[24px] border border-primary/10 bg-primary/[0.04] px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/80">
                            Miért ajánlott
                          </p>
                          <p className="mt-1 text-sm font-semibold text-on-surface">
                            {primaryReason}
                          </p>
                          <p className="mt-1 text-sm text-on-surface-variant">
                            {secondaryReason}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {displayTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[rgba(135,102,64,0.08)] px-3 py-1.5 text-[11px] font-semibold text-on-surface"
                            >
                              {tag}
                            </span>
                          ))}
                          <span className="rounded-full bg-surface-container-high px-3 py-1.5 text-[11px] font-medium text-on-surface-variant">
                            {missingCount === 0 ? "Nem hiányzik semmi" : `${missingCount} hiányzó hozzávaló`}
                          </span>
                        </div>

                        <div className="mt-auto flex flex-wrap gap-2">
                          <button
                            onClick={() => setPreviewRecipe(recipe)}
                            className="rounded-full border border-surface-variant px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
                          >
                            Megnézem
                          </button>
                          <button
                            onClick={() => setSelected(recipe)}
                            className={`rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
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
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
            <div className={`flex items-center gap-4 rounded-[30px] border border-white/70 bg-gradient-to-br ${PROTEIN_GRADIENTS[selected.protein]} p-4 shadow-[0_22px_42px_-30px_rgba(34,27,19,0.38)]`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/76">
                <span className={`material-symbols-outlined text-[22px] ${PROTEIN_ICON_COLORS[selected.protein]}`}>
                  {PROTEIN_ICONS[selected.protein]}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface/65">Kiválasztott recept</p>
                <p className="mt-1 font-semibold text-on-surface text-base">{selected.name}</p>
                <p className="text-[11px] text-outline mt-1">
                  {selected.duration} perc · {(plannedRecipe?.ingredients.length ?? selected.ingredients.length)} hozzávaló · {selected.instructions.length} lépés
                </p>
              </div>
            </div>

            <FlowSection
              label="Időzítés"
              title="Mikor főzöd?"
              description="Válaszd ki a főzés napját, és a terv rögtön ehhez igazodik."
            >
              <div className="flex flex-wrap gap-2">
                {cookDateOptions.slice(0, 5).map((opt) => (
                  <button
                    key={opt.dateKey}
                    onClick={() => setCookDateKey(opt.dateKey)}
                    className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
                      cookDateKey === opt.dateKey
                        ? "border-primary bg-primary text-white shadow-[0_16px_28px_-22px_rgba(51,69,55,0.8)]"
                        : "border-surface-variant/40 bg-white/78 text-on-surface-variant hover:bg-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FlowSection>

            <FlowSection
              label="Adagolás"
              title="Hány napra szóljon?"
              description="Egyszerű döntés: válaszd ki, hány napra tervezzük be ezt az ételt."
            >
              <div className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4].map((days) => (
                  <button
                    key={days}
                    onClick={() => setEatDays(days)}
                    className={`cursor-pointer rounded-[26px] border px-3 py-4 text-center transition-all ${
                      eatDays === days
                        ? "border-primary/15 bg-[linear-gradient(180deg,rgba(74,93,78,0.96),rgba(57,75,61,0.98))] text-white shadow-[0_22px_36px_-24px_rgba(51,69,55,0.75)]"
                        : "border-surface-variant/40 bg-white/78 text-on-surface-variant hover:bg-white"
                    }`}
                  >
                    <span className="block text-2xl font-bold">{days}</span>
                    <span className={`mt-1 block text-[11px] ${eatDays === days ? "text-white/78" : ""}`}>napra</span>
                  </button>
                ))}
              </div>
            </FlowSection>

            <div className="rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,246,242,0.94))] p-5 shadow-[0_18px_40px_-34px_rgba(34,27,19,0.35)]">
              <div className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-outline">Heti terv összefoglaló</p>
                <h3 className="mt-2 text-lg font-semibold text-on-surface">Így kerül be a heti ritmusba</h3>
              </div>
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[220px_1fr]">
              <div className="rounded-[24px] border border-primary/10 bg-primary/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-1">Főzés napja</p>
                <p className="text-sm font-semibold text-on-surface">{cookDateKey}</p>
              </div>
              <div className="rounded-[24px] border border-secondary/10 bg-secondary/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-1">Ekkor eszitek</p>
                <p className="text-sm text-on-surface-variant">
                  {eatDates.join(", ")}
                </p>
              </div>
              </div>
              <div className="mt-4">
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-2">Bevásárlólistára kerül</p>
                <div className="flex flex-wrap gap-1.5">
                  {(plannedRecipe?.ingredients ?? selected.ingredients).map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-full border border-secondary-fixed-dim/35 bg-secondary-fixed/25 px-3 py-1 text-xs font-medium text-on-surface"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-on-surface-variant">
                  {eatDays} napra tervezve, kb. {plannedRecipe?.servings ?? selected.servings ?? 4} adaggal.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="shrink-0 border-t border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(255,255,255,0.42))] px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          {step === 1 && (
            <>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-full border border-surface-variant/45 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-white/75"
              >
                Mégse
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-[0_20px_34px_-22px_rgba(51,69,55,0.75)] transition-all hover:bg-primary/90"
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
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-surface-variant/45 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-white/75"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Vissza
              </button>
              <div className="flex items-center gap-3">
                {selected && (
                  <p className="hidden text-sm text-on-surface-variant sm:block">
                    Kiválasztva: <span className="font-semibold text-on-surface">{selected.name}</span>
                  </p>
                )}
                <button
                  onClick={() => selected && setStep(3)}
                  disabled={!selected}
                  className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                    selected
                      ? "cursor-pointer bg-primary text-white shadow-[0_20px_34px_-22px_rgba(51,69,55,0.75)] hover:bg-primary/90"
                      : "cursor-not-allowed bg-surface-container text-outline"
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
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-surface-variant/45 px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-white/75"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Vissza
              </button>
              <button
                onClick={() => void handleConfirm()}
                disabled={isSubmitting}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                  isSubmitting
                    ? "cursor-progress bg-primary/60 text-white"
                    : "cursor-pointer bg-primary text-white shadow-[0_20px_34px_-22px_rgba(51,69,55,0.75)] hover:bg-primary/90"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                {isSubmitting ? "Mentés..." : "Hozzáadás"}
              </button>
            </>
          )}
        </div>
        </div>
      </div>

      {previewRecipe && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setPreviewRecipe(null)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),rgba(14,18,15,0.34)] backdrop-blur-md" />
          <div className="relative z-10 flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-none border-0 bg-[linear-gradient(180deg,rgba(253,251,248,0.99),rgba(248,244,239,0.98))] shadow-[0_30px_90px_-24px_rgba(27,28,26,0.42)] sm:max-h-[88vh] sm:rounded-[34px] sm:border sm:border-white/70">
            <div className="relative shrink-0 border-b border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0.36))] p-5 backdrop-blur-md">
              <button
                onClick={() => setPreviewRecipe(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-on-surface shadow-sm hover:bg-white"
                aria-label="Előnézet bezárása"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] items-end">
                <div className="relative h-64 overflow-hidden rounded-[28px] border border-white/70">
                  <RecipeImage recipe={previewRecipe} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,12,9,0.05),rgba(16,12,9,0.12)_45%,rgba(16,12,9,0.55)_100%)]" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-bold text-on-surface">
                      {previewRecipe.duration} perc
                    </span>
                    <span className="rounded-full bg-white/82 px-3 py-1 text-[11px] font-semibold text-on-surface">
                      {previewRecipe.category}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="rounded-[22px] bg-white/18 px-4 py-3 backdrop-blur-md">
                      <p className="text-lg font-semibold text-white">{previewRecipe.name}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-outline">Recept részletei</p>
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

            <div className="grid gap-6 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-3">
                  Elkészítés
                </p>
                <ol className="flex flex-col gap-3">
                  {previewRecipe.instructions.map((stepText, index) => (
                    <li key={stepText} className="flex gap-3 rounded-[24px] border border-white/75 bg-white/78 px-4 py-3 shadow-[0_14px_30px_-28px_rgba(34,27,19,0.35)]">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-on-surface">{stepText}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/75 bg-white/78 p-4 shadow-[0_14px_30px_-28px_rgba(34,27,19,0.35)]">
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

                <div className="rounded-[28px] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,245,238,0.94))] p-4 shadow-[0_14px_30px_-28px_rgba(146,75,45,0.35)]">
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

            <div className="flex items-center justify-between gap-3 border-t border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(255,255,255,0.4))] p-5 backdrop-blur-md">
              <button
                onClick={() => setPreviewRecipe(null)}
                className="rounded-full border border-surface-variant/45 px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-white/75"
              >
                Bezárás
              </button>
              <button
                onClick={() => {
                  setSelected(previewRecipe);
                  setPreviewRecipe(null);
                }}
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_20px_34px_-22px_rgba(51,69,55,0.75)] transition-colors hover:bg-primary/90"
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
