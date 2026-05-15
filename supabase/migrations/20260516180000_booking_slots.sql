-- C0: 20-minute slots, one active client per slot, RPC booking flow

-- Normalize legacy placeholder durations (1h) to 20 minutes
update public.bookings
set
  ends_at = starts_at + interval '20 minutes',
  updated_at = now()
where
  ends_at is distinct from starts_at + interval '20 minutes';

alter table public.bookings
drop constraint if exists bookings_slot_20m;

alter table public.bookings
add constraint bookings_slot_20m check (
  ends_at = starts_at + interval '20 minutes'
);

drop index if exists public.bookings_one_active_slot;

create unique index bookings_one_active_slot on public.bookings (starts_at)
where
  status in ('pending', 'accepted');

-- Clients book only via RPC (security definer)
drop policy if exists bookings_insert_rules on public.bookings;

create policy bookings_insert_admin on public.bookings for insert to authenticated
with
  check (public.has_role ('admin'));

create or replace function public.is_valid_booking_slot(p_slot_start timestamptz)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    p_slot_start > now()
    and extract(
      second
      from
        p_slot_start
    ) = 0
    and extract(
      milliseconds
      from
        p_slot_start
    ) = 0
    and extract(
      minute
      from
        p_slot_start at time zone 'Europe/Paris'
    ) in (0, 20, 40)
    and extract(
      hour
      from
        p_slot_start at time zone 'Europe/Paris'
    ) >= 10
    and extract(
      hour
      from
        p_slot_start at time zone 'Europe/Paris'
    ) < 20
    and (p_slot_start at time zone 'Europe/Paris')::date <= (
      (now() at time zone 'Europe/Paris')::date + 14
    )
    and (p_slot_start at time zone 'Europe/Paris')::date >= (
      (now() at time zone 'Europe/Paris')::date
    );
$$;

create or replace function public.get_occupied_slot_starts(p_date date)
returns setof timestamptz
language sql
security definer
stable
set search_path = public
as $$
  select
    b.starts_at
  from
    public.bookings b
  where
    b.status in ('pending', 'accepted')
    and (b.starts_at at time zone 'Europe/Paris')::date = p_date;
$$;

revoke all on function public.get_occupied_slot_starts (date)
from public;

grant
execute on function public.get_occupied_slot_starts (date) to authenticated;

create or replace function public.create_pending_booking(
  p_slot_start timestamptz,
  p_notes text default null
)
returns table (
  id uuid,
  created_at timestamptz,
  starts_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_id uuid;
  v_created timestamptz;
  v_starts timestamptz;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Non authentifié';
  end if;

  if public.has_role ('admin') or public.has_role ('staff') then
    raise exception 'Réservation client uniquement';
  end if;

  if not public.is_valid_booking_slot (p_slot_start) then
    raise exception 'Créneau invalide ou indisponible';
  end if;

  if exists (
    select
      1
    from
      public.bookings b
    where
      b.profile_id = v_uid
      and b.status = 'pending'
  ) then
    raise exception 'Vous avez déjà une demande en attente';
  end if;

  if exists (
    select
      1
    from
      public.bookings b
    where
      b.starts_at = p_slot_start
      and b.status in ('pending', 'accepted')
  ) then
    raise exception 'Ce créneau est déjà réservé';
  end if;

  insert into
    public.bookings (
      profile_id,
      title,
      notes,
      status,
      validated,
      starts_at,
      ends_at,
      metadata
    )
  values
    (
      v_uid,
      'Demande de déblocage',
      nullif(trim(p_notes), ''),
      'pending',
      false,
      p_slot_start,
      p_slot_start + interval '20 minutes',
      jsonb_build_object('source', 'deblocage')
    )
  returning
    bookings.id,
    bookings.created_at,
    bookings.starts_at into v_id,
    v_created,
    v_starts;

  insert into
    public.history (
      subject_id,
      actor_id,
      event_type,
      entity_type,
      entity_id,
      payload
    )
  values
    (
      v_uid,
      v_uid,
      'booking_requested',
      'booking',
      v_id,
      jsonb_build_object(
        'booking_id',
        v_id,
        'starts_at',
        v_starts
      )
    );

  return query
  select
    v_id,
    v_created,
    v_starts;
end;
$$;

revoke all on function public.create_pending_booking (timestamptz, text)
from public;

grant
execute on function public.create_pending_booking (timestamptz, text) to authenticated;
