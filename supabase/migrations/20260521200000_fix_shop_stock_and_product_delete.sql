-- Boutique : libération stock idempotente, expiration 6h, suppression produit sûre.

begin;

alter table public.shop_products
  add column if not exists deleted_at timestamptz;

-- Libération stock par id (verrouille la commande, idempotent).
create or replace function public.release_shop_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.shop_orders%rowtype;
begin
  select *
    into v_order
  from public.shop_orders
  where id = p_order_id
  for update;

  if not found or not v_order.stock_reserved then
    return;
  end if;

  if exists (
    select 1
    from public.shop_order_items i
    where i.order_id = p_order_id
  ) then
    update public.shop_products p
    set stock = p.stock + agg.qty
    from (
      select i.product_id, sum(i.quantity)::integer as qty
      from public.shop_order_items i
      where i.order_id = p_order_id
      group by i.product_id
    ) agg
    where p.id = agg.product_id;
  elsif v_order.product_id is not null then
    update public.shop_products
    set stock = stock + v_order.quantity
    where id = v_order.product_id;
  end if;

  update public.shop_orders
  set stock_reserved = false
  where id = p_order_id;
end;
$$;

-- Compat : appels existants avec la ligne commande.
create or replace function public.release_shop_order_stock(p_order public.shop_orders)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.release_shop_order_stock(p_order.id);
end;
$$;

create or replace function public.expire_shop_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.shop_orders%rowtype;
  v_count integer := 0;
begin
  for v_order in
    select *
    from public.shop_orders
    where status = 'payment_pending'
      and expires_at < now()
      and stock_reserved = true
    for update
  loop
    update public.shop_orders
    set
      status = 'expired',
      expired_at = coalesce(expired_at, now()),
      handled_by = coalesce(handled_by, v_order.handled_by)
    where id = v_order.id
      and status = 'payment_pending';

    perform public.release_shop_order_stock(v_order.id);

    if not exists (
      select 1
      from public.history h
      where h.entity_id = v_order.id
        and h.event_type = 'shop_order_expired'
    ) then
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
        v_order.profile_id,
        'shop_order_expired',
        'shop_order',
        v_order.id,
        jsonb_build_object(
          'order_id', v_order.id,
          'product_id', v_order.product_id,
          'status', 'expired'
        )
      );
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.cancel_shop_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_order public.shop_orders%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  perform public.expire_shop_orders();

  select *
    into v_order
  from public.shop_orders
  where id = p_order_id
    and profile_id = v_uid
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_order.status <> 'payment_pending' then
    raise exception 'invalid_state';
  end if;

  update public.shop_orders
  set
    status = 'cancelled',
    cancelled_at = now()
  where id = p_order_id;

  perform public.release_shop_order_stock(p_order_id);

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
    'shop_order_cancelled',
    'shop_order',
    v_order.id,
    jsonb_build_object('order_id', v_order.id, 'status', 'cancelled')
  );
end;
$$;

create or replace function public.admin_update_shop_order_status(
  p_order_id uuid,
  p_status text,
  p_admin_note text default null,
  p_tracking_number text default null
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
  v_tracking text;
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

  v_tracking := nullif(trim(coalesce(p_tracking_number, '')), '');

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
    tracking_number = case
      when p_status = 'shipped' and v_tracking is not null then v_tracking
      when p_status = 'shipped' then tracking_number
      else tracking_number
    end,
    paid_at = case when p_status in ('paid', 'preparing', 'shipped', 'completed') then coalesce(paid_at, v_now) else paid_at end,
    preparing_at = case when p_status in ('preparing', 'shipped', 'completed') then coalesce(preparing_at, v_now) else preparing_at end,
    shipped_at = case when p_status in ('shipped', 'completed') then coalesce(shipped_at, v_now) else shipped_at end,
    completed_at = case when p_status = 'completed' then coalesce(completed_at, v_now) else completed_at end,
    cancelled_at = case when p_status = 'cancelled' then coalesce(cancelled_at, v_now) else cancelled_at end,
    refused_at = case when p_status = 'refused' then coalesce(refused_at, v_now) else refused_at end,
    handled_by = v_uid
  where id = p_order_id
  returning * into v_order;

  if p_status = 'completed' and v_order.stock_reserved then
    update public.shop_orders
    set stock_reserved = false
    where id = p_order_id;
  elsif p_status in ('refused', 'cancelled') then
    if p_status = 'cancelled' and v_was_completed then
      null;
    else
      perform public.release_shop_order_stock(p_order_id);
    end if;
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
        'tracking_number', v_order.tracking_number,
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

create or replace function public.admin_delete_shop_product(p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null or not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  if p_product_id is null then
    raise exception 'invalid_product';
  end if;

  if not exists (
    select 1
    from public.shop_products
    where id = p_product_id
  ) then
    raise exception 'not_found';
  end if;

  if exists (
    select 1
    from public.shop_order_items i
    where i.product_id = p_product_id
    limit 1
  ) then
    update public.shop_products
    set
      is_active = false,
      deleted_at = coalesce(deleted_at, now()),
      updated_at = now()
    where id = p_product_id;

    return jsonb_build_object('archived', true, 'hard_deleted', false);
  end if;

  delete from public.shop_product_recommendations
  where product_id = p_product_id
     or recommended_product_id = p_product_id;

  delete from public.shop_products
  where id = p_product_id;

  return jsonb_build_object('archived', false, 'hard_deleted', true);
end;
$$;

revoke all on function public.release_shop_order_stock(uuid) from public, anon;
revoke all on function public.admin_delete_shop_product(uuid) from public, anon;

grant execute on function public.release_shop_order_stock(uuid) to authenticated, service_role;
grant execute on function public.admin_delete_shop_product(uuid) to authenticated;

commit;
