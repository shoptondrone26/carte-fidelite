-- Comptabilité boutique : CA enregistré à la clôture « terminée », contre-écriture si annulation.

begin;

alter table public.accounting_transactions
  alter column amount_eur type numeric(10, 2) using amount_eur::numeric(10, 2);

alter table public.accounting_transactions
  drop constraint if exists accounting_transactions_amount_eur_check;

alter table public.accounting_transactions
  add column if not exists shop_order_id uuid
    references public.shop_orders (id) on delete restrict;

create unique index if not exists accounting_transactions_shop_order_sale_key
  on public.accounting_transactions (shop_order_id)
  where shop_order_id is not null
    and action_type = 'shop_order';

create unique index if not exists accounting_transactions_shop_order_cancellation_key
  on public.accounting_transactions (shop_order_id)
  where shop_order_id is not null
    and action_type = 'shop_order_cancellation';

alter table public.accounting_transactions
  drop constraint if exists accounting_transactions_action_type_check;

alter table public.accounting_transactions
  add constraint accounting_transactions_action_type_check
  check (
    action_type in (
      'paid_unlock',
      'unlock_cancellation',
      'phantom_mode',
      'phantom_mode_cancellation',
      'shop_order',
      'shop_order_cancellation'
    )
  );

comment on column public.accounting_transactions.shop_order_id is
  'Commande boutique liée à l''écriture comptable (vente ou contre-écriture).';

create or replace function public.post_shop_order_accounting_sale(
  p_order public.shop_orders,
  p_actor_id uuid,
  p_history_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount numeric(10, 2);
begin
  if p_order.status <> 'completed' then
    raise exception 'invalid_state';
  end if;

  if exists (
    select 1
    from public.accounting_transactions tx
    where tx.shop_order_id = p_order.id
      and tx.action_type = 'shop_order'
  ) then
    return;
  end if;

  v_amount := p_order.total_price_eur;
  if v_amount is null or v_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  insert into public.accounting_transactions(
    profile_id,
    actor_id,
    amount_eur,
    action_type,
    history_id,
    shop_order_id
  )
  values (
    p_order.profile_id,
    p_actor_id,
    v_amount,
    'shop_order',
    p_history_id,
    p_order.id
  );
end;
$$;

create or replace function public.post_shop_order_accounting_cancellation(
  p_order public.shop_orders,
  p_actor_id uuid,
  p_history_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_tx public.accounting_transactions%rowtype;
begin
  select *
    into v_sale_tx
  from public.accounting_transactions tx
  where tx.shop_order_id = p_order.id
    and tx.action_type = 'shop_order'
    and tx.amount_eur > 0
  order by tx.created_at desc
  limit 1
  for update;

  if not found then
    return;
  end if;

  if exists (
    select 1
    from public.accounting_transactions tx
    where tx.shop_order_id = p_order.id
      and tx.action_type = 'shop_order_cancellation'
  ) then
    return;
  end if;

  insert into public.accounting_transactions(
    profile_id,
    actor_id,
    amount_eur,
    action_type,
    history_id,
    shop_order_id
  )
  values (
    p_order.profile_id,
    p_actor_id,
    -v_sale_tx.amount_eur,
    'shop_order_cancellation',
    p_history_id,
    p_order.id
  );
end;
$$;

create or replace function public.admin_update_shop_order_status(
  p_order_id uuid,
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
  v_order public.shop_orders%rowtype;
  v_previous_status text;
  v_was_completed boolean;
  v_now timestamptz := now();
  v_event_type text;
  v_history_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null or not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  if p_status not in (
    'paid',
    'preparing',
    'shipped',
    'completed',
    'refused',
    'cancelled'
  ) then
    raise exception 'invalid_status';
  end if;

  perform public.expire_shop_orders();

  select *
    into v_order
  from public.shop_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_order.status in ('refused', 'cancelled', 'expired') then
    raise exception 'invalid_state';
  end if;

  if v_order.status = 'completed' and p_status <> 'cancelled' then
    raise exception 'invalid_state';
  end if;

  if p_status = 'paid' and v_order.status <> 'payment_pending' then
    raise exception 'invalid_transition';
  end if;

  if p_status = 'preparing' and v_order.status <> 'paid' then
    raise exception 'invalid_transition';
  end if;

  if p_status = 'shipped' and v_order.status not in ('preparing', 'shipped') then
    raise exception 'invalid_transition';
  end if;

  if p_status = 'completed' and v_order.status not in ('shipped', 'completed') then
    raise exception 'invalid_transition';
  end if;

  if p_status = 'refused' and v_order.status <> 'payment_pending' then
    raise exception 'invalid_transition';
  end if;

  if p_status = 'cancelled' and v_order.status not in (
    'payment_pending',
    'paid',
    'preparing',
    'shipped',
    'completed'
  ) then
    raise exception 'invalid_transition';
  end if;

  v_previous_status := v_order.status;
  v_was_completed := v_order.completed_at is not null;

  update public.shop_orders
  set
    status = p_status,
    admin_note = nullif(trim(coalesce(p_admin_note, admin_note, '')), ''),
    paid_at = case when p_status in ('paid', 'preparing', 'shipped', 'completed') then coalesce(paid_at, v_now) else paid_at end,
    preparing_at = case when p_status in ('preparing', 'shipped', 'completed') then coalesce(preparing_at, v_now) else preparing_at end,
    shipped_at = case when p_status in ('shipped', 'completed') then coalesce(shipped_at, v_now) else shipped_at end,
    completed_at = case when p_status = 'completed' then coalesce(completed_at, v_now) else completed_at end,
    cancelled_at = case when p_status = 'cancelled' then coalesce(cancelled_at, v_now) else cancelled_at end,
    refused_at = case when p_status = 'refused' then coalesce(refused_at, v_now) else refused_at end,
    handled_by = v_uid
  where id = p_order_id
  returning * into v_order;

  if p_status in ('refused', 'cancelled') and v_previous_status = 'payment_pending' then
    perform public.release_shop_order_stock(v_order);
  end if;

  v_event_type := public.shop_order_history_event_for_status(p_status);
  if v_event_type is not null then
    insert into public.history(
      subject_id,
      actor_id,
      event_type,
      entity_type,
      entity_id,
      payload
    )
    values (
      v_order.profile_id,
      v_uid,
      v_event_type,
      'shop_order',
      v_order.id,
      jsonb_build_object(
        'order_id', v_order.id,
        'product_id', v_order.product_id,
        'product_name', v_order.product_name,
        'amount_eur', v_order.total_price_eur,
        'status', p_status
      )
    )
    returning id into v_history_id;
  end if;

  if p_status = 'completed' then
    perform public.post_shop_order_accounting_sale(v_order, v_uid, v_history_id);
  elsif p_status = 'cancelled' and v_was_completed then
    perform public.post_shop_order_accounting_cancellation(v_order, v_uid, v_history_id);
  end if;
end;
$$;

revoke all on function public.post_shop_order_accounting_sale(public.shop_orders, uuid, uuid) from public, anon;
revoke all on function public.post_shop_order_accounting_cancellation(public.shop_orders, uuid, uuid) from public, anon;

grant execute on function public.post_shop_order_accounting_sale(public.shop_orders, uuid, uuid) to service_role;
grant execute on function public.post_shop_order_accounting_cancellation(public.shop_orders, uuid, uuid) to service_role;

commit;
