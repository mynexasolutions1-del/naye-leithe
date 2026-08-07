import { supabaseAdmin } from "@/lib/supabase/admin";
import CategoriesClient from "@/components/admin/CategoriesClient";
import type { Category, SubCategory } from "@/types/db";

export const dynamic = "force-dynamic";

type CategoryWithSubs = Category & { subcategories: SubCategory[] };

export default async function AdminCategoriesPage() {
  const { data: categories } = await supabaseAdmin
    .from("category")
    .select("*, subcategories:sub_category(*)")
    .order("name");

  const catIds = (categories ?? []).map((c) => c.id);
  const { data: productCounts } = catIds.length
    ? await supabaseAdmin.from("product").select("category_id").in("category_id", catIds)
    : { data: [] };

  const countMap: Record<number, number> = {};
  (productCounts ?? []).forEach((p: any) => { countMap[p.category_id] = (countMap[p.category_id] ?? 0) + 1; });

  return (
    <CategoriesClient
      categories={(categories ?? []) as CategoryWithSubs[]}
      countMap={countMap}
    />
  );
}
