import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";

import { ClientComingSoon } from "@/components/client/client-coming-soon";
import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique",
};

export default async function BoutiquePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/boutique");
  }

  if (await getIsAdmin(supabase, user.id)) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-8 pt-6">
      <ClientComingSoon
        title="Boutique membre"
        description="Notre sélection de produits réservés aux membres ShopTonDrone Privé arrive très bientôt."
        icon={ShoppingBag}
        badge="Bientôt disponible"
      />
    </main>
  );
}
