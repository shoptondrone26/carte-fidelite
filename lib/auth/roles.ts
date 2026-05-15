import type { SupabaseClient } from "@supabase/supabase-js";

function collectSlugs(
  roles: { slug?: string } | { slug?: string }[] | null | undefined,
): string[] {
  if (!roles) {
    return [];
  }
  if (Array.isArray(roles)) {
    return roles.flatMap((r) => (r.slug ? [r.slug] : []));
  }
  return roles.slug ? [roles.slug] : [];
}

export async function getIsAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(slug)")
    .eq("profile_id", userId);

  if (process.env.DEBUG_ADMIN_ROLE === "1") {
    const slugs =
      data?.flatMap((row) => {
        const r = row as { roles?: { slug?: string } | { slug?: string }[] | null };
        return collectSlugs(r.roles);
      }) ?? [];
    // eslint-disable-next-line no-console -- debug opt-in only
    console.log("[getIsAdmin]", { userId, error: error?.message, rowCount: data?.length, slugs });
  }

  if (error || !data) {
    return false;
  }

  return data.some((row) => {
    const r = row as { roles?: { slug?: string } | { slug?: string }[] | null };
    return collectSlugs(r.roles).includes("admin");
  });
}
