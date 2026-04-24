import { getRecipeImageDataUri } from "@/lib/recipes/recipe-image";
import type { Recipe } from "@/types/etkezes";

interface Props {
  recipe: Recipe;
  className?: string;
  alt?: string;
}

export default function RecipeImage({ recipe, className = "", alt }: Props) {
  return (
    <img
      src={recipe.image ?? getRecipeImageDataUri(recipe)}
      alt={alt ?? recipe.name}
      className={className}
    />
  );
}
