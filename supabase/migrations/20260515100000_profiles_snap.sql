-- Colonne Snapchat sur profiles + persistance à l'inscription

alter table public.profiles
  add column if not exists snap text;

comment on column public.profiles.snap is 'Identifiant Snapchat du client.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_id uuid;
begin
  insert into public.profiles (id, email, full_name, snap)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    nullif(trim(both from coalesce(new.raw_user_meta_data ->> 'snap', '')), '')
  );

  select r.id into customer_id from public.roles r where r.slug = 'customer' limit 1;

  insert into public.user_roles (profile_id, role_id)
  values (new.id, customer_id);

  return new;
end;
$$;
