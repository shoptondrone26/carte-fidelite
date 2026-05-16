-- Extend bookable 20-minute slots from 10:00-20:00 to 10:00-00:00.
-- Last valid start is 23:40 Europe/Paris; the slot ends at 00:00.

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
    ) < 24
    and (p_slot_start at time zone 'Europe/Paris')::date <= (
      (now() at time zone 'Europe/Paris')::date + 14
    )
    and (p_slot_start at time zone 'Europe/Paris')::date >= (
      (now() at time zone 'Europe/Paris')::date
    );
$$;
