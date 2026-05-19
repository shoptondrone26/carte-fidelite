-- Commandes boutique : demande manuelle, réservation stock 6h, workflow admin.

begin;

create table public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.shop_products (id) on delete restrict,
  status text not null default 'payment_pending',
  delivery_method text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_eur numeric(10, 2) not null check (unit_price_eur >= 0),
  total_price_eur numeric(10, 2) not null check (total_price_eur >= 0),
  product_name text not null,
  product_image_url text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  paid_at timestamptz,
  preparing_at timestamptz,
  shipped_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  refused_at timestamptz,
  expired_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,
  stock_reserved boolean not null default true,
  constraint shop_orders_status_check check (
    status in (
      'payment_pending',
      'paid',
      'preparing',
      'shipped',
      'completed',
      'refused',
      'cancelled',
      'expired'
    )
  ),
  constraint shop_orders_delivery_check check (
    delivery_method in ('pickup', 'chronopost_24h')
  )
);

create index shop_orders_profile_created_idx
  on public.shop_orders (profile_id, created_at desc);

create index shop_orders_admin_queue_idx
  on public.shop_orders (status, created_at desc)
  where status in ('payment_pending', 'paid', 'preparing', 'shipped');

create index shop_orders_expires_idx
  on public.shop_orders (expires_at)
  where status = 'payment_pending';

create trigger shop_orders_set_updated_at
  before update on public.shop_orders
  for each row execute function public.set_updated_at();

alter table public.shop_orders enable row level security;

drop policy if exists shop_orders_select_own_or_admin on public.shop_orders;
create policy shop_orders_select_own_or_admin
  on public.shop_orders
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or public.has_role('admin')
    or public.has_role('staff')
  );

revoke all on public.shop_orders from public, anon;
grant select on public.shop_orders to authenticated;
grant all on public.shop_orders to service_role;

create or replace function public.shop_order_history_event_for_status(p_status text)
returns text
language sql
stable
set search_path = public
as $$
  select case p_status
    when 'payment_pending' then 'shop_order_payment_pending'
    when 'paid' then 'shop_order_paid'
    when 'preparing' then 'shop_order_preparing'
    when 'shipped' then 'shop_order_shipped'
    when 'completed' then 'shop_order_completed'
    when 'refused' then 'shop_order_refused'
    when 'cancelled' then 'shop_order_cancelled'
    when 'expired' then 'shop_order_expired'
    else null
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

  update public.shop_products
  set stock = stock + p_order.quantity
  where id = p_order.product_id;

  update public.shop_orders
  set stock_reserved = false
  where id = p_order.id;
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
    for update
  loop
    update public.shop_orders
    set
      status = 'expired',
      expired_at = coalesce(expired_at, now()),
      handled_by = coalesce(handled_by, v_order.handled_by)
    where id = v_order.id;

    perform public.release_shop_order_stock(v_order);

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

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.create_shop_order(
  p_product_id uuid,
  p_delivery_method text
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

  if v_product.stock < 1 then
    raise exception 'insufficient_stock';
  end if;

  update public.shop_products
  set stock = stock - 1
  where id = p_product_id
    and stock >= 1;

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
    1,
    v_product.price_eur,
    v_product.price_eur,
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
      'status', v_order.status
    )
  );

  return v_order;
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

  perform public.release_shop_order_stock(v_order);

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
  v_now timestamptz := now();
  v_event_type text;
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

  if v_order.status in ('completed', 'refused', 'cancelled', 'expired') then
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

  if p_status = 'cancelled' and v_order.status not in ('payment_pending', 'paid', 'preparing', 'shipped') then
    raise exception 'invalid_transition';
  end if;

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
  where id = p_order_id;

  if p_status in ('refused', 'cancelled') and v_order.status = 'payment_pending' then
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
        'status', p_status
      )
    );
  end if;
end;
$$;

revoke all on function public.expire_shop_orders() from public, anon;
revoke all on function public.release_shop_order_stock(public.shop_orders) from public, anon;
revoke all on function public.create_shop_order(uuid, text) from public, anon;
revoke all on function public.cancel_shop_order(uuid) from public, anon;
revoke all on function public.admin_update_shop_order_status(uuid, text, text) from public, anon;

grant execute on function public.expire_shop_orders() to authenticated, service_role;
grant execute on function public.create_shop_order(uuid, text) to authenticated;
grant execute on function public.cancel_shop_order(uuid) to authenticated;
grant execute on function public.admin_update_shop_order_status(uuid, text, text) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.shop_orders;
exception
  when duplicate_object then null;
end $$;

commit;
