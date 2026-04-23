"use client";

import { useEffect, useState } from "react";
import { RECIPES, toDateKey } from "@/lib/etkezes-data";
import type { MealBatch, Recipe } from "@/types/etkezes";

const TIME_FILTERS = [
  { label: "Villám", sublabel: "≤15 perc", max: 15, icon: "bolt" },
  { label: "Közepes", sublabel: "≤30 perc", max: 30, icon: "timer" },
  { label: "Hosszabb", sublabel: "≤60 perc", max: 60, icon: "hourglass_bottom" },
  { label: "Bármennyi", sublabel: "Nincs limit", max: Infinity, icon: "all_inclusive" },
];

const PROTEIN_FILTERS: { label: string; value: Recipe["protein"] | "mind"; icon: string }[] = [
  { label: "Csirke", value: "csirke", icon: "egg_alt" },
  { label: "Hal", value: "hal", icon: "set_meal" },
  { label: "Marha", value: "marha", icon: "lunch_dining" },
  { label: "Vegán", value: "vegetáriánus", icon: "eco" },
  { label: "Egyéb", value: "egyéb", icon: "restaurant" },
  { label: "Mind", value: "mind", icon: "all_inclusive" },
];

const PROTEIN_GRADIENTS: Record<string, string> = {
  csirke: "from-amber-50 to-amber-100",
  hal: "from-blue-50 to-blue-100",
  marha: "from-red-50 to-red-100",
  vegetáriánus: "from-green-50 to-green-100",
  egyéb: "from-purple-50 to-purple-100",
};

const PROTEIN_ICON_COLORS: Record<string, string> = {
  csirke: "text-amber-600",
  hal: "text-blue-600",
  marha: "text-red-600",
  vegetáriánus: "text-green-600",
  egyéb: "text-purple-600",
};

const PROTEIN_ICONS: Record<string, string> = {
  csirke: "egg_alt",
  hal: "set_meal",
  marha: "lunch_dining",
  vegetáriánus: "eco",
  egyéb: "restaurant",
};

interface Props {
  onAdd: (batch: Omit<MealBatch, "id">) => void;
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

function getFoodImageUrl(recipe: Recipe): string {
  const imagesByProtein: Record<Recipe["protein"], string[]> = {
    csirke: [
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=640&q=80",
    ],
    hal: [
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=640&q=80",
    ],
    marha: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=640&q=80",
    ],
    vegetáriánus: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=640&q=80",
    ],
    egyéb: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=640&q=80",
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=640&q=80",
    ],
  };
  const hash = [...recipe.name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const images = imagesByProtein[recipe.protein];
  return images[hash % images.length];
}

export default function AddMealModal({ onAdd, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [timeFilter, setTimeFilter] = useState<number>(Infinity);
  const [proteinFilter, setProteinFilter] = useState<Recipe["protein"] | "mind">("mind");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [cookDateKey, setCookDateKey] = useState<string>(getCookDateOptions()[0].dateKey);
  const [eatDays, setEatDays] = useState<number>(1);
  const [internetRecipes, setInternetRecipes] = useState<Recipe[]>([]);
  const [isSearchingInternet, setIsSearchingInternet] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(80);

  const cookDateOptions = getCookDateOptions();

  const localFiltered = RECIPES.filter((r) => {
    const timeOk = r.duration <= timeFilter;
    const proteinOk = proteinFilter === "mind" || r.protein === proteinFilter;
    return timeOk && proteinOk;
  });
  const filtered = [...localFiltered, ...internetRecipes].filter(
    (recipe, index, recipes) => recipes.findIndex((candidate) => candidate.id === recipe.id) === index,
  );
  const visibleRecipes = filtered.slice(0, visibleRecipeCount);

  const eatDates = Array.from({ length: eatDays }, (_, i) => addDays(cookDateKey, i));

  const handleConfirm = () => {
    if (!selected) return;
    onAdd({
      recipeId: selected.id,
      recipeSnapshot: { ...selected, image: selected.image ?? getFoodImageUrl(selected) },
      cookDate: cookDateKey,
      eatDates,
    });
    onClose();
  };

  useEffect(() => {
    if (step !== 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearchingInternet(true);
      setSearchError(null);

      const params = new URLSearchParams({
        protein: proteinFilter,
        maxDuration: String(timeFilter),
      });

      fetch(`/api/recipes/search?${params.toString()}`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("Nem sikerült az internetes receptkeresés.");
          return response.json() as Promise<{ recipes: Recipe[] }>;
        })
        .then(({ recipes }) => setInternetRecipes(recipes))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setInternetRecipes([]);
          setSearchError("Az internetes receptkeresés most nem elérhető, a lokális recepteket mutatjuk.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearchingInternet(false);
        });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [proteinFilter, step, timeFilter]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-6xl bg-surface-container-lowest rounded-3xl shadow-[0_32px_80px_-12px_rgba(74,93,78,0.25)] overflow-hidden flex flex-col max-h-[94vh]">

        {/* Fejléc */}
        <div className="px-6 pt-6 pb-4 border-b border-surface-variant/50 shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Kaja hozzáadása</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {step === 1 && "Szűrők — mennyi idő, milyen fehérje"}
                {step === 2 && "Válassz receptet"}
                {step === 3 && "Mikor főzöd, és hány napra szól?"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2">
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

        {/* Step 1: Szűrők */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            <div>
              <p className="text-sm font-bold text-on-surface mb-3">Mennyi időd van főzni?</p>
              <div className="grid grid-cols-4 gap-2">
                {TIME_FILTERS.map((f) => {
                  const active = timeFilter === f.max;
                  return (
                    <button
                      key={f.max}
                      onClick={() => {
                        setTimeFilter(f.max);
                        setSelected(null);
                        setInternetRecipes([]);
                        setVisibleRecipeCount(80);
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        active
                          ? "bg-primary-container text-on-primary-container border-primary-container shadow-sm"
                          : "bg-surface-container-low border-surface-variant/50 text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[22px] ${active ? "" : "text-outline"}`}>
                        {f.icon}
                      </span>
                      <span className="text-xs font-bold leading-none">{f.label}</span>
                      <span className={`text-[10px] leading-none ${active ? "opacity-80" : "text-outline"}`}>{f.sublabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-on-surface mb-3">Milyen fehérje legyen?</p>
              <div className="grid grid-cols-3 gap-2">
                {PROTEIN_FILTERS.map((f) => {
                  const active = proteinFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => {
                        setProteinFilter(f.value);
                        setSelected(null);
                        setInternetRecipes([]);
                        setVisibleRecipeCount(80);
                      }}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        active
                          ? "bg-primary-container text-on-primary-container border-primary-container shadow-sm"
                          : "bg-surface-container-low border-surface-variant/50 text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${active ? "" : "text-outline"}`}>
                        {f.icon}
                      </span>
                      <span className="text-sm font-semibold">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-surface-container rounded-2xl px-4 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">travel_explore</span>
              <span className="text-sm text-on-surface-variant">
                Először idő alapján szűrünk, utána fehérje szerint. A következő lépésben internetes receptek is jönnek.
              </span>
            </div>
          </div>
        )}

        {/* Step 2: Recept */}
        {step === 2 && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <p className="text-xs font-bold text-outline uppercase tracking-widest mb-3">
              {filtered.length} recept
              {timeFilter < Infinity && ` · ≤${timeFilter} perc`}
              {proteinFilter !== "mind" && ` · ${proteinFilter}`}
              {isSearchingInternet && " · internet keresése…"}
            </p>

            {searchError && (
              <div className="mb-3 rounded-2xl bg-secondary-fixed/25 border border-secondary-fixed-dim/40 px-4 py-3 text-xs font-medium text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">wifi_off</span>
                {searchError}
              </div>
            )}

            {filtered.length === 0 && isSearchingInternet ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="h-[82px] rounded-2xl bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-outline mb-2 block">search_off</span>
                <p className="text-sm">Nincs recept ezekkel a szűrőkkel.</p>
                <button onClick={() => setStep(1)} className="mt-3 text-primary text-sm font-semibold cursor-pointer">
                  Szűrők módosítása
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {visibleRecipes.map((recipe) => {
                  const isSelected = selected?.id === recipe.id;
                  return (
                    <article
                      key={recipe.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "bg-primary-container/30 border-primary-container shadow-sm"
                          : "bg-surface-container-low border-surface-variant/40 hover:border-primary-container/50 hover:bg-surface-container"
                      }`}
                    >
                      <button
                        onClick={() => setPreviewRecipe(recipe)}
                        className={`w-20 h-20 rounded-2xl shrink-0 flex items-center justify-center bg-gradient-to-br ${PROTEIN_GRADIENTS[recipe.protein]} relative overflow-hidden shadow-sm`}
                        aria-label={`${recipe.name} részletei`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={recipe.image ?? getFoodImageUrl(recipe)}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 rounded-xl bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          </div>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setPreviewRecipe(recipe)}
                          className={`text-sm font-semibold leading-snug mb-1 line-clamp-2 text-left hover:text-primary ${isSelected ? "text-primary" : "text-on-surface"}`}
                        >
                          {recipe.name}
                        </button>
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-outline">
                            <span className="material-symbols-outlined text-[13px]">timer</span>
                            {recipe.duration} p
                          </span>
                          <span className="text-outline/40">·</span>
                          <span className="text-[11px] text-outline">{recipe.protein}</span>
                          {recipe.source === "hungarian-web" && (
                            <>
                              <span className="text-outline/40">·</span>
                              <span className="text-[11px] text-primary font-semibold">magyar web</span>
                            </>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => setPreviewRecipe(recipe)}
                            className="text-[11px] font-bold text-primary hover:underline"
                          >
                            Megnézem
                          </button>
                          {isSelected && (
                            <span className="text-[11px] font-semibold text-primary">Kiválasztva</span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {visibleRecipes.length < filtered.length && (
                  <button
                    onClick={() => setVisibleRecipeCount((count) => count + 80)}
                    className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                  >
                    További receptek mutatása ({filtered.length - visibleRecipes.length} maradt)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Dátumok */}
        {step === 3 && selected && (
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
            <div className={`flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br ${PROTEIN_GRADIENTS[selected.protein]} border border-surface-variant/20`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/50">
                <span className={`material-symbols-outlined text-[20px] ${PROTEIN_ICON_COLORS[selected.protein]}`}>
                  {PROTEIN_ICONS[selected.protein]}
                </span>
              </div>
              <div>
                <p className="font-semibold text-on-surface text-sm">{selected.name}</p>
                <p className="text-[11px] text-outline">{selected.duration} perc · {selected.ingredients.length} hozzávaló</p>
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
              <p className="text-sm font-bold text-on-surface mb-3">Hány napig eszitek?</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setEatDays(n)}
                    className={`w-12 h-12 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                      eatDays === n
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-surface-container-low border-surface-variant/50 text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <span className="ml-1 text-sm text-outline">nap</span>
              </div>
              {eatDays > 1 && (
                <p className="text-xs text-on-surface-variant mt-2">
                  Maradék: {eatDates.slice(1).map((d) => d.slice(5).replace("-", ". ") + ".").join(", ")}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-on-surface mb-2">Hozzávalók a bevásárlólistához:</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.ingredients.map((ing) => (
                  <span key={ing} className="px-3 py-1 bg-secondary-fixed/30 text-on-surface text-xs font-medium rounded-full border border-secondary-fixed-dim/40">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lábléc */}
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
                Tovább
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
                    <span className="font-semibold text-on-surface">{selected.name}</span>
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
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-full text-sm font-bold bg-primary text-white shadow-[0_4px_14px_rgba(51,69,55,0.3)] hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                Hozzáadás
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
          <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl bg-surface-container-lowest shadow-[0_24px_70px_-18px_rgba(27,28,26,0.35)] border border-white/70">
            <div className={`relative h-64 bg-gradient-to-br ${PROTEIN_GRADIENTS[previewRecipe.protein]} flex items-center justify-center overflow-hidden`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewRecipe.image ?? getFoodImageUrl(previewRecipe)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
              <button
                onClick={() => setPreviewRecipe(null)}
                className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/90 text-on-surface shadow-sm flex items-center justify-center hover:bg-white"
                aria-label="Előnézet bezárása"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <div className="absolute bottom-4 left-5 right-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">timer</span>
                    {previewRecipe.duration} perc
                  </span>
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-on-surface">
                    {previewRecipe.protein}
                  </span>
                  {previewRecipe.source === "hungarian-web" && (
                    <span className="rounded-full bg-secondary-container/90 px-2.5 py-1 text-[11px] font-bold text-on-secondary-container">
                      magyar web
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white drop-shadow-sm">{previewRecipe.name}</h3>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-on-surface-variant">
                {previewRecipe.description}
              </p>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-2">
                  Hozzávalók
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {previewRecipe.ingredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-full border border-surface-variant bg-surface-container-low px-3 py-1 text-xs font-medium text-on-surface"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {previewRecipe.sourceUrl ? (
                  <a
                    href={previewRecipe.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    Forrás megnyitása
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                ) : (
                  <span className="text-xs text-outline">Lokális recept</span>
                )}

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
        </div>
      )}
    </div>
  );
}
