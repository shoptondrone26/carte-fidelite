-- Carnet admin : annuler la dernière commande même si terminée (contre-écriture compta).

begin;

create or replace function public.admin_cancel_latest_shop_order(p_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_order public.shop_orders%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null or not public.has_role('admin') then
    raise exception 'forbidden';
  end if;

  if p_profile_id is null then
    raise exception 'invalid_profile';
  end if;

  perform public.expire_shop_orders();

  select *
    into v_order
  from public.shop_orders
  where profile_id = p_profile_id
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'already_cancelled';
  end if;

  if v_order.status not in (
    'payment_pending',
    'paid',
    'preparing',
    'shipped',
    'completed'
  ) then
    raise exception 'not_cancellable';
  end if;

  perform public.admin_update_shop_order_status(v_order.id, 'cancelled', null);

  return v_order.id;
end;
$$;

commit;
