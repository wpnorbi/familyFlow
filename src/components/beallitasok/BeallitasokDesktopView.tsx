import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import LogoutButton from "@/components/auth/LogoutButton";
import { getUserImportedRecipes } from "@/lib/recipes/user-import.provider";

const IMPORTED_RECIPES = getUserImportedRecipes();
const RECIPES_WITHOUT_GENERATED_IMAGE = IMPORTED_RECIPES.filter((recipe) => recipe.imageStrategy !== "generated");
const SOURCE_FALLBACK_RECIPES = RECIPES_WITHOUT_GENERATED_IMAGE.filter(
  (recipe) => recipe.imageStrategy === "source-fallback",
);
const PLACEHOLDER_RECIPES = RECIPES_WITHOUT_GENERATED_IMAGE.filter((recipe) => recipe.imageStrategy === "placeholder");
const MISSING_IMAGE_PREVIEW = RECIPES_WITHOUT_GENERATED_IMAGE.slice(0, 8);

const FAMILY_MEMBERS: Array<{ name: string; role: string; badge?: string }> = [
  { name: "Anna Kovács", role: "Családfő", badge: "Te" },
  { name: "Péter Kovács", role: "Szülő" },
  { name: "Lilla Kovács", role: "Gyerek" },
  { name: "Bence Kovács", role: "Gyerek" },
] as const;

const NOTIFICATIONS = [
  { label: "Új receptötletek", enabled: true },
  { label: "Kamra figyelmeztetések", enabled: true },
  { label: "Heti összegzés", enabled: true },
  { label: "Program emlékeztetők", enabled: true },
  { label: "Tippek és tanácsok", enabled: false },
] as const;

const ROUTINE_ITEMS = [
  { label: "Reggeli emlékeztető", time: "07:30", enabled: true },
  { label: "Uzsonna emlékeztető", time: "15:30", enabled: true },
  { label: "Vacsora emlékeztető", time: "18:30", enabled: true },
  { label: "Heti tervezés emlékeztető", time: "Vasárnap 17:00", enabled: true },
] as const;

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <span className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${enabled ? "bg-[rgba(153,165,99,0.92)]" : "bg-[rgba(74,67,54,0.12)]"}`}>
      <span className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-7" : "translate-x-1"}`} />
    </span>
  );
}

function DesktopCard({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="ff-glass-card rounded-[32px] p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(246,248,236,0.96)] text-[var(--ff-primary-soft)]">
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
          </div>
          <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[var(--ff-text)]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function BeallitasokDesktopView() {
  return (
    <div className="mx-auto hidden w-full max-w-[1600px] flex-col gap-5 px-4 py-4 md:flex md:px-6 md:py-5 lg:px-8">
      <WelcomeHeader />

      <section className="ff-glass-card rounded-[34px] px-6 py-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[56px] font-semibold leading-none tracking-[-0.06em] text-[var(--ff-text)]">Beállítások</h1>
            <p className="mt-3 text-[20px] text-[var(--ff-text-muted)]">Szabja személyre a Family Flow élményt az egész család számára.</p>
          </div>
          <button className="flex items-center gap-3 rounded-full bg-[rgba(246,248,236,0.92)] px-5 py-4 text-[16px] font-semibold text-[var(--ff-primary-soft)]">
            <span className="material-symbols-outlined text-[22px]">done</span>
            Változások mentése
          </button>
        </div>
      </section>

      <div className="grid grid-cols-[1.12fr_0.86fr_0.9fr] gap-5">
        <section className="ff-glass-card rounded-[32px] p-5">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[linear-gradient(145deg,rgba(238,243,231,0.98),rgba(255,240,227,0.92))] text-[40px] font-semibold text-[var(--ff-primary)]">
                N
              </div>
              <div>
                <h2 className="text-[32px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">Norbi</h2>
                <p className="mt-2 text-[18px] text-[var(--ff-text-muted)]">norbi@familyflow.app</p>
                <span className="mt-3 inline-flex rounded-full bg-[rgba(246,248,236,0.96)] px-4 py-2 text-[14px] font-semibold text-[var(--ff-primary-soft)]">Családfő</span>
              </div>
            </div>

            <button className="rounded-full border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.9)] px-5 py-3 text-[15px] font-semibold text-[var(--ff-text-muted)]">
              Profil szerkesztése
            </button>
          </div>

          <div className="mt-6 divide-y divide-[rgba(74,67,54,0.08)] rounded-[26px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)] px-5">
            <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 py-5">
              <span className="text-[16px] font-medium text-[var(--ff-text)]">Előfizetés</span>
              <span className="text-[16px] text-[var(--ff-text-muted)]">Family Flow Prémium</span>
              <button className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-primary-soft)]">Részletek <span className="material-symbols-outlined text-[18px]">arrow_forward</span></button>
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 py-5">
              <span className="text-[16px] font-medium text-[var(--ff-text)]">Család kódja</span>
              <span className="text-[16px] text-[var(--ff-text-muted)]">FAM-7X9Q</span>
              <button className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-primary-soft)]">Megosztás <span className="material-symbols-outlined text-[18px]">ios_share</span></button>
            </div>
          </div>
        </section>

        <DesktopCard
          title="Családtagok"
          icon="group"
          action={<button className="rounded-full border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.9)] px-5 py-3 text-[15px] font-semibold text-[var(--ff-text-muted)]">Hozzáadás</button>}
        >
          <div className="space-y-4">
            {FAMILY_MEMBERS.map((member) => (
              <div key={member.name} className="grid grid-cols-[44px_minmax(0,1fr)_80px_22px] items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(145deg,rgba(238,243,231,0.98),rgba(255,240,227,0.92))] text-[14px] font-bold text-[var(--ff-primary)]">
                  {member.name.slice(0, 1)}
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-[var(--ff-text)]">{member.name}</p>
                  <p className="text-[14px] text-[var(--ff-text-muted)]">{member.role}</p>
                </div>
                {member.badge ? <span className="rounded-full bg-[rgba(246,248,236,0.96)] px-3 py-1.5 text-center text-[13px] font-semibold text-[var(--ff-primary-soft)]">{member.badge}</span> : <span />}
                <span className="material-symbols-outlined text-[20px] text-[var(--ff-text-soft)]">chevron_right</span>
              </div>
            ))}
          </div>

          <button className="mt-5 flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-primary-soft)]">
            Család kezelése
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </DesktopCard>

        <DesktopCard title="Napi rutin" icon="calendar_month">
          <div className="space-y-4">
            {ROUTINE_ITEMS.map((item) => (
              <div key={item.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-[rgba(74,67,54,0.08)] pb-4 last:border-b-0 last:pb-0">
                <span className="text-[16px] font-medium text-[var(--ff-text)]">{item.label}</span>
                <span className="rounded-full bg-[rgba(255,249,237,0.88)] px-4 py-2 text-[14px] font-semibold text-[var(--ff-text-muted)]">{item.time}</span>
                <Toggle enabled={item.enabled} />
              </div>
            ))}
          </div>
          <button className="mt-5 flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-primary-soft)]">
            Rutin beállítások
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </DesktopCard>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <DesktopCard title="Értesítések" icon="notifications">
          <div className="space-y-4">
            {NOTIFICATIONS.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <span className="text-[16px] text-[var(--ff-text)]">{item.label}</span>
                <Toggle enabled={item.enabled} />
              </div>
            ))}
          </div>
          <button className="mt-5 flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-primary-soft)]">
            Értesítési beállítások
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </DesktopCard>

        <DesktopCard title="Étkezési preferenciák" icon="eco">
          <div className="space-y-4">
            <div className="rounded-[22px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)] px-4 py-4">
              <p className="text-[15px] font-medium text-[var(--ff-text)]">Étkezési stílus</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Mediterrán", "Magyaros", "Vegetáriánus"].map((tag) => (
                  <span key={tag} className="rounded-full bg-[rgba(246,248,236,0.96)] px-3 py-1.5 text-[13px] font-semibold text-[var(--ff-primary-soft)]">{tag}</span>
                ))}
              </div>
            </div>
            {[
              ["Allergiák és érzékenységek", "2 beállítva"],
              ["Kerülendő alapanyagok", "Nincs beállítva"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-[22px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)] px-4 py-4">
                <span className="text-[15px] font-medium text-[var(--ff-text)]">{label}</span>
                <span className="text-[14px] text-[var(--ff-text-muted)]">{value}</span>
              </div>
            ))}
          </div>
          <button className="mt-5 flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-primary-soft)]">
            Preferenciák kezelése
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </DesktopCard>

        <DesktopCard title="Gyerekbarát alapbeállítások" icon="sentiment_satisfied">
          <div className="space-y-4">
            {[
              "Gyerekbarát receptek elsődlegesen",
              "Ismerős alapanyagok előnyben",
              "Adagok életkor szerint",
            ].map((label) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[16px] font-medium text-[var(--ff-text)]">{label}</p>
                  <p className="mt-1 text-[13px] text-[var(--ff-text-muted)]">
                    {label === "Adagok életkor szerint" ? "Automatikus adagméret állítás" : "Egyszerűbb, kedvelt receptek megjelenítése"}
                  </p>
                </div>
                <Toggle enabled />
              </div>
            ))}
          </div>
          <button className="mt-5 flex items-center gap-2 text-[15px] font-semibold text-[var(--ff-primary-soft)]">
            Részletek és beállítások
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </DesktopCard>
      </div>

      <div className="grid grid-cols-[1.15fr_0.9fr_0.75fr] gap-5">
        <DesktopCard title="Receptképek" icon="photo_library">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Összes import</p>
              <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">{IMPORTED_RECIPES.length}</p>
            </div>
            <div className="rounded-[22px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,249,237,0.76)] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Forrás fallback</p>
              <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">{SOURCE_FALLBACK_RECIPES.length}</p>
            </div>
            <div className="rounded-[22px] border border-[rgba(74,67,54,0.08)] bg-[rgba(238,243,231,0.76)] px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ff-text-soft)]">Placeholder</p>
              <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[var(--ff-text)]">{PLACEHOLDER_RECIPES.length}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[rgba(74,67,54,0.08)] bg-[rgba(255,252,244,0.72)] p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-semibold text-[var(--ff-text)]">Még nincs saját generált kép</p>
                <p className="mt-1 text-[13px] text-[var(--ff-text-muted)]">
                  Ezek a receptek még forrásképet vagy placeholdert használnak.
                </p>
              </div>
              <span className="rounded-full bg-[rgba(246,248,236,0.96)] px-3 py-1.5 text-[13px] font-semibold text-[var(--ff-primary-soft)]">
                {RECIPES_WITHOUT_GENERATED_IMAGE.length} recept
              </span>
            </div>

            <div className="space-y-3">
              {MISSING_IMAGE_PREVIEW.map((recipe) => (
                <div
                  key={recipe.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-[18px] bg-[rgba(255,249,237,0.86)] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-[var(--ff-text)]">{recipe.name}</p>
                    <p className="mt-1 text-[13px] text-[var(--ff-text-muted)]">{recipe.sourceName ?? "Importált recept"}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--ff-text-muted)]">
                    {recipe.imageStrategy === "source-fallback" ? "Forráskép" : "Placeholder"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DesktopCard>

        <DesktopCard title="Megjelenés" icon="palette">
          <div>
            <p className="text-[15px] font-medium text-[var(--ff-text)]">Téma</p>
            <div className="mt-3 flex gap-3">
              {["Világos", "Nappali", "Sötét"].map((item, index) => (
                <button
                  key={item}
                  className={`rounded-[18px] px-6 py-4 text-[15px] font-semibold ${
                    index === 0
                      ? "border border-[rgba(234,148,56,0.34)] bg-[rgba(255,245,233,0.92)] text-[var(--ff-caramel-strong)]"
                      : "border border-[rgba(74,67,54,0.08)] bg-[rgba(255,251,244,0.88)] text-[var(--ff-text-muted)]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="mt-6 text-[15px] font-medium text-[var(--ff-text)]">Akcentus szín</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {["#b8b287", "#e59a43", "#8d673e", "#86633a", "#d98b3c", "#f7f1e6", "#d8c3d7", "#aeb6d2", "#e8a7b0"].map((color, index) => (
                <span key={color} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
                  {index === 4 ? <span className="material-symbols-outlined text-[18px] text-white">done</span> : null}
                </span>
              ))}
            </div>
          </div>
        </DesktopCard>

        <DesktopCard title="Adatok" icon="shield">
          <div className="space-y-4">
            {[
              ["Adatvédelem és adatkezelés", "Részletek"],
              ["Adat exportálása", "Letöltés"],
              ["Fiók törlése", "Törlés"],
            ].map(([label, action], index) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className={`text-[16px] ${index === 2 ? "text-[var(--ff-caramel-strong)]" : "text-[var(--ff-text)]"}`}>{label}</span>
                <button className={`text-[15px] font-semibold ${index === 2 ? "text-[var(--ff-caramel-strong)]" : "text-[var(--ff-primary-soft)]"}`}>{action}</button>
              </div>
            ))}
          </div>
        </DesktopCard>

        <section className="ff-glass-card relative overflow-hidden rounded-[32px] p-5">
          <div className="absolute bottom-0 right-0 text-[120px] opacity-[0.08]">❋</div>
          <h2 className="text-[34px] font-semibold tracking-[-0.05em] text-[var(--ff-text)]">Kérdése van?</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[var(--ff-text-muted)]">Segítünk, hogy a legtöbbet hozza ki a Family Flow-ból.</p>
          <button className="mt-10 flex items-center justify-between rounded-full bg-[linear-gradient(135deg,#ea9438,#de7f24)] px-6 py-4 text-[16px] font-semibold text-[var(--ff-text-inverse)] shadow-[0_24px_38px_-24px_rgba(185,130,71,0.42)]">
            Kapcsolatfelvétel
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <LogoutButton className="mt-4 flex w-full items-center justify-between rounded-[22px] border border-[rgba(196,74,54,0.16)] bg-[rgba(255,242,236,0.82)] px-5 py-4 text-left text-[rgba(181,67,48,0.92)]">
            <span className="flex items-center gap-3 text-[15px] font-semibold">
              <span className="material-symbols-outlined text-[22px]">logout</span>
              Kijelentkezés
            </span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </LogoutButton>
        </section>
      </div>
    </div>
  );
}
