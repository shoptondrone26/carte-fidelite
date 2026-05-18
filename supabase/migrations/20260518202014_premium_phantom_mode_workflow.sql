-- Premium Mode Phantom requests: client tracking, admin workflow and accounting.

begin;

create table if not exists public.phantom_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  amount_eur smallint not null default 500,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  paid_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,
  completion_history_id uuid references public.history (id) on delete set null,
  constraint phantom_requests_amount_check check (amount_eur = 500),
  constraint phantom_requests_status_check check (
    status in (
      'pending',
      'accepted',
      'payment_pending',
      'paid',
      'in_progress',
      'completed',
      'refused',
      'cancelled'
    )
  )
);

create index if not exists phantom_requests_profile_created_idx
  on public.phantom_requests (profile_id, created_at desc);

create index if not exists phantom_requests_status_created_idx
  on public.phantom_requests (status, created_at desc);

alter table public.phantom_requests enable row level security;

drop policy if exists phantom_requests_select_own_or_admin on public.phantom_requests;
create policy phantom_requests_select_own_or_admin
  on public.phantom_requests
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or public.has_role('admin')
    or public.has_role('staff')
  );

drop policy if exists phantom_requests_insert_own on public.phantom_requests;
create policy phantom_requests_insert_own
  on public.phantom_requests
  for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    and status = 'pending'
    and amount_eur = 500
  );

drop policy if exists phantom_requests_update_admin on public.phantom_requests;
create policy phantom_requests_update_admin
  on public.phantom_requests
  for update
  to authenticated
  using (public.has_role('admin') or public.has_role('staff'))
  with check (public.has_role('admin') or public.has_role('staff'));

revoke all on public.phantom_requests from public, anon;
grant select on public.phantom_requests to authenticated;
grant all on public.phantom_requests to service_role;

alter table public.accounting_transactions
  drop constraint if exists accounting_transactions_amount_eur_check;

alter table public.accounting_transactions
  add constraint accounting_transactions_amount_eur_check
  check (amount_eur in (-200, -150, 150, 200, 500));

alter table public.accounting_transactions
  drop constraint if exists accounting_transactions_action_type_check;

alter table public.accounting_transactions
  add constraint accounting_transactions_action_type_check
  check (action_type in ('paid_unlock', 'unlock_cancellation', 'phantom_mode'));

create or replace function public.create_phantom_request()
returns table (
  id uuid,
  profile_id uuid,
  status text,
  amount_eur smallint,
  admin_note text,
  created_at timestamptz,
  updated_at timestamptz,
  accepted_at timestamptz,
  paid_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  handled_by uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_request public.phantom_requests%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if public.has_role('admin') or public.has_role('staff') then
    raise exception 'client_only';
  end if;

  if exists (
    select 1
    from public.phantom_requests pr
    where pr.profile_id = v_uid
      and pr.status in ('pending', 'accepted', 'payment_pending', 'paid', 'in_progress')
  ) then
    raise exception 'active_request_exists';
  end if;

  insert into public.phantom_requests(profile_id)
  values (v_uid)
  returning * into v_request;

  insert into public.history(
    subject_id,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    payload
  )
  values (
    v_uid,
    v_uid,
    'phantom_mode_requested',
    'phantom_request',
    v_request.id,
    jsonb_build_object('request_id', v_request.id, 'status', v_request.status)
  );

  return query
  select
    v_request.id,
    v_request.profile_id,
    v_request.status,
    v_request.amount_eur,
    v_request.admin_note,
    v_request.created_at,
    v_request.updated_at,
    v_request.accepted_at,
    v_request.paid_at,
    v_request.started_at,
    v_request.completed_at,
    v_request.cancelled_at,
    v_request.handled_by;
end;
$$;

create or replace function public.admin_update_phantom_request_status(
  p_request_id uuid,
  p_status text,
  p_admin_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_request public.phantom_requests%rowtype;
  v_now timestamptz := now();
begin
  v_uid := auth.uid();
  if v_uid is null or not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  if p_status not in ('accepted', 'payment_pending', 'paid', 'in_progress', 'refused', 'cancelled') then
    raise exception 'invalid_status';
  end if;

  select *
    into v_request
  from public.phantom_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_request.status in ('completed', 'refused', 'cancelled') then
    raise exception 'invalid_state';
  end if;

  update public.phantom_requests
  set
    status = p_status,
    admin_note = nullif(trim(coalesce(p_admin_note, admin_note, '')), ''),
    updated_at = v_now,
    accepted_at = case when p_status in ('accepted', 'payment_pending', 'paid', 'in_progress') then coalesce(accepted_at, v_now) else accepted_at end,
    paid_at = case when p_status in ('paid', 'in_progress') then coalesce(paid_at, v_now) else paid_at end,
    started_at = case when p_status = 'in_progress' then coalesce(started_at, v_now) else started_at end,
    cancelled_at = case when p_status in ('refused', 'cancelled') then coalesce(cancelled_at, v_now) else cancelled_at end,
    handled_by = v_uid
  where id = p_request_id;

  insert into public.history(
    subject_id,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    payload
  )
  values (
    v_request.profile_id,
    v_uid,
    'phantom_mode_updated',
    'phantom_request',
    p_request_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'previous_status', v_request.status,
      'status', p_status
    )
  );
end;
$$;

create or replace function public.complete_phantom_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_request public.phantom_requests%rowtype;
  v_now timestamptz := now();
  v_history_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null or not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  select *
    into v_request
  from public.phantom_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_request.status = 'completed' or v_request.completion_history_id is not null then
    raise exception 'already_completed';
  end if;

  if v_request.status not in ('paid', 'in_progress') then
    raise exception 'invalid_state';
  end if;

  insert into public.history(
    subject_id,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    payload
  )
  values (
    v_request.profile_id,
    v_uid,
    'phantom_mode_completed',
    'phantom_request',
    p_request_id,
    jsonb_build_object('request_id', p_request_id, 'status', 'completed')
  )
  returning id into v_history_id;

  update public.phantom_requests
  set
    status = 'completed',
    updated_at = v_now,
    accepted_at = coalesce(accepted_at, v_now),
    paid_at = coalesce(paid_at, v_now),
    started_at = coalesce(started_at, v_now),
    completed_at = v_now,
    handled_by = v_uid,
    completion_history_id = v_history_id
  where id = p_request_id
    and status <> 'completed'
    and completion_history_id is null;

  if not found then
    raise exception 'already_completed';
  end if;

  insert into public.accounting_transactions(
    profile_id,
    actor_id,
    amount_eur,
    action_type,
    history_id
  )
  values (
    v_request.profile_id,
    v_uid,
    500,
    'phantom_mode',
    v_history_id
  );
end;
$$;

revoke all on function public.create_phantom_request() from public, anon;
revoke all on function public.admin_update_phantom_request_status(uuid, text, text) from public, anon;
revoke all on function public.complete_phantom_request(uuid) from public, anon;

grant execute on function public.create_phantom_request() to authenticated;
grant execute on function public.admin_update_phantom_request_status(uuid, text, text) to authenticated;
grant execute on function public.complete_phantom_request(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    execute 'create publication supabase_realtime';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'phantom_requests'
  ) then
    execute 'alter publication supabase_realtime add table public.phantom_requests';
  end if;
end $$;

commit;
