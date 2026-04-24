"use client";

import { useMealData } from "@/hooks/useMealData";
import ShoppingNeeds from "@/components/etkezes/ShoppingNeeds";

export default function BevasarlasClient() {
  const { shoppingItems, hydrated } = useMealData();

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
      <section className="rounded-[22px] border border-surface-variant bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,244,239,0.93))] px-4 py-3.5 shadow-[0_14px_24px_-24px_rgba(34,27,19,0.2)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-outline">Bevásárlás</p>
        <h1 className="mt-1 text-xl font-bold text-on-background">A tervhez tartozó lista</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Amit az étkezési terv még igényel, itt egy helyen átnézhető.
        </p>
      </section>

      {!hydrated && (
        <div className="rounded-2xl border border-surface-variant/70 bg-white/92 px-4 py-3 text-sm text-outline">
          Adatok betöltése...
        </div>
      )}

      <ShoppingNeeds items={shoppingItems} />
    </div>
  );
}
