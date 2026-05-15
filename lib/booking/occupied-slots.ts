import type { SupabaseClient } from "@supabase/supabase-js";

/** Créneaux déjà pris pour une date (sans identité client). */
export async function fetchOccupiedSlotStarts(
  supabase: SupabaseClient,
  dateKey: string,
): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_occupied_slot_starts", {
    p_date: dateKey,
  });

  if (error) {
    console.error("get_occupied_slot_starts", error.message);
    return [];
  }

  if (!data) return [];
  return (data as string[]).map((s) => new Date(s).toISOString());
}
