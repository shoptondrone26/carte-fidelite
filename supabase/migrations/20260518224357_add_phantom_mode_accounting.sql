-- Add Mode Fantome revenue to admin-only accounting.
-- The 500 EUR transaction is created only when an admin completes the request.

begin;

alter table public.accounting_transactions
  add column if not exists phantom_request_id uuid
    references public.phantom_requests (id) on delete restrict;

create unique index if not exists accounting_transactions_phantom_request_id_key
  on public.accounting_transactions (phantom_request_id)
  where phantom_request_id is not null;

create index if not exists accounting_transactions_action_type_created_at_idx
  on public.accounting_transactions (action_type, created_at desc);

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

comment on column public.accounting_transactions.phantom_request_id is
  'Mode Fantome request linked to the 500 EUR admin-only accounting transaction.';

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

  if v_request.status = 'completed' or v_request.completed_at is not null then
    raise exception 'already_completed';
  end if;

  if exists (
    select 1
    from public.accounting_transactions tx
    where tx.phantom_request_id = p_request_id
      and tx.action_type = 'phantom_mode'
  ) then
    raise exception 'already_completed';
  end if;

  if v_request.status not in ('paid', 'in_progress') then
    raise exception 'invalid_state';
  end if;

  update public.phantom_requests
  set
    status = 'completed',
    accepted_at = coalesce(accepted_at, v_now),
    payment_pending_at = coalesce(payment_pending_at, v_now),
    paid_at = coalesce(paid_at, v_now),
    started_at = coalesce(started_at, v_now),
    completed_at = v_now,
    handled_by = v_uid
  where id = p_request_id
    and status <> 'completed'
    and completed_at is null;

  if not found then
    raise exception 'already_completed';
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
    'phantom_completed',
    'phantom_request',
    p_request_id,
    jsonb_build_object('request_id', p_request_id, 'status', 'completed')
  )
  returning id into v_history_id;

  insert into public.accounting_transactions(
    profile_id,
    actor_id,
    amount_eur,
    action_type,
    history_id,
    phantom_request_id
  )
  values (
    v_request.profile_id,
    v_uid,
    500,
    'phantom_mode',
    v_history_id,
    p_request_id
  );
end;
$$;

revoke all on function public.complete_phantom_request(uuid) from public, anon;
grant execute on function public.complete_phantom_request(uuid) to authenticated;

commit;
