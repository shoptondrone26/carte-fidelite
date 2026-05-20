-- Frais paiement Chronopost (Paysafecard 5 %) + sous-total produits.

begin;

alter table public.shop_orders
  add column if not exists subtotal_eur numeric(10, 2),
  add column if not exists payment_method text,
  add column if not exists psc_amount_eur numeric(10, 2) not null default 0,
  add column if not exists payment_fee_eur numeric(10, 2) not null default 0;

update public.shop_orders
set
  subtotal_eur = coalesce(subtotal_eur, total_price_eur),
  payment_method = coalesce(payment_method, 'wire_transfer'),
  psc_amount_eur = coalesce(psc_amount_eur, 0),
  payment_fee_eur = coalesce(payment_fee_eur, 0)
where subtotal_eur is null or payment_method is null;

alter table public.shop_orders
  alter column subtotal_eur set not null,
  alter column payment_method set not null,
  alter column payment_method set default 'wire_transfer';

alter table public.shop_orders
  drop constraint if exists shop_orders_payment_method_check;

alter table public.shop_orders
  add constraint shop_orders_payment_method_check check (
    payment_method in ('wire_transfer', 'paysafecard', 'mixed')
  );

alter table public.shop_orders
  drop constraint if exists shop_orders_psc_amount_check;

alter table public.shop_orders
  add constraint shop_orders_psc_amount_check check (psc_amount_eur >= 0);

alter table public.shop_orders
  drop constraint if exists shop_orders_payment_fee_check;

alter table public.shop_orders
  add constraint shop_orders_payment_fee_check check (payment_fee_eur >= 0);

create or replace function public.compute_shop_payment_totals(
  p_subtotal numeric,
  p_delivery_method text,
  p_payment_method text,
  p_psc_amount numeric default 0
)
returns table (
  subtotal_eur numeric,
  payment_method text,
  psc_amount_eur numeric,
  payment_fee_eur numeric,
  total_price_eur numeric
)
language plpgsql
immutable
as $$
declare
  v_subtotal numeric(10, 2);
  v_psc numeric(10, 2);
  v_fee numeric(10, 2);
  v_method text;
begin
  v_subtotal := round(greatest(coalesce(p_subtotal, 0), 0)::numeric, 2);

  if p_delivery_method = 'pickup' then
    return query
    select v_subtotal, 'wire_transfer'::text, 0::numeric, 0::numeric, v_subtotal;
    return;
  end if;

  v_psc := round(greatest(coalesce(p_psc_amount, 0), 0)::numeric, 2);

  if coalesce(p_payment_method, 'wire_transfer') = 'wire_transfer' or v_psc <= 0 then
    return query
    select v_subtotal, 'wire_transfer'::text, 0::numeric, 0::numeric, v_subtotal;
    return;
  end if;

  if p_payment_method = 'paysafecard' or v_psc >= v_subtotal then
    v_fee := round(v_subtotal * 0.05, 2);
    return query
    select
      v_subtotal,
      'paysafecard'::text,
      v_subtotal,
      v_fee,
      round(v_subtotal + v_fee, 2);
    return;
  end if;

  v_psc := least(v_psc, v_subtotal);
  v_fee := round(v_psc * 0.05, 2);
  return query
  select
    v_subtotal,
    'mixed'::text,
    v_psc,
    v_fee,
    round(v_subtotal + v_fee, 2);
end;
$$;

create or replace function public.create_shop_cart_order(
  p_lines jsonb,
  p_delivery_method text,
  p_payment_method text default 'wire_transfer',
  p_psc_amount_eur numeric default 0
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
  v_subtotal numeric(10, 2) := 0;
  v_qty_sum integer := 0;
  v_item_count integer := 0;
  v_sort integer := 0;
  v_first_product_id uuid;
  v_first_name text;
  v_first_image text;
  v_pay record;
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

    v_subtotal := v_subtotal + (v_product.price_eur * v_line.quantity);
    v_qty_sum := v_qty_sum + v_line.quantity;
    v_item_count := v_item_count + 1;

    if v_first_product_id is null then
      v_first_product_id := v_line.product_id;
      v_first_name := v_product.name;
      v_first_image := v_product.image_url;
    end if;
  end loop;

  select *
    into v_pay
  from public.compute_shop_payment_totals(
    v_subtotal,
    p_delivery_method,
    coalesce(p_payment_method, 'wire_transfer'),
    coalesce(p_psc_amount_eur, 0)
  );

  insert into public.shop_orders(
    profile_id,
    product_id,
    status,
    delivery_method,
    quantity,
    unit_price_eur,
    subtotal_eur,
    payment_method,
    psc_amount_eur,
    payment_fee_eur,
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
    case when v_qty_sum > 0 then round(v_subtotal / v_qty_sum, 2) else 0 end,
    v_pay.subtotal_eur,
    v_pay.payment_method,
    v_pay.psc_amount_eur,
    v_pay.payment_fee_eur,
    v_pay.total_price_eur,
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
      'payment_method', v_pay.payment_method,
      'psc_amount_eur', v_pay.psc_amount_eur,
      'payment_fee_eur', v_pay.payment_fee_eur,
      'subtotal_eur', v_pay.subtotal_eur,
      'item_count', v_item_count,
      'total_price_eur', v_pay.total_price_eur,
      'status', v_order.status
    )
  );

  return v_order;
end;
$$;

grant execute on function public.compute_shop_payment_totals(numeric, text, text, numeric) to authenticated;

-- Commande mono-produit (legacy sheet) avec frais PSC
create or replace function public.create_shop_order(
  p_product_id uuid,
  p_delivery_method text,
  p_quantity integer default 1,
  p_payment_method text default 'wire_transfer',
  p_psc_amount_eur numeric default 0
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
  v_subtotal numeric(10, 2);
  v_pay record;
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

  v_subtotal := v_product.price_eur * v_qty;

  select *
    into v_pay
  from public.compute_shop_payment_totals(
    v_subtotal,
    p_delivery_method,
    coalesce(p_payment_method, 'wire_transfer'),
    coalesce(p_psc_amount_eur, 0)
  );

  insert into public.shop_orders(
    profile_id,
    product_id,
    status,
    delivery_method,
    quantity,
    unit_price_eur,
    subtotal_eur,
    payment_method,
    psc_amount_eur,
    payment_fee_eur,
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
    v_pay.subtotal_eur,
    v_pay.payment_method,
    v_pay.psc_amount_eur,
    v_pay.payment_fee_eur,
    v_pay.total_price_eur,
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
      'delivery_method', p_delivery_method,
      'payment_method', v_pay.payment_method,
      'psc_amount_eur', v_pay.psc_amount_eur,
      'payment_fee_eur', v_pay.payment_fee_eur,
      'subtotal_eur', v_pay.subtotal_eur,
      'total_price_eur', v_pay.total_price_eur,
      'status', v_order.status
    )
  );

  return v_order;
end;
$$;

commit;
