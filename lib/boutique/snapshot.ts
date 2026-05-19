import type { SupabaseClient } from "@supabase/supabase-js";

import type { BoutiqueSnapshot } from "@/lib/boutique/types";

/**
 * Agrège les données boutique client.
 * Branchera les tables `boutique_*` lors de l’implémentation complète.
 */
export async function fetchBoutiqueSnapshot(
  _supabase: SupabaseClient,
  _userId: string,
): Promise<BoutiqueSnapshot> {
  return {
    productsCount: 0,
    ordersCount: 0,
    activeOrdersCount: 0,
    historyCount: 0,
  };
}
