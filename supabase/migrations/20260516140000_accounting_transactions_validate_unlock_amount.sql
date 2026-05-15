-- P0/P1: Comptabilité admin — table accounting_transactions + validate_unlock avec montant (150|200 €)

-- ---------------------------------------------------------------------------
-- accounting_transactions (lecture admin uniquement ; écriture via RPC)
-- ---------------------------------------------------------------------------
create table public.accounting_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  amount_eur smallint not null check (amount_eur in (150, 200)),
  action_type text not null default 'paid_unlock'
    check (action_type in ('paid_unlock')),
  history_id uuid references public.history (id) on delete set null,
  created_at timestamptz not null default now()
);

create index accounting_transactions_created_at_idx
  on public.accounting_transactions (created_at desc);

create index accounting_transactions_profile_id_created_at_idx
  on public.accounting_transactions (profile_id, created_at desc);

create index accounting_transactions_actor_id_idx
  on public.accounting_transactions (actor_id);

comment on table public.accounting_transactions is
  'Transactions comptables (déblocages payants). Montants visibles admin uniquement.';

alter table public.accounting_transactions enable row level security;

create policy accounting_transactions_select_admin
  on public.accounting_transactions
  for select
  to authenticated
  using (public.has_role('admin'));

grant select on public.accounting_transactions to authenticated;

grant all on public.accounting_transactions to service_role;

-- ---------------------------------------------------------------------------
-- validate_unlock(profile, amount_eur): fidélité + compta + history (sans montant)
-- ---------------------------------------------------------------------------
drop function if exists public.validate_unlock(uuid);

create or replace function public.validate_unlock(
  p_profile_id uuid,
  p_amount_eur smallint
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_history_id uuid;
begin
  if not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  if p_amount_eur is null or p_amount_eur not in (150, 200) then
    raise exception 'invalid_amount';
  end if;

  update public.profiles
  set
    total_unlocks = total_unlocks + 1,
    updated_at = now()
  where
    id = p_profile_id;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'not_found';
  end if;

  insert into public.history(
    subject_id,
    actor_id,
    event_type,
    entity_type,
    entity_id,
    payload)
  values (
    p_profile_id,
    auth.uid(),
    'unlock_validated',
    'profile',
    p_profile_id,
    jsonb_build_object('profile_id', p_profile_id))
  returning id into v_history_id;

  insert into public.accounting_transactions(
    profile_id,
    actor_id,
    amount_eur,
    action_type,
    history_id)
  values (
    p_profile_id,
    auth.uid(),
    p_amount_eur,
    'paid_unlock',
    v_history_id);
end;
$$;

revoke all on function public.validate_unlock(uuid, smallint) from public;

grant execute on function public.validate_unlock(uuid, smallint) to authenticated;
