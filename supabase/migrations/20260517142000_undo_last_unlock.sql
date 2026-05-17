-- Admin-only undo for the latest paid unlock.
-- Keeps the original accounting/history rows and adds auditable counter-entries.

begin;

alter table public.accounting_transactions
  drop constraint if exists accounting_transactions_amount_eur_check;

alter table public.accounting_transactions
  add constraint accounting_transactions_amount_eur_check
  check (amount_eur in (-200, -150, 150, 200));

alter table public.accounting_transactions
  drop constraint if exists accounting_transactions_action_type_check;

alter table public.accounting_transactions
  add constraint accounting_transactions_action_type_check
  check (action_type in ('paid_unlock', 'unlock_cancellation'));

create or replace function public.undo_last_unlock(p_profile_id uuid)
returns table (
  amount_eur smallint,
  transaction_id uuid,
  history_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_total_unlocks integer;
  v_tx record;
  v_history_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null or not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  select total_unlocks
    into v_total_unlocks
  from public.profiles
  where id = p_profile_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_total_unlocks <= 0 then
    raise exception 'nothing_to_undo';
  end if;

  select
    tx.id,
    tx.amount_eur,
    tx.history_id,
    tx.created_at
  into v_tx
  from public.accounting_transactions tx
  where tx.profile_id = p_profile_id
    and tx.action_type = 'paid_unlock'
    and tx.amount_eur > 0
    and not exists (
      select 1
      from public.history h
      where h.event_type = 'unlock_cancelled'
        and h.payload->>'original_transaction_id' = tx.id::text
    )
  order by tx.created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'nothing_to_undo';
  end if;

  update public.profiles
  set
    total_unlocks = total_unlocks - 1,
    updated_at = now()
  where id = p_profile_id
    and total_unlocks > 0;

  if not found then
    raise exception 'nothing_to_undo';
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
    p_profile_id,
    v_uid,
    'unlock_cancelled',
    'accounting_transaction',
    v_tx.id,
    jsonb_build_object(
      'profile_id', p_profile_id,
      'amount_eur', v_tx.amount_eur,
      'original_transaction_id', v_tx.id,
      'original_history_id', v_tx.history_id,
      'original_created_at', v_tx.created_at
    )
  )
  returning id into v_history_id;

  insert into public.accounting_transactions(
    profile_id,
    actor_id,
    amount_eur,
    action_type,
    history_id
  )
  values (
    p_profile_id,
    v_uid,
    (v_tx.amount_eur * -1)::smallint,
    'unlock_cancellation',
    v_history_id
  );

  amount_eur := v_tx.amount_eur;
  transaction_id := v_tx.id;
  history_id := v_history_id;
  return next;
end;
$$;

revoke all on function public.undo_last_unlock(uuid) from public, anon;
grant execute on function public.undo_last_unlock(uuid) to authenticated;

commit;
