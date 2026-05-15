-- Grant admin role to bibi.bil26@icloud.com
-- Runs as migration owner (bypasses RLS). Safe to re-run: idempotent.

insert into public.roles (slug, name, description, sort_order)
values ('admin', 'Administrateur', 'Gestion complète', 30)
on conflict (slug) do nothing;

insert into public.user_roles (profile_id, role_id)
select distinct u.id, r.id
from auth.users u
inner join public.profiles p on p.id = u.id
cross join lateral (select id from public.roles where slug = 'admin' limit 1) r
where lower(trim(both from coalesce(u.email, ''))) = lower('bibi.bil26@icloud.com')
   or lower(trim(both from coalesce(p.email, ''))) = lower('bibi.bil26@icloud.com')
on conflict (profile_id, role_id) do nothing;
