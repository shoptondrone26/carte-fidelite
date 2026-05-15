-- Tables: roles, profiles, user_roles, bookings, history

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (profile_id, role_id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_range_valid check (ends_at > starts_at)
);

create index bookings_profile_id_starts_at_idx
  on public.bookings (profile_id, starts_at desc);

create table public.history (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index history_subject_id_created_at_idx
  on public.history (subject_id, created_at desc);

create index history_entity_idx
  on public.history (entity_type, entity_id);
