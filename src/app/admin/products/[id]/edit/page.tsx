import { supabaseAdmin } from "@/lib/supabase/admin";
import ProductFormClient from "@/components/admin/ProductFormClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [
    { data: product },
    { data: categories },
    { data: subcategories },
    { data: brands },
    { data: attributes },
  ] = await Promise.all([
    supabaseAdmin
      .from("product")
      .select(
        `
        *,
        images:product_image(*),
        attributes:product_attribute(
          attribute_id,
          attribute:attribute(id, name, type, slug, is_featured, values:attribute_value(id, attribute_id, value, image_url))
        ),
        variations:product_variation(
          id, price, img_url, stock_status,
          options:variation_option(
            attribute_value_id,
            attribute_value:attribute_value(id, value, attribute_id)
          )
        )
        `
      )
      .eq("id", id)
      .single(),
    supabaseAdmin.from("category").select("id, name, img").order("name"),
    supabaseAdmin.from("sub_category").select("id, name, category_id").order("name"),
    supabaseAdmin.from("brand").select("id, name").order("name"),
    supabaseAdmin
      .from("attribute")
      .select("id, name, slug, type, is_featured, values:attribute_value(id, attribute_id, value, image_url)")
      .order("name"),
  ]);

  if (!product) notFound();

  return (
    <ProductFormClient
      product={product as any}
      categories={categories ?? []}
      subcategories={subcategories ?? []}
      brands={brands ?? []}
      attributes={(attributes ?? []) as any}
    />
  );
}
