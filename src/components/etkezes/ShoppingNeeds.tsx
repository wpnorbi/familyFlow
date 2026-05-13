"use client";

import { useState } from "react";

interface Props {
  items: string[];
}

export default function ShoppingNeeds({ items }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const remaining = items.filter((i) => !checked.has(i));

  if (items.length === 0) {
    return (
      <div className="ff-glass-card min-h-[180px] flex flex-col items-center justify-center gap-2.5 rounded-[var(--ff-radius-lg)] p-5 text-center">
        <span
          className="material-symbols-outlined text-3xl text-[var(--ff-caramel)]"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 100" }}
        >
          shopping_cart
        </span>
        <div>
          <p className="mb-1 text-sm font-semibold text-[var(--ff-text)]">Most még minden nyugodt</p>
          <p className="max-w-sm text-xs leading-relaxed text-[var(--ff-text-muted)]">
            Amint bekerül egy recept a tervbe, a hiányzó hozzávalók természetesen ide rendeződnek.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <span className="ff-chip px-2.5 py-1 text-[10px] font-semibold text-[var(--ff-primary)]">
              Recept hozzáadása
            </span>
            <span className="ff-chip px-2.5 py-1 text-[10px] font-medium">
              Egyetlen tervből már lista is lesz
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-glass-card-priority relative overflow-hidden rounded-[var(--ff-radius-lg)] p-5">
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-[var(--ff-peach-soft)] blur-2xl" />

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[var(--ff-text-soft)]">
              A tervből következik
            </p>
            <p className="text-base font-semibold text-[var(--ff-text)]">
              Bevásárlólista
            </p>
            <p className="mt-0.5 text-xs text-[var(--ff-text-muted)]">
              <span className="font-semibold text-[var(--ff-text)]">{remaining.length}</span>
              {" "}/ {items.length} tétel hiányzik
            </p>
          </div>
          {checked.size > 0 && (
            <span className="ff-chip px-2 py-0.5 text-[10px] font-bold text-[var(--ff-primary)]">
              {checked.size} megvan
            </span>
          )}
        </div>

        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const done = checked.has(item);
            return (
              <li key={item}>
                <button
                  onClick={() => toggle(item)}
                  className="group flex w-full items-center gap-2.5 rounded-[14px] p-2.5 text-left transition-colors hover:bg-[rgba(255,252,244,0.9)] cursor-pointer"
                >
                  <div
                    className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      done
                        ? "border-[var(--ff-primary)] bg-[var(--ff-primary)]"
                        : "border-[rgba(111,106,96,0.22)] group-hover:border-[var(--ff-primary-soft)]"
                    }`}
                  >
                    {done && (
                      <span
                        className="material-symbols-outlined text-white text-[13px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check
                      </span>
                    )}
                  </div>
                  <span
                    className={`flex-1 text-xs font-medium transition-colors ${
                      done ? "line-through text-[var(--ff-text-soft)]" : "text-[var(--ff-text)]"
                    }`}
                  >
                    {item}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {remaining.length === 0 && items.length > 0 && (
          <div className="flex items-center gap-2 pt-0.5 text-xs font-semibold text-[var(--ff-primary)]">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            Minden megvan!
          </div>
        )}
      </div>
    </div>
  );
}
