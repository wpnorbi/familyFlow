export interface Recipe {
  id: string;
  sourceId?: string;
  name: string;
  duration: number; // perc
  category: string;
  protein: "csirke" | "hal" | "marha" | "sertés" | "vegetáriánus" | "egyéb";
  description: string;
  image?: string;
  ingredients: string[];
  instructions: string[];
  tags?: string[];
  source?: "local" | "hungarian-web" | "wikikonyvek" | "mek" | "user-import";
  sourceUrl?: string;
  area?: string;
  servings?: number;
}

// Egy főzési alkalom ami több napra szól
export interface MealBatch {
  id: string;
  recipeId: string;
  recipeSnapshot?: Recipe;
  cookDate: string;   // "YYYY-MM-DD" — mikor főzöd
  eatDates: string[]; // "YYYY-MM-DD"[] — mikor eszitek (beleértve cookDate)
}

export interface WeekDay {
  dateKey: string; // "YYYY-MM-DD"
  name: string;
  shortName: string;
  date: Date;
  isToday: boolean;
}
