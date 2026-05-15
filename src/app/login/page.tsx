import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Belépés — Family Flow",
  description: "Belépés a Family Flow családi irányítóközpontba.",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--ff-bg)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,249,237,0.98),transparent_24%),radial-gradient(circle_at_top_right,rgba(238,243,231,0.82),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(246,228,203,0.74),transparent_26%),linear-gradient(180deg,#fffdf8_0%,#f8f2e8_100%)]" />

      <div className="relative grid w-full max-w-[1100px] gap-6 rounded-[38px] border border-white/80 bg-[rgba(255,251,244,0.78)] p-4 shadow-[0_44px_110px_-62px_rgba(50,34,14,0.42)] backdrop-blur-[24px] md:grid-cols-[1.04fr_0.96fr] md:p-6">
        <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,rgba(55,67,50,0.96),rgba(94,113,87,0.92)_42%,rgba(185,130,71,0.84)_100%)] px-6 py-7 text-[var(--ff-text-inverse)] md:px-8 md:py-9">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,245,226,0.26),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(244,224,192,0.18),transparent_28%)]" />

          <div className="relative max-w-[420px]">
            <span className="inline-flex rounded-full bg-[rgba(255,249,237,0.18)] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[rgba(255,249,237,0.92)]">
              Family Flow
            </span>
            <h1 className="mt-6 text-[42px] font-semibold leading-[0.95] tracking-[-0.06em] md:text-[52px]">
              Saját családi
              <br />
              command center
            </h1>
            <p className="mt-4 max-w-[340px] text-[16px] leading-relaxed text-[rgba(255,249,237,0.82)]">
              Privát hozzáférés a heti étkezésekhez, programokhoz, kamrához és napi rutinhoz.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "Étkezéstervezés valódi receptjavaslatokkal",
                "Családi programok és napi ritmus egy helyen",
                "Kamra és bevásárlólista saját használatra védve",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[18px] border border-[rgba(255,249,237,0.14)] bg-[rgba(255,249,237,0.10)] px-4 py-3"
                >
                  <span className="material-symbols-outlined text-[18px] text-[rgba(255,230,183,0.95)]">check_circle</span>
                  <span className="text-[14px] text-[rgba(255,249,237,0.92)]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,252,244,0.98),rgba(246,235,216,0.88))] px-6 py-7 shadow-[0_22px_48px_-34px_rgba(61,49,34,0.26)] md:px-8 md:py-9">
          <div className="mx-auto max-w-[420px]">
            <span className="inline-flex rounded-full bg-[rgba(221,230,211,0.88)] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--ff-primary)]">
              Privát belépés
            </span>
            <h2 className="mt-5 text-[34px] font-semibold tracking-[-0.05em] text-[var(--ff-text)] md:text-[40px]">
              Lépj be a Family Flow-ba
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ff-text-muted)]">
              Csak bejelentkezés után érhető el az alkalmazás teljes tartalma és a családi állapot mentése.
            </p>

            <div className="mt-8">
              <Suspense
                fallback={
                  <div className="rounded-[20px] bg-[rgba(255,249,237,0.78)] px-4 py-5 text-[14px] text-[var(--ff-text-muted)]">
                    Belépési felület betöltése...
                  </div>
                }
              >
                <LoginForm />
              </Suspense>
            </div>

            <div className="mt-5 rounded-[18px] bg-[rgba(255,249,237,0.78)] px-4 py-3 text-[13px] leading-relaxed text-[var(--ff-text-muted)]">
              Első körben az admin felületen létrehozott Supabase felhasználóval lehet belépni.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
