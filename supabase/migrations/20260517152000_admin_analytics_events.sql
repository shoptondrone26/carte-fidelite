-- Lightweight product analytics for admin business insights.

begin;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  event_type text not null check (
    event_type in (
      'app_open',
      'dashboard_open',
      'booking_created',
      'booking_accepted',
      'booking_refused',
      'unlock_validated',
      'privilege_opened',
      'privilege_used',
      'login',
      'signup'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_type_created_at_idx
  on public.analytics_events (event_type, created_at desc);

create index if not exists analytics_events_user_id_created_at_idx
  on public.analytics_events (user_id, created_at desc)
  where user_id is not null;

alter table public.analytics_events enable row level security;

drop policy if exists analytics_events_select_admin on public.analytics_events;
create policy analytics_events_select_admin
  on public.analytics_events
  for select
  to authenticated
  using (public.has_role('admin'));

revoke all on public.analytics_events from public, anon, authenticated;
grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;

create or replace function public.track_analytics_event(
  p_event_type text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_event_type not in (
    'app_open',
    'dashboard_open',
    'booking_created',
    'booking_accepted',
    'booking_refused',
    'unlock_validated',
    'privilege_opened',
    'privilege_used',
    'login',
    'signup'
  ) then
    raise exception 'invalid_event_type';
  end if;

  insert into public.analytics_events(user_id, event_type, metadata)
  values (
    v_uid,
    p_event_type,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.track_analytics_event(text, jsonb) from public, anon;
grant execute on function public.track_analytics_event(text, jsonb) to authenticated;

commit;
