import { redirect } from "next/navigation";

import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin(nextPath = "/admin") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!(await getIsAdmin(supabase, user.id))) {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    displayName:
      profile?.full_name?.trim() || profile?.email || user.email || "Admin",
  };
}
