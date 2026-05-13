"use client";

import { useMealData } from "@/hooks/useMealData";
import ShoppingNeeds from "@/components/etkezes/ShoppingNeeds";

export default function BevasarlasClient() {
  const { shoppingItems, hydrated } = useMealData();

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
      <section className="ff-glass-card-warm rounded-[var(--ff-radius-lg)] px-4 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--ff-text-soft)]">Bevásárlás</p>
        <h1 className="mt-1 text-xl font-semibold text-[var(--ff-text)]">A tervhez tartozó lista</h1>
        <p className="mt-1 text-sm text-[var(--ff-text-muted)]">
          Amit az étkezési terv még igényel, itt egy helyen átnézhető.
        </p>
      </section>

      {!hydrated && (
        <div className="ff-glass-card rounded-[var(--ff-radius-md)] px-4 py-3 text-sm text-[var(--ff-text-soft)]">
          Adatok betöltése...
        </div>
      )}

      <ShoppingNeeds items={shoppingItems} />
    </div>
  );
}
