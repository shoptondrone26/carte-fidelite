alter function public.set_updated_at() set search_path = public;

revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to supabase_auth_admin;

revoke all on function public.has_role(text) from public;
grant execute on function public.has_role(text) to authenticated;
