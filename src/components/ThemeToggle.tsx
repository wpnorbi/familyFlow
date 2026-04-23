"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "familyflow-theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

interface ThemeToggleProps {
  iconOnly?: boolean;
  className?: string;
}

export default function ThemeToggle({ iconOnly = false, className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    const nextTheme: ThemeMode = savedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setMounted(true);
  }, []);

  function handleToggle() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  const isDark = mounted ? theme === "dark" : false;
  const label = isDark ? "Váltás nappali módra" : "Váltás éjszakai módra";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={isDark ? "Nappali mód" : "Éjszakai mód"}
      className={className}
    >
      <span
        className="material-symbols-outlined text-[20px]"
        style={{ fontVariationSettings: isDark ? "'FILL' 1" : "'FILL' 0" }}
      >
        {isDark ? "light_mode" : "dark_mode"}
      </span>
      {!iconOnly && <span className="hidden sm:inline">{isDark ? "Nappali" : "Éjszakai"}</span>}
    </button>
  );
}
