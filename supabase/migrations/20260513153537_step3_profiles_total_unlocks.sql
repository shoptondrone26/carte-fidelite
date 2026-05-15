alter table public.profiles
  add column if not exists total_unlocks integer not null default 0
  check (total_unlocks >= 0);

comment on column public.profiles.total_unlocks is 'Nombre cumulé de déblocages (fidélité).';
