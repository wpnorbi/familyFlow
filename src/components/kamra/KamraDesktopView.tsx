"use client";

import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import { useMealData } from "@/hooks/useMealData";

const CATEGORY_CARDS = [
  { title: "Gabona", count: "5 tétel", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80" },
  { title: "Hüvelyes", count: "4 tétel", image: "https://images.unsplash.com/photo-1515543904379-3d757afe72e6?auto=format&fit=crop&w=600&q=80" },
  { title: "Tészta, rizs", count: "3 tétel", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=600&q=80" },
  { title: "Fűszerek", count: "6 tétel", image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=600&q=80" },
  { title: "Konzervek", count: "4 tétel", image: "https://images.unsplash.com/photo-1584473457493-17c1c9f8a4f9?auto=format&fit=crop&w=600&q=80" },
  { title: "Egyéb", count: "2 tétel", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=600&q=80" },
] as const;

const FALLBACK_ITEMS = ["Zabpehely", "Lencse", "Tészta", "Paradicsompüré", "Olívaolaj", "Liszt"];
const IDEA_RECIPES = [
  { title: "Krémes gombás tészta", meta: "60 perc • 6 alapanyag", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80" },
  { title: "Lencsefőzelék", meta: "35 perc • 8 alapanyag", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80" },
  { title: "Paradicsomos tészta", meta: "25 perc • 5 alapanyag", image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80" },
] as const;

export default function KamraDesktopView() {
  const { pantryItems, shoppingItems, hydrated } = useMealData();
  const pantryCount = pantryItems.length || 24;
  const lowStockCount = shoppingItems.length || 6;
  const listCount = shoppingItems.length || 8;
  const ingredientItems = (hydrated && pantryItems.length ? pantryItems : FALLBACK_ITEMS).slice(0, 6);

  return (
    <div className="mx-auto hidden w-full max-w-[1600px] flex-col gap-5 px-4 py-4 md:flex md:px-6 md:py-5 lg:px-8">
      <WelcomeHeader />

      <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,251,244,0.98),rgba(246,228,203,0.72))] px-6 py-6 shadow-[0_26px_70px_-34px_rgba(61,49,34,0.24)]">
        <div
          className="absolute inset-y-0 right-0 w-[42%] bg-cover bg-center"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80)" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,251,244,0.98),rgba(255,251,244,0.86)_56%,rgba(255,251,244,0.12))]" />
        <div className="relative">
          <h1 className="text-[56px] font-semibold leading-none tracking-[-0.06em] text-[var(--ff-text)]">Kamra</h1>
          <p className="mt-3 max-w-[42rem] text-[20px] text-[var(--ff-text-muted)]">Kövesd, mi van otthon, és soha ne fogyjon el, amire szükséged van.</p>

          <div className="mt-7 grid grid-cols-4 gap-4">
            <div className="rounded-[28px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.94)] px-5 py-5 shadow-[0_22px_40px_-28px_rgba(61,49,34,0.18)]">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[rgba(221,230,211,0.72)] text-[var(--ff-primary)]">
                  <span className="material-symbols-outlined text-[32px]">inventory_2</span>
                </div>
                <div>
                  <p className="text-[42px] font-semibold leading-none tracking-[-0.05em] text-[var(--ff-text)]">{pantryCount}</p>
                  <p className="mt-1 text-[16px] font-semibold text-[var(--ff-text)]">alapanyag</p>
                  <p className="mt-1 text-[14px] text-[var(--ff-text-muted)]">Összesen a kamrában</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.94)] px-5 py-5 shadow-[0_22px_40px_-28px_rgba(61,49,34,0.18)]">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[rgba(248,220,198,0.78)] text-[var(--ff-caramel-strong)]">
                  <span className="material-symbols-outlined text-[32px]">schedule</span>
                </div>
                <div>
                  <p className="text-[42px] font-semibold leading-none tracking-[-0.05em] text-[var(--ff-text)]">{lowStockCount}</p>
                  <p className="mt-1 text-[16px] font-semibold text-[var(--ff-text)]">hamarosan elfogy</p>
                  <p className="mt-1 text-[14px] text-[var(--ff-text-muted)]">Érdemes pótolni</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.94)] px-5 py-5 shadow-[0_22px_40px_-28px_rgba(61,49,34,0.18)]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[rgba(255,240,227,0.76)] text-[var(--ff-caramel-strong)]">
                    <span className="material-symbols-outlined text-[32px]">event_note</span>
                  </div>
                  <div>
                    <p className="text-[22px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Lista {listCount} tétel</p>
                    <p className="mt-1 text-[14px] text-[var(--ff-text-muted)]">Következő bevásárlásod</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[24px] text-[var(--ff-text-soft)]">chevron_right</span>
              </div>
            </div>

            <button className="rounded-[28px] bg-[linear-gradient(135deg,#ea9438,#de7f24)] px-6 py-5 text-left text-[var(--ff-text-inverse)] shadow-[0_24px_38px_-24px_rgba(185,130,71,0.42)]">
              <div className="flex items-center gap-3 text-[18px] font-semibold">
                <span className="material-symbols-outlined text-[28px]">autorenew</span>
                Kamra frissítése
              </div>
              <p className="mt-3 text-[14px] text-[rgba(255,249,237,0.92)]">Utoljára frissítve: ma 18:30</p>
            </button>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <div className="flex min-w-[540px] items-center gap-3 rounded-[24px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.9)] px-5 py-4 shadow-[0_18px_34px_-24px_rgba(61,49,34,0.16)]">
          <span className="material-symbols-outlined text-[24px] text-[var(--ff-text-muted)]">search</span>
          <span className="text-[17px] text-[var(--ff-text-soft)]">Keresés az alapanyagok között...</span>
        </div>
        <div className="flex flex-1 items-center gap-3 overflow-hidden">
          {["Összes", "Gabona", "Hüvelyes", "Tészta, rizs", "Fűszerek", "Konzervek", "Egyéb"].map((filter, index) => (
            <button
              key={filter}
              className={`shrink-0 rounded-full px-5 py-3 text-[15px] font-semibold ${
                index === 0
                  ? "bg-[linear-gradient(145deg,rgba(153,165,99,0.96),rgba(129,145,79,0.96))] text-[var(--ff-text-inverse)] shadow-[0_16px_28px_-18px_rgba(61,49,34,0.24)]"
                  : "border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.88)] text-[var(--ff-text)]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 rounded-full border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.88)] px-5 py-3 text-[15px] font-medium text-[var(--ff-text-muted)]">
          Állapot
          <span className="material-symbols-outlined text-[20px]">expand_more</span>
        </button>
      </div>

      <section className="grid grid-cols-[0.9fr_1fr_0.78fr] gap-5">
        <div className="ff-glass-card rounded-[32px] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Kamra kategóriák</h2>
            <button className="flex items-center gap-2 text-[15px] font-medium text-[var(--ff-text-muted)]">
              Összes megtekintése
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {CATEGORY_CARDS.map((item) => (
              <div key={item.title} className="flex items-center gap-4 rounded-[24px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.84)] px-4 py-4">
                <div className="h-20 w-20 overflow-hidden rounded-[18px] bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[16px] font-semibold text-[var(--ff-text)]">{item.title}</h3>
                  <p className="mt-1 text-[14px] text-[var(--ff-text-muted)]">{item.count}</p>
                </div>
                <span className="material-symbols-outlined text-[22px] text-[var(--ff-text-soft)]">chevron_right</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ff-glass-card rounded-[32px] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Alapanyagok</h2>
            <button className="flex items-center gap-2 text-[15px] font-medium text-[var(--ff-text-muted)]">
              Rendezés
              <span className="material-symbols-outlined text-[20px]">sort</span>
            </button>
          </div>
          <div className="space-y-3">
            {ingredientItems.map((item, index) => {
              const state =
                index === 2 ? { label: "kevés", tone: "bg-[rgba(255,240,227,0.84)] text-[var(--ff-caramel-strong)]", note: "kb. 2 adag" } :
                index === ingredientItems.length - 1 ? { label: "elfogyott", tone: "bg-[rgba(248,220,198,0.78)] text-[var(--ff-caramel-strong)]", note: "" } :
                { label: "van otthon", tone: "bg-[rgba(221,230,211,0.72)] text-[var(--ff-primary-soft)]", note: "" };
              return (
                <div key={item} className="grid grid-cols-[56px_minmax(0,1fr)_110px_26px] items-center gap-4 rounded-[22px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.84)] px-4 py-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[rgba(255,249,237,0.92)] text-[28px]">
                    {index % 2 === 0 ? "🥫" : "🫙"}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[var(--ff-text)]">{item}</h3>
                    <p className="mt-1 text-[14px] text-[var(--ff-text-muted)]">{index % 2 === 0 ? "500 g" : "1 kg"}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-[12px] font-semibold ${state.tone}`}>{state.label}</span>
                    {state.note ? <p className="mt-1 text-[12px] text-[var(--ff-text-soft)]">{state.note}</p> : null}
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-[var(--ff-text-soft)]">chevron_right</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ff-glass-card rounded-[32px] p-5">
          <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Főzz abból, ami van</h2>
          <p className="mt-1 text-[15px] text-[var(--ff-text-muted)]">Ötletek a kamrádból</p>

          <div className="mt-4 overflow-hidden rounded-[26px] border border-[rgba(74,67,54,0.08)]">
            <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${IDEA_RECIPES[0].image})` }} />
            <div className="bg-[linear-gradient(180deg,rgba(72,57,37,0.82),rgba(72,57,37,0.92))] px-5 py-5 text-[var(--ff-text-inverse)]">
              <h3 className="text-[30px] font-semibold leading-none tracking-[-0.04em]">{IDEA_RECIPES[0].title}</h3>
              <p className="mt-3 text-[15px] text-[rgba(255,249,237,0.88)]">{IDEA_RECIPES[0].meta}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {IDEA_RECIPES.slice(1).map((item) => (
              <div key={item.title} className="grid grid-cols-[70px_minmax(0,1fr)_34px] items-center gap-3 rounded-[22px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.84)] px-3 py-3">
                <div className="h-16 overflow-hidden rounded-[16px] bg-cover bg-center" style={{ backgroundImage: `url(${item.image})` }} />
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--ff-text)]">{item.title}</h3>
                  <p className="mt-1 text-[13px] text-[var(--ff-text-muted)]">{item.meta}</p>
                </div>
                <span className="material-symbols-outlined text-[20px] text-[var(--ff-text-soft)]">chevron_right</span>
              </div>
            ))}
          </div>

          <button className="mt-4 flex w-full items-center justify-between rounded-full bg-[linear-gradient(145deg,rgba(221,230,211,0.92),rgba(238,243,231,0.92))] px-5 py-4 text-[16px] font-semibold text-[var(--ff-primary)]">
            További ötletek felfedezése
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
        </div>
      </section>

      <section className="ff-glass-card flex items-center justify-between gap-6 rounded-[30px] px-6 py-5">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">{lowStockCount} alapanyag hamarosan elfogy</h2>
          <p className="mt-2 text-[15px] text-[var(--ff-text-muted)]">Nézd meg, mit érdemes pótolni a következő bevásárlásnál.</p>
        </div>
        <div className="flex items-center gap-2">
          {["🫙", "🥫", "🫒", "🌾"].map((item) => (
            <div key={item} className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,249,237,0.92)] text-[22px]">
              {item}
            </div>
          ))}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,249,237,0.92)] text-[16px] font-semibold text-[var(--ff-text-muted)]">+2</div>
        </div>
        <button className="flex min-w-[280px] items-center justify-between rounded-full bg-[linear-gradient(135deg,#ea9438,#de7f24)] px-6 py-4 text-[18px] font-semibold text-[var(--ff-text-inverse)] shadow-[0_24px_38px_-24px_rgba(185,130,71,0.42)]">
          Lista megnyitása
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--ff-caramel-strong)]">
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </span>
        </button>
      </section>
    </div>
  );
}
