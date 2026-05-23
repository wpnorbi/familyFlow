export type ExternalRecipeContentMode =
  | "external-link-catalog"
  | "original-family-flow-version-inspired-by-title"
  | "source-faithful-family-flow-adaptation";

export type ExternalRecipeDifficulty = "Könnyű" | "Közepes" | "Nehéz" | null;

export type ExternalRecipeImage =
  | {
      type: "placeholder-or-ai-generated";
      url: string | null;
      aiPrompt: string;
    }
  | {
      type: "user-uploaded";
      url: string;
      aiPrompt?: never;
    }
  | {
      type: "licensed-stock";
      url: string;
      aiPrompt?: string;
    }
  | {
      type: "external-source-url";
      url: string;
      aiPrompt?: never;
    };

export interface ExternalRecipeIngredient {
  name: string;
  amount?: number | string;
  unit?: string;
  note?: string;
  optional?: boolean;
}

export interface ExternalRecipeIngredientGroup {
  name: string;
  items: ExternalRecipeIngredient[];
}

export interface ExternalRecipeImportItem {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  contentMode: ExternalRecipeContentMode;
  difficulty: ExternalRecipeDifficulty;
  totalTimeMinutes: number | null;
  servings: number | null;
  category: string;
  tags: string[];
  safeShortDescription: string;
  image: ExternalRecipeImage;
  imageStrategy:
    | "use-generated-image"
    | "use-source-image-as-private-fallback"
    | "use-placeholder";
  ingredientGroups: ExternalRecipeIngredientGroup[];
  sourcePreparationSteps?: string[];
  customPreparationSteps: string[];
  familyNotes: string;
  kidFriendlyNotes: string;
  shoppingListReady: boolean;
  openOriginalRecipeLabel: string;
}

export interface ExternalRecipeImportPackage {
  schemaVersion: string;
  createdAt: string;
  source: {
    name: string;
    baseUrl: string;
    importMode: "external-reference-with-original-family-flow-version";
    contentPolicy: string[];
  };
  recipes: ExternalRecipeImportItem[];
}
