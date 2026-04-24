import { NextResponse } from "next/server";
import { DEFAULT_FAMILY_STATE, mergeFamilyState, normalizeFamilyState } from "@/lib/family-state";
import { createAdminClient } from "@/lib/supabase-admin";
import type { FamilyAppState } from "@/types/family-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROW_ID = "default";

type AppStateRow = {
  id: string;
  schedule: unknown;
  meal_batches: unknown;
  shopping_items: unknown;
  pantry_items: unknown;
};

function rowToState(row: AppStateRow | null): FamilyAppState {
  if (!row) return DEFAULT_FAMILY_STATE;

  return normalizeFamilyState({
    schedule: row.schedule,
    mealBatches: row.meal_batches,
    shoppingItems: row.shopping_items,
    pantryItems: row.pantry_items,
  });
}

function isSupabasePersistenceConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function GET() {
  if (!isSupabasePersistenceConfigured()) {
    return NextResponse.json(DEFAULT_FAMILY_STATE);
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("app_state")
      .select("id, schedule, meal_batches, shopping_items, pantry_items")
      .eq("id", ROW_ID)
      .maybeSingle<AppStateRow>();

    if (error) {
      return NextResponse.json(
        { error: "Nem sikerült betölteni az alkalmazás állapotát." },
        { status: 500 },
      );
    }

    return NextResponse.json(rowToState(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const patch = (await request.json()) as Partial<FamilyAppState>;

    if (!isSupabasePersistenceConfigured()) {
      return NextResponse.json(mergeFamilyState(DEFAULT_FAMILY_STATE, patch));
    }

    const supabase = createAdminClient();

    const { data: existingRow, error: readError } = await supabase
      .from("app_state")
      .select("id, schedule, meal_batches, shopping_items, pantry_items")
      .eq("id", ROW_ID)
      .maybeSingle<AppStateRow>();

    if (readError) {
      return NextResponse.json(
        { error: "Nem sikerült betölteni a mentett adatokat frissítéshez." },
        { status: 500 },
      );
    }

    const nextState = mergeFamilyState(rowToState(existingRow), patch);
    const { error: writeError } = await supabase.from("app_state").upsert(
      {
        id: ROW_ID,
        schedule: nextState.schedule,
        meal_batches: nextState.mealBatches,
        shopping_items: nextState.shoppingItems,
        pantry_items: nextState.pantryItems,
      },
      { onConflict: "id" },
    );

    if (writeError) {
      return NextResponse.json(
        { error: "Nem sikerült elmenteni az alkalmazás állapotát." },
        { status: 500 },
      );
    }

    return NextResponse.json(nextState);
  } catch {
    return NextResponse.json({ error: "Érvénytelen kérés." }, { status: 400 });
  }
}
