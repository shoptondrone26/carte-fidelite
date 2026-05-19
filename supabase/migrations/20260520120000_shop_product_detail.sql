-- Pages produit premium : galerie (3 photos), descriptions, specs, recommandations.

alter table public.shop_products
  add column if not exists short_description text,
  add column if not exists specs text,
  add column if not exists image_urls jsonb not null default '[]'::jsonb,
  add column if not exists primary_image_index smallint not null default 0;

comment on column public.shop_products.short_description is
  'Accroche catalogue (carte produit).';
comment on column public.shop_products.description is
  'Description complète (page produit).';
comment on column public.shop_products.specs is
  'Caractéristiques / détails (page produit, texte libre).';
comment on column public.shop_products.image_urls is
  'Jusqu’à 3 URLs publiques Storage ; image_url = photo principale (sync).';

update public.shop_products
set
  image_urls = case
    when image_url is not null and trim(image_url) <> '' then jsonb_build_array(image_url)
    else '[]'::jsonb
  end,
  short_description = coalesce(short_description, description)
where
  image_urls = '[]'::jsonb
  or image_urls is null;

alter table public.shop_products
  drop constraint if exists shop_products_image_urls_max;

alter table public.shop_products
  add constraint shop_products_image_urls_max check (
    jsonb_typeof(image_urls) = 'array'
    and jsonb_array_length(image_urls) <= 3
  );

alter table public.shop_products
  drop constraint if exists shop_products_primary_image_index_range;

alter table public.shop_products
  add constraint shop_products_primary_image_index_range check (
    primary_image_index >= 0
    and primary_image_index <= 2
  );

create or replace function public.sync_shop_product_primary_image()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  urls jsonb;
  len int;
  idx int;
begin
  urls := coalesce(new.image_urls, '[]'::jsonb);
  len := jsonb_array_length(urls);
  if len > 0 then
    idx := greatest(0, least(coalesce(new.primary_image_index, 0), len - 1));
    new.primary_image_index := idx;
    new.image_url := urls ->> idx;
  else
    new.primary_image_index := 0;
    new.image_url := null;
  end if;
  return new;
end;
$$;

drop trigger if exists shop_products_sync_primary_image on public.shop_products;

create trigger shop_products_sync_primary_image
  before insert or update of image_urls, primary_image_index
  on public.shop_products
  for each row
  execute function public.sync_shop_product_primary_image();

-- Recommandations « souvent acheté avec »
create table if not exists public.shop_product_recommendations (
  product_id uuid not null references public.shop_products (id) on delete cascade,
  recommended_product_id uuid not null references public.shop_products (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (product_id, recommended_product_id),
  check (product_id <> recommended_product_id)
);

create index if not exists shop_product_recommendations_product_idx
  on public.shop_product_recommendations (product_id, sort_order);

alter table public.shop_product_recommendations enable row level security;

drop policy if exists shop_product_recommendations_select on public.shop_product_recommendations;

create policy shop_product_recommendations_select
  on public.shop_product_recommendations
  for select
  to authenticated
  using (
    public.has_role('admin')
    or exists (
      select 1
      from public.shop_products p
      where
        p.id = product_id
        and p.is_active = true
    )
  );

drop policy if exists shop_product_recommendations_insert_admin on public.shop_product_recommendations;

create policy shop_product_recommendations_insert_admin
  on public.shop_product_recommendations
  for insert
  to authenticated
  with check (public.has_role('admin'));

drop policy if exists shop_product_recommendations_update_admin on public.shop_product_recommendations;

create policy shop_product_recommendations_update_admin
  on public.shop_product_recommendations
  for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

drop policy if exists shop_product_recommendations_delete_admin on public.shop_product_recommendations;

create policy shop_product_recommendations_delete_admin
  on public.shop_product_recommendations
  for delete
  to authenticated
  using (public.has_role('admin'));

grant select, insert, update, delete on public.shop_product_recommendations to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.shop_product_recommendations;
exception
  when duplicate_object then null;
end $$;
