-- Corrige le calcul des frais quand payment_method = paysafecard (sans montant saisi).

begin;

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
begin
  v_subtotal := round(greatest(coalesce(p_subtotal, 0), 0)::numeric, 2);

  if p_delivery_method = 'pickup' then
    return query
    select v_subtotal, 'wire_transfer'::text, 0::numeric, 0::numeric, v_subtotal;
    return;
  end if;

  if coalesce(p_payment_method, 'wire_transfer') = 'wire_transfer' then
    return query
    select v_subtotal, 'wire_transfer'::text, 0::numeric, 0::numeric, v_subtotal;
    return;
  end if;

  if p_payment_method = 'paysafecard' then
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

  v_psc := round(greatest(coalesce(p_psc_amount, 0), 0)::numeric, 2);

  if v_psc <= 0 then
    return query
    select v_subtotal, 'wire_transfer'::text, 0::numeric, 0::numeric, v_subtotal;
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

commit;
