# FamilyFlow

FamilyFlow egy Next.js 16 app családi események, programok, kamra- és étkezéstervezés kezelésére.

## Local fejlesztés

1. Telepítsd a csomagokat:

```bash
npm install
```

2. Hozd létre a lokális env fájlt:

```bash
cp .env.example .env.local
```

3. Töltsd ki a Supabase értékeket a `.env.local` fájlban.

4. Indítsd el a fejlesztői szervert:

```bash
npm run dev
```

## Környezeti változók

Szükséges változók:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Az első kettő mehet kliensoldalra is. A `SUPABASE_SERVICE_ROLE_KEY` kizárólag szerveroldali env legyen, például Vercelben és a lokális `.env.local` fájlban.

## Jelenlegi adatkezelés

Az app jelenlegi MVP állapotban részben böngészős `localStorage`-ot használ adatmentésre. Ez azt jelenti, hogy:

- ugyanazon az eszközön megmaradnak az adatok,
- másik eszközre nem szinkronizálódnak,
- böngésző törlés vagy eszközcsere esetén elveszhetnek.

Supabase integrációval ezt ki lehet váltani tartós, központi adatmentésre.

## Deploy

Ajánlott folyamat:

1. Projekt feltöltése GitHub-ra
2. GitHub repo importálása Vercelbe
3. Ugyanazoknak az env változóknak a beállítása Vercelben
4. A [supabase/schema.sql](/Users/vasnorbert/Work/FamilyFlow/supabase/schema.sql) futtatása a Supabase SQL Editorban
5. Az aktuális `localStorage` alapú store-ok cseréje Supabase alapú mentésre
