import { redirect } from "next/navigation";

import { getIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function requireClient(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (await getIsAdmin(supabase, user.id)) {
    redirect("/admin");
  }

  return { supabase, user };
}
