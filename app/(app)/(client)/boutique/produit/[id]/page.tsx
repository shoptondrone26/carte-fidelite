import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/client/boutique/product-detail-view";
import { fetchRecommendedProducts } from "@/lib/boutique/recommendations";
import { fetchCatalogProductById } from "@/lib/boutique/products";
import { requireClient } from "@/lib/client/require-client";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { supabase } = await requireClient("/boutique");
  const product = await fetchCatalogProductById(supabase, id);
  if (!product) return { title: "Produit" };
  return {
    title: product.name,
    description:
      product.short_description ?? product.description ?? undefined,
  };
}

export default async function BoutiqueProductPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await requireClient("/boutique");

  const product = await fetchCatalogProductById(supabase, id);
  if (!product) notFound();

  const recommendations = await fetchRecommendedProducts(supabase, id);

  return (
    <ProductDetailView product={product} recommendations={recommendations} />
  );
}
