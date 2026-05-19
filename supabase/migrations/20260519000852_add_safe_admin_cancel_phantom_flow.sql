-- Safe admin cancellation flow for Mode Fantome.
-- Keeps request/history/accounting rows and adds a negative counter-entry when needed.

begin;

alter table public.accounting_transactions
  drop constraint if exists accounting_transactions_amount_eur_check;

alter table public.accounting_transactions
  add constraint accounting_transactions_amount_eur_check
  check (amount_eur in (-500, -200, -150, 150, 200, 500));

alter table public.accounting_transactions
  drop constraint if exists accounting_transactions_action_type_check;

alter table public.accounting_transactions
  add constraint accounting_transactions_action_type_check
  check (
    action_type in (
      'paid_unlock',
      'unlock_cancellation',
      'phantom_mode',
      'phantom_mode_cancellation'
    )
  );

drop index if exists public.accounting_transactions_phantom_request_id_key;

create unique index accounting_transactions_phantom_request_id_key
  on public.accounting_transactions (phantom_request_id)
  where phantom_request_id is not null
    and action_type = 'phantom_mode';

create unique index if not exists accounting_transactions_phantom_cancellation_key
  on public.accounting_transactions (phantom_request_id)
  where phantom_request_id is not null
    and action_type = 'phantom_mode_cancellation';

create or replace function public.cancel_phantom_request(p_request_id uuid)
returns table (
  request_id uuid,
  correction_amount_eur smallint,
  correction_transaction_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_request public.phantom_requests%rowtype;
  v_history_id uuid;
  v_paid_tx public.accounting_transactions%rowtype;
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

  if v_request.status = 'cancelled' then
    raise exception 'already_cancelled';
  end if;

  if v_request.status not in ('accepted', 'payment_pending', 'paid', 'in_progress', 'completed') then
    raise exception 'invalid_state';
  end if;

  update public.phantom_requests
  set
    status = 'cancelled',
    cancelled_at = coalesce(cancelled_at, now()),
    handled_by = v_uid
  where id = p_request_id
    and status in ('accepted', 'payment_pending', 'paid', 'in_progress', 'completed');

  if not found then
    raise exception 'already_cancelled';
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
    'phantom_cancelled',
    'phantom_request',
    p_request_id,
    jsonb_build_object(
      'request_id', p_request_id,
      'previous_status', v_request.status,
      'status', 'cancelled'
    )
  )
  returning id into v_history_id;

  select *
    into v_paid_tx
  from public.accounting_transactions tx
  where tx.phantom_request_id = p_request_id
    and tx.action_type = 'phantom_mode'
    and tx.amount_eur = 500
  order by tx.created_at desc
  limit 1
  for update;

  if found and not exists (
    select 1
    from public.accounting_transactions tx
    where tx.phantom_request_id = p_request_id
      and tx.action_type = 'phantom_mode_cancellation'
  ) then
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
      -500,
      'phantom_mode_cancellation',
      v_history_id,
      p_request_id
    )
    returning id into correction_transaction_id;

    correction_amount_eur := -500;
  else
    correction_amount_eur := 0;
    correction_transaction_id := null;
  end if;

  request_id := p_request_id;
  return next;
end;
$$;

revoke all on function public.cancel_phantom_request(uuid) from public, anon;
grant execute on function public.cancel_phantom_request(uuid) to authenticated;

commit;
