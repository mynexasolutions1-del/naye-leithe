import { supabaseAdmin } from "@/lib/supabase/admin";
import ProductFormClient from "@/components/admin/ProductFormClient";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [
    { data: categories },
    { data: subcategories },
    { data: brands },
    { data: attributes },
  ] = await Promise.all([
    supabaseAdmin.from("category").select("id, name, img").order("name"),
    supabaseAdmin.from("sub_category").select("id, name, category_id").order("name"),
    supabaseAdmin.from("brand").select("id, name").order("name"),
    supabaseAdmin
      .from("attribute")
      .select("id, name, slug, type, is_featured, values:attribute_value(id, attribute_id, value, image_url)")
      .order("name"),
  ]);

  return (
    <ProductFormClient
      categories={categories ?? []}
      subcategories={subcategories ?? []}
      brands={brands ?? []}
      attributes={(attributes ?? []) as any}
    />
  );
}
