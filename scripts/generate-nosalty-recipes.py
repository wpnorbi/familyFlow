#!/usr/bin/env python3
"""Generate 400+ nosalty-style recipes for family-flow-nosalty-recipes.safe-import.json"""

import json
import re
import unicodedata
from datetime import datetime

def slugify(text):
    text = text.lower()
    text = unicodedata.normalize('NFKD', text)
    replacements = {
        'á':'a','é':'e','í':'i','ó':'o','ö':'o','ő':'o','ú':'u','ü':'u','ű':'u',
        'Á':'a','É':'e','Í':'i','Ó':'o','Ö':'o','Ő':'o','Ú':'u','Ü':'u','Ű':'u',
    }
    for k,v in replacements.items():
        text = text.replace(k,v)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text).strip('-')
    return text

def make_image_url(slug):
    # nosalty image URL pattern
    a = slug[:2].upper() if len(slug) >= 2 else 'ZZ'
    b = slug[2:4].upper() if len(slug) >= 4 else 'ZZ'
    return f"https://image-api.nosalty.hu/nosalty/images/recipes/{a}/{b}/{slug}.jpeg?w=1200&h=1200"

PREP_STEPS_FOETEL = [
    "Készítsd elő az alapanyagokat: mosd meg, darabold fel, és tedd külön a gyorsan, illetve lassabban készülő részeket.",
    "A fő alapanyagot enyhén sózd, majd kevés zsiradékon közepesen forró serpenyőben pirítsd aranybarnára minden oldalán.",
    "Add hozzá a zöldségeket, fűszereket és a recept jellegéhez illő folyadékot vagy mártásalapot.",
    "Főzd, süsd vagy párold készre fedő alatt, közben készíts hozzá köretet vagy friss kiegészítőt.",
    "A végén kóstolj, igazíts az ízeken, majd családi adagokban tálald friss zöldfűszerrel szórva."
]
PREP_STEPS_LEVES = [
    "A zöldségeket és a húst megtisztítva, feldarabolva tedd félre.",
    "Egy nagyobb fazékban olajon dinszteld meg a hagymát, majd add hozzá a többi alapanyagot.",
    "Öntsd fel vízzel vagy alaplével, fűszerezd, majd közepes lángon főzd puhára.",
    "Kóstold meg, szükség szerint pótold a sót és a fűszereket.",
    "Tálald melegen, friss kenyérrel vagy galuskaként megfőzött tésztával."
]
PREP_STEPS_DESSERT = [
    "Mérj ki minden alapanyagot pontosan, majd melegítsd elő a sütőt 180 fokra (légkeveréssel 160 fokra).",
    "A száraz és a nedves hozzávalókat külön keverd össze, majd óvatosan forgasd egybe.",
    "Töltsd kibélelt sütőformába, egyengesd el és tedd a sütőbe.",
    "Süsd 30-40 percig, vagy amíg fogvájóval szúrva tisztán jön ki.",
    "Hagyd hűlni, majd szeleteld és tálald porcukorral vagy tejszínhabbal."
]
PREP_STEPS_TESZTA = [
    "Sós vízben főzd al dentére a tésztát a csomagoláson lévő utasítás szerint.",
    "Közben készítsd el a mártást: pirítsd meg az alapanyagokat, add hozzá a folyadékot és a fűszereket.",
    "A leszűrt tésztát add a mártáshoz, és forgasd össze alaposan.",
    "Ha szükséges, adj hozzá egy kevés főzővizet a krémesebb állagért.",
    "Tálald azonnal, friss parmezánnal és bazsalikommal meghinve."
]
PREP_STEPS_SALATA = [
    "A zöldségeket és egyéb alapanyagokat mosd meg, szárítsd le és darabold fel.",
    "Készítsd el az öntet alapját: keverd össze az olajat, az ecetet, a mustárt és a fűszereket.",
    "A salátaalapot tedd egy tálba, add hozzá a többi hozzávalót.",
    "Locsold meg az öntettel és forgasd össze óvatosan.",
    "Azonnal tálald, vagy hűtőben pihentesd 15 percig az ízek összeérésére."
]
PREP_STEPS_REGGELI = [
    "Készítsd elő az alapanyagokat: mosd meg a gyümölcsöt, tojd fel a tojásokat, szeld fel a kenyeret.",
    "Melegítsd fel a serpenyőt közepes lángon, adj hozzá kevés vajat vagy olajat.",
    "Süsd meg az alapanyagokat a kívánt állagra, figyelve hogy ne égjen meg.",
    "Fűszerezd ízlés szerint, adj hozzá friss zöldfűszert ha van.",
    "Tálald melegen, gyümölccsel vagy pirítóssal kiegészítve."
]
PREP_STEPS_EGYTALETEL = PREP_STEPS_FOETEL

def make_recipe(title, category, tags, time_min, servings, ingredients, extra_notes="", kid_notes=""):
    slug = slugify(title)
    rid = f"nosalty-{slug}"
    steps = {
        "Főétel": PREP_STEPS_FOETEL,
        "Leves": PREP_STEPS_LEVES,
        "Desszert": PREP_STEPS_DESSERT,
        "Tészta": PREP_STEPS_TESZTA,
        "Saláta": PREP_STEPS_SALATA,
        "Reggeli": PREP_STEPS_REGGELI,
        "Egytálétel": PREP_STEPS_EGYTALETEL,
    }.get(category, PREP_STEPS_FOETEL)
    return {
        "id": rid,
        "title": title,
        "sourceName": "Nosalty",
        "sourceUrl": f"https://www.nosalty.hu/recept/{slug}",
        "contentMode": "original-family-flow-version-inspired-by-title",
        "difficulty": None,
        "totalTimeMinutes": time_min,
        "servings": servings,
        "category": category,
        "tags": tags,
        "safeShortDescription": f"Family Flow verzió a(z) {title} receptötlethez: appon belül tervezhető, családi ebédre igazított változat.",
        "image": {
            "type": "external-source-url",
            "url": make_image_url(slug)
        },
        "ingredientGroups": [
            {
                "name": "Hozzávalók",
                "items": ingredients
            }
        ],
        "customPreparationSteps": steps,
        "familyNotes": extra_notes or "Saját Family Flow változat, amely Nosalty receptötlet alapján, appon belüli tervezéshez használható.",
        "kidFriendlyNotes": kid_notes,
        "shoppingListReady": True,
        "openOriginalRecipeLabel": "Eredeti Nosalty recept megnyitása"
    }

def i(name, amount=None, unit=None):
    d = {"name": name}
    if amount is not None:
        d["amount"] = str(amount)
    if unit is not None:
        d["unit"] = unit
    return d

# ─── FŐÉTELEK ──────────────────────────────────────────────────────────────────

FOETEL_RECIPES = [
    ("Csirkepaprikás galuskával", ["csirke","paprika","tejfolos"], 60, 4,
     [i("csirkecomb",1,"kg"), i("vöröshagyma",2,"db"), i("piros paprika",3,"evőkanál"), i("tejföl",200,"g"), i("só",1,"csipet"), i("galuska",300,"g")]),

    ("Töltött káposzta tejfölös mártásban", ["toltott","kaposzta","hus"], 120, 6,
     [i("savanyú káposzta",1,"kg"), i("darált hús",600,"g"), i("rizs",150,"g"), i("tojás",2,"db"), i("füstölt szalonna",100,"g"), i("tejföl",300,"g")]),

    ("Marhapörkölt csipetkével", ["porkolt","marha","csipetke"], 120, 4,
     [i("marhahús",800,"g"), i("vöröshagyma",3,"db"), i("piros paprika",2,"evőkanál"), i("paradicsom",2,"db"), i("paprika",2,"db"), i("zsír",3,"evőkanál")]),

    ("Rántott csirkemell", ["rantott","csirke","bundazott"], 30, 4,
     [i("csirkemell",600,"g"), i("tojás",2,"db"), i("zsemlemorzsa",150,"g"), i("liszt",100,"g"), i("só"), i("olaj",500,"ml")]),

    ("Lecsó kolbásszal", ["lecso","kolbasz","zoldseg"], 40, 4,
     [i("paradicsomszelet",500,"g"), i("kaliforniai paprika",4,"db"), i("kolbász",300,"g"), i("hagyma",2,"db"), i("olaj",3,"evőkanál"), i("só"), i("paprika",1,"evőkanál")]),

    ("Paprikás krumpli füstölt hússal", ["krumpli","paprikas","fustolt"], 50, 4,
     [i("burgonya",1,"kg"), i("füstölt csülök",400,"g"), i("hagyma",2,"db"), i("paprika",2,"evőkanál"), i("tejföl",150,"g"), i("só")]),

    ("Töltött paprika paradicsommártásban", ["toltott","paprika","daralt"], 80, 4,
     [i("húsos paprika",6,"db"), i("darált hús",500,"g"), i("rizs",100,"g"), i("paradicsomlé",500,"ml"), i("tojás",1,"db"), i("cukor",1,"evőkanál")]),

    ("Rakott krumpli", ["rakott","krumpli","tejfol"], 70, 6,
     [i("burgonya",1,"kg"), i("főtt tojás",4,"db"), i("tejföl",300,"g"), i("füstölt kolbász",200,"g"), i("vaj",50,"g"), i("só")]),

    ("Csirkemell gombamártással", ["csirke","gomba","krem"], 40, 4,
     [i("csirkemell",600,"g"), i("gomba",300,"g"), i("tejszín",200,"ml"), i("hagyma",1,"db"), i("fokhagyma",3,"gerezd"), i("vaj",40,"g")]),

    ("Sertéskaraj mustáros krémmel", ["sertes","karaj","mustaros"], 45, 4,
     [i("sertéskaraj",600,"g"), i("dijoni mustár",2,"evőkanál"), i("tejszín",200,"ml"), i("hagyma",1,"db"), i("kakukkfű"), i("olaj",2,"evőkanál")]),

    ("Fokhagymás vajban sült csirke", ["csirke","fokhagymas","vajas"], 60, 4,
     [i("csirkecomb",4,"db"), i("vaj",100,"g"), i("fokhagyma",6,"gerezd"), i("rozmaring",2,"ág"), i("citrom",1,"db"), i("só"), i("bors")]),

    ("Mediterrán csirkecomb zöldségekkel", ["csirke","mediterran","zoldseg"], 70, 4,
     [i("csirkecomb",4,"db"), i("koktélparadicsom",300,"g"), i("olívabogyó",100,"g"), i("kapribogyó",2,"evőkanál"), i("fokhagyma",4,"gerezd"), i("fehérbor",100,"ml")]),

    ("Tandoori csirke", ["csirke","indiai","fuszeres"], 90, 4,
     [i("csirkecomb",4,"db"), i("joghurt",200,"g"), i("tandoori fűszerkeverék",3,"evőkanál"), i("citromlé",2,"evőkanál"), i("fokhagyma",3,"gerezd"), i("gyömbér",1,"evőkanál")]),

    ("Csirke curry kókusztejjel", ["csirke","curry","kokusz"], 45, 4,
     [i("csirkemell",600,"g"), i("kókusztej",400,"ml"), i("curry por",2,"evőkanál"), i("hagyma",1,"db"), i("fokhagyma",3,"gerezd"), i("paradicsom",2,"db")]),

    ("Lazac citromos kapros mártásban", ["lazac","hal","kapros"], 30, 4,
     [i("lazacfilé",600,"g"), i("tejszín",200,"ml"), i("kapor",1,"csokor"), i("citromlé",1,"db"), i("vaj",30,"g"), i("só"), i("bors")]),

    ("Garnélás rizottó", ["garnela","rizotto","tengeri"], 40, 4,
     [i("arborio rizs",300,"g"), i("garnéla",400,"g"), i("fehérbor",150,"ml"), i("alaplé",1,"l"), i("parmezán",50,"g"), i("vaj",60,"g"), i("hagyma",1,"db")]),

    ("Tonhalas spagetti kapribogyóval", ["tonhal","spagetti","kapri"], 25, 4,
     [i("spagetti",400,"g"), i("konzerv tonhal",2,"doboz"), i("kapribogyó",3,"evőkanál"), i("olívabogyó",100,"g"), i("fokhagyma",3,"gerezd"), i("olívaolaj",4,"evőkanál")]),

    ("Tőkehal paradicsomszószban", ["tokhal","hal","paradicsomos"], 40, 4,
     [i("tőkehalfilé",600,"g"), i("paradicsom",400,"g"), i("fokhagyma",4,"gerezd"), i("fehérbor",100,"ml"), i("kapribogyó",2,"evőkanál"), i("olívaolaj",3,"evőkanál")]),

    ("Sertés szűzérmék gombamártással", ["sertes","szuzpecsenye","gomba"], 35, 4,
     [i("sertésszűz",600,"g"), i("gomba",250,"g"), i("tejszín",200,"ml"), i("hagyma",1,"db"), i("kakukkfű"), i("vaj",40,"g")]),

    ("Bécsi szelet", ["becsi","szelet","rantott"], 30, 4,
     [i("borjúcomb",600,"g"), i("tojás",2,"db"), i("zsemlemorzsa",150,"g"), i("liszt",80,"g"), i("vaj",150,"g"), i("citrom",1,"db")]),

    ("Erdélyi rakott krumpli", ["erdelyi","rakott","hungaricum"], 80, 6,
     [i("burgonya",1,"kg"), i("főtt tojás",4,"db"), i("tejföl",400,"g"), i("kolbász",300,"g"), i("bacon",100,"g"), i("reszelt sajt",150,"g")]),

    ("Tokány tejföllel", ["tokany","sertes","tejfolos"], 70, 4,
     [i("sertéshús",700,"g"), i("hagyma",3,"db"), i("paprika",2,"evőkanál"), i("tejföl",200,"g"), i("bor",100,"ml"), i("babérlevél",2,"db")]),

    ("Harcsapörkölt tejföllel", ["harcsa","hal","porkolt"], 60, 4,
     [i("harcsa",800,"g"), i("hagyma",3,"db"), i("piros paprika",3,"evőkanál"), i("tejföl",200,"g"), i("paradicsom",2,"db"), i("zsír",2,"evőkanál")]),

    ("Olasz csirkecomb paradicsommal", ["csirke","olasz","paradicsomos"], 70, 4,
     [i("csirkecomb",4,"db"), i("paradicsom",400,"g"), i("fehérbor",150,"ml"), i("kapribogyó",2,"evőkanál"), i("fokhagyma",4,"gerezd"), i("bazsalikom",1,"csokor")]),

    ("Puttanesca spagetti", ["spagetti","puttanesca","olasz"], 25, 4,
     [i("spagetti",400,"g"), i("paradicsom",400,"g"), i("szardella",6,"db"), i("kapribogyó",3,"evőkanál"), i("olívabogyó",100,"g"), i("chili",1,"db")]),

    ("Arrabiata spagetti", ["spagetti","arrabiata","csipős"], 25, 4,
     [i("spagetti",400,"g"), i("paradicsom",400,"g"), i("fokhagyma",5,"gerezd"), i("chili",2,"db"), i("olívaolaj",4,"evőkanál"), i("petrezselyem",1,"csokor")]),

    ("Pesto spagetti koktélparadicsommal", ["spagetti","pesto","zold"], 20, 4,
     [i("spagetti",400,"g"), i("bazsalikom pesto",6,"evőkanál"), i("koktélparadicsom",300,"g"), i("parmezán",50,"g"), i("fenyőmag",30,"g"), i("fokhagyma",2,"gerezd")]),

    ("Csirkés lazagna", ["lazagna","csirke","sajtos"], 90, 6,
     [i("lazagna lapok",300,"g"), i("csirkemell",500,"g"), i("tejszínes besamel",600,"ml"), i("paradicsomlé",400,"ml"), i("mozzarella",250,"g"), i("parmezán",80,"g")]),

    ("Húsos cannelloni", ["cannelloni","daralt","olasz"], 80, 4,
     [i("cannelloni csövek",250,"g"), i("darált marhahús",500,"g"), i("paradicsomlé",400,"ml"), i("besamel mártás",400,"ml"), i("parmezán",100,"g"), i("hagyma",1,"db")]),

    ("Görög muszaka", ["muszaka","gorog","padlizsanos"], 100, 6,
     [i("padlizsán",3,"db"), i("darált bárány",600,"g"), i("burgonya",3,"db"), i("besamel",500,"ml"), i("paradicsomlé",300,"ml"), i("fahéj",1,"tk"), i("szerecsendió")]),

    ("Thai csirke földimogyoróval", ["csirke","thai","mogyoros"], 35, 4,
     [i("csirkemell",600,"g"), i("kókusztej",400,"ml"), i("mogyoróvaj",3,"evőkanál"), i("szójaszósz",3,"evőkanál"), i("lime",1,"db"), i("gyömbér",1,"evőkanál")]),

    ("Marokkói csirkecomb fűszeres mártásban", ["csirke","marokkoi","fuszeres"], 80, 4,
     [i("csirkecomb",4,"db"), i("ras el hanout",2,"evőkanál"), i("paradicsom",3,"db"), i("hagyma",2,"db"), i("méz",2,"evőkanál"), i("mandula",50,"g")]),

    ("Sertésoldalas sütőben", ["oldalas","sertes","sutobe"], 120, 4,
     [i("sertésoldalas",1.2,"kg"), i("fokhagyma",6,"gerezd"), i("rozmaring"), i("kakukkfű"), i("méz",3,"evőkanál"), i("mustár",2,"evőkanál")]),

    ("BBQ csirkeszárny", ["csirke","bbq","sutobe"], 50, 4,
     [i("csirkeszárny",1,"kg"), i("BBQ szósz",150,"ml"), i("fokhagyma",3,"gerezd"), i("méz",2,"evőkanál"), i("szójaszósz",2,"evőkanál"), i("citromlé",1,"evőkanál")]),

    ("Zsályás borjúszelet", ["borju","zsalyas","olasz"], 30, 4,
     [i("borjúszelet",600,"g"), i("zsálya",8,"levél"), i("sonka",100,"g"), i("vaj",60,"g"), i("fehérbor",100,"ml"), i("só"), i("bors")]),

    ("Vadász szelet gombával", ["sertes","vadasz","gomba"], 45, 4,
     [i("sertéskaraj",600,"g"), i("vegyes gomba",300,"g"), i("tejszín",200,"ml"), i("hagyma",1,"db"), i("babérlevél",2,"db"), i("vörösbor",100,"ml")]),

    ("Mexikói chili con carne", ["chili","marha","mexikoi"], 60, 4,
     [i("darált marhahús",600,"g"), i("vörösbab",400,"g"), i("paradicsom",400,"g"), i("chili paprika",2,"db"), i("hagyma",2,"db"), i("kömény",1,"evőkanál")]),

    ("Burrito darált hússal", ["burrito","mexikoi","tortiyas"], 40, 4,
     [i("tortilla lap",8,"db"), i("darált hús",500,"g"), i("fekete bab",400,"g"), i("sajt",150,"g"), i("tejföl",100,"g"), i("guacamole",200,"g")]),

    ("Quesadilla csirkés", ["quesadilla","csirke","mexikoi"], 25, 4,
     [i("tortilla lap",8,"db"), i("csirkemell",400,"g"), i("sajt",200,"g"), i("paprika",2,"db"), i("hagyma",1,"db"), i("tejföl",100,"g")]),

    ("Marhasteak sütővajas mártással", ["marha","steak","vajas"], 20, 2,
     [i("marhahátszín",400,"g"), i("vaj",80,"g"), i("fokhagyma",3,"gerezd"), i("kakukkfű",3,"ág"), i("rozmaring",2,"ág"), i("só"), i("bors")]),

    ("Hamburger házi húspogácsával", ["hamburger","marha","hazikeszitesu"], 30, 4,
     [i("darált marhahús",600,"g"), i("hamburger zsemle",4,"db"), i("saláta",1,"fej"), i("paradicsom",2,"db"), i("sajt",4,"szelet"), i("hagyma",1,"db")]),

    ("Hot dog házi stílusban", ["hotdog","kolbasz","fastfood"], 20, 4,
     [i("virsli",8,"db"), i("hosszú zsemle",4,"db"), i("mustár"), i("ketchup"), i("savanyúság"), i("hagyma",1,"db")]),

    ("Csirkés wrap", ["wrap","csirke","tortiyas"], 20, 4,
     [i("csirkemell",400,"g"), i("tortilla",4,"db"), i("jégsaláta",1,"fej"), i("paradicsom",2,"db"), i("tejföl",100,"g"), i("sajt",100,"g")]),

    ("Görög gyros csirkéből", ["gyros","csirke","gorog"], 35, 4,
     [i("csirkemell",600,"g"), i("görög joghurt",300,"g"), i("pitakenyér",4,"db"), i("uborka",1,"db"), i("paradicsom",2,"db"), i("fokhagyma",3,"gerezd")]),

    ("Döner kebab házilag", ["kebab","doner","torok"], 40, 4,
     [i("bárány- vagy csirkehús",600,"g"), i("joghurt",200,"g"), i("fűszerkeverék",3,"evőkanál"), i("pita",4,"db"), i("saláta"), i("paradicsom",2,"db")]),

    ("Falafel görög joghurtos szósszal", ["falafel","csicseriborsó","kozel-keleti"], 45, 4,
     [i("csicseriborsó",400,"g"), i("hagyma",1,"db"), i("petrezselyem",1,"csokor"), i("kömény",1,"evőkanál"), i("koriander",1,"evőkanál"), i("fokhagyma",3,"gerezd")]),

    ("Csirkés paella", ["paella","csirke","spanyol"], 60, 4,
     [i("paella rizs",300,"g"), i("csirkecomb",4,"db"), i("paprika",2,"db"), i("paradicsom",3,"db"), i("sáfrány",1,"csipet"), i("zöldségalaplé",800,"ml")]),

    ("Tenger gyümölcsei paella", ["paella","tengeri","spanyol"], 50, 4,
     [i("paella rizs",300,"g"), i("kagyló",400,"g"), i("garnéla",300,"g"), i("tintahal",200,"g"), i("sáfrány",1,"csipet"), i("fehérbor",150,"ml")]),

    ("Sertés szűzpecsenye mézes balzsamecetes mártásban", ["sertes","szuz","mezes"], 35, 4,
     [i("sertésszűz",600,"g"), i("méz",3,"evőkanál"), i("balzsamecet",3,"evőkanál"), i("fokhagyma",4,"gerezd"), i("rozmaring"), i("olívaolaj",2,"evőkanál")]),

    ("Kacsamell narancsmártással", ["kacsa","kacsamell","narancs"], 40, 4,
     [i("kacsamell",600,"g"), i("narancslé",200,"ml"), i("méz",2,"evőkanál"), i("Grand Marnier",2,"evőkanál"), i("narancs",1,"db"), i("só"), i("bors")]),

    ("Kacsacomb körtelekváros mártással", ["kacsa","kacsa","korte"], 150, 4,
     [i("kacsacomb",4,"db"), i("körte",3,"db"), i("vörösbor",200,"ml"), i("méz",2,"evőkanál"), i("kakukkfű"), i("rozmaring"), i("só")]),

    ("Nyúlpörkölt", ["nyul","porkolt","vadhus"], 90, 4,
     [i("nyúl",1,"db"), i("hagyma",3,"db"), i("piros paprika",3,"evőkanál"), i("paradicsom",2,"db"), i("tejföl",200,"g"), i("zsír",2,"evőkanál")]),

    ("Vaddisznó pörkölt", ["vadkan","porkolt","vadhus"], 120, 4,
     [i("vaddisznó hús",800,"g"), i("hagyma",3,"db"), i("vörösbor",200,"ml"), i("paprika",2,"evőkanál"), i("babérlevél",3,"db"), i("borókabogyó",5,"db")]),

    ("Szarvas ragu vadasan", ["szarvas","vadas","vadhus"], 120, 4,
     [i("szarvashús",700,"g"), i("tejföl",300,"g"), i("mustár",2,"evőkanál"), i("sárgarépa",2,"db"), i("ecet",2,"evőkanál"), i("cukor",1,"evőkanál")]),

    ("Babgulyás füstölt csülökkel", ["bab","gulyas","csulok"], 120, 6,
     [i("szárazbab",400,"g"), i("füstölt csülök",600,"g"), i("hagyma",2,"db"), i("paprika",3,"evőkanál"), i("paradicsom",2,"db"), i("só"), i("babérlevél",2,"db")]),

    ("Sárgarépa krémleves gyömbérrel", ["kremleves","sargarepa","gyomber"], 35, 4,
     [i("sárgarépa",600,"g"), i("gyömbér",30,"g"), i("kókusztej",400,"ml"), i("hagyma",1,"db"), i("zöldségalaplé",500,"ml"), i("narancs",1,"db")]),

    ("Csirkemell töltve sajttal", ["csirke","toltott","sajtos"], 45, 4,
     [i("csirkemell",4,"db"), i("füstölt sajt",150,"g"), i("sonka",100,"g"), i("bazsalikom",1,"csokor"), i("olívaolaj",2,"evőkanál"), i("só"), i("bors")]),

    ("Csirkemell szezámmaggal bundázva", ["csirke","szezam","ropogos"], 30, 4,
     [i("csirkemell",600,"g"), i("szezámmag",100,"g"), i("zsemlemorzsa",50,"g"), i("tojás",2,"db"), i("szójaszósz",2,"evőkanál"), i("fokhagyma",2,"gerezd")]),

    ("Csirkemell mozarellával és paradicsommal", ["csirke","mozarella","caprese"], 30, 4,
     [i("csirkemell",4,"db"), i("mozzarella",200,"g"), i("paradicsom",3,"db"), i("bazsalikom"), i("olívaolaj",2,"evőkanál"), i("balzsamecet",1,"evőkanál")]),

    ("Spenótos csirkemell", ["csirke","spenot","kremyes"], 30, 4,
     [i("csirkemell",600,"g"), i("spenót",300,"g"), i("tejszín",200,"ml"), i("fokhagyma",3,"gerezd"), i("parmezán",50,"g"), i("vaj",30,"g")]),

    ("Csirkés szezámos rózmaringos sütőben", ["csirke","rozmaring","sutobe"], 55, 4,
     [i("csirkecomb",4,"db"), i("rozmaring",4,"ág"), i("fokhagyma",6,"gerezd"), i("citrom",1,"db"), i("olívaolaj",3,"evőkanál"), i("só"), i("bors")]),

    ("Kapros tejfölös sertéskaraj", ["sertes","kapros","tejfolos"], 40, 4,
     [i("sertéskaraj",600,"g"), i("tejföl",200,"g"), i("kapor",1,"csokor"), i("hagyma",1,"db"), i("fokhagyma",2,"gerezd"), i("olaj",2,"evőkanál")]),

    ("Sonkás ananászos pizza", ["pizza","sonkas","ananaszos"], 40, 4,
     [i("pizzatészta",400,"g"), i("paradicsomlé",200,"ml"), i("mozzarella",250,"g"), i("sonka",150,"g"), i("ananász",200,"g"), i("oregánó",1,"evőkanál")]),

    ("Margherita pizza", ["pizza","margherita","olasz"], 35, 4,
     [i("pizzatészta",400,"g"), i("san marzano paradicsom",400,"g"), i("mozzarella",300,"g"), i("bazsalikom",1,"csokor"), i("olívaolaj",3,"evőkanál"), i("só")]),

    ("Négyféle sajttal töltött pizza", ["pizza","sajtos","sajt4fele"], 35, 4,
     [i("pizzatészta",400,"g"), i("mozzarella",150,"g"), i("gorgonzola",80,"g"), i("parmezán",50,"g"), i("ementáli",100,"g"), i("fokhagyma",2,"gerezd")]),

    ("Szalámis pizza tojással", ["pizza","szalamis","tojasos"], 35, 4,
     [i("pizzatészta",400,"g"), i("szalámi",150,"g"), i("tojás",4,"db"), i("mozzarella",200,"g"), i("paradicsomszósz",200,"ml"), i("oregánó")]),

    ("Sültkrumpli sütőben", ["krumpli","sutve","sutos"], 45, 4,
     [i("burgonya",1,"kg"), i("olívaolaj",3,"evőkanál"), i("fokhagyma",4,"gerezd"), i("rozmaring"), i("paprika",1,"evőkanál"), i("só")]),

    ("Hasábburgonya házilag", ["krumpli","hasab","sutve"], 40, 4,
     [i("burgonya",1,"kg"), i("olaj",500,"ml"), i("só"), i("fokhagymapor",1,"evőkanál"), i("paprika",1,"evőkanál")]),

    ("Édesburgonyafőzelék", ["edesburgonyas","foezelek","krem"], 40, 4,
     [i("édesburgonya",800,"g"), i("kókusztej",400,"ml"), i("gyömbér",20,"g"), i("fokhagyma",3,"gerezd"), i("lime",1,"db"), i("hagyma",1,"db")]),

    ("Sütőtökös risotto", ["risotto","sutotok","oszi"], 45, 4,
     [i("arborio rizs",300,"g"), i("sütőtök",400,"g"), i("fehérbor",150,"ml"), i("parmezán",80,"g"), i("vaj",60,"g"), i("zöldségalaplé",1,"l")]),

    ("Zöldborsós risotto mentával", ["risotto","zoldborsas","menta"], 40, 4,
     [i("arborio rizs",300,"g"), i("zöldborsó",300,"g"), i("menta",1,"csokor"), i("fehérbor",150,"ml"), i("parmezán",80,"g"), i("zöldségalaplé",1,"l")]),

    ("Gombás risotto parmezánnal", ["risotto","gomba","olasz"], 40, 4,
     [i("arborio rizs",300,"g"), i("vegyes gomba",400,"g"), i("fehérbor",100,"ml"), i("parmezán",100,"g"), i("szarvasgomba olaj",1,"evőkanál"), i("alaplé",1,"l")]),

    ("Pirított tofu zöldséges wokban", ["tofu","wok","vegyes"], 25, 4,
     [i("tofu",400,"g"), i("brokkoli",300,"g"), i("répa",2,"db"), i("szójaszósz",4,"evőkanál"), i("szezámolaj",2,"evőkanál"), i("gyömbér",1,"evőkanál")]),

    ("Vegán chili három babból", ["vegan","chili","bab"], 50, 4,
     [i("vörösbab",200,"g"), i("fekete bab",200,"g"), i("csicseriborsó",200,"g"), i("paradicsom",400,"g"), i("hagyma",2,"db"), i("chili",2,"db"), i("kömény",1,"evőkanál")]),

    ("Lencsés dhal kókusztejjel", ["dal","lencse","indiai"], 40, 4,
     [i("vörös lencse",300,"g"), i("kókusztej",400,"ml"), i("paradicsom",3,"db"), i("hagyma",2,"db"), i("curry por",2,"evőkanál"), i("fokhagyma",4,"gerezd")]),

    ("Csicseriborsós spinótos curry", ["curry","csicseriborsas","spenot"], 35, 4,
     [i("csicseriborsó",400,"g"), i("spenót",300,"g"), i("kókusztej",400,"ml"), i("hagyma",1,"db"), i("fokhagyma",3,"gerezd"), i("curry por",2,"evőkanál")]),

    ("Zöldséges wok tofuval", ["wok","zoldseg","tofu"], 20, 4,
     [i("vegyes wokzöldség",500,"g"), i("tofu",300,"g"), i("szójaszósz",3,"evőkanál"), i("szezámolaj",2,"evőkanál"), i("fokhagyma",3,"gerezd"), i("gyömbér",15,"g")]),

    ("Bolognai húsmártásos rizs", ["bolognai","daralt","rizs"], 40, 4,
     [i("darált hús",500,"g"), i("paradicsomlé",400,"ml"), i("hagyma",2,"db"), i("fokhagyma",3,"gerezd"), i("rizs",300,"g"), i("parmezán",50,"g")]),

    ("Csirkés fried rice", ["fried-rice","csirke","azsiai"], 25, 4,
     [i("rizs",300,"g"), i("csirkemell",300,"g"), i("tojás",3,"db"), i("borsó",150,"g"), i("szójaszósz",3,"evőkanál"), i("szezámolaj",2,"evőkanál")]),

    ("Pirított rizs tojással", ["tojasos","rizs","azsiai"], 20, 4,
     [i("rizs",300,"g"), i("tojás",4,"db"), i("hagyma",1,"db"), i("szójaszósz",3,"evőkanál"), i("szezámolaj",2,"evőkanál"), i("fokhagyma",2,"gerezd")]),

    ("Főtt kolbász savanyúsággal", ["kolbasz","savanyusag","gyors"], 20, 4,
     [i("házi kolbász",600,"g"), i("vegyes savanyúság",400,"g"), i("kenyér"), i("mustár")]),

    ("Olasz salsiccia paradicsomos babnál", ["salsiccia","bab","olasz"], 40, 4,
     [i("salsiccia",600,"g"), i("fehérbab",400,"g"), i("paradicsom",300,"g"), i("fokhagyma",4,"gerezd"), i("zsálya",6,"levél"), i("fehérbor",100,"ml")]),

    ("Csirkés souvlaki tzatzikivel", ["souvlaki","csirke","gorog"], 35, 4,
     [i("csirkemell",600,"g"), i("fokhagymás joghurt",300,"g"), i("citromlé",2,"evőkanál"), i("oregánó",2,"evőkanál"), i("pita",4,"db"), i("hagyma",1,"db")]),

    ("Sertéshús tikka masala", ["tikka","sertes","indiai"], 45, 4,
     [i("sertéshús",600,"g"), i("joghurt",200,"g"), i("tikka masala paszta",4,"evőkanál"), i("paradicsom",400,"g"), i("tejszín",100,"ml"), i("hagyma",2,"db")]),

    ("Zöldséges omlett sütőben", ["omlett","zoldseg","tojas"], 25, 4,
     [i("tojás",8,"db"), i("tejszín",100,"ml"), i("paprika",2,"db"), i("hagyma",1,"db"), i("sajt",100,"g"), i("spárga",200,"g")]),

    ("Shakshuka", ["shakshuka","tojas","kozel-keleti"], 30, 4,
     [i("tojás",6,"db"), i("paradicsom",400,"g"), i("paprika",2,"db"), i("hagyma",1,"db"), i("fokhagyma",3,"gerezd"), i("kömény",1,"evőkanál"), i("paprika por",1,"evőkanál")]),

    ("Csirkés bastilla", ["bastilla","csirke","marokkoi"], 90, 6,
     [i("csirkecomb",4,"db"), i("tojás",4,"db"), i("mandula",150,"g"), i("fahéj",2,"evőkanál"), i("porcukor",2,"evőkanál"), i("rétestészta",8,"lap")]),

    ("Cézár csirkés saláta bundázott csirkével", ["cezar","csirke","salata"], 30, 4,
     [i("csirkemell",400,"g"), i("rómaisaláta",2,"fej"), i("parmezán",80,"g"), i("kruton",100,"g"), i("cézár öntet",100,"ml"), i("tojás",2,"db")]),

    ("Rakott zöldbab hússal", ["rakott","zoldbab","hus"], 70, 4,
     [i("zöldbab",600,"g"), i("darált hús",400,"g"), i("tejföl",300,"g"), i("tojás",2,"db"), i("hagyma",1,"db"), i("reszelt sajt",150,"g")]),

    ("Zöldbab sertéshússal kínai módra", ["zoldbab","sertes","kinai"], 30, 4,
     [i("zöldbab",500,"g"), i("sertéshús",400,"g"), i("szójaszósz",4,"evőkanál"), i("fokhagyma",3,"gerezd"), i("gyömbér",1,"evőkanál"), i("szezámolaj",1,"evőkanál")]),

    ("Rakott kelkáposzta", ["rakott","kelkaposzta","daralt"], 80, 4,
     [i("kelkáposzta",1,"kg"), i("darált hús",400,"g"), i("rizs",150,"g"), i("tejföl",300,"g"), i("tojás",2,"db"), i("hagyma",1,"db")]),

    ("Töltött champignon", ["champignon","toltott","sajtos"], 35, 4,
     [i("nagy champignon",8,"db"), i("darált hús",300,"g"), i("hagyma",1,"db"), i("fokhagyma",2,"gerezd"), i("sajt",100,"g"), i("petrezselyem",1,"csokor")]),

    ("Ropogós malacbőr",["malacbor","ropogos","sertes"], 180, 4,
     [i("malacsült",1.5,"kg"), i("só"), i("bors"), i("kömény",1,"evőkanál"), i("fokhagyma",4,"gerezd"), i("sör",200,"ml")]),

    ("Roston sertésborda", ["bordas","roston","sertes"], 20, 4,
     [i("sertésborda",4,"db"), i("fokhagyma",3,"gerezd"), i("rozmaring"), i("olívaolaj",2,"evőkanál"), i("só"), i("bors")]),

    ("Csirkés tacos", ["tacos","csirke","mexikoi"], 30, 4,
     [i("csirkemell",500,"g"), i("taco kagyló",12,"db"), i("paradicsom",2,"db"), i("jégsaláta",1,"fej"), i("tejföl",100,"g"), i("sajt",100,"g")]),

    ("Cukkinifőzelék", ["fozelek","cukkini","zoldseg"], 30, 4,
     [i("cukkini",800,"g"), i("tejföl",200,"g"), i("tojás",2,"db"), i("kapor",1,"csokor"), i("fokhagyma",2,"gerezd"), i("liszt",2,"evőkanál")]),

    ("Spenótfőzelék tojással", ["fozelek","spenot","tojas"], 30, 4,
     [i("spenót",600,"g"), i("tejföl",200,"g"), i("tojás",4,"db"), i("fokhagyma",3,"gerezd"), i("liszt",2,"evőkanál"), i("vaj",30,"g")]),

    ("Sárgaborsó főzelék", ["fozelek","sargaborso","magyaros"], 60, 4,
     [i("sárgaborsó",400,"g"), i("füstölt szalonna",100,"g"), i("hagyma",2,"db"), i("liszt",2,"evőkanál"), i("paprika",1,"evőkanál"), i("ecet",1,"evőkanál")]),

    ("Kelvirágfőzelék", ["fozelek","kelvirag","zoldseg"], 30, 4,
     [i("karfiol",1,"db"), i("tejföl",200,"g"), i("tojás",2,"db"), i("liszt",2,"evőkanál"), i("vaj",30,"g"), i("petrezselyem",1,"csokor")]),

    ("Burgonyafőzelék kapribogyóval", ["fozelek","burgonyals","kapri"], 35, 4,
     [i("burgonya",800,"g"), i("tejföl",200,"g"), i("tojás",2,"db"), i("kapribogyó",3,"evőkanál"), i("kapor",1,"csokor"), i("ecet",1,"evőkanál")]),
]

# ─── LEVESEK ──────────────────────────────────────────────────────────────────

LEVES_RECIPES = [
    ("Gulyásleves magyarosan", ["gulyas","leves","marha"], 90, 6,
     [i("marhahús",600,"g"), i("burgonya",500,"g"), i("hagyma",2,"db"), i("paprika",3,"evőkanál"), i("paradicsom",2,"db"), i("paprika",2,"db"), i("kömény")]),

    ("Tyúkhúsleves levesbetéttel", ["tyukhus","leves","hazias"], 120, 6,
     [i("tyúk",1,"db"), i("sárgarépa",3,"db"), i("petrezselyem gyökér",2,"db"), i("zeller",1,"db"), i("hagyma",2,"db"), i("csigatészta",200,"g"), i("só"), i("bors")]),

    ("Csontleves házi tésztával", ["csontleves","hazias","tartalmas"], 180, 6,
     [i("marhacsont",1,"kg"), i("sárgarépa",3,"db"), i("petrezselyem gyökér",2,"db"), i("hagyma",2,"db"), i("zeller",1,"db"), i("levesbetét",200,"g")]),

    ("Zöldségleves betéttel", ["zoldseg","leves","vegetarianus"], 40, 4,
     [i("sárgarépa",2,"db"), i("burgonya",3,"db"), i("zöldborsó",150,"g"), i("zöldbab",150,"g"), i("hagyma",1,"db"), i("zöldségkocka",1,"db"), i("tészta",150,"g")]),

    ("Bableves füstölt hússal", ["bab","leves","fustolt"], 90, 6,
     [i("szárazbab",400,"g"), i("füstölt szalonna",150,"g"), i("hagyma",2,"db"), i("sárgarépa",2,"db"), i("paprika",2,"evőkanál"), i("ecet",2,"evőkanál")]),

    ("Gombaleves tejszínnel", ["gomba","leves","tejszines"], 35, 4,
     [i("vegyes gomba",400,"g"), i("tejszín",200,"ml"), i("hagyma",1,"db"), i("fokhagyma",3,"gerezd"), i("kakukkfű"), i("zöldségalaplé",600,"ml")]),

    ("Francia hagymakrémleves", ["hagyma","leves","francia"], 60, 4,
     [i("hagyma",6,"db"), i("vaj",60,"g"), i("fehérbor",200,"ml"), i("marhaalaplé",800,"ml"), i("baguette",4,"szelet"), i("gruyère sajt",150,"g")]),

    ("Paradicsomkrémleves bazsalikommal", ["paradicsom","kremleves","olasz"], 35, 4,
     [i("paradicsom",800,"g"), i("hagyma",1,"db"), i("fokhagyma",4,"gerezd"), i("bazsalikom",1,"csokor"), i("tejszín",100,"ml"), i("olívaolaj",3,"evőkanál")]),

    ("Lencsekrémleves gyömbérrel", ["lencse","kremleves","gyomber"], 40, 4,
     [i("vörös lencse",300,"g"), i("gyömbér",30,"g"), i("hagyma",1,"db"), i("fokhagyma",3,"gerezd"), i("kömény",1,"evőkanál"), i("kókusztej",400,"ml")]),

    ("Brokkoli krémleves", ["brokkoli","kremleves","krem"], 30, 4,
     [i("brokkoli",600,"g"), i("hagyma",1,"db"), i("fokhagyma",2,"gerezd"), i("tejszín",200,"ml"), i("zöldségalaplé",600,"ml"), i("parmezán",50,"g")]),

    ("Sütőtök krémleves", ["sutotok","kremleves","oszi"], 40, 4,
     [i("sütőtök",800,"g"), i("hagyma",1,"db"), i("gyömbér",20,"g"), i("kókusztej",400,"ml"), i("fokhagyma",3,"gerezd"), i("zöldségalaplé",400,"ml")]),

    ("Sárgarépa krémleves naranccsal", ["sargarepa","kremleves","narancs"], 35, 4,
     [i("sárgarépa",600,"g"), i("narancs",1,"db"), i("gyömbér",20,"g"), i("hagyma",1,"db"), i("zöldségalaplé",600,"ml"), i("tejszín",100,"ml")]),

    ("Thai kókuszes csirkeleves", ["thai","kokusze","csirkeleves"], 30, 4,
     [i("csirkemell",300,"g"), i("kókusztej",400,"ml"), i("csirke alaplé",400,"ml"), i("galangal",3,"szelet"), i("citromfű",2,"szár"), i("lime levél",4,"db")]),

    ("Miso leves tofuval", ["miso","tofu","japán"], 15, 4,
     [i("miso paszta",4,"evőkanál"), i("tofu",200,"g"), i("dashi",800,"ml"), i("wakame hínár",10,"g"), i("újhagyma",2,"szál")]),

    ("Pho bo vietnami marhahúsleves", ["pho","marha","vietnami"], 180, 4,
     [i("marhahús",600,"g"), i("marhacsont",500,"g"), i("rizstészta",300,"g"), i("csillagánizs",3,"db"), i("fahéj",1,"rúd"), i("gyömbér",50,"g")]),

    ("Ramen sertéshúsos", ["ramen","sertes","japán"], 60, 4,
     [i("sertéshús",400,"g"), i("ramen tészta",300,"g"), i("tojás",4,"db"), i("shoyu szósz",3,"evőkanál"), i("bambuszrügy",100,"g"), i("nori alga",4,"lap")]),

    ("Halászlé pontyból", ["halaszle","ponty","magyaros"], 60, 4,
     [i("ponty",1.2,"kg"), i("hagyma",3,"db"), i("paprika",4,"evőkanál"), i("paradicsom",2,"db"), i("só"), i("cseresznyepaprika",2,"db")]),

    ("Minestrone olasz zöldségleves", ["minestrone","olasz","zoldseg"], 50, 4,
     [i("cukorbab",150,"g"), i("sárgarépa",2,"db"), i("zeller",2,"szár"), i("paradicsom",400,"g"), i("pasztatészta",150,"g"), i("parmezán",50,"g")]),

    ("Kínai wonton leves", ["wonton","kínai","leves"], 45, 4,
     [i("wonton tészta",24,"db"), i("darált sertés",300,"g"), i("gyömbér",20,"g"), i("szójaszósz",2,"evőkanál"), i("csirkealaplé",800,"ml"), i("újhagyma",4,"szál")]),

    ("Spárgakrémleves", ["sparga","kremleves","tavasz"], 35, 4,
     [i("spárga",600,"g"), i("hagyma",1,"db"), i("vaj",50,"g"), i("tejszín",200,"ml"), i("zöldségalaplé",600,"ml"), i("citromlé",1,"evőkanál")]),

    ("Gazpacho hideg paradicsomleves", ["gazpacho","hideg","spanyol"], 20, 4,
     [i("paradicsom",600,"g"), i("uborka",1,"db"), i("paprika",1,"db"), i("hagyma",1,"db"), i("fokhagyma",2,"gerezd"), i("olívaolaj",4,"evőkanál"), i("ecet",2,"evőkanál")]),

    ("Vichyssoise hideg krumplileves", ["vichyssoise","hideg","francia"], 50, 4,
     [i("burgonya",500,"g"), i("póréhagyma",3,"szár"), i("vaj",60,"g"), i("tejszín",300,"ml"), i("csirkealaplé",600,"ml"), i("snidling",1,"csokor")]),

    ("Borsóleves mentalevéllel", ["borso","leves","menta"], 30, 4,
     [i("zöldborsó",500,"g"), i("menta",1,"csokor"), i("hagyma",1,"db"), i("vaj",40,"g"), i("tejszín",150,"ml"), i("zöldségalaplé",600,"ml")]),

    ("Csirkés avgolemono görög tojásos leves", ["avgolemono","gorog","citromos"], 40, 4,
     [i("csirkemell",300,"g"), i("rizs",100,"g"), i("tojás",3,"db"), i("citromlé",2,"db"), i("csirkealaplé",1,"l"), i("só"), i("fehér bors")]),

    ("Ribollita toszkán kenyérleves", ["ribollita","toszkán","olasz"], 60, 6,
     [i("fehér bab",400,"g"), i("kelkáposzta",300,"g"), i("sárgarépa",2,"db"), i("hagyma",2,"db"), i("paradicsom",400,"g"), i("kenyér",300,"g"), i("olívaolaj",4,"evőkanál")]),
]

# ─── DESSZERTEK ─────────────────────────────────────────────────────────────────

DESSERT_RECIPES = [
    ("Csokis brownie dióval", ["csoki","brownie","sutes"], 50, 12,
     [i("étcsokoládé",200,"g"), i("vaj",150,"g"), i("cukor",200,"g"), i("tojás",3,"db"), i("liszt",80,"g"), i("dió",100,"g"), i("kakaó",2,"evőkanál")]),

    ("Túrós palacsinta", ["palacsinta","turos","desszert"], 40, 4,
     [i("liszt",200,"g"), i("tej",400,"ml"), i("tojás",2,"db"), i("túró",400,"g"), i("cukor",3,"evőkanál"), i("citromhéj",1,"db"), i("vaníliás cukor",1,"csomag")]),

    ("Almás pite", ["almas","pite","sutes"], 80, 8,
     [i("alma",1,"kg"), i("liszt",400,"g"), i("vaj",200,"g"), i("cukor",150,"g"), i("tojás",2,"db"), i("fahéj",2,"evőkanál"), i("sütőpor",2,"tk")]),

    ("Somlói galuska", ["somloi","galuska","hungaricum"], 120, 8,
     [i("piskóta",400,"g"), i("pudingpor",2,"csomag"), i("tejszínhab",400,"ml"), i("dió",100,"g"), i("mazsola",100,"g"), i("rum",3,"evőkanál"), i("csokimártás",200,"g")]),

    ("Gesztenyepüré tejszínhabbal", ["gesztenye","desert","teli"], 30, 4,
     [i("gesztenyepüré",400,"g"), i("tejszín",200,"ml"), i("rum",2,"evőkanál"), i("porcukor",50,"g"), i("vaníliás cukor",1,"csomag")]),

    ("Rákóczi túrós", ["rakoczi","turos","magyaros"], 90, 12,
     [i("túró",500,"g"), i("liszt",300,"g"), i("vaj",200,"g"), i("tojás",3,"db"), i("cukor",200,"g"), i("lekvár",200,"g"), i("tojásfehérje",3,"db")]),

    ("Panna cotta vaníliaöntettel", ["panna-cotta","olasz","krem"], 30, 4,
     [i("tejszín",500,"ml"), i("cukor",60,"g"), i("zselatin",3,"lap"), i("vaníliarúd",1,"db"), i("eperzselé",200,"g")]),

    ("Tiramisu", ["tiramisu","olasz","kave"], 40, 8,
     [i("mascarpone",500,"g"), i("tojás",4,"db"), i("cukor",100,"g"), i("erős kávé",300,"ml"), i("babapiskóta",300,"g"), i("rum",3,"evőkanál"), i("kakaó",3,"evőkanál")]),

    ("Creme brulee", ["cremebrulee","francia","krem"], 60, 4,
     [i("tejszín",500,"ml"), i("tojássárgája",5,"db"), i("cukor",100,"g"), i("vaníliarúd",1,"db"), i("barna cukor",4,"evőkanál")]),

    ("Eclair kávés glazúrral", ["eclair","profiterol","kave"], 60, 12,
     [i("víz",200,"ml"), i("vaj",80,"g"), i("liszt",120,"g"), i("tojás",4,"db"), i("kávékrém",300,"g"), i("csokoládé glazúr",200,"g")]),

    ("Soufflé csokoládés", ["souffle","csoki","sutve"], 45, 4,
     [i("étcsokoládé",150,"g"), i("vaj",50,"g"), i("tojás",4,"db"), i("cukor",80,"g"), i("liszt",30,"g")]),

    ("Eper cheesecake sütés nélkül", ["cheesecake","eper","sutesnelkul"], 30, 8,
     [i("keksz",250,"g"), i("vaj",100,"g"), i("krémsajt",400,"g"), i("tejszínhab",300,"ml"), i("zselatin",4,"lap"), i("eper",300,"g")]),

    ("Mákos guba", ["makos","guba","magyaros"], 40, 4,
     [i("kifli",4,"db"), i("mák",200,"g"), i("cukor",100,"g"), i("tej",400,"ml"), i("tojás",2,"db"), i("vaníliás cukor",1,"csomag")]),

    ("Rétes almás", ["retes","almas","magyaros"], 60, 8,
     [i("rétestészta",6,"lap"), i("alma",1,"kg"), i("cukor",100,"g"), i("fahéj",2,"evőkanál"), i("zsemlemorzsa",50,"g"), i("vaj",80,"g")]),

    ("Rétes mákos", ["retes","makos","magyaros"], 60, 8,
     [i("rétestészta",6,"lap"), i("mák",200,"g"), i("cukor",150,"g"), i("tej",200,"ml"), i("mazsola",50,"g"), i("citromhéj",1,"db")]),

    ("Kürtőskalács", ["kurtoskalacs","erdélyi","tezi"], 60, 8,
     [i("liszt",500,"g"), i("élesztő",25,"g"), i("tej",200,"ml"), i("vaj",100,"g"), i("tojás",2,"db"), i("cukor",80,"g"), i("fahéjcukor",100,"g")]),

    ("Dobos torta", ["dobos","torta","magyaros"], 180, 12,
     [i("tojás",6,"db"), i("cukor",200,"g"), i("liszt",150,"g"), i("kakaós vajkrém",500,"g"), i("cukor karamell",100,"g")]),

    ("Esterházy torta", ["esterhazy","torta","magyaros"], 180, 12,
     [i("tojásfehérje",6,"db"), i("dió",300,"g"), i("cukor",200,"g"), i("vaníliakrém",500,"g"), i("fondant",200,"g")]),

    ("Gyümölcstorta tejszínhabbal", ["gyumolcstorta","krem","desszert"], 90, 12,
     [i("piskóta alap",1,"db"), i("tejszínhab",400,"ml"), i("vegyes gyümölcs",500,"g"), i("zselatin",3,"lap"), i("vaníliapu ding",2,"csomag")]),

    ("Francia csokoládémousse", ["csoki","mousse","krem"], 30, 4,
     [i("étcsokoládé",200,"g"), i("tojás",4,"db"), i("tejszín",200,"ml"), i("cukor",60,"g"), i("rum",1,"evőkanál")]),

    ("Palacsinta Gundel módra", ["palacsinta","gundel","magyaros"], 60, 4,
     [i("palacsinta",8,"db"), i("dió",200,"g"), i("cukor",100,"g"), i("tejszín",200,"ml"), i("rum",3,"evőkanál"), i("étcsokoládé",150,"g")]),

    ("Sacher torta", ["sacher","torta","becsi"], 180, 12,
     [i("étcsokoládé",200,"g"), i("vaj",150,"g"), i("cukor",150,"g"), i("tojás",6,"db"), i("liszt",150,"g"), i("sárgabarack lekvár",200,"g"), i("fondant",300,"g")]),

    ("Linzer sütemény", ["linzer","keksz","sutes"], 60, 24,
     [i("liszt",300,"g"), i("vaj",200,"g"), i("cukor",80,"g"), i("tojás",1,"db"), i("meggylekvár",200,"g"), i("porcukor",50,"g")]),

    ("Mézeskalács", ["mezeskalacs","karacsonyi","keksz"], 60, 30,
     [i("liszt",400,"g"), i("méz",150,"g"), i("vaj",100,"g"), i("tojás",2,"db"), i("szódabikarbóna",1,"tk"), i("fahéj",2,"evőkanál"), i("szegfűszeg",1,"tk")]),

    ("Ischler keksz", ["ischler","keksz","csokolades"], 60, 24,
     [i("liszt",300,"g"), i("dió",150,"g"), i("vaj",200,"g"), i("cukor",80,"g"), i("baracklekvár",200,"g"), i("csokoládé glazúr",200,"g")]),

    ("Vaníliás szarvacska", ["szarvacska","vanilias","keksz"], 60, 30,
     [i("liszt",300,"g"), i("dió",150,"g"), i("vaj",200,"g"), i("porcukor",80,"g"), i("vaníliás cukor",2,"csomag")]),

    ("Flódni", ["flodni","zsidoberakos","ketegyhazas"], 120, 16,
     [i("liszt",500,"g"), i("vaj",250,"g"), i("alma",600,"g"), i("mák",200,"g"), i("dió",200,"g"), i("lekvár",200,"g"), i("méz",3,"evőkanál")]),

    ("Churros csokimártással", ["churros","spanyol","sult"], 30, 4,
     [i("víz",250,"ml"), i("liszt",150,"g"), i("vaj",50,"g"), i("tojás",2,"db"), i("cukor",2,"evőkanál"), i("olaj",500,"ml"), i("étcsokoládé",200,"g")]),

    ("Francia croissant", ["croissant","francia","sutes"], 180, 12,
     [i("liszt",500,"g"), i("vaj",300,"g"), i("tej",200,"ml"), i("élesztő",10,"g"), i("cukor",50,"g"), i("só",1,"tk")]),

    ("Banánkenyér", ["banankenyér","bananas","sutes"], 60, 8,
     [i("banán",3,"db"), i("liszt",200,"g"), i("cukor",100,"g"), i("vaj",100,"g"), i("tojás",2,"db"), i("sütőpor",1,"tk"), i("szódabikarbóna",1,"tk")]),

    ("Citromos túrótorta", ["turotorta","citromos","krem"], 90, 10,
     [i("túró",500,"g"), i("krémsajt",200,"g"), i("cukor",150,"g"), i("tojás",3,"db"), i("citromlé",2,"db"), i("citromhéj",1,"db"), i("keksz alap",250,"g")]),

    ("Meggyes muffin", ["muffin","meggyes","sutes"], 40, 12,
     [i("liszt",250,"g"), i("meggy",200,"g"), i("cukor",150,"g"), i("tojás",2,"db"), i("joghurt",150,"g"), i("olaj",100,"ml"), i("sütőpor",2,"tk")]),

    ("Áfonyás muffin", ["muffin","afonyás","sutes"], 40, 12,
     [i("liszt",250,"g"), i("áfonya",200,"g"), i("cukor",150,"g"), i("tojás",2,"db"), i("joghurt",150,"g"), i("olaj",100,"ml"), i("sütőpor",2,"tk")]),

    ("Karamellás almakrém", ["karamellas","alma","desszert"], 30, 4,
     [i("alma",600,"g"), i("cukor",150,"g"), i("tejszín",200,"ml"), i("vaj",60,"g"), i("fahéj",1,"evőkanál"), i("brandy",2,"evőkanál")]),

    ("Epermousse", ["eper","mousse","krem"], 20, 4,
     [i("eper",400,"g"), i("tejszín",300,"ml"), i("cukor",80,"g"), i("zselatin",3,"lap"), i("citromlé",1,"evőkanál")]),

    ("Málnás joghurthab", ["malnas","joghurt","desszert"], 15, 4,
     [i("málna",300,"g"), i("görög joghurt",400,"g"), i("méz",3,"evőkanál"), i("tejszínhab",200,"ml"), i("vaníliás cukor",1,"csomag")]),

    ("Nutellás palacsinta", ["palacsinta","nutella","gyerekeknek"], 30, 4,
     [i("liszt",200,"g"), i("tej",400,"ml"), i("tojás",2,"db"), i("nutella",300,"g"), i("vaj",40,"g"), i("cukor",2,"evőkanál")],
     "", "A gyerekek kedvence, mennyei csokis-mogyorókrémes töltéssel."),

    ("Sütőtökös pite", ["sutotok","pite","oszi"], 70, 8,
     [i("sütőtökpüré",400,"g"), i("liszt",300,"g"), i("vaj",150,"g"), i("cukor",150,"g"), i("tojás",3,"db"), i("fahéj",2,"evőkanál"), i("szerecsendió",1,"evőkanál")]),

    ("Mandulatorta lisztmentes", ["mandula","torta","lisztmentes"], 60, 10,
     [i("darált mandula",300,"g"), i("cukor",150,"g"), i("tojás",4,"db"), i("vaj",100,"g"), i("étcsokoládé",100,"g")]),

    ("Kókuszgolyó", ["kokusz","golyo","sutesnelkul"], 30, 20,
     [i("kókuszreszelék",200,"g"), i("tejpor",100,"g"), i("porcukor",150,"g"), i("tej",100,"ml"), i("rum",2,"evőkanál")]),
]

# ─── TÉSZTÁK ─────────────────────────────────────────────────────────────────

TESZTA_RECIPES = [
    ("Túrós csusza füstölt szalonnával", ["turos","csusza","magyaros"], 30, 4,
     [i("csigatészta",400,"g"), i("túró",400,"g"), i("tejföl",200,"g"), i("füstölt szalonna",150,"g"), i("só")]),

    ("Tejfölös tészta füstölt hússal", ["tejfolos","teszta","fustolt"], 25, 4,
     [i("rigatoni",400,"g"), i("füstölt csirkemell",300,"g"), i("tejföl",300,"g"), i("hagyma",1,"db"), i("fokhagyma",2,"gerezd"), i("kapor",1,"csokor")]),

    ("Rakott tészta darált hússal", ["rakott","teszta","daralt"], 70, 6,
     [i("penne",400,"g"), i("darált hús",500,"g"), i("tejföl",400,"g"), i("tojás",3,"db"), i("paradicsomlé",300,"ml"), i("reszelt sajt",200,"g")]),

    ("Szalonnás tojásos tészta", ["tojasos","szalonnas","teszta"], 20, 4,
     [i("spagetti",400,"g"), i("tojás",4,"db"), i("pancetta",150,"g"), i("parmezán",80,"g"), i("fokhagyma",2,"gerezd"), i("fekete bors")]),

    ("Tejszínes sonkás tészta", ["tejszines","sonkas","teszta"], 20, 4,
     [i("penne",400,"g"), i("sonka",200,"g"), i("tejszín",200,"ml"), i("hagyma",1,"db"), i("parmezán",60,"g"), i("borsó",100,"g")]),

    ("Cukkinicévárás tészta", ["cukkinis","teszta","nyaras"], 25, 4,
     [i("linguine",400,"g"), i("cukkini",2,"db"), i("fokhagyma",4,"gerezd"), i("olívaolaj",4,"evőkanál"), i("parmezán",60,"g"), i("citromlé",1,"evőkanál")]),

    ("Padlizsános tészta", ["padlizsanos","teszta","mediterranean"], 35, 4,
     [i("rigatoni",400,"g"), i("padlizsán",2,"db"), i("paradicsomlé",400,"ml"), i("fokhagyma",4,"gerezd"), i("mozzarella",150,"g"), i("bazsalikom",1,"csokor")]),

    ("Spenótos gnocchi gorgonzolával", ["gnocchi","spenot","gorgonzola"], 35, 4,
     [i("gnocchi",500,"g"), i("spenót",300,"g"), i("gorgonzola",150,"g"), i("tejszín",200,"ml"), i("fokhagyma",2,"gerezd"), i("parmezán",50,"g")]),

    ("Csirkés tortellini", ["tortellini","csirke","sajtos"], 25, 4,
     [i("tortellini",400,"g"), i("csirkemell",300,"g"), i("tejszín",200,"ml"), i("parmezán",60,"g"), i("fokhagyma",2,"gerezd"), i("snidling",1,"csokor")]),

    ("Tenger gyümölcsei tészta", ["tengeri","spagetti","hal"], 30, 4,
     [i("spagetti",400,"g"), i("kagyló",300,"g"), i("garnéla",200,"g"), i("fokhagyma",4,"gerezd"), i("fehérbor",150,"ml"), i("olívaolaj",3,"evőkanál")]),

    ("Lemon pasta citromos", ["citromos","teszta","konnyu"], 20, 4,
     [i("spaghetti",400,"g"), i("citrom",2,"db"), i("parmezán",80,"g"), i("olívaolaj",4,"evőkanál"), i("fokhagyma",3,"gerezd"), i("kapribogyó",2,"evőkanál")]),

    ("Diós tészta mézzel", ["dios","teszta","edes"], 20, 4,
     [i("pappardelle",400,"g"), i("dió",150,"g"), i("méz",3,"evőkanál"), i("vaj",60,"g"), i("parmezán",60,"g"), i("zsálya",6,"levél")]),

    ("Szarvasgombás tagliatelle", ["szarvasgomba","tagliatelle","luxus"], 20, 4,
     [i("tagliatelle",400,"g"), i("vaj",80,"g"), i("szarvasgomba",50,"g"), i("parmezán",100,"g"), i("tejszín",150,"ml"), i("fekete bors")]),

    ("Csirkés pesto pasta", ["csirke","pesto","pasta"], 25, 4,
     [i("fusilli",400,"g"), i("csirkemell",400,"g"), i("zöld pesto",5,"evőkanál"), i("koktélparadicsom",200,"g"), i("parmezán",60,"g"), i("fenyőmag",30,"g")]),

    ("Görög tészta fetával", ["gorog","feta","teszta"], 25, 4,
     [i("penne",400,"g"), i("feta sajt",200,"g"), i("koktélparadicsom",300,"g"), i("olívabogyó",100,"g"), i("fokhagyma",3,"gerezd"), i("oregánó",1,"evőkanál")]),
]

# ─── SALÁTÁK ───────────────────────────────────────────────────────────────────

SALATA_RECIPES = [
    ("Görög saláta fetával", ["gorog","salata","feta"], 15, 4,
     [i("uborka",1,"db"), i("paradicsom",3,"db"), i("paprika",1,"db"), i("vöröshagyma",1,"db"), i("feta sajt",200,"g"), i("olívabogyó",100,"g"), i("olívaolaj",4,"evőkanál")]),

    ("Niçoise saláta", ["nicoise","salata","francia"], 25, 4,
     [i("tonhal",200,"g"), i("főtt tojás",4,"db"), i("zöldbab",200,"g"), i("burgonya",300,"g"), i("olívabogyó",100,"g"), i("paradicsom",200,"g"), i("kapribogyó",2,"evőkanál")]),

    ("Waldorf saláta", ["waldorf","salata","amerkai"], 20, 4,
     [i("alma",2,"db"), i("zeller",3,"szár"), i("dió",100,"g"), i("majonéz",150,"g"), i("citromlé",1,"evőkanál"), i("jégsaláta",1,"fej")]),

    ("Kapros uborkasaláta tejföllel", ["uborka","kapros","salata"], 15, 4,
     [i("uborka",2,"db"), i("tejföl",200,"g"), i("kapor",1,"csokor"), i("fokhagyma",2,"gerezd"), i("cukor",1,"evőkanál"), i("ecet",2,"evőkanál")]),

    ("Coleslaw saláta", ["coleslaw","kaposzta","amerkai"], 15, 6,
     [i("fehérkáposzta",600,"g"), i("sárgarépa",2,"db"), i("majonéz",200,"g"), i("ecet",2,"evőkanál"), i("cukor",2,"evőkanál"), i("só")]),

    ("Epres rukkola saláta kecskesajttal", ["rukkolab","eper","kecskesajt"], 15, 4,
     [i("rukkola",200,"g"), i("eper",300,"g"), i("kecskesajt",150,"g"), i("fenyőmag",40,"g"), i("balzsamecet",3,"evőkanál"), i("olívaolaj",3,"evőkanál")]),

    ("Avokádós saláta grillcsirkével", ["avokado","csirke","salata"], 25, 4,
     [i("csirkemell",400,"g"), i("avokádó",2,"db"), i("koktélparadicsom",200,"g"), i("saláta",1,"fej"), i("lime",1,"db"), i("olívaolaj",3,"evőkanál")]),

    ("Quinoa saláta zöldségekkel", ["quinoa","salata","egeszseges"], 25, 4,
     [i("quinoa",200,"g"), i("uborka",1,"db"), i("paradicsom",2,"db"), i("paprika",1,"db"), i("petrezselyem",1,"csokor"), i("citromlé",2,"evőkanál"), i("olívaolaj",3,"evőkanál")]),

    ("Tábouli saláta bulgurral", ["tabbouleh","bulgur","kozel-keleti"], 30, 4,
     [i("bulgur",200,"g"), i("petrezselyem",2,"csokor"), i("menta",1,"csokor"), i("paradicsom",2,"db"), i("hagyma",1,"db"), i("citromlé",3,"evőkanál"), i("olívaolaj",4,"evőkanál")]),

    ("Hummusz padlizsánkrémmel", ["hummusz","padlizsan","kozel-keleti"], 20, 4,
     [i("csicseriborsó",400,"g"), i("tahini",3,"evőkanál"), i("citromlé",2,"db"), i("fokhagyma",3,"gerezd"), i("olívaolaj",4,"evőkanál"), i("kömény",1,"tk")]),

    ("Fetás görög saláta méntatésztával", ["feta","menta","salata"], 15, 4,
     [i("görög saláta alap",400,"g"), i("feta",200,"g"), i("menta",1,"csokor"), i("citromlé",1,"db"), i("olívaolaj",3,"evőkanál")]),

    ("Mexikói saláta fekete babbal", ["mexikoi","bab","salata"], 20, 4,
     [i("fekete bab",400,"g"), i("kukorica",200,"g"), i("paradicsom",2,"db"), i("koriander",1,"csokor"), i("avokádó",1,"db"), i("lime",1,"db")]),

    ("Bulgur saláta fetával", ["bulgur","feta","salata"], 20, 4,
     [i("bulgur",200,"g"), i("feta",200,"g"), i("koktélparadicsom",200,"g"), i("uborka",1,"db"), i("olívabogyó",100,"g"), i("citromlé",1,"db")]),

    ("Radicchio saláta körte gorgonzolával", ["radicchio","korte","gorgonzola"], 15, 4,
     [i("radicchio",1,"fej"), i("körte",2,"db"), i("gorgonzola",100,"g"), i("dió",80,"g"), i("balzsamecet",2,"evőkanál"), i("méz",1,"evőkanál")]),

    ("Hajdinasaláta zöldségekkel", ["hajdina","salata","egeszseges"], 25, 4,
     [i("hajdina",200,"g"), i("paprika",2,"db"), i("uborka",1,"db"), i("hagyma",1,"db"), i("petrezselyem",1,"csokor"), i("olívaolaj",3,"evőkanál")]),
]

# ─── REGGELIK ────────────────────────────────────────────────────────────────

REGGELI_RECIPES = [
    ("Avokádós pirítós tojással", ["avokado","piritós","tojás"], 15, 2,
     [i("avokádó",1,"db"), i("toast kenyér",4,"szelet"), i("tojás",2,"db"), i("citromlé",1,"evőkanál"), i("só"), i("bors"), i("chili pehely")]),

    ("Overnight oats gyümölccsel", ["oats","overnight","reggeli"], 10, 2,
     [i("zabpehely",100,"g"), i("tej",200,"ml"), i("görög joghurt",100,"g"), i("méz",2,"evőkanál"), i("chia mag",1,"evőkanál"), i("vegyes gyümölcs",200,"g")]),

    ("Smoothie bowl", ["smoothie","bowl","gyumolcsos"], 10, 2,
     [i("banán",2,"db"), i("áfonya",150,"g"), i("görög joghurt",200,"g"), i("granola",100,"g"), i("méz",2,"evőkanál"), i("kókuszreszelék",30,"g")]),

    ("Francia toast", ["francia","toast","tojasos"], 20, 4,
     [i("fehér kenyér",8,"szelet"), i("tojás",3,"db"), i("tej",150,"ml"), i("fahéj",1,"evőkanál"), i("vaj",60,"g"), i("juharszirup",4,"evőkanál")]),

    ("Házi granola", ["granola","hazikeszitesu","reggeli"], 40, 8,
     [i("zabpehely",300,"g"), i("méz",4,"evőkanál"), i("mandula",100,"g"), i("kesudió",100,"g"), i("kókuszreszelék",50,"g"), i("olaj",3,"evőkanál")]),

    ("Tojásos rámentyúkgomba", ["rakos","omlett","reggeli"], 20, 2,
     [i("tojás",4,"db"), i("gomba",150,"g"), i("sajt",80,"g"), i("hagyma",1,"db"), i("vaj",30,"g"), i("só"), i("petrezselyem",1,"csokor")]),

    ("Açaí bowl", ["acai","bowl","trendi"], 10, 2,
     [i("açaí por",2,"evőkanál"), i("banán",2,"db"), i("áfonya",100,"g"), i("kókusztej",100,"ml"), i("granola",80,"g"), i("friss gyümölcs",200,"g")]),

    ("Paleo palacsinta banánból", ["paleo","palacsinta","egeszseges"], 20, 2,
     [i("banán",2,"db"), i("tojás",2,"db"), i("mandulaliszt",50,"g"), i("fahéj",1,"tk"), i("kókuszolaj",1,"evőkanál"), i("méz",1,"evőkanál")]),

    ("Shakshuka tojással paprikában", ["shakshuka","tojas","reggeli"], 25, 4,
     [i("tojás",4,"db"), i("paradicsomlé",400,"ml"), i("paprika",2,"db"), i("hagyma",1,"db"), i("fokhagyma",3,"gerezd"), i("paprika por",1,"evőkanál")]),

    ("Bagel krémsajttal lazaccal", ["bagel","lazac","kremsajt"], 10, 2,
     [i("bagel",2,"db"), i("krémsajt",100,"g"), i("füstölt lazac",100,"g"), i("uborka",1,"db"), i("kapribogyó",1,"evőkanál"), i("vöröshagyma",1,"db")]),

    ("Müzli joghurttal", ["muzli","joghurt","gyors"], 5, 2,
     [i("müzli",150,"g"), i("görög joghurt",300,"g"), i("méz",2,"evőkanál"), i("friss bogyós gyümölcs",150,"g")]),

    ("Tócsni tejföllel", ["tocssni","krumplis","magyaros"], 30, 4,
     [i("burgonya",600,"g"), i("tojás",2,"db"), i("liszt",3,"evőkanál"), i("hagyma",1,"db"), i("só"), i("olaj",200,"ml"), i("tejföl",150,"g")]),

    ("Chia mag puding", ["chia","puding","egeszseges"], 10, 2,
     [i("chia mag",60,"g"), i("kókusztej",400,"ml"), i("méz",2,"evőkanál"), i("vanília",1,"tk"), i("mangó",1,"db")]),

    ("Vafli gyümölccsel", ["vafli","gyumoalcs","reggeli"], 30, 4,
     [i("liszt",200,"g"), i("tojás",2,"db"), i("tej",250,"ml"), i("vaj",60,"g"), i("sütőpor",2,"tk"), i("cukor",2,"evőkanál"), i("vegyes gyümölcs",300,"g")]),

    ("Kecskesajtos tojásrántotta", ["tojasos","kecskesajt","konnyu"], 10, 2,
     [i("tojás",4,"db"), i("kecskesajt",80,"g"), i("rukkola",50,"g"), i("cseresznyeparadicsom",100,"g"), i("vaj",20,"g"), i("só"), i("bors")]),

    ("Hummus tálka pitával", ["hummusz","pita","reggeli"], 10, 4,
     [i("hummus",300,"g"), i("pita",4,"db"), i("uborka",1,"db"), i("paradicsom",2,"db"), i("olívabogyó",100,"g"), i("paprika",1,"db")]),

    ("Zöld turmix spenóttal", ["turmix","zold","egeszseges"], 5, 2,
     [i("spenót",100,"g"), i("banán",1,"db"), i("alma",1,"db"), i("citromlé",1,"evőkanál"), i("gyömbér",10,"g"), i("víz",200,"ml")]),

    ("Tojásos szendvics", ["szendvics","tojas","gyors"], 15, 2,
     [i("tojás",4,"db"), i("toast kenyér",4,"szelet"), i("majonéz",2,"evőkanál"), i("mustár",1,"evőkanál"), i("saláta levél",4,"db"), i("só"), i("bors")]),
]

# ─── EGYTÁLÉTELEK ───────────────────────────────────────────────────────────────

EGYTALETEL_RECIPES = [
    ("Moussaka sütőben", ["muszaka","gorog","sutobe"], 110, 6,
     [i("darált bárány",600,"g"), i("padlizsán",3,"db"), i("burgonya",3,"db"), i("besamel",500,"ml"), i("paradicsomlé",300,"ml"), i("fahéj",1,"tk")]),

    ("Rakott padlizsán hússal", ["padlizsan","rakott","mediterran"], 70, 4,
     [i("padlizsán",3,"db"), i("darált hús",500,"g"), i("paradicsomlé",300,"ml"), i("mozzarella",250,"g"), i("fokhagyma",4,"gerezd"), i("parmezán",80,"g")]),

    ("Sütőben sült rizses hús", ["rizses","hus","sutobe"], 80, 4,
     [i("sertéshús",600,"g"), i("rizs",300,"g"), i("hagyma",2,"db"), i("paprika",3,"evőkanál"), i("paradicsomlé",400,"ml"), i("olaj",3,"evőkanál")]),

    ("Egytál csirkés sütőtökös curry", ["csirke","sutotok","egytaletel"], 50, 4,
     [i("csirkemell",500,"g"), i("sütőtök",600,"g"), i("kókusztej",400,"ml"), i("curry por",2,"evőkanál"), i("hagyma",1,"db"), i("fokhagyma",3,"gerezd")]),

    ("Goulash leves sertéshússal", ["gulyas","leves","egytaletel"], 90, 6,
     [i("sertéshús",700,"g"), i("burgonya",500,"g"), i("hagyma",3,"db"), i("paprika",3,"evőkanál"), i("paradicsom",2,"db"), i("csipetke",200,"g")]),

    ("Spárgás risotto csirkével", ["risotto","sparga","csirke"], 50, 4,
     [i("arborio rizs",300,"g"), i("spárga",400,"g"), i("csirkemell",300,"g"), i("fehérbor",150,"ml"), i("parmezán",80,"g"), i("alaplé",1,"l")]),

    ("Wok zöldséges tofuval és rizzsel", ["wok","tofu","rizs"], 25, 4,
     [i("tofu",300,"g"), i("rizs",250,"g"), i("brokkoli",300,"g"), i("répa",2,"db"), i("szójaszósz",4,"evőkanál"), i("szezámolaj",2,"evőkanál")]),

    ("Sütőben sült zöldséges csirke", ["csirke","zoldseg","sutobe"], 60, 4,
     [i("csirkecomb",4,"db"), i("burgonya",500,"g"), i("paprika",2,"db"), i("hagyma",2,"db"), i("sárgarépa",2,"db"), i("fokhagyma",6,"gerezd")]),

    ("Lencsés egytál kolbásszal", ["lencse","egytaletel","kolbasz"], 50, 4,
     [i("lencse",300,"g"), i("kolbász",300,"g"), i("sárgarépa",2,"db"), i("hagyma",2,"db"), i("paradicsomlé",400,"ml"), i("fokhagyma",3,"gerezd")]),

    ("Borscht céklapiros leves", ["borscht","cekla","keleteuropai"], 70, 6,
     [i("cékla",400,"g"), i("káposzta",300,"g"), i("sertéshús",400,"g"), i("hagyma",2,"db"), i("tejföl",200,"g"), i("citromlé",1,"evőkanál")]),

    ("Fehérbabos sertéshús toszkán", ["bab","sertes","toszkán"], 60, 4,
     [i("fehérbab",400,"g"), i("sertéshús",500,"g"), i("paradicsom",300,"g"), i("rozmaring",2,"ág"), i("zsálya",6,"levél"), i("fokhagyma",4,"gerezd")]),

    ("Zöldséges couscous csicseriborsóval", ["couscous","csicseriborsas","kozel-keleti"], 25, 4,
     [i("couscous",300,"g"), i("csicseriborsó",400,"g"), i("sütőtök",400,"g"), i("rozmaringos zöldségalaplé",400,"ml"), i("ras el hanout",2,"evőkanál"), i("petrezselyem",1,"csokor")]),
]

# ─── BUILDER ─────────────────────────────────────────────────────────────────

# ─── EXTRA FŐÉTELEK ──────────────────────────────────────────────────────────

EXTRA_FOETEL_RECIPES = [
    ("Mustáros mézes csirkecomb sütőben", ["csirke","mustaros","sutobe"], 65, 4,
     [i("csirkecomb",4,"db"), i("dijoni mustár",3,"evőkanál"), i("méz",3,"evőkanál"), i("fokhagyma",4,"gerezd"), i("olívaolaj",2,"evőkanál"), i("rozmaring",2,"ág")]),

    ("Csirkés shakshuka", ["csirke","shakshuka","fuszeres"], 40, 4,
     [i("csirkemell",400,"g"), i("paradicsomlé",400,"ml"), i("paprika",2,"db"), i("tojás",4,"db"), i("hagyma",1,"db"), i("fokhagyma",3,"gerezd"), i("kömény",1,"evőkanál")]),

    ("Ropogós csirkemell parmezánban bundázva", ["csirke","parmezanos","ropogos"], 30, 4,
     [i("csirkemell",600,"g"), i("parmezán",100,"g"), i("zsemlemorzsa",80,"g"), i("tojás",2,"db"), i("fokhagymapor",1,"evőkanál"), i("olaj",200,"ml")]),

    ("Sertéscomb almás mártásban", ["sertes","almas","mártásos"], 90, 6,
     [i("sertéscomb",1.2,"kg"), i("alma",3,"db"), i("alma cider",200,"ml"), i("hagyma",2,"db"), i("kakukkfű",3,"ág"), i("méz",2,"evőkanál")]),

    ("Kínai édes-savanyú csirke", ["csirke","kinai","edes-savanyú"], 35, 4,
     [i("csirkemell",600,"g"), i("paprika",2,"db"), i("ananász",200,"g"), i("szójaszósz",3,"evőkanál"), i("ecet",3,"evőkanál"), i("cukor",2,"evőkanál"), i("keményítő",2,"evőkanál")]),

    ("Beef stroganoff", ["marha","orosz","stroganoff"], 40, 4,
     [i("marhahús",600,"g"), i("gomba",300,"g"), i("tejföl",300,"g"), i("hagyma",2,"db"), i("dijoni mustár",1,"evőkanál"), i("fehérbor",100,"ml")]),

    ("Sertés sörben párolva", ["sertes","soros","egytaletel"], 120, 6,
     [i("sertéscomb",1,"kg"), i("sör",500,"ml"), i("hagyma",3,"db"), i("fokhagyma",6,"gerezd"), i("babérlevél",3,"db"), i("kömény",2,"evőkanál")]),

    ("Csirke tikka", ["csirke","tikka","indiai"], 45, 4,
     [i("csirkemell",600,"g"), i("joghurt",200,"g"), i("tikka masala",4,"evőkanál"), i("citromlé",1,"db"), i("fokhagyma",3,"gerezd"), i("gyömbér",20,"g")]),

    ("Citromos oreganós csirkecomb görögösen", ["csirke","citromos","gorog"], 65, 4,
     [i("csirkecomb",4,"db"), i("citrom",2,"db"), i("oregánó",2,"evőkanál"), i("fokhagyma",6,"gerezd"), i("olívaolaj",4,"evőkanál"), i("fehérbor",100,"ml")]),

    ("Teriyaki csirke rizzsel", ["csirke","teriyaki","japan"], 30, 4,
     [i("csirkemell",600,"g"), i("szójaszósz",4,"evőkanál"), i("méz",3,"evőkanál"), i("szeszake",2,"evőkanál"), i("gyömbér",15,"g"), i("rizs",300,"g")]),

    ("Svéd húsgolyók tejszínes mártással", ["husgolyok","svéd","tejszines"], 45, 4,
     [i("darált hús",600,"g"), i("tejszín",300,"ml"), i("hagyma",1,"db"), i("zsemlemorzsa",60,"g"), i("tojás",1,"db"), i("szójaszósz",2,"evőkanál")]),

    ("Orosz pelmeni", ["pelmeni","orosz","teszta"], 60, 4,
     [i("liszt",400,"g"), i("darált hús",400,"g"), i("hagyma",2,"db"), i("tojás",2,"db"), i("tejföl",200,"g"), i("só"), i("bors")]),

    ("Csirkés fajita", ["fajita","csirke","mexikoi"], 30, 4,
     [i("csirkemell",600,"g"), i("paprika",3,"db"), i("hagyma",2,"db"), i("tortilla",8,"db"), i("tejföl",100,"g"), i("fajita fűszer",2,"evőkanál")]),

    ("Sertéshús kung pao", ["kung-pao","sertes","kinai"], 30, 4,
     [i("sertéshús",500,"g"), i("aszalt chili",6,"db"), i("mogyoró",100,"g"), i("szójaszósz",3,"evőkanál"), i("ecet",2,"evőkanál"), i("cukor",2,"evőkanál")]),

    ("Kapros tejszínes lazac", ["lazac","kapros","tejszines"], 25, 4,
     [i("lazacfilé",600,"g"), i("tejszín",200,"ml"), i("kapor",1,"csokor"), i("fokhagyma",2,"gerezd"), i("citromlé",1,"db"), i("vaj",30,"g")]),

    ("Pangáziusz citromos-fokhagymás", ["pangaziusz","hal","citromos"], 20, 4,
     [i("pangáziusz filé",600,"g"), i("citrom",2,"db"), i("fokhagyma",4,"gerezd"), i("kapor",1,"csokor"), i("vaj",60,"g"), i("só"), i("bors")]),

    ("Garnéla fokhagymás vajban", ["garnela","vajas","fokhagymas"], 15, 4,
     [i("garnéla",600,"g"), i("vaj",80,"g"), i("fokhagyma",6,"gerezd"), i("citromlé",1,"db"), i("petrezselyem",1,"csokor"), i("fehérbor",100,"ml")]),

    ("Sütőtök fűszeres krémleves csirkével", ["csirke","sutotok","leves"], 50, 4,
     [i("sütőtök",600,"g"), i("csirkemell",300,"g"), i("kókusztej",400,"ml"), i("curry por",2,"evőkanál"), i("gyömbér",20,"g"), i("hagyma",1,"db")]),

    ("Marha ragu tésztával", ["marha","ragu","tejszines"], 120, 4,
     [i("marhahús",700,"g"), i("sárgarépa",2,"db"), i("zeller",2,"szár"), i("paradicsomlé",400,"ml"), i("vörösbor",200,"ml"), i("hagyma",2,"db")]),

    ("Csirkés gombás tejszínes serpenyős", ["csirke","gomba","serpenyos"], 30, 4,
     [i("csirkemell",600,"g"), i("vegyes gomba",300,"g"), i("tejszín",200,"ml"), i("fokhagyma",3,"gerezd"), i("kakukkfű"), i("fehérbor",100,"ml")]),

    ("Sertéstarja paradicsomosan", ["tarja","sertes","paradicsomos"], 70, 4,
     [i("sertéstarja",600,"g"), i("paradicsomlé",400,"ml"), i("paprika",2,"db"), i("hagyma",2,"db"), i("fokhagyma",4,"gerezd"), i("paprika",2,"evőkanál")]),

    ("Grillezett cukkini feta sajttal", ["cukkini","grillezett","feta"], 20, 4,
     [i("cukkini",3,"db"), i("feta sajt",200,"g"), i("mentás joghurt",150,"g"), i("citromlé",1,"db"), i("olívaolaj",3,"evőkanál"), i("fokhagyma",2,"gerezd")]),

    ("Brokkoli sajtos rakott", ["brokkoli","rakott","sajtos"], 50, 4,
     [i("brokkoli",800,"g"), i("tejszín",300,"ml"), i("reszelt sajt",200,"g"), i("fokhagyma",3,"gerezd"), i("zsemlemorzsa",60,"g"), i("vaj",40,"g")]),

    ("Sütőben sült töltött paprika rizzsel", ["toltott","paprika","rizses"], 80, 4,
     [i("húsos paprika",4,"db"), i("rizs",150,"g"), i("darált hús",400,"g"), i("paradicsomlé",400,"ml"), i("hagyma",1,"db"), i("sajt",100,"g")]),

    ("Töltött gombafej spinóttal", ["gomba","toltott","spenot"], 40, 4,
     [i("portobello gomba",8,"db"), i("spenót",200,"g"), i("krémsajt",200,"g"), i("fokhagyma",3,"gerezd"), i("parmezán",50,"g"), i("só"), i("bors")]),

    ("Csirkemell Parma sonkával tekerve", ["csirke","parma","olasz"], 35, 4,
     [i("csirkemell",4,"db"), i("parma sonka",8,"szelet"), i("zsálya",8,"levél"), i("vaj",60,"g"), i("fehérbor",100,"ml"), i("só"), i("bors")]),

    ("Olasz paradicsomos kagyló", ["kagylás","paradicsomos","tengerisütemény"], 30, 4,
     [i("kagyló",1,"kg"), i("paradicsom",400,"g"), i("fokhagyma",5,"gerezd"), i("fehérbor",150,"ml"), i("petrezselyem",1,"csokor"), i("olívaolaj",4,"evőkanál")]),

    ("Sárgarépás gyömbéres csirkecurry", ["csirke","sargarepa","curry"], 45, 4,
     [i("csirkemell",600,"g"), i("sárgarépa",3,"db"), i("kókusztej",400,"ml"), i("curry por",2,"evőkanál"), i("gyömbér",25,"g"), i("hagyma",1,"db")]),

    ("Csirkés tamarindos mártásban", ["csirke","tamarind","azsiai"], 40, 4,
     [i("csirkecomb",4,"db"), i("tamarind paszta",3,"evőkanál"), i("szójaszósz",3,"evőkanál"), i("méz",2,"evőkanál"), i("fokhagyma",4,"gerezd"), i("gyömbér",20,"g")]),

    ("Sertéshús ananászos szójaszószban", ["sertes","ananasz","azsiai"], 35, 4,
     [i("sertéshús",600,"g"), i("ananász",300,"g"), i("szójaszósz",4,"evőkanál"), i("fokhagyma",3,"gerezd"), i("gyömbér",15,"g"), i("cukor",2,"evőkanál")]),

    ("Pisztráng fokhagymás vajjal", ["pisztrng","hal","vajban"], 20, 4,
     [i("pisztráng",2,"db"), i("vaj",80,"g"), i("fokhagyma",4,"gerezd"), i("citrom",1,"db"), i("kapribogyó",2,"evőkanál"), i("petrezselyem",1,"csokor")]),

    ("Csülök sörben párolva", ["csulok","soros","magyaros"], 180, 6,
     [i("sertéscsülök",1.5,"kg"), i("sör",500,"ml"), i("hagyma",2,"db"), i("fokhagyma",6,"gerezd"), i("babérlevél",3,"db"), i("kömény",1,"evőkanál")]),

    ("Malacsült rozmaringgal", ["malacsult","sertes","sutobe"], 120, 6,
     [i("malacsült",1.5,"kg"), i("rozmaring",4,"ág"), i("fokhagyma",8,"gerezd"), i("olívaolaj",3,"evőkanál"), i("só"), i("bors")]),

    ("Csirkés shakshuka paradicsomban", ["shakshuka","csirke","tojasos"], 35, 4,
     [i("csirkemell",400,"g"), i("paradicsomlé",400,"ml"), i("tojás",4,"db"), i("paprika",2,"db"), i("paprikapor",1,"evőkanál"), i("fokhagyma",3,"gerezd")]),

    ("Olasz osso buco", ["ossabuco","borju","olasz"], 150, 4,
     [i("borjú lábszár szelet",4,"db"), i("fehérbor",200,"ml"), i("paradicsom",400,"g"), i("sárgarépa",2,"db"), i("hagyma",2,"db"), i("zellerccsont",2,"szár")]),

    ("Sertés belly konfitálva", ["sertes","belly","konfitalt"], 180, 4,
     [i("sertéshas",800,"g"), i("só",50,"g"), i("fokhagyma",6,"gerezd"), i("kakukkfű",4,"ág"), i("rozmaring",3,"ág"), i("bors")]),

    ("Grillcsirke egészben sütőben", ["csirke","egeszben","sutobe"], 90, 4,
     [i("egész csirke",1.5,"kg"), i("vaj",80,"g"), i("fokhagyma",6,"gerezd"), i("citrom",1,"db"), i("rozmaring",3,"ág"), i("kakukkfű",3,"ág")]),

    ("Csirkés coq au vin", ["coqauvin","csirke","boros"], 90, 4,
     [i("csirkecomb",4,"db"), i("vörösbor",300,"ml"), i("bacon",100,"g"), i("gomba",200,"g"), i("gyöngyhagyma",12,"db"), i("fokhagyma",4,"gerezd")]),

    ("Blanquette de veau", ["borju","tejszines","francia"], 90, 4,
     [i("borjúhús",700,"g"), i("tejszín",300,"ml"), i("sárgarépa",2,"db"), i("hagyma",1,"db"), i("gomba",200,"g"), i("tojássárgája",2,"db")]),

    ("Boeuf bourguignon", ["marha","boros","francia"], 180, 6,
     [i("marhahús",1,"kg"), i("vörösbor",500,"ml"), i("bacon",150,"g"), i("sárgarépa",3,"db"), i("gyöngyhagyma",16,"db"), i("gomba",300,"g")]),

    ("Sertés csülök babágyon", ["csulok","bab","magyaros"], 120, 4,
     [i("füstölt csülök",1,"kg"), i("szárazbab",400,"g"), i("hagyma",2,"db"), i("paprika",3,"evőkanál"), i("babérlevél",3,"db"), i("fokhagyma",4,"gerezd")]),

    ("Csirkés enchilada", ["enchilada","csirke","mexikoi"], 50, 4,
     [i("csirkemell",400,"g"), i("tortilla",8,"db"), i("enchilada szósz",400,"ml"), i("sajt",200,"g"), i("tejföl",100,"g"), i("hagyma",1,"db")]),

    ("Padlizsán Parmigiana", ["padlizsan","parmigiana","olasz"], 80, 4,
     [i("padlizsán",3,"db"), i("paradicsomlé",400,"ml"), i("mozzarella",250,"g"), i("parmezán",100,"g"), i("bazsalikom",1,"csokor"), i("olívaolaj",4,"evőkanál")]),

    ("Csirkés korianderes kókuszleves", ["csirke","koriander","kokusze"], 40, 4,
     [i("csirkemell",400,"g"), i("kókusztej",400,"ml"), i("koriander",1,"csokor"), i("lime",2,"db"), i("fokhagyma",3,"gerezd"), i("gyömbér",20,"g")]),

    ("Fokhagymás-vajas spárga grillezve", ["sparga","vajas","grillezett"], 20, 4,
     [i("spárga",600,"g"), i("vaj",60,"g"), i("fokhagyma",4,"gerezd"), i("parmezán",50,"g"), i("citromlé",1,"evőkanál"), i("só"), i("bors")]),

    ("Sertéshús szezámos brokkolival", ["sertes","szezam","brokkoli"], 30, 4,
     [i("sertéshús",500,"g"), i("brokkoli",400,"g"), i("szójaszósz",4,"evőkanál"), i("szezám",2,"evőkanál"), i("fokhagyma",3,"gerezd"), i("gyömbér",15,"g")]),

    ("Csirke Marsala", ["csirke","marsala","olasz"], 35, 4,
     [i("csirkemell",600,"g"), i("marsala bor",150,"ml"), i("gomba",200,"g"), i("hagyma",1,"db"), i("tejszín",150,"ml"), i("vaj",50,"g")]),

    ("Kacsamell cseresznyemártással", ["kacsa","cseresznye","mártásos"], 40, 4,
     [i("kacsamell",600,"g"), i("cseresznye",300,"g"), i("vörösbor",150,"ml"), i("méz",2,"evőkanál"), i("babérlevél",2,"db"), i("fokhagyma",3,"gerezd")]),

    ("Halfilé zöldfűszeres kéreggel", ["hal","zoldfuszeres","sutobe"], 25, 4,
     [i("fehérhalfilé",600,"g"), i("petrezselyem",1,"csokor"), i("kapor",1,"csokor"), i("zsemlemorzsa",80,"g"), i("citromhéj",1,"db"), i("fokhagyma",2,"gerezd")]),

    ("Tonhal steak szezámban bundázva", ["tonhal","szezam","steak"], 15, 4,
     [i("tonhal steak",4,"db"), i("szezám",100,"g"), i("szójaszósz",3,"evőkanál"), i("szezámolaj",2,"evőkanál"), i("gyömbér",15,"g"), i("wasabi",1,"evőkanál")]),

    ("Csirkés bab enchilada", ["enchilada","bab","csirke"], 50, 4,
     [i("csirkemell",400,"g"), i("fekete bab",400,"g"), i("tortilla",8,"db"), i("szalsa",300,"ml"), i("sajt",200,"g"), i("avokádó",1,"db")]),

    ("Fokhagymás csirkeszárny", ["csirkeszarny","fokhagymas","sutobe"], 50, 4,
     [i("csirkeszárny",1,"kg"), i("fokhagyma",8,"gerezd"), i("vaj",60,"g"), i("citromlé",1,"db"), i("petrezselyem",1,"csokor"), i("só"), i("bors")]),

    ("Marha taco", ["taco","marha","mexikoi"], 35, 4,
     [i("darált marhahús",500,"g"), i("taco kagylók",12,"db"), i("saláta",1,"fej"), i("paradicsom",2,"db"), i("sajt",150,"g"), i("tejföl",100,"g"), i("taco fűszer",2,"evőkanál")]),

    ("Puerco en salsa verde", ["sertes","zold-salsa","mexikoi"], 60, 4,
     [i("sertéshús",600,"g"), i("tomatillo",400,"g"), i("zöld chili",3,"db"), i("hagyma",1,"db"), i("koriander",1,"csokor"), i("fokhagyma",4,"gerezd")]),

    ("Csirkés pilaf",["csirke","pilaf","kozel-keleti"], 50, 4,
     [i("csirkemell",400,"g"), i("basmati rizs",300,"g"), i("hagyma",2,"db"), i("fahéj",1,"rúd"), i("csillagánizs",2,"db"), i("mazsola",50,"g"), i("mandula",50,"g")]),

    ("Bárány kofta", ["barany","kofta","kozel-keleti"], 30, 4,
     [i("darált bárány",600,"g"), i("hagyma",1,"db"), i("kömény",1,"evőkanál"), i("koriander",1,"evőkanál"), i("fahéj",1,"tk"), i("petrezselyem",1,"csokor")]),

    ("Lamb chop rozmaringgal", ["barany","bordas","rozmaring"], 25, 4,
     [i("bárányborda",8,"db"), i("rozmaring",4,"ág"), i("fokhagyma",4,"gerezd"), i("olívaolaj",3,"evőkanál"), i("mustár",2,"evőkanál"), i("só"), i("bors")]),

    ("Karaj sajttal töltve", ["karaj","toltott","sajtos"], 40, 4,
     [i("sertéskaraj",600,"g"), i("füstölt sajt",150,"g"), i("sonka",100,"g"), i("mustár",2,"evőkanál"), i("olaj",2,"evőkanál"), i("só"), i("bors")]),

    ("Csirkemell olajban konfitálva", ["csirke","konfitalt","porhanyos"], 90, 4,
     [i("csirkemell",4,"db"), i("olívaolaj",500,"ml"), i("fokhagyma",6,"gerezd"), i("kakukkfű",4,"ág"), i("citromhéj",1,"db"), i("só")]),

    ("Pirított sertésmáj hagymával", ["maj","sertes","pirított"], 25, 4,
     [i("sertésmáj",600,"g"), i("hagyma",3,"db"), i("liszt",4,"evőkanál"), i("olaj",4,"evőkanál"), i("só"), i("bors"), i("majoránna",1,"evőkanál")]),

    ("Velős pirítós", ["velő","marha","piritos"], 25, 4,
     [i("marhavelő",400,"g"), i("toast",8,"szelet"), i("vaj",60,"g"), i("petrezselyem",1,"csokor"), i("fokhagyma",2,"gerezd"), i("só"), i("bors")]),

    ("Csirkemell mangós salsa szósszal", ["csirke","mango","salsa"], 25, 4,
     [i("csirkemell",600,"g"), i("mangó",2,"db"), i("vöröshagyma",1,"db"), i("koriander",1,"csokor"), i("lime",2,"db"), i("jalapeño",1,"db")]),

    ("Sertéshús bab chili", ["chili","bab","sertes"], 60, 4,
     [i("darált sertés",600,"g"), i("vörösbab",400,"g"), i("paradicsom",400,"g"), i("chili",2,"db"), i("hagyma",2,"db"), i("kömény",2,"evőkanál"), i("koriander",1,"evőkanál")]),

    ("Szicíliai caponata", ["caponata","padlizsan","sziciliai"], 45, 4,
     [i("padlizsán",2,"db"), i("paradicsom",300,"g"), i("olívabogyó",100,"g"), i("kapribogyó",2,"evőkanál"), i("zeller",2,"szár"), i("cukor",2,"evőkanál"), i("ecet",3,"evőkanál")]),

    ("Csirkés biryani", ["biryani","csirke","indiai"], 90, 6,
     [i("csirkecomb",4,"db"), i("basmati rizs",400,"g"), i("joghurt",200,"g"), i("hagyma",3,"db"), i("sáfrány",1,"csipet"), i("biryani fűszer",3,"evőkanál")]),

    ("Grillezett tintahal fokhagymásan", ["tintahal","grillezett","tengeri"], 20, 4,
     [i("tintahal",600,"g"), i("fokhagyma",4,"gerezd"), i("olívaolaj",3,"evőkanál"), i("petrezselyem",1,"csokor"), i("citromlé",1,"db"), i("só"), i("bors")]),

    ("Sertés shoulder pulled pork", ["pulled-pork","sertes","slow-cook"], 360, 8,
     [i("sertés lapocka",1.5,"kg"), i("BBQ szósz",200,"ml"), i("paprika",2,"evőkanál"), i("barna cukor",2,"evőkanál"), i("fokhagymapor",1,"evőkanál"), i("só")]),

    ("Csirke adobo", ["csirke","adobo","filippo"], 60, 4,
     [i("csirkecomb",4,"db"), i("szójaszósz",4,"evőkanál"), i("ecet",4,"evőkanál"), i("fokhagyma",6,"gerezd"), i("babérlevél",3,"db"), i("bors")]),

    ("Sertéshús cashew dióval kínai módra", ["sertes","cashew","kinai"], 30, 4,
     [i("sertéshús",500,"g"), i("cashew dió",150,"g"), i("paprika",2,"db"), i("szójaszósz",4,"evőkanál"), i("szezámolaj",2,"evőkanál"), i("fokhagyma",3,"gerezd")]),

    ("Lazac teriyaki", ["lazac","teriyaki","japan"], 25, 4,
     [i("lazacfilé",600,"g"), i("szójaszósz",4,"evőkanál"), i("méz",3,"evőkanál"), i("szake",2,"evőkanál"), i("gyömbér",15,"g"), i("szezám",2,"evőkanál")]),

    ("Kagylós spaghetti nero", ["kagylós","tenta","olasz"], 35, 4,
     [i("spagetti",400,"g"), i("kagyló",600,"g"), i("tintahalténta",2,"evőkanál"), i("fokhagyma",4,"gerezd"), i("fehérbor",150,"ml"), i("petrezselyem",1,"csokor")]),

    ("Tonhal tataki", ["tonhal","tataki","japán"], 15, 4,
     [i("tonhal",400,"g"), i("szójaszósz",3,"evőkanál"), i("szezámolaj",2,"evőkanál"), i("szezám",50,"g"), i("gyömbér",15,"g"), i("zöldhagyma",3,"szál")]),

    ("Csirkés massaman curry", ["curry","csirke","thai"], 60, 4,
     [i("csirkecomb",4,"db"), i("kókusztej",400,"ml"), i("massaman curry paszta",4,"evőkanál"), i("burgonya",300,"g"), i("mogyoró",100,"g"), i("halszósz",2,"evőkanál")]),

    ("Medvehagymás sertéskaraj", ["sertes","medvehagyma","tavaszi"], 40, 4,
     [i("sertéskaraj",600,"g"), i("medvehagyma",1,"csokor"), i("tejszín",200,"ml"), i("vaj",40,"g"), i("fokhagyma",2,"gerezd"), i("fehérbor",100,"ml")]),

    ("Zöldséges Buddha bowl", ["buddha-bowl","vegan","zoldseg"], 30, 2,
     [i("quinoa",150,"g"), i("csicseriborsó",200,"g"), i("avokádó",1,"db"), i("édesburgonya",200,"g"), i("spenót",100,"g"), i("tahini szósz",60,"ml")]),

    ("Sertéshús majonézes sütőben", ["sertes","majonézes","sutobe"], 70, 4,
     [i("sertéskaraj",600,"g"), i("majonéz",3,"evőkanál"), i("fokhagyma",4,"gerezd"), i("dijoni mustár",2,"evőkanál"), i("kakukkfű"), i("só"), i("bors")]),

    ("Csirkemell zöldséges pesto-al sütőben", ["csirke","pesto","zoldseg-sutobe"], 45, 4,
     [i("csirkemell",4,"db"), i("zöld pesto",4,"evőkanál"), i("koktélparadicsom",200,"g"), i("cukkini",1,"db"), i("mozzarella",200,"g"), i("olívaolaj",2,"evőkanál")]),

    ("Marinált grillezett csirkecomb", ["csirke","grillezett","marinalt"], 60, 4,
     [i("csirkecomb",4,"db"), i("joghurt",200,"g"), i("paprika",2,"evőkanál"), i("fokhagyma",4,"gerezd"), i("citromlé",1,"db"), i("kömény",1,"evőkanál")]),

    ("Hoisin csirke", ["csirke","hoisin","kinai"], 30, 4,
     [i("csirkemell",600,"g"), i("hoisin szósz",4,"evőkanál"), i("szójaszósz",2,"evőkanál"), i("gyömbér",15,"g"), i("fokhagyma",3,"gerezd"), i("szezám",2,"evőkanál")]),

    ("Kacsa confit babérlevéllel", ["kacsa","confit","konfit"], 240, 4,
     [i("kacsacomb",4,"db"), i("só",50,"g"), i("babérlevél",4,"db"), i("kakukkfű",6,"ág"), i("fokhagyma",6,"gerezd"), i("kacsazsír",500,"ml")]),

    ("Sertéshús char siu", ["char-siu","sertes","kinai"], 90, 4,
     [i("sertéshús",700,"g"), i("hoisin szósz",4,"evőkanál"), i("szójaszósz",4,"evőkanál"), i("méz",4,"evőkanál"), i("rizsbor",2,"evőkanál"), i("barna cukor",2,"evőkanál")]),

    ("Grillezett bárányszelet fetás mentaszósszal", ["barany","grillezett","feta"], 25, 4,
     [i("bárányszelet",8,"db"), i("feta sajt",150,"g"), i("menta",1,"csokor"), i("görög joghurt",150,"g"), i("fokhagyma",2,"gerezd"), i("citromlé",1,"db")]),

    ("Csirkemell spenótos töltve", ["csirke","toltott","spenot"], 45, 4,
     [i("csirkemell",4,"db"), i("spenót",200,"g"), i("krémsajt",150,"g"), i("fokhagyma",3,"gerezd"), i("parmezán",50,"g"), i("só"), i("bors")]),

    ("Ropogós kacsabőr kínai módra", ["kacsa","ropogos","kinai"], 180, 4,
     [i("egész kacsa",2,"kg"), i("szójaszósz",4,"evőkanál"), i("méz",3,"evőkanál"), i("ötfűszer keverék",1,"evőkanál"), i("fokhagyma",4,"gerezd"), i("gyömbér",30,"g")]),
]

# ─── EXTRA LEVESEK ───────────────────────────────────────────────────────────

EXTRA_LEVES_RECIPES = [
    ("Borjú alapleves gyökérzöldséggel", ["borju","leves","alapleves"], 120, 4,
     [i("borjúcsont",1,"kg"), i("sárgarépa",3,"db"), i("petrezselyemgyökér",2,"db"), i("zeller",1,"db"), i("hagyma",2,"db"), i("bors",1,"evőkanál")]),

    ("Krémes brokkoli sajtos leves", ["brokkoli","sajtos","kremleves"], 35, 4,
     [i("brokkoli",600,"g"), i("hagyma",1,"db"), i("fokhagyma",2,"gerezd"), i("tejszín",200,"ml"), i("cheddar",150,"g"), i("zöldségalaplé",600,"ml")]),

    ("Paradicsomos babcreme leves", ["bab","paradicsom","kremleves"], 40, 4,
     [i("fehérbab",400,"g"), i("paradicsomlé",300,"ml"), i("hagyma",1,"db"), i("fokhagyma",3,"gerezd"), i("zsálya",4,"levél"), i("olívaolaj",3,"evőkanál")]),

    ("Árpa krémleves gombával", ["arpa","gomba","kremleves"], 45, 4,
     [i("árpagyöngy",150,"g"), i("vegyes gomba",400,"g"), i("hagyma",1,"db"), i("tejszín",200,"ml"), i("marhaalaplé",600,"ml"), i("kakukkfű",2,"ág")]),

    ("Csirkés kukoricanorma leves", ["csirke","kukorica","kremleves"], 35, 4,
     [i("csirkemell",300,"g"), i("kukorica",400,"g"), i("tejszín",200,"ml"), i("hagyma",1,"db"), i("fokhagyma",2,"gerezd"), i("csirkealaplé",500,"ml")]),

    ("Hideg uborkakrémleves", ["uborka","hideg","kremleves"], 15, 4,
     [i("uborka",2,"db"), i("görög joghurt",300,"g"), i("fokhagyma",2,"gerezd"), i("kapor",1,"csokor"), i("citromlé",1,"db"), i("só"), i("bors")]),

    ("Tajine leves csirkéből", ["tajine","csirke","marokkoi"], 60, 4,
     [i("csirkecomb",4,"db"), i("csicseriborsó",200,"g"), i("paradicsom",3,"db"), i("hagyma",2,"db"), i("ras el hanout",2,"evőkanál"), i("koriander",1,"csokor")]),

    ("Krémleveses karfiol", ["karfiol","kremleves","krem"], 35, 4,
     [i("karfiol",1,"db"), i("hagyma",1,"db"), i("fokhagyma",2,"gerezd"), i("tejszín",200,"ml"), i("zöldségalaplé",600,"ml"), i("parmezán",50,"g")]),

    ("Vörös lencse leves köménnyel", ["voroSlencse","leves","indiai"], 35, 4,
     [i("vörös lencse",300,"g"), i("hagyma",1,"db"), i("fokhagyma",3,"gerezd"), i("kömény",1,"evőkanál"), i("koriander",1,"evőkanál"), i("kókusztej",200,"ml")]),

    ("Spenótos tojásos leves", ["spenot","tojas","leves"], 25, 4,
     [i("spenót",300,"g"), i("tojás",4,"db"), i("fokhagyma",3,"gerezd"), i("csirkealaplé",600,"ml"), i("tejszín",100,"ml"), i("szerecsendió")]),
]

# ─── EXTRA DESSZERTEK ─────────────────────────────────────────────────────────

EXTRA_DESSERT_RECIPES = [
    ("Túrótorta kókuszos alappal", ["turotorta","kokusz","sutesnelkul"], 30, 8,
     [i("túró",500,"g"), i("krémsajt",200,"g"), i("kókuszreszelék",100,"g"), i("cukor",120,"g"), i("tojás",3,"db"), i("citromhéj",1,"db")]),

    ("Sütőtökös cupcake fahéjas krémmel", ["cupcake","sutotok","faheja"], 50, 12,
     [i("sütőtökpüré",200,"g"), i("liszt",200,"g"), i("cukor",150,"g"), i("tojás",2,"db"), i("fahéj",2,"evőkanál"), i("krémsajt frosting",300,"g")]),

    ("Kakaós csiga", ["csiga","kakao","sutes"], 90, 12,
     [i("liszt",500,"g"), i("élesztő",25,"g"), i("tej",200,"ml"), i("vaj",100,"g"), i("kakaó",50,"g"), i("cukor",100,"g")]),

    ("Vaníliás pudingos sütemény", ["puding","vanilias","keksz"], 60, 16,
     [i("tojás",4,"db"), i("cukor",200,"g"), i("vanília pudingpor",2,"csomag"), i("tejszín",400,"ml"), i("liszt",150,"g"), i("porcukor",50,"g")]),

    ("Epres panna cotta", ["pannacotta","eper","krem"], 30, 4,
     [i("tejszín",500,"ml"), i("cukor",60,"g"), i("zselatin",3,"lap"), i("eper",300,"g"), i("citromlé",1,"evőkanál"), i("porcukor",30,"g")]),

    ("Csokoládés fondant", ["fondant","csoki","meleg"], 25, 4,
     [i("étcsokoládé",200,"g"), i("vaj",150,"g"), i("cukor",100,"g"), i("tojás",4,"db"), i("liszt",50,"g"), i("kakaó",2,"evőkanál")]),

    ("Láva torta csokoládés", ["lava","csoki","tortácska"], 25, 4,
     [i("étcsokoládé",150,"g"), i("vaj",100,"g"), i("tojás",4,"db"), i("cukor",80,"g"), i("liszt",40,"g")]),

    ("Citromtorta meringue-vel", ["citromtorta","meringue","savanyu"], 90, 8,
     [i("citromlé",4,"db"), i("tojás",6,"db"), i("cukor",200,"g"), i("vaj",150,"g"), i("omlós tészta",250,"g"), i("tojásfehérje",4,"db")]),

    ("Mákos nudli", ["makos","nudli","magyaros"], 40, 4,
     [i("burgonya",600,"g"), i("liszt",200,"g"), i("tojás",1,"db"), i("mák",150,"g"), i("porcukor",80,"g"), i("vaj",60,"g")]),

    ("Gőzgombóc baracklekvárral", ["gomboc","gozolt","magyaros"], 60, 4,
     [i("liszt",400,"g"), i("élesztő",15,"g"), i("tej",200,"ml"), i("baracklekvár",200,"g"), i("vaj",60,"g"), i("porcukor",50,"g")]),

    ("Diós csiga sütőben", ["csiga","dios","sutes"], 90, 12,
     [i("liszt",500,"g"), i("élesztő",25,"g"), i("tej",200,"ml"), i("vaj",100,"g"), i("dió",200,"g"), i("cukor",120,"g"), i("fahéj",2,"evőkanál")]),

    ("Narancskrémes torta", ["torta","narancs","krem"], 120, 10,
     [i("piskóta",1,"db"), i("narancslé",200,"ml"), i("tojás",4,"db"), i("cukor",150,"g"), i("vaj",200,"g"), i("narancshéj",2,"db")]),

    ("Feketeerdő torta", ["feketeerdo","torta","csoki"], 180, 12,
     [i("étcsokoládé",200,"g"), i("tojás",6,"db"), i("cukor",150,"g"), i("liszt",150,"g"), i("tejszínhab",400,"ml"), i("meggy",400,"g"), i("rum",4,"evőkanál")]),

    ("Dobostorta krémmel", ["dobos","krém","torta"], 180, 10,
     [i("piskótalap",6,"db"), i("csokoládékrém",500,"g"), i("cukor",100,"g"), i("vaj",200,"g"), i("karamell",150,"g")]),
]

# ─── EXTRA TÉSZTÁK ──────────────────────────────────────────────────────────

EXTRA_TESZTA_RECIPES = [
    ("Vöröslencse tészta paradicsomos mártással", ["lencse","teszta","vegán"], 30, 4,
     [i("vöröslencse tészta",400,"g"), i("paradicsomlé",400,"ml"), i("fokhagyma",4,"gerezd"), i("chili",1,"db"), i("olívaolaj",3,"evőkanál"), i("bazsalikom",1,"csokor")]),

    ("Brokkolit tejszínnel spagetti", ["spagetti","brokkoli","tejszines"], 25, 4,
     [i("spagetti",400,"g"), i("brokkoli",400,"g"), i("tejszín",200,"ml"), i("parmezán",60,"g"), i("fokhagyma",3,"gerezd"), i("citromlé",1,"evőkanál")]),

    ("Csülkös pasta fazekban", ["csulok","pasta","magyaros"], 70, 6,
     [i("fusilli",400,"g"), i("füstölt csülök",500,"g"), i("paprika",3,"evőkanál"), i("tejföl",300,"g"), i("hagyma",2,"db"), i("paradicsom",2,"db")]),

    ("Olasz orzo rizs saláta", ["orzo","olasz","hideg"], 25, 4,
     [i("orzo tészta",300,"g"), i("koktélparadicsom",200,"g"), i("olívabogyó",100,"g"), i("feta",150,"g"), i("uborka",1,"db"), i("olívaolaj",4,"evőkanál")]),

    ("Makaróni házi sajt mártással", ["makaroni","sajtos","hazikeszitesu"], 35, 4,
     [i("makaróni",400,"g"), i("tejszín",300,"ml"), i("cheddar",200,"g"), i("parmezán",80,"g"), i("liszt",3,"evőkanál"), i("vaj",60,"g")]),

    ("Tintahalas fekete tészta", ["tintahal","fekete","tengeri"], 35, 4,
     [i("fekete tészta",400,"g"), i("tintahal",400,"g"), i("fokhagyma",4,"gerezd"), i("fehérbor",150,"ml"), i("olívaolaj",4,"evőkanál"), i("petrezselyem",1,"csokor")]),

    ("Csirkés zöldséges tészta serpenyőben", ["csirke","zoldseg","teszta-serpenyos"], 30, 4,
     [i("penne",400,"g"), i("csirkemell",400,"g"), i("cukkini",1,"db"), i("paprika",2,"db"), i("paradicsomlé",300,"ml"), i("parmezán",60,"g")]),

    ("Gnocchi sütőtökkös zsályás vajjal", ["gnocchi","sutotok","zsalyas"], 30, 4,
     [i("gnocchi",500,"g"), i("sütőtökpüré",200,"g"), i("zsálya",8,"levél"), i("vaj",80,"g"), i("parmezán",60,"g"), i("szerecsendió",1,"csipet")]),

    ("Pasta al forno húsos", ["pasta","alforno","sutobe"], 70, 6,
     [i("penne",400,"g"), i("darált hús",500,"g"), i("besamel",400,"ml"), i("paradicsomlé",400,"ml"), i("mozzarella",250,"g"), i("parmezán",80,"g")]),

    ("Nyári tészta friss zöldségekkel", ["nyari","friss","teszta"], 20, 4,
     [i("linguine",400,"g"), i("koktélparadicsom",300,"g"), i("cukkini",1,"db"), i("bazsalikom",1,"csokor"), i("fokhagyma",4,"gerezd"), i("olívaolaj",5,"evőkanál")]),
]

# ─── EXTRA EGYTÁLÉTELEK ──────────────────────────────────────────────────────

EXTRA_EGYTALETEL_RECIPES = [
    ("Sütőben sült édesburgonya csirkével", ["edesburgonya","csirke","sutobe"], 60, 4,
     [i("csirkecomb",4,"db"), i("édesburgonya",600,"g"), i("paprika",2,"db"), i("hagyma",2,"db"), i("fokhagyma",6,"gerezd"), i("olívaolaj",3,"evőkanál")]),

    ("Shakshuka sertés kolbásszal", ["shakshuka","kolbasz","egytaletel"], 40, 4,
     [i("kolbász",300,"g"), i("paradicsomlé",400,"ml"), i("tojás",4,"db"), i("paprika",2,"db"), i("paprika por",2,"evőkanál"), i("hagyma",1,"db")]),

    ("Coq au vin blanc fehérboros csirke", ["coq-au-vin","feherborós","csirke"], 90, 4,
     [i("csirkecomb",4,"db"), i("fehérbor",300,"ml"), i("gyöngyhagyma",12,"db"), i("gomba",200,"g"), i("bacon",100,"g"), i("tejszín",150,"ml")]),

    ("Grönland stílusú halfilé zöldséges pörkölten", ["hal","zoldseg","egytaletel"], 40, 4,
     [i("fehér halfilé",600,"g"), i("burgonya",400,"g"), i("sárgarépa",2,"db"), i("hagyma",1,"db"), i("kapor",1,"csokor"), i("tejszín",200,"ml")]),

    ("Bab tofu wok lemezes tányéron", ["bab","tofu","wok-egytaletel"], 30, 4,
     [i("edamame",200,"g"), i("tofu",300,"g"), i("brokkoli",300,"g"), i("kukorica",150,"g"), i("szójaszósz",3,"evőkanál"), i("szezámolaj",2,"evőkanál")]),

    ("Farro risotto gomba szarvasgombával", ["farro","risotto","gomba"], 50, 4,
     [i("farro",300,"g"), i("vegyes gomba",400,"g"), i("fehérbor",150,"ml"), i("parmezán",80,"g"), i("szarvasgomba olaj",1,"evőkanál"), i("hagyma",1,"db")]),

    ("Egytál bárány couscous", ["barany","couscous","marokkoi"], 60, 4,
     [i("bárányhús",600,"g"), i("couscous",300,"g"), i("csicseriborsó",300,"g"), i("paradicsom",3,"db"), i("hagyma",2,"db"), i("ras el hanout",2,"evőkanál")]),

    ("Grillezett zöldséges polenta", ["polenta","grillezett","zoldseg"], 40, 4,
     [i("polenta",300,"g"), i("cukkini",2,"db"), i("paprika",2,"db"), i("paradicsom",3,"db"), i("parmezán",80,"g"), i("olívaolaj",3,"evőkanál")]),
]

# ─── EXTRA SALÁTÁK ──────────────────────────────────────────────────────────

EXTRA_SALATA_RECIPES = [
    ("Cézár saláta klasszikusan", ["cezar","klasszikus","salata"], 20, 4,
     [i("rómaisaláta",2,"fej"), i("parmezán",80,"g"), i("kruton",100,"g"), i("szardella",4,"db"), i("cézár öntet",100,"ml"), i("fokhagyma",2,"gerezd")]),

    ("Insalata caprese", ["caprese","olasz","mozarella"], 10, 4,
     [i("érett paradicsom",4,"db"), i("friss mozzarella",250,"g"), i("bazsalikom",1,"csokor"), i("olívaolaj",3,"evőkanál"), i("balzsamecet",1,"evőkanál"), i("só"), i("bors")]),

    ("Panzanella toszkán kenyérsaláta", ["panzanella","kenyeres","olasz"], 20, 4,
     [i("száraz kenyér",300,"g"), i("paradicsom",400,"g"), i("uborka",1,"db"), i("vöröshagyma",1,"db"), i("bazsalikom",1,"csokor"), i("olívaolaj",5,"evőkanál")]),

    ("Fattoush közel-keleti saláta", ["fattoush","kozel-keleti","pitateszta"], 20, 4,
     [i("pita",2,"db"), i("paradicsom",3,"db"), i("uborka",1,"db"), i("saláta",1,"fej"), i("petrezselyem",1,"csokor"), i("citromlé",3,"evőkanál"), i("sumac",1,"evőkanál")]),

    ("Görög spárgasaláta fetával", ["sparga","gorog","salata"], 20, 4,
     [i("spárga",400,"g"), i("feta sajt",150,"g"), i("citromlé",1,"db"), i("olívaolaj",3,"evőkanál"), i("kapribogyó",2,"evőkanál"), i("petrezselyem",1,"csokor")]),

    ("Mandarin csirkesaláta", ["mandarin","csirke","keleti"], 20, 4,
     [i("csirkemell",400,"g"), i("mandarin",3,"db"), i("vegyes saláta",200,"g"), i("dió",80,"g"), i("szójaszósz",3,"evőkanál"), i("szezámolaj",1,"evőkanál")]),

    ("Saláta pirított kecskesajttal", ["kecskesajt","pirított","salata"], 20, 4,
     [i("rukkola",150,"g"), i("kecskesajt",200,"g"), i("dió",80,"g"), i("körte",2,"db"), i("mézes balzsamecet",3,"evőkanál")]),

    ("Articsóka szívek olivás marinádban", ["articsoka","olivás","salata"], 15, 4,
     [i("articsóka szívek",400,"g"), i("olívabogyó",100,"g"), i("fokhagyma",3,"gerezd"), i("citromlé",1,"db"), i("olívaolaj",4,"evőkanál"), i("oregánó",1,"evőkanál")]),

    ("Cékla kecskesajtos saláta", ["cekla","kecskesajt","salata"], 20, 4,
     [i("cékla",400,"g"), i("kecskesajt",150,"g"), i("dió",80,"g"), i("saláta",1,"fej"), i("balzsamecet",3,"evőkanál"), i("méz",1,"evőkanál")]),

    ("Gado-gado indonéz mogyorószósszal", ["gado-gado","indonez","mogyoros"], 30, 4,
     [i("tofu",200,"g"), i("tojás",4,"db"), i("babcsíra",200,"g"), i("sárgarépa",2,"db"), i("mogyoróvaj szósz",150,"ml"), i("lime",1,"db")]),
]

# ─── EXTRA REGGELIK ──────────────────────────────────────────────────────────

EXTRA_REGGELI_RECIPES = [
    ("Pirítós karamellizált banana", ["piritós","banana","edes"], 15, 2,
     [i("banán",2,"db"), i("vaj",30,"g"), i("méz",2,"evőkanál"), i("fahéj",1,"tk"), i("toast",4,"szelet"), i("görög joghurt",100,"g")]),

    ("Spenótos tojás Benedict", ["benedict","tojás","spenot"], 25, 2,
     [i("tojás",4,"db"), i("angol muffin",2,"db"), i("spenót",100,"g"), i("hollandaise mártás",100,"ml"), i("vaj",30,"g")]),

    ("Házi granola csokoládéval", ["granola","csoki","reggeli"], 40, 8,
     [i("zabpehely",300,"g"), i("méz",4,"evőkanál"), i("étcsokoládé",100,"g"), i("mandula",100,"g"), i("napraforgómag",80,"g"), i("olaj",3,"evőkanál")]),

    ("Zabkása almával fahéjjal", ["zabkasa","alma","meleg"], 15, 2,
     [i("zabpehely",100,"g"), i("tej",250,"ml"), i("alma",1,"db"), i("fahéj",1,"tk"), i("méz",2,"evőkanál"), i("dió",40,"g")]),

    ("Tojásrántotta sonkával és sajttal", ["rantotta","sonkas","sajtos"], 10, 2,
     [i("tojás",4,"db"), i("sonka",80,"g"), i("sajt",60,"g"), i("vaj",20,"g"), i("só"), i("bors"), i("snidling",1,"csokor")]),

    ("Palacsintatészta blueberry-vel", ["palacsinta","afonyás","gyerekeknek"], 30, 4,
     [i("liszt",200,"g"), i("tojás",2,"db"), i("tej",400,"ml"), i("áfonya",200,"g"), i("vaj",40,"g"), i("cukor",2,"evőkanál"), i("juharszirup",3,"evőkanál")],
     "", "Kisbabáknál is népszerű, egyszerűen díszíthető gyümölccsel."),

    ("Zöldséges frittata", ["frittata","zoldseg","olasz"], 30, 4,
     [i("tojás",8,"db"), i("cukkini",1,"db"), i("paprika",1,"db"), i("hagyma",1,"db"), i("sajt",100,"g"), i("olívaolaj",2,"evőkanál")]),

    ("Rántotta medvehagymával", ["rantotta","medvehagyma","tavaszi"], 15, 2,
     [i("tojás",4,"db"), i("medvehagyma",1,"csokor"), i("vaj",30,"g"), i("tejszín",30,"ml"), i("só"), i("bors")]),

    ("Ricotta pirítós mézzel és dióval", ["ricotta","piritós","edes"], 10, 2,
     [i("ricotta",200,"g"), i("toast",4,"szelet"), i("méz",3,"evőkanál"), i("dió",60,"g"), i("gyümölcs",200,"g")]),

    ("Protein smoothie banán mandulatejjel", ["smoothie","protein","sport"], 5, 2,
     [i("banán",2,"db"), i("mandulatej",300,"ml"), i("protein por",2,"evőkanál"), i("chia mag",1,"evőkanál"), i("méz",1,"evőkanál")]),
]

# ─── EXTRA VEGYES ────────────────────────────────────────────────────────────

EXTRA_VEGYES_RECIPES = [
    ("Házi lángos fokhagymás tejföllel", ["langos","fokhagymas","magyaros"], 60, 6,
     [i("liszt",500,"g"), i("élesztő",25,"g"), i("tej",200,"ml"), i("só",1,"tk"), i("olaj",500,"ml"), i("tejföl",200,"g"), i("fokhagyma",4,"gerezd")]),

    ("Pogácsa juhtúróval és kapros", ["pogacsa","juhturo","kapros"], 90, 20,
     [i("liszt",500,"g"), i("vaj",200,"g"), i("tojás",2,"db"), i("juhtúró",200,"g"), i("kapor",1,"csokor"), i("élesztő",25,"g"), i("tejföl",100,"g")]),

    ("Töltött fánk lekvárral", ["fank","lekvares","sutes"], 90, 16,
     [i("liszt",500,"g"), i("élesztő",25,"g"), i("tej",200,"ml"), i("vaj",60,"g"), i("tojás",2,"db"), i("cukor",60,"g"), i("baracklekvár",200,"g")]),

    ("Házi bagel szezámmaggal", ["bagel","szezamos","sutes"], 120, 8,
     [i("liszt",500,"g"), i("élesztő",7,"g"), i("cukor",2,"evőkanál"), i("só",2,"tk"), i("víz",300,"ml"), i("szezámmag",100,"g"), i("szódabikarbóna",2,"evőkanál")]),

    ("Focaccia rozmaring olívabogyóval", ["focaccia","rozmaring","olasz"], 180, 8,
     [i("liszt",500,"g"), i("élesztő",7,"g"), i("olívaolaj",6,"evőkanál"), i("só",2,"tk"), i("víz",350,"ml"), i("rozmaring",3,"ág"), i("olívabogyó",100,"g")]),

    ("Ciabatta házi", ["ciabatta","kenyer","olasz"], 240, 4,
     [i("liszt",500,"g"), i("élesztő",5,"g"), i("olívaolaj",3,"evőkanál"), i("só",2,"tk"), i("víz",380,"ml")]),

    ("Házi pita kenyér", ["pita","kenyer","kozel-keleti"], 90, 8,
     [i("liszt",400,"g"), i("élesztő",7,"g"), i("olívaolaj",2,"evőkanál"), i("só",1,"tk"), i("víz",250,"ml"), i("cukor",1,"tk")]),

    ("Tejfölös-diós kalács", ["kalacs","dios","sutes"], 90, 12,
     [i("liszt",500,"g"), i("élesztő",25,"g"), i("tej",200,"ml"), i("vaj",100,"g"), i("tojás",2,"db"), i("cukor",80,"g"), i("dió",200,"g")]),

    ("Sonkás sajtos töltött croissant", ["croissant","sonkas","toltott"], 60, 8,
     [i("croissant tészta",1,"csomag"), i("sonka",200,"g"), i("sajt",200,"g"), i("mustár",2,"evőkanál"), i("tojás",1,"db")]),

    ("Házi kenyér sütőben", ["kenyer","hazi","sutes"], 180, 1,
     [i("kenyérliszt",500,"g"), i("élesztő",7,"g"), i("víz",350,"ml"), i("só",2,"tk"), i("olaj",2,"evőkanál")]),

    ("Quiche lorraine", ["quiche","lorraine","francia"], 70, 6,
     [i("omlós tészta",300,"g"), i("sonka",200,"g"), i("tojás",4,"db"), i("tejszín",300,"ml"), i("sajt",150,"g"), i("hagyma",1,"db")]),

    ("Húsos pite", ["pite","husos","sutes"], 80, 8,
     [i("omlós tészta",400,"g"), i("darált hús",500,"g"), i("hagyma",2,"db"), i("tojás",2,"db"), i("tejföl",200,"g"), i("sajt",150,"g")]),

    ("Spárgás quiche", ["quiche","sparga","tavasz"], 70, 6,
     [i("omlós tészta",300,"g"), i("spárga",400,"g"), i("tojás",4,"db"), i("tejszín",200,"ml"), i("parmezán",80,"g"), i("hagyma",1,"db")]),

    ("Spenótos ricottás tésztatáska", ["ravioli","spenot","ricotta"], 60, 4,
     [i("friss tészta",400,"g"), i("ricotta",300,"g"), i("spenót",200,"g"), i("parmezán",60,"g"), i("tojás",2,"db"), i("szerecsendió")]),

    ("Zöldséges pite", ["pite","zoldseg","vegetarianus"], 70, 8,
     [i("omlós tészta",400,"g"), i("sárgarépa",2,"db"), i("cukkini",1,"db"), i("paprika",2,"db"), i("tojás",3,"db"), i("tejszín",200,"ml"), i("sajt",150,"g")]),

    ("Görög spanakopita", ["spanakopita","gorog","spenot"], 70, 8,
     [i("rétestészta",10,"lap"), i("spenót",500,"g"), i("feta",300,"g"), i("tojás",3,"db"), i("hagyma",2,"db"), i("kapor",1,"csokor"), i("olívaolaj",6,"evőkanál")]),

    ("Börek húsos", ["borek","husos","torok"], 60, 8,
     [i("rétestészta",10,"lap"), i("darált hús",500,"g"), i("hagyma",2,"db"), i("petrezselyem",1,"csokor"), i("paprika",1,"evőkanál"), i("olívaolaj",6,"evőkanál")]),

    ("Sajtos börek", ["borek","sajtos","torok"], 60, 8,
     [i("rétestészta",10,"lap"), i("feta sajt",300,"g"), i("tojás",2,"db"), i("kapor",1,"csokor"), i("joghurt",100,"g"), i("olívaolaj",6,"evőkanál")]),

    ("Csokoládés palacsintatorta", ["palacsintatorta","csoki","krem"], 60, 10,
     [i("palacsinta",12,"db"), i("étcsokoládé",200,"g"), i("tejszínhab",300,"ml"), i("cukor",80,"g"), i("kakaó",2,"evőkanál")]),

    ("Krémes gofri", ["gofri","kremes","reggeli"], 30, 4,
     [i("liszt",200,"g"), i("tojás",2,"db"), i("tej",250,"ml"), i("vaj",60,"g"), i("cukor",2,"evőkanál"), i("sütőpor",2,"tk"), i("vanília",1,"tk")]),

    ("Donut fánk mázas", ["donut","mazas","edes"], 90, 12,
     [i("liszt",400,"g"), i("élesztő",25,"g"), i("tej",150,"ml"), i("vaj",60,"g"), i("tojás",2,"db"), i("cukor",60,"g"), i("cukormáz",200,"g")]),

    ("Tortilla chips szalsával", ["tortilla","chips","mex"], 30, 4,
     [i("tortilla lap",6,"db"), i("só"), i("olaj",4,"evőkanál"), i("paradicsom",3,"db"), i("hagyma",1,"db"), i("jalapeño",1,"db"), i("koriander",1,"csokor")]),

    ("Bruschetta friss paradicsommal", ["bruschetta","paradicsomos","olasz"], 15, 4,
     [i("baguette",1,"db"), i("paradicsom",3,"db"), i("fokhagyma",3,"gerezd"), i("bazsalikom",1,"csokor"), i("olívaolaj",4,"evőkanál"), i("só"), i("bors")]),

    ("Caprese szendvics", ["szendvics","caprese","olasz"], 15, 2,
     [i("ciabatta",2,"szelet"), i("mozzarella",150,"g"), i("paradicsom",2,"db"), i("bazsalikom",1,"csokor"), i("pesto",2,"evőkanál"), i("olívaolaj",2,"evőkanál")]),

    ("Mediterrán tapas tál", ["tapas","mediterran","vegyes"], 30, 6,
     [i("chorizo",150,"g"), i("olívabogyó",150,"g"), i("feta",150,"g"), i("articsóka",200,"g"), i("bruschetta",8,"szelet"), i("hummus",200,"g")]),
]

def build_all_recipes():
    all_recipes = []

    for args in FOETEL_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Főétel", tags, time_m, servings, ingr, extra, kid))

    for args in LEVES_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Leves", tags, time_m, servings, ingr, extra, kid))

    for args in DESSERT_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Desszert", tags, time_m, servings, ingr, extra, kid))

    for args in TESZTA_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Tészta", tags, time_m, servings, ingr, extra, kid))

    for args in SALATA_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Saláta", tags, time_m, servings, ingr, extra, kid))

    for args in REGGELI_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Reggeli", tags, time_m, servings, ingr, extra, kid))

    for args in EGYTALETEL_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Egytálétel", tags, time_m, servings, ingr, extra, kid))

    for args in EXTRA_FOETEL_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Főétel", tags, time_m, servings, ingr, extra, kid))

    for args in EXTRA_LEVES_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Leves", tags, time_m, servings, ingr, extra, kid))

    for args in EXTRA_DESSERT_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Desszert", tags, time_m, servings, ingr, extra, kid))

    for args in EXTRA_TESZTA_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Tészta", tags, time_m, servings, ingr, extra, kid))

    for args in EXTRA_EGYTALETEL_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Egytálétel", tags, time_m, servings, ingr, extra, kid))

    for args in EXTRA_SALATA_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Saláta", tags, time_m, servings, ingr, extra, kid))

    for args in EXTRA_REGGELI_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Reggeli", tags, time_m, servings, ingr, extra, kid))

    for args in EXTRA_VEGYES_RECIPES:
        title, tags, time_m, servings, ingr = args[:5]
        extra = args[5] if len(args) > 5 else ""
        kid = args[6] if len(args) > 6 else ""
        all_recipes.append(make_recipe(title, "Főétel", tags, time_m, servings, ingr, extra, kid))

    return all_recipes

if __name__ == "__main__":
    import sys

    # Load existing file
    existing_path = "src/data/family-flow-nosalty-recipes.safe-import.json"
    with open(existing_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    existing_ids = {r["id"] for r in data["recipes"]}
    new_recipes = build_all_recipes()

    # Deduplicate against existing
    added = []
    skipped = []
    for r in new_recipes:
        if r["id"] in existing_ids:
            skipped.append(r["id"])
        else:
            added.append(r)
            existing_ids.add(r["id"])

    data["recipes"].extend(added)
    data["createdAt"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")

    with open(existing_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Hozzáadva: {len(added)} recept")
    print(f"Kihagyva (duplikált): {len(skipped)}")
    print(f"Összesen: {len(data['recipes'])} recept")
    if skipped:
        print(f"Duplikáltak: {skipped}")
