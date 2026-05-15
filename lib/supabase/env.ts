export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !anonKey?.trim()) {
    throw new Error(
      "Variables manquantes : définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel → Environment Variables ou .env.local).",
    );
  }
  return { url: url.trim(), anonKey: anonKey.trim() };
}
