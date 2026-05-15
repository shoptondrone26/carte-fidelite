create or replace function public.has_role(role_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.profile_id = auth.uid()
      and r.slug = role_slug
  );
$$;
