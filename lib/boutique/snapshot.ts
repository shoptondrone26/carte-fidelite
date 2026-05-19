import type { SupabaseClient } from "@supabase/supabase-js";

import type { BoutiqueSnapshot } from "@/lib/boutique/types";

export async function fetchBoutiqueSnapshot(
  supabase: SupabaseClient,
  _userId: string,
): Promise<BoutiqueSnapshot> {
  const { count, error } = await supabase
    .from("shop_products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) {
    return {
      productsCount: 0,
      ordersCount: 0,
      activeOrdersCount: 0,
      historyCount: 0,
    };
  }

  return {
    productsCount: count ?? 0,
    ordersCount: 0,
    activeOrdersCount: 0,
    historyCount: 0,
  };
}
