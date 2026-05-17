-- Boutique cadeaux + points + parrainage.
-- Points are separate from total_unlocks and are only used for gift redemptions.

begin;

alter table public.profiles
  add column if not exists points_balance integer not null default 0
    check (points_balance >= 0),
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.profiles (id) on delete set null,
  add constraint profiles_no_self_referral check (referred_by is null or referred_by <> id);

comment on column public.profiles.points_balance is
  'Solde points boutique cadeaux. Séparé de total_unlocks.';
comment on column public.profiles.referral_code is
  'Code parrainage unique du client.';
comment on column public.profiles.referred_by is
  'Parrain direct, figé à l’inscription.';

create or replace function public.generate_referral_code(p_profile_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_try integer := 0;
begin
  loop
    v_code := upper(substr(replace(p_profile_id::text, '-', ''), 1, 6) || substr(md5(random()::text), 1, 2));
    exit when not exists (
      select 1 from public.profiles where referral_code = v_code
    );
    v_try := v_try + 1;
    if v_try > 20 then
      raise exception 'referral_code_generation_failed';
    end if;
  end loop;
  return v_code;
end;
$$;

update public.profiles
set referral_code = public.generate_referral_code(id)
where referral_code is null;

alter table public.profiles
  alter column referral_code set not null;

create table if not exists public.gift_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  points_price integer not null check (points_price > 0),
  real_cost_eur integer not null default 0 check (real_cost_eur >= 0),
  image_url text,
  rarity text not null default 'rare'
    check (rarity in ('rare', 'premium', 'elite', 'legendary')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gift_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  gift_id uuid not null references public.gift_catalog (id) on delete restrict,
  points_spent integer not null check (points_spent > 0),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'refused', 'sent', 'cancelled')),
  tracking_number text,
  admin_note text,
  handled_by uuid references public.profiles (id) on delete set null,
  sent_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  points_delta integer not null check (points_delta <> 0),
  reason text not null check (
    reason in (
      'unlock_reward',
      'referral_reward',
      'unlock_cancel',
      'referral_cancel',
      'gift_redeem',
      'gift_refund'
    )
  ),
  source_profile_id uuid references public.profiles (id) on delete set null,
  source_history_id uuid references public.history (id) on delete set null,
  gift_request_id uuid references public.gift_requests (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists points_ledger_unlock_reward_once_idx
  on public.points_ledger (profile_id, reason, source_history_id)
  where reason in ('unlock_reward', 'unlock_cancel') and source_history_id is not null;

create unique index if not exists points_ledger_referral_reward_once_idx
  on public.points_ledger (profile_id, reason, source_history_id, source_profile_id)
  where reason in ('referral_reward', 'referral_cancel') and source_history_id is not null;

create unique index if not exists points_ledger_gift_redeem_once_idx
  on public.points_ledger (profile_id, reason, gift_request_id)
  where reason = 'gift_redeem' and gift_request_id is not null;

create unique index if not exists points_ledger_gift_refund_once_idx
  on public.points_ledger (profile_id, reason, gift_request_id)
  where reason = 'gift_refund' and gift_request_id is not null;

create index if not exists gift_catalog_active_sort_idx
  on public.gift_catalog (active, sort_order, created_at);

create index if not exists gift_requests_profile_created_idx
  on public.gift_requests (profile_id, created_at desc);

create index if not exists gift_requests_status_created_idx
  on public.gift_requests (status, created_at desc);

create index if not exists points_ledger_profile_created_idx
  on public.points_ledger (profile_id, created_at desc);

create index if not exists points_ledger_created_idx
  on public.points_ledger (created_at desc);

alter table public.gift_catalog enable row level security;
alter table public.gift_requests enable row level security;
alter table public.points_ledger enable row level security;

drop policy if exists gift_catalog_select_active_or_admin on public.gift_catalog;
create policy gift_catalog_select_active_or_admin
  on public.gift_catalog
  for select
  to authenticated
  using (active or public.has_role('admin'));

drop policy if exists gift_requests_select_owner_or_admin on public.gift_requests;
create policy gift_requests_select_owner_or_admin
  on public.gift_requests
  for select
  to authenticated
  using (profile_id = auth.uid() or public.has_role('admin'));

drop policy if exists points_ledger_select_owner_or_admin on public.points_ledger;
create policy points_ledger_select_owner_or_admin
  on public.points_ledger
  for select
  to authenticated
  using (profile_id = auth.uid() or public.has_role('admin'));

revoke all on public.gift_catalog from public, anon, authenticated;
revoke all on public.gift_requests from public, anon, authenticated;
revoke all on public.points_ledger from public, anon, authenticated;
grant select on public.gift_catalog to authenticated;
grant select on public.gift_requests to authenticated;
grant select on public.points_ledger to authenticated;
grant all on public.gift_catalog to service_role;
grant all on public.gift_requests to service_role;
grant all on public.points_ledger to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_id uuid;
  v_referrer_id uuid;
  v_code text;
begin
  v_code := nullif(upper(trim(coalesce(new.raw_user_meta_data ->> 'referral_code', ''))), '');

  if v_code is not null then
    select id into v_referrer_id
    from public.profiles
    where referral_code = v_code
    limit 1;
  end if;

  if v_referrer_id = new.id then
    v_referrer_id := null;
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    snap,
    referral_code,
    referred_by
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    nullif(trim(both from coalesce(new.raw_user_meta_data ->> 'snap', '')), ''),
    public.generate_referral_code(new.id),
    v_referrer_id
  );

  select r.id into customer_id from public.roles r where r.slug = 'customer' limit 1;

  insert into public.user_roles (profile_id, role_id)
  values (new.id, customer_id);

  return new;
end;
$$;

create or replace function public.apply_points_delta(
  p_profile_id uuid,
  p_points_delta integer,
  p_reason text,
  p_source_profile_id uuid default null,
  p_source_history_id uuid default null,
  p_gift_request_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ledger_id uuid;
begin
  if p_points_delta = 0 then
    raise exception 'invalid_points_delta';
  end if;

  update public.profiles
  set
    points_balance = points_balance + p_points_delta,
    updated_at = now()
  where id = p_profile_id
    and points_balance + p_points_delta >= 0;

  if not found then
    raise exception 'insufficient_points';
  end if;

  insert into public.points_ledger(
    profile_id,
    points_delta,
    reason,
    source_profile_id,
    source_history_id,
    gift_request_id,
    metadata
  )
  values (
    p_profile_id,
    p_points_delta,
    p_reason,
    p_source_profile_id,
    p_source_history_id,
    p_gift_request_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_ledger_id;

  return v_ledger_id;
end;
$$;

create or replace function public.award_unlock_points(
  p_profile_id uuid,
  p_amount_eur smallint,
  p_history_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_referral_points integer;
begin
  if p_amount_eur not in (150, 200) then
    raise exception 'invalid_amount';
  end if;

  perform public.apply_points_delta(
    p_profile_id,
    p_amount_eur,
    'unlock_reward',
    null,
    p_history_id,
    null,
    jsonb_build_object('amount_eur', p_amount_eur)
  );

  select referred_by into v_referrer_id
  from public.profiles
  where id = p_profile_id;

  if v_referrer_id is not null and v_referrer_id <> p_profile_id then
    v_referral_points := case when p_amount_eur = 200 then 75 else 50 end;
    perform public.apply_points_delta(
      v_referrer_id,
      v_referral_points,
      'referral_reward',
      p_profile_id,
      p_history_id,
      null,
      jsonb_build_object('amount_eur', p_amount_eur, 'referred_profile_id', p_profile_id)
    );
  end if;
end;
$$;

create or replace function public.revoke_unlock_points(
  p_profile_id uuid,
  p_original_history_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  for v_row in
    select profile_id, points_delta, reason, source_profile_id, metadata
    from public.points_ledger
    where source_history_id = p_original_history_id
      and reason in ('unlock_reward', 'referral_reward')
    order by created_at asc
  loop
    if v_row.reason = 'unlock_reward' and not exists (
      select 1 from public.points_ledger
      where profile_id = v_row.profile_id
        and reason = 'unlock_cancel'
        and source_history_id = p_original_history_id
    ) then
      perform public.apply_points_delta(
        v_row.profile_id,
        v_row.points_delta * -1,
        'unlock_cancel',
        null,
        p_original_history_id,
        null,
        jsonb_build_object('cancelled_points', v_row.points_delta)
      );
    end if;

    if v_row.reason = 'referral_reward' and not exists (
      select 1 from public.points_ledger
      where profile_id = v_row.profile_id
        and reason = 'referral_cancel'
        and source_history_id = p_original_history_id
        and source_profile_id = p_profile_id
    ) then
      perform public.apply_points_delta(
        v_row.profile_id,
        v_row.points_delta * -1,
        'referral_cancel',
        p_profile_id,
        p_original_history_id,
        null,
        jsonb_build_object('cancelled_points', v_row.points_delta)
      );
    end if;
  end loop;
end;
$$;

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
  where id = p_profile_id;
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
    jsonb_build_object('profile_id', p_profile_id, 'amount_eur', p_amount_eur))
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

  perform public.award_unlock_points(p_profile_id, p_amount_eur, v_history_id);
end;
$$;

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

  perform public.revoke_unlock_points(p_profile_id, v_tx.history_id);

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

create or replace function public.redeem_gift(p_gift_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_gift record;
  v_request_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select id, points_price, name
    into v_gift
  from public.gift_catalog
  where id = p_gift_id
    and active = true;

  if not found then
    raise exception 'gift_not_found';
  end if;

  insert into public.gift_requests(profile_id, gift_id, points_spent)
  values (v_uid, v_gift.id, v_gift.points_price)
  returning id into v_request_id;

  perform public.apply_points_delta(
    v_uid,
    v_gift.points_price * -1,
    'gift_redeem',
    null,
    null,
    v_request_id,
    jsonb_build_object('gift_id', v_gift.id, 'gift_name', v_gift.name)
  );

  insert into public.history(subject_id, actor_id, event_type, entity_type, entity_id, payload)
  values (
    v_uid,
    v_uid,
    'gift_requested',
    'gift_request',
    v_request_id,
    jsonb_build_object('gift_id', v_gift.id, 'gift_name', v_gift.name, 'points_spent', v_gift.points_price)
  );

  return v_request_id;
end;
$$;

create or replace function public.admin_update_gift_request(
  p_request_id uuid,
  p_status text,
  p_tracking_number text default null,
  p_admin_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_request record;
begin
  v_uid := auth.uid();
  if v_uid is null or not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  if p_status not in ('accepted', 'refused', 'sent', 'cancelled') then
    raise exception 'invalid_status';
  end if;

  select gr.*, gc.name as gift_name
    into v_request
  from public.gift_requests gr
  join public.gift_catalog gc on gc.id = gr.gift_id
  where gr.id = p_request_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_request.status in ('refused', 'sent', 'cancelled') then
    raise exception 'already_final';
  end if;

  if p_status = 'sent' and v_request.status not in ('pending', 'accepted') then
    raise exception 'invalid_state';
  end if;

  if p_status in ('refused', 'cancelled') and v_request.refunded_at is null then
    perform public.apply_points_delta(
      v_request.profile_id,
      v_request.points_spent,
      'gift_refund',
      null,
      null,
      v_request.id,
      jsonb_build_object('gift_id', v_request.gift_id, 'gift_name', v_request.gift_name)
    );
  end if;

  update public.gift_requests
  set
    status = p_status,
    tracking_number = nullif(trim(coalesce(p_tracking_number, v_request.tracking_number, '')), ''),
    admin_note = nullif(trim(coalesce(p_admin_note, v_request.admin_note, '')), ''),
    handled_by = v_uid,
    sent_at = case when p_status = 'sent' then now() else v_request.sent_at end,
    refunded_at = case when p_status in ('refused', 'cancelled') and v_request.refunded_at is null then now() else v_request.refunded_at end,
    updated_at = now()
  where id = p_request_id;

  insert into public.history(subject_id, actor_id, event_type, entity_type, entity_id, payload)
  values (
    v_request.profile_id,
    v_uid,
    case
      when p_status = 'accepted' then 'gift_accepted'
      when p_status = 'sent' then 'gift_sent'
      when p_status = 'refused' then 'gift_refused'
      else 'gift_cancelled'
    end,
    'gift_request',
    p_request_id,
    jsonb_build_object(
      'gift_id', v_request.gift_id,
      'gift_name', v_request.gift_name,
      'points_spent', v_request.points_spent,
      'tracking_number', p_tracking_number
    )
  );
end;
$$;

create or replace function public.admin_upsert_gift(
  p_id uuid,
  p_name text,
  p_description text,
  p_points_price integer,
  p_real_cost_eur integer,
  p_image_url text,
  p_rarity text,
  p_active boolean,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null or not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  if p_id is null then
    insert into public.gift_catalog(
      name, description, points_price, real_cost_eur, image_url, rarity, active, sort_order
    )
    values (
      nullif(trim(p_name), ''),
      nullif(trim(p_description), ''),
      p_points_price,
      coalesce(p_real_cost_eur, 0),
      nullif(trim(coalesce(p_image_url, '')), ''),
      coalesce(p_rarity, 'rare'),
      coalesce(p_active, true),
      coalesce(p_sort_order, 0)
    )
    returning id into v_id;
  else
    update public.gift_catalog
    set
      name = nullif(trim(p_name), ''),
      description = nullif(trim(p_description), ''),
      points_price = p_points_price,
      real_cost_eur = coalesce(p_real_cost_eur, 0),
      image_url = nullif(trim(coalesce(p_image_url, '')), ''),
      rarity = coalesce(p_rarity, 'rare'),
      active = coalesce(p_active, true),
      sort_order = coalesce(p_sort_order, 0),
      updated_at = now()
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'not_found';
    end if;
  end if;

  return v_id;
end;
$$;

insert into public.gift_catalog(name, description, points_price, real_cost_eur, rarity, active, sort_order)
values
  ('Hélices silencieuses', 'Pack premium pour voler plus discrètement.', 900, 30, 'rare', true, 10),
  ('Système de largage', 'Accessoire exclusif pour scénarios avancés.', 1500, 50, 'premium', true, 20),
  ('Dongle cellulaire 4G', 'Connexion renforcée pour usages exigeants.', 4000, 150, 'elite', true, 30),
  ('Réduction -10% sur drone', 'Avantage privé sur un drone sélectionné.', 7500, 150, 'elite', true, 40),
  ('Drone', 'Cadeau ultime du club privé.', 30000, 1200, 'legendary', true, 50)
on conflict do nothing;

do $$
begin
  alter publication supabase_realtime add table public.gift_catalog;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.gift_requests;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.points_ledger;
exception
  when duplicate_object then null;
end $$;

revoke all on function public.generate_referral_code(uuid) from public, anon, authenticated;
revoke all on function public.apply_points_delta(uuid, integer, text, uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.award_unlock_points(uuid, smallint, uuid) from public, anon, authenticated;
revoke all on function public.revoke_unlock_points(uuid, uuid) from public, anon, authenticated;
revoke all on function public.validate_unlock(uuid, smallint) from public, anon;
revoke all on function public.undo_last_unlock(uuid) from public, anon;
revoke all on function public.redeem_gift(uuid) from public, anon;
revoke all on function public.admin_update_gift_request(uuid, text, text, text) from public, anon;
revoke all on function public.admin_upsert_gift(uuid, text, text, integer, integer, text, text, boolean, integer) from public, anon;

grant execute on function public.validate_unlock(uuid, smallint) to authenticated;
grant execute on function public.undo_last_unlock(uuid) to authenticated;
grant execute on function public.redeem_gift(uuid) to authenticated;
grant execute on function public.admin_update_gift_request(uuid, text, text, text) to authenticated;
grant execute on function public.admin_upsert_gift(uuid, text, text, integer, integer, text, text, boolean, integer) to authenticated;

commit;
