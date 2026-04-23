import type { MealBatch, Recipe, WeekDay } from "@/types/etkezes";

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const RECIPES: Recipe[] = [
  {
    id: "zabkasa",
    name: "Zabkása bogyós gyümölcsökkel",
    duration: 10,
    category: "Reggeli",
    protein: "vegetáriánus",
    description: "Krémes zabkása friss bogyós gyümölcsökkel és mézzel.",
    ingredients: ["Zab", "Tej", "Áfonya", "Málna", "Méz", "Fahéj"],
    tags: ["vegetáriánus", "gyors"],
  },
  {
    id: "avokado-piritos",
    name: "Avokádó pirítós tojással",
    duration: 15,
    category: "Reggeli",
    protein: "vegetáriánus",
    description: "Ropogós pirítós friss avokádóval és buggyantott tojással.",
    ingredients: ["Kenyér", "Avokádó", "Tojás", "Citromlé", "Chili", "Só"],
    tags: ["gyors"],
  },
  {
    id: "sajtos-omlett",
    name: "Sajtos-sonkás omlett",
    duration: 10,
    category: "Reggeli",
    protein: "egyéb",
    description: "Gyors és tápláló reggelire, pár hozzávalóból.",
    ingredients: ["Tojás", "Sajt", "Sonka", "Tejföl", "Só", "Bors"],
    tags: ["gyors", "protein"],
  },
  {
    id: "joghurt-granola",
    name: "Görög joghurt granolával",
    duration: 5,
    category: "Reggeli",
    protein: "vegetáriánus",
    description: "Krémes joghurt ropogós granolával és friss gyümölcsökkel.",
    ingredients: ["Görög joghurt", "Granola", "Eper", "Banán", "Méz"],
    tags: ["gyors", "vegetáriánus"],
  },
  {
    id: "lazac",
    name: "Citromos-Fokhagymás Sült Lazac",
    duration: 35,
    category: "Főétel",
    protein: "hal",
    description: "Sült lazac spárgával és citromos quinoa körettel.",
    ingredients: ["Lazac", "Citrom", "Fokhagyma", "Spárga", "Olívaolaj", "Kapor"],
    tags: ["hal", "protein"],
  },
  {
    id: "teszta",
    name: "Házi Paradicsomos Tészta",
    duration: 40,
    category: "Főétel",
    protein: "vegetáriánus",
    description: "Klasszikus paradicsomos tészta friss bazsalikommal és parmezánnal.",
    ingredients: ["Tészta", "Paradicsom", "Bazsalikom", "Fokhagyma", "Olívaolaj", "Parmezán"],
    tags: ["vegetáriánus", "család"],
  },
  {
    id: "quinoa",
    name: "Quinoa Tál pirított zöldségekkel",
    duration: 30,
    category: "Főétel",
    protein: "vegetáriánus",
    description: "Tápláló quinoa tál szezonális zöldségekkel és citromos öntettel.",
    ingredients: ["Quinoa", "Paprika", "Cukkini", "Hagyma", "Olívaolaj", "Fűszerek"],
    tags: ["vegetáriánus", "egészséges"],
  },
  {
    id: "gombaleves",
    name: "Krémes Gombaleves",
    duration: 45,
    category: "Leves",
    protein: "vegetáriánus",
    description: "Selymes krémleves friss csiperkegombából, kakukkfűvel.",
    ingredients: ["Csiperkegomba", "Tejszín", "Vöröshagyma", "Kakukkfű", "Vaj", "Zöldségleves"],
    tags: ["vegetáriánus", "leves"],
  },
  {
    id: "steak",
    name: "Rozmaringos Steak",
    duration: 25,
    category: "Főétel",
    protein: "marha",
    description: "Tökéletesen elkészített steak rozmaringgal és fokhagymás vajjal.",
    ingredients: ["Marhahús", "Rozmaring", "Vaj", "Fokhagyma", "Só", "Bors"],
    tags: ["hús", "protein"],
  },
  {
    id: "avokado-tal",
    name: "Nyári Avokádó Tál",
    duration: 15,
    category: "Főétel",
    protein: "vegetáriánus",
    description: "Frissítő avokádó tál mediterrán ízekkel, feta sajttal.",
    ingredients: ["Avokádó", "Paradicsom", "Uborka", "Feta", "Citromlé", "Olívaolaj"],
    tags: ["vegetáriánus", "gyors", "egészséges"],
  },
  {
    id: "csirke-curry",
    name: "Krémes Csirke Curry",
    duration: 45,
    category: "Főétel",
    protein: "csirke",
    description: "Aromás indiai curry csirkével, kókusztejjel és jázmin rizzsel.",
    ingredients: ["Csirkemell", "Kókusztej", "Curry por", "Paradicsom", "Rizs", "Koriander"],
    tags: ["hús", "fűszeres"],
  },
  {
    id: "ramen",
    name: "Japán Ramen lágy tojással",
    duration: 30,
    category: "Leves",
    protein: "egyéb",
    description: "Melegítő ramen leves gazdag alaplével és lágy főtt tojással.",
    ingredients: ["Ramen tészta", "Tojás", "Shiitake gomba", "Spenót", "Szójaszósz", "Gyömbér"],
    tags: ["leves", "ázsiai"],
  },
  {
    id: "csirkesutemeny",
    name: "Sütőben sült csirkecomb",
    duration: 55,
    category: "Főétel",
    protein: "csirke",
    description: "Ropogós bőrű csirkecomb fűszeres páccal és sült burgonyával.",
    ingredients: ["Csirkecomb", "Fokhagyma", "Rozmaring", "Burgonya", "Olívaolaj", "Paprika"],
    tags: ["hús", "sütő"],
  },
];

export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

export function getBatchRecipe(batch: MealBatch): Recipe | undefined {
  return batch.recipeSnapshot ?? getRecipeById(batch.recipeId);
}

export function getWeekDays(): WeekDay[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const names = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];
  const shortNames = ["H", "K", "Sz", "Cs", "P", "Szo", "V"];

  return names.map((name, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    return { dateKey: toDateKey(date), name, shortName: shortNames[i], date, isToday };
  });
}

export const INITIAL_BATCHES: MealBatch[] = [];

export function getBatchesForDate(batches: MealBatch[], dateKey: string): MealBatch[] {
  return batches.filter((b) => b.eatDates.includes(dateKey));
}

export function getCookBatchForDate(batches: MealBatch[], dateKey: string): MealBatch | undefined {
  return batches.find((b) => b.cookDate === dateKey);
}

export function getUpcomingBatches(
  batches: MealBatch[],
  fromDateKey: string,
  limit = 5
): { batch: MealBatch; nextEatDate: string }[] {
  return batches
    .flatMap((b) => {
      const nextEatDate = b.eatDates.find((d) => d >= fromDateKey);
      return nextEatDate ? [{ batch: b, nextEatDate }] : [];
    })
    .sort((a, b) => a.nextEatDate.localeCompare(b.nextEatDate))
    .slice(0, limit);
}
