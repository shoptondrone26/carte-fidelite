import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

import { ClientComingSoon } from "@/components/client/client-coming-soon";
import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réglages",
};

export default async function ReglagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/reglages");
  }

  if (await getIsAdmin(supabase, user.id)) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-8 pt-6">
      <ClientComingSoon
        title="Réglages"
        description="Gérez vos préférences de compte et vos notifications depuis cet espace."
        icon={Settings}
        badge="Bientôt disponible"
      />
    </main>
  );
}
