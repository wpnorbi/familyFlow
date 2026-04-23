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
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-dashed border-surface-variant flex flex-col items-center justify-center text-center min-h-[200px] gap-3">
        <span
          className="material-symbols-outlined text-3xl text-outline"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 100" }}
        >
          shopping_cart
        </span>
        <div>
          <p className="font-semibold text-on-surface mb-1">Bevásárlólista üres</p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Amikor kaját adsz hozzá, az alapanyagok automatikusan ide kerülnek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 border border-secondary-fixed-dim/40 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-28 h-28 bg-secondary-fixed/20 rounded-bl-full -z-0 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-outline uppercase tracking-widest mb-1">
              Bevásárlólista
            </p>
            <p className="text-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">{remaining.length}</span>
              {" "}/ {items.length} tétel hiányzik
            </p>
          </div>
          {checked.size > 0 && (
            <span className="text-[11px] font-bold text-primary bg-primary-fixed/50 px-2 py-1 rounded-full">
              {checked.size} megvan
            </span>
          )}
        </div>

        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const done = checked.has(item);
            return (
              <li key={item}>
                <button
                  onClick={() => toggle(item)}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-surface-container rounded-xl transition-colors cursor-pointer group text-left"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
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
                    className={`flex-1 text-sm font-medium transition-colors ${
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
          <div className="flex items-center gap-2 text-primary text-sm font-semibold pt-1">
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
