alter table public.bookings add column if not exists validated boolean not null default false;

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check check (
    status in (
      'pending',
      'confirmed',
      'cancelled',
      'completed',
      'accepted',
      'refused'
    )
  );

create unique index if not exists bookings_one_pending_per_profile on public.bookings (profile_id)
where
  status = 'pending';

create or replace function public.enforce_profile_total_unlocks()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.total_unlocks is distinct from old.total_unlocks then
    if not (public.has_role('admin') or public.has_role('staff')) then
      raise exception 'total_unlocks: modification interdite';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_total_unlocks on public.profiles;

create trigger profiles_enforce_total_unlocks
  before update on public.profiles
  for each row execute function public.enforce_profile_total_unlocks();
