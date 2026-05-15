-- OneSignal push: préférences profil + file d'attente + rappels créneaux

alter table public.profiles
add column if not exists push_enabled boolean not null default true,
add column if not exists onesignal_subscription_id text,
add column if not exists push_updated_at timestamptz;

comment on column public.profiles.push_enabled is
  'Opt-in notifications push (OneSignal).';
comment on column public.profiles.onesignal_subscription_id is
  'ID abonnement OneSignal (Web Push v16).';

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (
    kind in (
      'booking_accepted',
      'booking_refused',
      'free_available',
      'vip_changed',
      'booking_reminder'
    )
  ),
  dedupe_key text not null,
  history_id uuid references public.history (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  constraint notification_outbox_dedupe_key unique (dedupe_key)
);

create index if not exists notification_outbox_pending_idx
  on public.notification_outbox (created_at)
  where
    sent_at is null;

alter table public.notification_outbox enable row level security;

create policy notification_outbox_service_role on public.notification_outbox for all to service_role using (true)
with
  check (true);

grant all on public.notification_outbox to service_role;

create table if not exists public.booking_reminder_sent (
  booking_id uuid primary key references public.bookings (id) on delete cascade,
  sent_at timestamptz not null default now()
);

alter table public.booking_reminder_sent enable row level security;

create policy booking_reminder_sent_service_role on public.booking_reminder_sent for all to service_role using (true)
with
  check (true);

grant all on public.booking_reminder_sent to service_role;

create or replace function public.enqueue_push_from_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_type = 'booking_accepted' then
    insert into
      public.notification_outbox (user_id, kind, dedupe_key, history_id, payload)
    values
      (
        new.subject_id,
        'booking_accepted',
        'history:' || new.id::text,
        new.id,
        coalesce(new.payload, '{}'::jsonb)
      )
    on conflict (dedupe_key) do nothing;
  elsif new.event_type = 'booking_refused' then
    insert into
      public.notification_outbox (user_id, kind, dedupe_key, history_id, payload)
    values
      (
        new.subject_id,
        'booking_refused',
        'history:' || new.id::text,
        new.id,
        coalesce(new.payload, '{}'::jsonb)
      )
    on conflict (dedupe_key) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists history_enqueue_push on public.history;

create trigger history_enqueue_push
  after insert on public.history
  for each row execute function public.enqueue_push_from_history();
