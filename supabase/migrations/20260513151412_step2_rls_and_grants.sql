alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.bookings enable row level security;
alter table public.history enable row level security;

create policy roles_select_authenticated
  on public.roles
  for select
  to authenticated
  using (true);

create policy roles_insert_admin
  on public.roles
  for insert
  to authenticated
  with check (public.has_role('admin'));

create policy roles_update_admin
  on public.roles
  for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

create policy roles_delete_admin
  on public.roles
  for delete
  to authenticated
  using (public.has_role('admin'));

create policy profiles_select_own_or_staff
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.has_role('admin')
    or public.has_role('staff')
  );

create policy profiles_insert_self
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy user_roles_select_own_or_admin
  on public.user_roles
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or public.has_role('admin')
  );

create policy user_roles_write_admin
  on public.user_roles
  for insert
  to authenticated
  with check (public.has_role('admin'));

create policy user_roles_delete_admin
  on public.user_roles
  for delete
  to authenticated
  using (public.has_role('admin'));

create policy bookings_select_own_or_staff
  on public.bookings
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or public.has_role('admin')
    or public.has_role('staff')
  );

create policy bookings_insert_own_or_staff
  on public.bookings
  for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    or public.has_role('admin')
    or public.has_role('staff')
  );

create policy bookings_update_own_or_staff
  on public.bookings
  for update
  to authenticated
  using (
    profile_id = auth.uid()
    or public.has_role('admin')
    or public.has_role('staff')
  )
  with check (
    profile_id = auth.uid()
    or public.has_role('admin')
    or public.has_role('staff')
  );

create policy bookings_delete_own_or_staff
  on public.bookings
  for delete
  to authenticated
  using (
    profile_id = auth.uid()
    or public.has_role('admin')
    or public.has_role('staff')
  );

create policy history_select_relevant
  on public.history
  for select
  to authenticated
  using (
    subject_id = auth.uid()
    or actor_id = auth.uid()
    or public.has_role('admin')
    or public.has_role('staff')
  );

create policy history_insert_rules
  on public.history
  for insert
  to authenticated
  with check (
    (
      subject_id = auth.uid()
      and (actor_id is null or actor_id = auth.uid())
    )
    or public.has_role('admin')
    or public.has_role('staff')
  );

create policy history_update_admin_staff
  on public.history
  for update
  to authenticated
  using (public.has_role('admin') or public.has_role('staff'))
  with check (public.has_role('admin') or public.has_role('staff'));

create policy history_delete_admin
  on public.history
  for delete
  to authenticated
  using (public.has_role('admin'));

grant usage on schema public to postgres, anon, authenticated, service_role;

grant select on public.roles to authenticated;
grant select, insert, update, delete on public.roles to service_role;

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

grant select, insert, update, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;

grant select, insert, update, delete on public.history to authenticated;
grant all on public.history to service_role;
