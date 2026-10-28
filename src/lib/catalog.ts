import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Variant {
  id: string;
  product_id: string;
  option_id: string | null;
  name: string;
  duration_days: number | null;
  price: number;
  stock: number;
  is_active: boolean;
  sort_order: number;
}
export interface Option {
  id: string;
  product_id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}
export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  short_description: string;
  description: string;
  tile_color: string;
  image_path: string | null;
  is_active: boolean;
  is_demo: boolean;
  sort_order: number;
  product_options: Option[];
  product_variants: Variant[];
}

const SELECT = "*, product_options(*), product_variants(*)";

function normalize(p: Product): Product {
  return {
    ...p,
    product_options: [...(p.product_options ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    product_variants: [...(p.product_variants ?? [])]
      .filter(v => v.is_active && (!v.option_id || p.product_options?.some(o => o.id === v.option_id && o.is_active)))
      .map((v) => ({ ...v, price: Number(v.price) }))
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select(SELECT)
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return (data as unknown as Product[]).map(normalize);
  },
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select(SELECT).eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data ? normalize(data as unknown as Product) : null;
    },
  });

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
    if (error) throw error;
    return data;
  },
});

export const useSettings = () => useQuery(settingsQuery);

export function minPrice(p: Product): number | null {
  const prices = p.product_variants.filter((v) => v.is_active).map((v) => v.price);
  return prices.length ? Math.min(...prices) : null;
}
export function totalStock(p: Product): number {
  return p.product_variants.filter((v) => v.is_active).reduce((s, v) => s + v.stock, 0);
}

export function useProductImage(path: string | null | undefined) {
  return useQuery({
    queryKey: ["img", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 50,
    queryFn: async () => {
      if (!path) return null;
      const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24);
      return data?.signedUrl ?? null;
    },
  });
}
