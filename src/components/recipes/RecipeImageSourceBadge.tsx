import type { Recipe } from "@/types/etkezes";

export default function RecipeImageSourceBadge({
  recipe,
  className = "",
}: {
  recipe: Recipe;
  className?: string;
}) {
  if (recipe.imageStrategy !== "source-fallback") {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-[rgba(32,27,21,0.56)] px-3 py-1.5 text-[11px] font-bold tracking-[0.04em] text-white shadow-[0_10px_24px_-18px_rgba(0,0,0,0.55)] backdrop-blur-md ${className}`}
    >
      <span className="material-symbols-outlined text-[14px]">photo_library</span>
      Forráskép
    </span>
  );
}
