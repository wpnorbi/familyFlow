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
    instructions: [
      "Forrald fel a tejet egy kisebb lábasban, majd szórd bele a zabot.",
      "Főzd 3-4 percig, amíg sűrű és krémes lesz.",
      "Keverd bele a fahéjat és a mézet.",
      "Tálald a bogyós gyümölcsökkel a tetején.",
    ],
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
    instructions: [
      "Pirítsd meg a kenyeret aranybarnára.",
      "Törd össze az avokádót citromlével, sóval és kevés chilivel.",
      "Készíts lágy vagy buggyantott tojást.",
      "Kend az avokádót a pirítósra, majd tedd rá a tojást.",
    ],
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
    instructions: [
      "Verd fel a tojásokat a tejföllel, sóval és borssal.",
      "Serpenyőben melegíts kevés zsiradékot, majd öntsd bele a tojást.",
      "Szórd rá a sonkát és a sajtot.",
      "Hajtsd félbe az omlettet, és süsd készre 2-3 perc alatt.",
    ],
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
    instructions: [
      "Kanalazd a joghurtot egy tálba.",
      "Szeleteld fel a gyümölcsöket.",
      "Szórd a joghurtra a granolát és a gyümölcsöket.",
      "Csorgass rá egy kevés mézet tálalás előtt.",
    ],
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
    instructions: [
      "Fűszerezd a lazacot sóval, borssal, fokhagymával és citromhéjjal.",
      "A spárgát forgasd össze olívaolajjal, majd tedd a hal mellé tepsire.",
      "Süsd 200 fokon 18-20 percig.",
      "Tálaláskor szórd meg kaporral és facsarj rá friss citromlevet.",
    ],
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
    instructions: [
      "Főzd ki a tésztát sós vízben.",
      "Közben fokhagymát piríts olívaolajon, majd add hozzá a paradicsomot.",
      "Főzd össze a szószt 10-12 perc alatt.",
      "Forgasd bele a tésztát, bazsalikommal és parmezánnal tálald.",
    ],
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
    instructions: [
      "Főzd meg a quinoát a csomagolás szerint.",
      "Serpenyőben pirítsd meg a felkockázott zöldségeket.",
      "Ízesítsd sóval, borssal és kedvenc fűszereiddel.",
      "Tálban keverd össze a quinoát a zöldségekkel, és locsold meg citromos olajjal.",
    ],
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
    instructions: [
      "A hagymát vajon párold üvegesre, majd add hozzá a gombát.",
      "Fűszerezd kakukkfűvel, és pirítsd 5-6 percig.",
      "Öntsd fel alaplével, majd főzd puhára.",
      "Turmixold le, keverd bele a tejszínt, és még egyszer forrald össze.",
    ],
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
    instructions: [
      "A húst szobahőmérsékletűre pihentesd, majd sózd, borsozd.",
      "Forró serpenyőben süsd oldalanként 2-3 percig.",
      "Add hozzá a vajat, fokhagymát és rozmaringot, majd locsolgasd a húst.",
      "Pihentesd 5 percig szeletelés előtt.",
    ],
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
    instructions: [
      "Vágd fel az avokádót, paradicsomot és uborkát.",
      "Keverd össze egy nagy tálban.",
      "Morzsold rá a fetát.",
      "Locsold meg citromlével és olívaolajjal, majd finoman forgasd össze.",
    ],
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
    instructions: [
      "Pirítsd meg a felkockázott csirkét kevés olajon.",
      "Szórd rá a curry port, majd add hozzá a paradicsomot.",
      "Öntsd fel kókusztejjel, és főzd sűrűre 15-20 perc alatt.",
      "Főtt rizzsel és friss korianderrel tálald.",
    ],
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
    instructions: [
      "Forralj alaplevet gyömbérrel és szójaszósszal.",
      "Add hozzá a gombát és pár percig főzd.",
      "Külön főzd ki a ramen tésztát és a lágy tojást.",
      "Tálaláskor tedd a tésztát a levesbe, majd jöhet a tojás és a spenót.",
    ],
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
    instructions: [
      "A csirkecombot dörzsöld be fokhagymával, paprikával, sóval és olajjal.",
      "A burgonyát vágd fel, majd keverd össze rozmaringgal.",
      "Rendezd tepsire a csirkét és a burgonyát.",
      "Süsd 200 fokon 45-50 percig, amíg aranybarna lesz.",
    ],
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
