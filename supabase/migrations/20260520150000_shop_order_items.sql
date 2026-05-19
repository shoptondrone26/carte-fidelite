-- Commandes boutique multi-produits : lignes shop_order_items, panier atomique.

begin;

-- ─── Lignes commande ───────────────────────────────────────────────────────

create table public.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders (id) on delete cascade,
  product_id uuid not null references public.shop_products (id) on delete restrict,
  product_name text not null,
  product_image_url text,
  unit_price_eur numeric(10, 2) not null check (unit_price_eur >= 0),
  quantity integer not null check (quantity > 0),
  line_total_eur numeric(10, 2) not null check (line_total_eur >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index shop_order_items_order_idx
  on public.shop_order_items (order_id, sort_order);

create index shop_order_items_product_idx
  on public.shop_order_items (product_id);

alter table public.shop_orders
  add column if not exists tracking_number text;

alter table public.shop_orders
  alter column product_id drop not null;

-- Rétrocompat : une ligne par commande existante
insert into public.shop_order_items (
  order_id,
  product_id,
  product_name,
  product_image_url,
  unit_price_eur,
  quantity,
  line_total_eur,
  sort_order
)
select
  so.id,
  so.product_id,
  so.product_name,
  so.product_image_url,
  so.unit_price_eur,
  so.quantity,
  so.total_price_eur,
  0
from public.shop_orders so
where so.product_id is not null
  and not exists (
    select 1
    from public.shop_order_items i
    where i.order_id = so.id
  );

-- ─── RLS lignes ──────────────────────────────────────────────────────────────

alter table public.shop_order_items enable row level security;

create policy shop_order_items_select_own_or_admin
  on public.shop_order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shop_orders o
      where o.id = shop_order_items.order_id
        and (
          o.profile_id = auth.uid()
          or public.has_role('admin')
          or public.has_role('staff')
        )
    )
  );

revoke all on public.shop_order_items from public, anon;
grant select on public.shop_order_items to authenticated;
grant all on public.shop_order_items to service_role;

-- ─── Helpers ─────────────────────────────────────────────────────────────────

create or replace function public.shop_product_has_active_order(
  p_profile_id uuid,
  p_product_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shop_orders so
    where so.profile_id = p_profile_id
      and so.status in ('payment_pending', 'paid', 'preparing', 'shipped')
      and (
        so.product_id = p_product_id
        or exists (
          select 1
          from public.shop_order_items i
          where i.order_id = so.id
            and i.product_id = p_product_id
        )
      )
  );
$$;

create or replace function public.shop_order_summary_name(p_item_count integer)
returns text
language sql
immutable
as $$
  select case
    when p_item_count <= 0 then 'Commande boutique'
    when p_item_count = 1 then '1 produit'
    else p_item_count::text || ' produits'
  end
$$;

create or replace function public.release_shop_order_stock(p_order public.shop_orders)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not p_order.stock_reserved then
    return;
  end if;

  if exists (
    select 1
    from public.shop_order_items i
    where i.order_id = p_order.id
  ) then
    update public.shop_products p
    set stock = p.stock + i.quantity
    from public.shop_order_items i
    where i.order_id = p_order.id
      and p.id = i.product_id;
  elsif p_order.product_id is not null then
    update public.shop_products
    set stock = stock + p_order.quantity
    where id = p_order.product_id;
  end if;

  update public.shop_orders
  set stock_reserved = false
  where id = p_order.id;
end;
$$;

-- ─── Panier multi-produits (une commande) ────────────────────────────────────

create or replace function public.create_shop_cart_order(
  p_lines jsonb,
  p_delivery_method text
)
returns public.shop_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_now timestamptz := now();
  v_order public.shop_orders%rowtype;
  v_line record;
  v_product public.shop_products%rowtype;
  v_total numeric(10, 2) := 0;
  v_qty_sum integer := 0;
  v_item_count integer := 0;
  v_sort integer := 0;
  v_first_product_id uuid;
  v_first_name text;
  v_first_image text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if public.has_role('admin') or public.has_role('staff') then
    raise exception 'client_only';
  end if;

  if p_delivery_method not in ('pickup', 'chronopost_24h') then
    raise exception 'invalid_delivery_method';
  end if;

  if p_lines is null
    or jsonb_typeof(p_lines) <> 'array'
    or jsonb_array_length(p_lines) = 0
  then
    raise exception 'empty_cart';
  end if;

  perform public.expire_shop_orders();

  create temporary table _cart_lines (
    product_id uuid primary key,
    quantity integer not null check (quantity > 0)
  ) on commit drop;

  insert into _cart_lines (product_id, quantity)
  select
    (elem->>'product_id')::uuid,
    sum(greatest(1, coalesce((elem->>'quantity')::integer, 1)))
  from jsonb_array_elements(p_lines) as elem
  where (elem->>'product_id') ~* '^[0-9a-f-]{36}$'
  group by (elem->>'product_id')::uuid;

  if not exists (select 1 from _cart_lines) then
    raise exception 'invalid_lines';
  end if;

  for v_line in select product_id, quantity from _cart_lines order by product_id
  loop
    if public.shop_product_has_active_order(v_uid, v_line.product_id) then
      raise exception 'active_order_exists';
    end if;
  end loop;

  for v_line in select product_id, quantity from _cart_lines order by product_id
  loop
    select *
      into v_product
    from public.shop_products
    where id = v_line.product_id
      and is_active = true
    for update;

    if not found then
      raise exception 'product_not_found';
    end if;

    if v_product.stock < v_line.quantity then
      raise exception 'insufficient_stock';
    end if;
  end loop;

  for v_line in select product_id, quantity from _cart_lines order by product_id
  loop
    update public.shop_products
    set stock = stock - v_line.quantity
    where id = v_line.product_id
      and stock >= v_line.quantity;

    if not found then
      raise exception 'insufficient_stock';
    end if;
  end loop;

  for v_line in select cl.product_id, cl.quantity
  from _cart_lines cl
  join public.shop_products p on p.id = cl.product_id
  order by cl.product_id
  loop
    select * into v_product from public.shop_products where id = v_line.product_id;

    v_total := v_total + (v_product.price_eur * v_line.quantity);
    v_qty_sum := v_qty_sum + v_line.quantity;
    v_item_count := v_item_count + 1;

    if v_first_product_id is null then
      v_first_product_id := v_line.product_id;
      v_first_name := v_product.name;
      v_first_image := v_product.image_url;
    end if;
  end loop;

  insert into public.shop_orders(
    profile_id,
    product_id,
    status,
    delivery_method,
    quantity,
    unit_price_eur,
    total_price_eur,
    product_name,
    product_image_url,
    expires_at,
    stock_reserved
  )
  values (
    v_uid,
    case when v_item_count = 1 then v_first_product_id else null end,
    'payment_pending',
    p_delivery_method,
    v_qty_sum,
    case when v_qty_sum > 0 then round(v_total / v_qty_sum, 2) else 0 end,
    v_total,
    case
      when v_item_count = 1 and v_qty_sum = 1 then v_first_name
      when v_item_count = 1 then v_first_name || ' × ' || v_qty_sum::text
      else public.shop_order_summary_name(v_item_count)
    end,
    case when v_item_count = 1 then v_first_image else null end,
    v_now + interval '6 hours',
    true
  )
  returning * into v_order;

  for v_line in select cl.product_id, cl.quantity
  from _cart_lines cl
  join public.shop_products p on p.id = cl.product_id
  order by cl.product_id
  loop
    select * into v_product from public.shop_products where id = v_line.product_id;

    insert into public.shop_order_items(
      order_id,
      product_id,
      product_name,
      product_image_url,
      unit_price_eur,
      quantity,
      line_total_eur,
      sort_order
    )
    values (
      v_order.id,
      v_line.product_id,
      v_product.name,
      v_product.image_url,
      v_product.price_eur,
      v_line.quantity,
      v_product.price_eur * v_line.quantity,
      v_sort
    );

    v_sort := v_sort + 1;
  end loop;

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
    'shop_order_payment_pending',
    'shop_order',
    v_order.id,
    jsonb_build_object(
      'order_id', v_order.id,
      'delivery_method', p_delivery_method,
      'item_count', v_item_count,
      'total_price_eur', v_total,
      'status', v_order.status
    )
  );

  return v_order;
end;
$$;

-- ─── Commande mono-produit (compat + ligne) ──────────────────────────────────

create or replace function public.create_shop_order(
  p_product_id uuid,
  p_delivery_method text,
  p_quantity integer default 1
)
returns public.shop_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_product public.shop_products%rowtype;
  v_order public.shop_orders%rowtype;
  v_now timestamptz := now();
  v_qty integer;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if public.has_role('admin') or public.has_role('staff') then
    raise exception 'client_only';
  end if;

  if p_delivery_method not in ('pickup', 'chronopost_24h') then
    raise exception 'invalid_delivery_method';
  end if;

  v_qty := coalesce(p_quantity, 1);
  if v_qty < 1 then
    raise exception 'invalid_quantity';
  end if;

  perform public.expire_shop_orders();

  if public.shop_product_has_active_order(v_uid, p_product_id) then
    raise exception 'active_order_exists';
  end if;

  select *
    into v_product
  from public.shop_products
  where id = p_product_id
    and is_active = true
  for update;

  if not found then
    raise exception 'product_not_found';
  end if;

  if v_product.stock < v_qty then
    raise exception 'insufficient_stock';
  end if;

  update public.shop_products
  set stock = stock - v_qty
  where id = p_product_id
    and stock >= v_qty;

  if not found then
    raise exception 'insufficient_stock';
  end if;

  insert into public.shop_orders(
    profile_id,
    product_id,
    status,
    delivery_method,
    quantity,
    unit_price_eur,
    total_price_eur,
    product_name,
    product_image_url,
    expires_at,
    stock_reserved
  )
  values (
    v_uid,
    p_product_id,
    'payment_pending',
    p_delivery_method,
    v_qty,
    v_product.price_eur,
    v_product.price_eur * v_qty,
    case when v_qty > 1 then v_product.name || ' × ' || v_qty::text else v_product.name end,
    v_product.image_url,
    v_now + interval '6 hours',
    true
  )
  returning * into v_order;

  insert into public.shop_order_items(
    order_id,
    product_id,
    product_name,
    product_image_url,
    unit_price_eur,
    quantity,
    line_total_eur,
    sort_order
  )
  values (
    v_order.id,
    p_product_id,
    v_product.name,
    v_product.image_url,
    v_product.price_eur,
    v_qty,
    v_product.price_eur * v_qty,
    0
  );

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
    'shop_order_payment_pending',
    'shop_order',
    v_order.id,
    jsonb_build_object(
      'order_id', v_order.id,
      'product_id', v_order.product_id,
      'delivery_method', p_delivery_method,
      'quantity', v_qty,
      'status', v_order.status
    )
  );

  return v_order;
end;
$$;

-- ─── Admin : suivi colis ─────────────────────────────────────────────────────

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

revoke all on function public.shop_product_has_active_order(uuid, uuid) from public, anon;
revoke all on function public.create_shop_cart_order(jsonb, text) from public, anon;

grant execute on function public.shop_product_has_active_order(uuid, uuid) to authenticated, service_role;
grant execute on function public.create_shop_cart_order(jsonb, text) to authenticated;

revoke all on function public.admin_update_shop_order_status(uuid, text, text) from public, anon;
grant execute on function public.admin_update_shop_order_status(uuid, text, text, text) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.shop_order_items;
exception
  when duplicate_object then null;
end $$;

commit;
