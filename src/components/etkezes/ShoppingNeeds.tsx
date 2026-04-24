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
      <div className="min-h-[180px] rounded-[24px] border border-surface-variant/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,244,239,0.92))] p-5 shadow-[0_14px_28px_-26px_rgba(34,27,19,0.22)] flex flex-col items-center justify-center text-center gap-2.5">
        <span
          className="material-symbols-outlined text-3xl text-secondary"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 100" }}
        >
          shopping_cart
        </span>
        <div>
          <p className="font-semibold text-on-surface mb-1 text-sm">Most még minden nyugodt</p>
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
            Amint bekerül egy recept a tervbe, a hiányzó hozzávalók természetesen ide rendeződnek.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            <span className="rounded-full border border-primary/15 bg-primary/[0.08] px-2.5 py-1 text-[10px] font-semibold text-primary">
              Recept hozzáadása
            </span>
            <span className="rounded-full border border-white/75 bg-white/85 px-2.5 py-1 text-[10px] font-medium text-on-surface-variant">
              Egyetlen tervből már lista is lesz
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-surface-variant/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(250,244,239,0.94))] p-5 shadow-[0_16px_30px_-28px_rgba(34,27,19,0.24)]">
      <div className="absolute top-0 right-0 h-28 w-28 rounded-bl-full bg-secondary-fixed/25 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-outline uppercase tracking-widest mb-1">
              A tervből következik
            </p>
            <p className="text-base font-semibold text-on-surface">
              Bevásárlólista
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              <span className="font-semibold text-on-surface">{remaining.length}</span>
              {" "}/ {items.length} tétel hiányzik
            </p>
          </div>
          {checked.size > 0 && (
            <span className="text-[10px] font-bold text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full border border-primary/15">
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
                  className="w-full flex items-center gap-2.5 rounded-[14px] p-2.5 hover:bg-white/90 transition-colors cursor-pointer group text-left"
                >
                  <div
                    className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      done
                        ? "bg-primary border-primary"
                        : "border-outline-variant group-hover:border-primary/50"
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
                      done ? "line-through text-outline" : "text-on-background"
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
          <div className="flex items-center gap-2 text-primary text-xs font-semibold pt-0.5">
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
