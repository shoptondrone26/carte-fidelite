-- Permettre une quantité > 1 par commande (panier client, une commande par produit).

drop function if exists public.create_shop_order(uuid, text);

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

  if exists (
    select 1
    from public.shop_orders so
    where so.profile_id = v_uid
      and so.product_id = p_product_id
      and so.status in ('payment_pending', 'paid', 'preparing', 'shipped')
  ) then
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
    v_product.name,
    v_product.image_url,
    v_now + interval '6 hours',
    true
  )
  returning * into v_order;

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

revoke all on function public.create_shop_order(uuid, text, integer) from public, anon;

grant execute on function public.create_shop_order(uuid, text, integer) to authenticated;
