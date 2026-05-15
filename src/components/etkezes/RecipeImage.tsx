"use client";

import { useEffect, useState } from "react";
import { getRecipeImageDataUri, getRecipeImageSrc } from "@/lib/recipes/recipe-image";
import type { Recipe } from "@/types/etkezes";

interface Props {
  recipe: Recipe;
  className?: string;
  alt?: string;
}

export default function RecipeImage({ recipe, className = "", alt }: Props) {
  const fallbackSrc = getRecipeImageDataUri(recipe);
  const initialSrc = getRecipeImageSrc(recipe);
  const [src, setSrc] = useState(initialSrc);

  useEffect(() => {
    setSrc(getRecipeImageSrc(recipe));
  }, [recipe, fallbackSrc]);

  return (
    <img
      src={src}
      alt={alt ?? recipe.name}
      className={className}
      onError={() => {
        if (src !== fallbackSrc) setSrc(fallbackSrc);
      }}
    />
  );
}
