drop policy if exists bookings_insert_rules on public.bookings;

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
