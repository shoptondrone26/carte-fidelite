drop policy if exists bookings_insert_own_or_staff on public.bookings;

drop policy if exists bookings_update_own_or_staff on public.bookings;

drop policy if exists bookings_delete_own_or_staff on public.bookings;

create policy bookings_insert_rules on public.bookings for insert to authenticated
with
  check (
    (
      profile_id = auth.uid()
      and status = 'pending'
      and validated = false
    )
    or public.has_role ('admin')
  );

create policy bookings_update_admin_staff on public.bookings for update to authenticated using (
  public.has_role ('admin')
  or public.has_role ('staff')
)
with
  check (public.has_role ('admin') or public.has_role ('staff'));

create policy bookings_update_owner_cancel on public.bookings for update to authenticated using (
  profile_id = auth.uid()
  and status = 'pending'
)
with
  check (
    profile_id = auth.uid()
    and status = 'cancelled'
    and validated = false
  );

create policy bookings_delete_admin_staff on public.bookings for delete to authenticated using (
  public.has_role ('admin')
  or public.has_role ('staff')
);

create or replace function public.accept_booking(p_booking_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
  v_count int;
begin
  if not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  select
    profile_id into v_profile
  from
    public.bookings
  where
    id = p_booking_id
  for update;
  if not found then
    raise exception 'not_found';
  end if;

  update public.bookings
  set
    status = 'accepted',
    validated = true,
    updated_at = now()
  where
    id = p_booking_id
    and status = 'pending';
  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'invalid_state';
  end if;

  update public.profiles
  set
    total_unlocks = total_unlocks + 1,
    updated_at = now()
  where
    id = v_profile;

  insert into public.history(
    subject_id,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    payload)
  values (
    v_profile,
    auth.uid(),
    'booking_accepted',
    'booking',
    p_booking_id,
    jsonb_build_object(
      'booking_id',
      p_booking_id));

end;

$$;

create or replace function public.refuse_booking(p_booking_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid;
  v_count int;
begin
  if not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  select
    profile_id into v_profile
  from
    public.bookings
  where
    id = p_booking_id
  for update;
  if not found then
    raise exception 'not_found';
  end if;

  update public.bookings
  set
    status = 'refused',
    validated = false,
    updated_at = now()
  where
    id = p_booking_id
    and status = 'pending';
  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'invalid_state';
  end if;

  insert into public.history(
    subject_id,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    payload)
  values (
    v_profile,
    auth.uid(),
    'booking_refused',
    'booking',
    p_booking_id,
    jsonb_build_object(
      'booking_id',
      p_booking_id));

end;

$$;

revoke all on function public.accept_booking(uuid) from public;

revoke all on function public.refuse_booking(uuid) from public;

grant execute on function public.accept_booking(uuid) to authenticated;

grant execute on function public.refuse_booking(uuid) to authenticated;
