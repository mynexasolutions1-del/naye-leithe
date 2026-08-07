import { supabaseAdmin } from "@/lib/supabase/admin";
import ProductsClient from "@/components/admin/ProductsClient";
import type { Category } from "@/types/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1", 10);
  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  let query = supabaseAdmin
    .from("product")
    .select(
      `*,
       attributes:product_attribute(
         attribute_id,
         attribute:attribute(id, name)
       ),
       variations:product_variation(
         id,
         options:variation_option(
           attribute_value_id,
           attribute_value:attribute_value(id, value, attribute_id)
         )
       )`,
      { count: "exact" }
    )
    .order("name");

  if (sp.category) query = query.eq("cat_name", sp.category);
  if (sp.status)   query = query.eq("stock_status", sp.status);

  const { data: products, count } = await query.range(from, to);
  const { data: categories } = await supabaseAdmin
    .from("category")
    .select("id, name")
    .order("name");

  return (
    <ProductsClient
      products={(products ?? []) as any[]}
      categories={(categories ?? []) as Category[]}
      totalCount={count ?? 0}
      currentPage={page}
      totalPages={Math.ceil((count ?? 0) / PAGE_SIZE)}
      currentFilters={{
        category: sp.category ?? "",
        status: sp.status ?? "",
      }}
    />
  );
}
