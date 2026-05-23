"use client";

import LogoutButton from "@/components/auth/LogoutButton";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGreetingHeader from "@/components/mobile/MobileGreetingHeader";
import { getUserImportedRecipes } from "@/lib/recipes/user-import.provider";

const IMPORTED_RECIPES = getUserImportedRecipes();
const RECIPES_WITHOUT_GENERATED_IMAGE = IMPORTED_RECIPES.filter((recipe) => recipe.imageStrategy !== "generated");
const MISSING_IMAGE_PREVIEW = RECIPES_WITHOUT_GENERATED_IMAGE.slice(0, 5);

const SETTINGS_ITEMS = [
  { icon: "person", label: "Profil adatok" },
  { icon: "group", label: "Családtagok kezelése" },
  { icon: "notifications", label: "Értesítések" },
  { icon: "light_mode", label: "Megjelenés", value: "Világos mód" },
  { icon: "language", label: "Nyelv", value: "Magyar" },
];

export default function BeallitasokMobileView() {
  return (
    <div className="relative min-h-screen bg-[var(--ff-bg)] md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,249,237,0.98),transparent_24%),radial-gradient(circle_at_top_right,rgba(238,243,231,0.82),transparent_30%),linear-gradient(180deg,#fffdf8_0%,#f8f2e8_100%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[430px] flex-col px-4 pb-32 pt-4">
        <MobileGreetingHeader />

        <section className="mb-6 flex items-center gap-5 rounded-[32px] border border-white/84 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(255,248,235,0.94))] px-5 py-6 shadow-[0_22px_40px_-28px_rgba(61,49,34,0.2)]">
          <div className="flex h-[96px] w-[96px] items-center justify-center rounded-full bg-[linear-gradient(145deg,rgba(238,243,231,0.98),rgba(255,240,227,0.92))] text-[34px] font-semibold text-[var(--ff-primary)]">
            N
          </div>
          <div className="min-w-0">
            <h2 className="text-[19px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Norbi</h2>
            <p className="mt-1 text-[14px] text-[var(--ff-text-muted)]">norbi@familyflow.app</p>
          </div>
        </section>

        <section className="rounded-[34px] border border-white/84 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(255,248,235,0.94))] px-5 py-2 shadow-[0_22px_40px_-28px_rgba(61,49,34,0.2)]">
          {SETTINGS_ITEMS.map((item, index) => (
            <div
              key={item.label}
              className={`flex items-center justify-between gap-3 py-6 ${index < SETTINGS_ITEMS.length - 1 ? "border-b border-[rgba(74,67,54,0.08)]" : ""}`}
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[29px] text-[var(--ff-primary-soft)]">{item.icon}</span>
                <span className="text-[16px] font-medium text-[var(--ff-text)]">{item.label}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--ff-text-soft)]">
                {item.value ? <span className="text-[15px]">{item.value}</span> : null}
                <span className="material-symbols-outlined text-[22px]">chevron_right</span>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-[34px] border border-white/84 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(255,248,235,0.94))] px-5 py-5 shadow-[0_22px_40px_-28px_rgba(61,49,34,0.2)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">Receptképek</h2>
              <p className="mt-1 text-[14px] text-[var(--ff-text-muted)]">Saját kép helyett még fallbacket használó receptek.</p>
            </div>
            <span className="rounded-full bg-[rgba(246,248,236,0.96)] px-3 py-1.5 text-[13px] font-semibold text-[var(--ff-primary-soft)]">
              {RECIPES_WITHOUT_GENERATED_IMAGE.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {MISSING_IMAGE_PREVIEW.map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center justify-between gap-3 rounded-[20px] bg-[rgba(255,249,237,0.84)] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-[var(--ff-text)]">{recipe.name}</p>
                  <p className="mt-1 text-[12px] text-[var(--ff-text-muted)]">{recipe.sourceName ?? "Importált recept"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[var(--ff-text-muted)]">
                  {recipe.imageStrategy === "source-fallback" ? "Forráskép" : "Placeholder"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <LogoutButton className="mt-6 w-full rounded-[28px] border border-white/84 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(255,248,235,0.94))] px-5 py-5 shadow-[0_22px_40px_-28px_rgba(61,49,34,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[var(--ff-caramel-strong)]">
              <span className="material-symbols-outlined text-[30px]">logout</span>
              <span className="text-[16px] font-semibold">Kijelentkezés</span>
            </div>
            <span className="material-symbols-outlined text-[22px] text-[var(--ff-text-soft)]">chevron_right</span>
          </div>
        </LogoutButton>
      </main>

      <MobileBottomNav />
    </div>
  );
}
