-- Catalogue boutique : produits + stockage images (fondation, sans commandes).

create table public.shop_products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 1),
  description text,
  price_eur numeric(10, 2) not null check (price_eur >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  category text not null default 'general' check (char_length(trim(category)) >= 1),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shop_products_catalog_idx
  on public.shop_products (is_active, category, sort_order, created_at desc);

create index shop_products_admin_idx
  on public.shop_products (updated_at desc);

comment on table public.shop_products is
  'Catalogue boutique membre. Commandes et paiement : évolutions futures.';

create trigger shop_products_set_updated_at
  before update on public.shop_products
  for each row execute function public.set_updated_at();

alter table public.shop_products enable row level security;

drop policy if exists shop_products_select_catalog on public.shop_products;
create policy shop_products_select_catalog
  on public.shop_products
  for select
  to authenticated
  using (is_active = true or public.has_role('admin'));

drop policy if exists shop_products_insert_admin on public.shop_products;
create policy shop_products_insert_admin
  on public.shop_products
  for insert
  to authenticated
  with check (public.has_role('admin'));

drop policy if exists shop_products_update_admin on public.shop_products;
create policy shop_products_update_admin
  on public.shop_products
  for update
  to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

drop policy if exists shop_products_delete_admin on public.shop_products;
create policy shop_products_delete_admin
  on public.shop_products
  for delete
  to authenticated
  using (public.has_role('admin'));

grant select, insert, update, delete on public.shop_products to authenticated;

-- Bucket images produits (lecture publique pour affichage catalogue).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-products',
  'shop-products',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists shop_products_storage_select on storage.objects;
create policy shop_products_storage_select
  on storage.objects
  for select
  to public
  using (bucket_id = 'shop-products');

drop policy if exists shop_products_storage_insert_admin on storage.objects;
create policy shop_products_storage_insert_admin
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'shop-products'
    and public.has_role('admin')
  );

drop policy if exists shop_products_storage_update_admin on storage.objects;
create policy shop_products_storage_update_admin
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'shop-products' and public.has_role('admin'))
  with check (bucket_id = 'shop-products' and public.has_role('admin'));

drop policy if exists shop_products_storage_delete_admin on storage.objects;
create policy shop_products_storage_delete_admin
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'shop-products' and public.has_role('admin'));

do $$
begin
  alter publication supabase_realtime add table public.shop_products;
exception
  when duplicate_object then null;
end $$;
