"use server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadImageToCloudinary } from "@/lib/serverImageUpload";

/* ── Orders ──────────────────────────────────────────────────────────────── */
export async function updateOrderStatusAction(formData: FormData) {
  const orderId = formData.get("order_id") as string;
  const status  = formData.get("status") as string;
  await supabaseAdmin.from("order").update({ status }).eq("id", parseInt(orderId));
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?_flash=Order+status+updated&_type=success`);
}

export async function cancelOrderAction(formData: FormData) {
  const orderId = formData.get("order_id") as string;
  await supabaseAdmin
    .from("order")
    .update({ status: "Cancelled" })
    .eq("id", parseInt(orderId));
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?_flash=Order+cancelled&_type=info`);
}

// Permanently removes an order and its line items. This is what unblocks
// deleting a product that's only undeletable because it appears in this
// order — order_item -> product is NO ACTION, so as long as any order
// still references a product, that product can't be deleted (by design,
// so a live order never silently loses one of its line items). Deleting
// the order here first is the intended way around that.
export async function deleteOrderAction(formData: FormData) {
  const orderId = parseInt(formData.get("order_id") as string);
  await supabaseAdmin.from("order_item").delete().eq("order_id", orderId);
  const { error } = await supabaseAdmin.from("order").delete().eq("id", orderId);
  if (error) {
    redirect(`/admin/orders?_flash=${encodeURIComponent(error.message)}&_type=error`);
  }
  revalidatePath("/admin/orders");
  redirect("/admin/orders?_flash=Order+deleted&_type=success");
}

/* ── Reviews ─────────────────────────────────────────────────────────────── */
export async function approveReviewAction(formData: FormData) {
  const id = formData.get("review_id") as string;
  await supabaseAdmin.from("review").update({ status: "Approved" }).eq("id", parseInt(id));
  revalidatePath("/admin/reviews");
  redirect("/admin/reviews?_flash=Review+approved&_type=success");
}

export async function rejectReviewAction(formData: FormData) {
  const id = formData.get("review_id") as string;
  await supabaseAdmin.from("review").update({ status: "Rejected" }).eq("id", parseInt(id));
  revalidatePath("/admin/reviews");
  redirect("/admin/reviews?_flash=Review+rejected&_type=info");
}

export async function deleteReviewAction(formData: FormData) {
  const id = formData.get("review_id") as string;
  await supabaseAdmin.from("review").delete().eq("id", parseInt(id));
  revalidatePath("/admin/reviews");
  redirect("/admin/reviews?_flash=Review+deleted&_type=success");
}

export async function toggleFeaturedReviewAction(formData: FormData) {
  const id       = formData.get("review_id") as string;
  const current  = formData.get("featured") === "true";
  await supabaseAdmin.from("review").update({ is_featured: !current }).eq("id", parseInt(id));
  revalidatePath("/admin/reviews");
  redirect("/admin/reviews?_flash=Review+updated&_type=success");
}

/* ── Categories ──────────────────────────────────────────────────────────── */
export interface CategoryFormData {
  name: string;
  img?: string | null;
}

export async function createCategoryAction(
  data: CategoryFormData
): Promise<{ success: boolean; error?: string }> {
  const name = data.name?.trim();
  if (!name) return { success: false, error: "Name is required" };
  const { error } = await supabaseAdmin.from("category").insert({ name, img: data.img || null });
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateCategoryAction(
  id: number,
  data: CategoryFormData
): Promise<{ success: boolean; error?: string }> {
  const name = data.name?.trim();
  if (!name) return { success: false, error: "Name is required" };
  const { error } = await supabaseAdmin
    .from("category")
    .update({ name, img: data.img || null })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function deleteCategoryAction(formData: FormData) {
  const id = parseInt(formData.get("category_id") as string);

  // category is referenced by product.category_id and sub_category.category_id
  // with NO ACTION on delete, so Postgres would reject the delete outright
  // while either exists. Rather than block the admin from deleting a
  // category (per product decision: category deletion should always
  // succeed), unassign it from anything pointing at it first — products
  // become category-less, subcategories can't exist without a parent so
  // they're removed too (which in turn un-assigns any product that was
  // sitting in one of them).
  const { data: subs } = await supabaseAdmin
    .from("sub_category")
    .select("id")
    .eq("category_id", id);
  const subIds = (subs ?? []).map((s) => s.id);

  await supabaseAdmin
    .from("product")
    .update({ category_id: null, sub_category_id: null, cat_name: null })
    .eq("category_id", id);

  if (subIds.length > 0) {
    // Catches products whose sub_category_id points into this category's
    // subcategories even if their own category_id somehow drifted.
    await supabaseAdmin
      .from("product")
      .update({ sub_category_id: null })
      .in("sub_category_id", subIds);
    await supabaseAdmin.from("sub_category").delete().in("id", subIds);
  }

  const { error } = await supabaseAdmin.from("category").delete().eq("id", id);
  if (error) {
    redirect(`/admin/categories?_flash=${encodeURIComponent(error.message)}&_type=error`);
  }
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  redirect("/admin/categories?_flash=Category+deleted&_type=success");
}

export interface SubcategoryFormData {
  category_id: number;
  name: string;
  img?: string | null;
}

export async function createSubcategoryAction(
  data: SubcategoryFormData
): Promise<{ success: boolean; error?: string }> {
  const name = data.name?.trim();
  if (!name) return { success: false, error: "Name is required" };
  const { error } = await supabaseAdmin
    .from("sub_category")
    .insert({ name, category_id: data.category_id, img: data.img || null });
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateSubcategoryAction(
  id: number,
  data: SubcategoryFormData
): Promise<{ success: boolean; error?: string }> {
  const name = data.name?.trim();
  if (!name) return { success: false, error: "Name is required" };
  const { error } = await supabaseAdmin
    .from("sub_category")
    .update({ name, category_id: data.category_id, img: data.img || null })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteSubcategoryAction(formData: FormData) {
  const id = parseInt(formData.get("sub_id") as string);

  // product.sub_category_id -> sub_category.id is NO ACTION on delete.
  // Same product decision as categories: deleting a subcategory always
  // succeeds, products just lose that assignment (they keep their
  // category_id — only the more specific subcategory goes away).
  await supabaseAdmin.from("product").update({ sub_category_id: null }).eq("sub_category_id", id);

  const { error } = await supabaseAdmin.from("sub_category").delete().eq("id", id);
  if (error) {
    redirect(`/admin/categories?_flash=${encodeURIComponent(error.message)}&_type=error`);
  }
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  redirect("/admin/categories?_flash=Subcategory+deleted&_type=success");
}

/* ── Brands ──────────────────────────────────────────────────────────────── */
export async function createBrandAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) redirect("/admin/brands?_flash=Name+required&_type=error");
  const { error } = await supabaseAdmin.from("brand").insert({ name });
  if (error) redirect(`/admin/brands?_flash=${encodeURIComponent(error.message)}&_type=error`);
  revalidatePath("/admin/brands");
  redirect("/admin/brands?_flash=Brand+created&_type=success");
}

export async function deleteBrandAction(formData: FormData) {
  const id = formData.get("brand_id") as string;
  await supabaseAdmin.from("brand").delete().eq("id", parseInt(id));
  revalidatePath("/admin/brands");
  redirect("/admin/brands?_flash=Brand+deleted&_type=success");
}

/* ── Attributes ──────────────────────────────────────────────────────────── */
function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export interface AttributeFormData {
  name: string;
  slug?: string;
}

export async function createAttributeAction(
  data: AttributeFormData
): Promise<{ success: boolean; error?: string; id?: number }> {
  const name = data.name?.trim();
  if (!name) return { success: false, error: "Name is required" };
  const slug = data.slug?.trim() || slugify(name);

  const { data: row, error } = await supabaseAdmin
    .from("attribute")
    .insert({ name, slug, type: "select", is_featured: false })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/attributes");
  return { success: true, id: row?.id };
}

export async function updateAttributeAction(
  id: number,
  data: AttributeFormData
): Promise<{ success: boolean; error?: string }> {
  const name = data.name?.trim();
  if (!name) return { success: false, error: "Name is required" };
  const slug = data.slug?.trim() || slugify(name);

  const { error } = await supabaseAdmin.from("attribute").update({ name, slug }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/attributes");
  revalidatePath(`/admin/attributes/${id}`);
  return { success: true };
}

export async function deleteAttributeAction(formData: FormData) {
  const id = formData.get("attribute_id") as string;
  await supabaseAdmin.from("attribute").delete().eq("id", parseInt(id));
  revalidatePath("/admin/attributes");
  redirect("/admin/attributes?_flash=Attribute+deleted&_type=success");
}

export async function createAttributeValueAction(formData: FormData) {
  const attrId = formData.get("attribute_id") as string;
  const value  = (formData.get("value") as string)?.trim();
  if (!value) redirect(`/admin/attributes/${attrId}?_flash=Value+is+required&_type=error`);

  // Image is optional — this whole form still works with plain progressive
  // enhancement (no client JS) since the upload happens server-side here.
  let imageUrl: string | null = null;
  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    try {
      imageUrl = await uploadImageToCloudinary(file, "attributes");
    } catch (err: any) {
      redirect(`/admin/attributes/${attrId}?_flash=${encodeURIComponent("Image upload failed: " + (err.message ?? "unknown error"))}&_type=error`);
    }
  }

  const { error } = await supabaseAdmin
    .from("attribute_value")
    .insert({ attribute_id: parseInt(attrId), value, image_url: imageUrl });
  if (error) redirect(`/admin/attributes/${attrId}?_flash=${encodeURIComponent(error.message)}&_type=error`);

  revalidatePath(`/admin/attributes/${attrId}`);
  revalidatePath("/admin/attributes");
  redirect(`/admin/attributes/${attrId}?_flash=Value+added&_type=success`);
}

export async function updateAttributeValueImageAction(formData: FormData) {
  const valueId = formData.get("value_id") as string;
  const attrId  = formData.get("attribute_id") as string;
  const file    = formData.get("image") as File | null;

  if (!file || file.size === 0) {
    redirect(`/admin/attributes/${attrId}?_flash=Please+choose+an+image&_type=error`);
  }

  let imageUrl: string;
  try {
    imageUrl = await uploadImageToCloudinary(file, "attributes");
  } catch (err: any) {
    redirect(`/admin/attributes/${attrId}?_flash=${encodeURIComponent("Image upload failed: " + (err.message ?? "unknown error"))}&_type=error`);
  }

  const { error } = await supabaseAdmin
    .from("attribute_value")
    .update({ image_url: imageUrl })
    .eq("id", parseInt(valueId));
  if (error) redirect(`/admin/attributes/${attrId}?_flash=${encodeURIComponent(error.message)}&_type=error`);

  revalidatePath(`/admin/attributes/${attrId}`);
  revalidatePath("/admin/attributes");
  redirect(`/admin/attributes/${attrId}?_flash=Image+updated&_type=success`);
}

export async function deleteAttributeValueAction(formData: FormData) {
  const id = formData.get("value_id") as string;

  // Look up which attribute this value belongs to so we can redirect back
  // to its "Manage Values" page — the delete button only needs to carry
  // the value's own id, not the parent too.
  const { data: row } = await supabaseAdmin
    .from("attribute_value")
    .select("attribute_id")
    .eq("id", parseInt(id))
    .single();

  await supabaseAdmin.from("attribute_value").delete().eq("id", parseInt(id));
  revalidatePath("/admin/attributes");

  const attrId = row?.attribute_id;
  if (attrId) {
    revalidatePath(`/admin/attributes/${attrId}`);
    redirect(`/admin/attributes/${attrId}?_flash=Value+removed&_type=success`);
  }
  redirect("/admin/attributes?_flash=Value+removed&_type=success");
}

/* ── Contact Queries ─────────────────────────────────────────────────────── */
export async function toggleContactMessageStatusAction(formData: FormData) {
  const id      = formData.get("message_id") as string;
  const current = formData.get("status") as string;
  const next    = current === "New" ? "Read" : "New";
  await supabaseAdmin.from("contact_message").update({ status: next }).eq("id", parseInt(id));
  revalidatePath("/admin/queries");
  redirect(`/admin/queries?_flash=Marked+as+${next}&_type=success`);
}

export async function deleteContactMessageAction(formData: FormData) {
  const id = formData.get("message_id") as string;
  await supabaseAdmin.from("contact_message").delete().eq("id", parseInt(id));
  revalidatePath("/admin/queries");
  redirect("/admin/queries?_flash=Query+deleted&_type=success");
}

/* ── Coupons ─────────────────────────────────────────────────────────────── */
export async function createCouponAction(formData: FormData) {
  const code       = (formData.get("code") as string)?.toUpperCase().trim();
  const type       = formData.get("type") as string;
  const discount   = parseFloat(formData.get("discount") as string);
  const threshold  = parseFloat(formData.get("threshold") as string) || 0;
  const usageLimit = parseInt(formData.get("usage_limit") as string) || null;
  const expiry     = (formData.get("expiry_date") as string) || null;

  if (!code || !type || isNaN(discount)) {
    redirect("/admin/coupons?_flash=Code%2C+type+and+discount+are+required&_type=error");
  }

  const { error } = await supabaseAdmin.from("coupon").insert({
    code, type, discount, threshold, usage_limit: usageLimit, expiry_date: expiry, is_active: true,
  });
  if (error) redirect(`/admin/coupons?_flash=${encodeURIComponent(error.message)}&_type=error`);
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons?_flash=Coupon+created&_type=success");
}

export async function deleteCouponAction(formData: FormData) {
  const id = formData.get("coupon_id") as string;
  await supabaseAdmin.from("coupon").delete().eq("id", parseInt(id));
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons?_flash=Coupon+deleted&_type=success");
}

export async function toggleCouponAction(formData: FormData) {
  const id      = formData.get("coupon_id") as string;
  const current = formData.get("is_active") === "true";
  await supabaseAdmin.from("coupon").update({ is_active: !current }).eq("id", parseInt(id));
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons?_flash=Coupon+updated&_type=success");
}

/* ── Customers ───────────────────────────────────────────────────────────── */
export async function deleteCustomerAction(formData: FormData) {
  const id = formData.get("user_id") as string;
  await supabaseAdmin.from("user").delete().eq("id", parseInt(id));
  revalidatePath("/admin/customers");
  redirect("/admin/customers?_flash=Customer+deleted&_type=success");
}

/* ── Products ────────────────────────────────────────────────────────────── */
export async function deleteProductAction(formData: FormData) {
  const id = formData.get("product_id") as string;

  // product is referenced by order_item, product_image, product_attribute,
  // product_variation, and review. product_attribute/product_variation are
  // ON DELETE CASCADE so those clean themselves up, but product_image and
  // review are NO ACTION — since virtually every product has at least a
  // gallery image, the delete was failing on that constraint on every
  // single attempt. The failure was never checked (`await ...delete()`
  // ignored its `error`), so the UI redirected to a "Product deleted"
  // success toast regardless, while the row silently stayed put.
  //
  // order_item is left alone and blocks deletion outright — a product that
  // has actually been ordered shouldn't disappear from order history.
  const { count: orderCount } = await supabaseAdmin
    .from("order_item")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id);

  if ((orderCount ?? 0) > 0) {
    redirect(`/admin/products?_flash=${encodeURIComponent(`Can't delete — this product appears in ${orderCount} order${orderCount === 1 ? "" : "s"}. Mark it out of stock instead.`)}&_type=error`);
  }

  await Promise.all([
    supabaseAdmin.from("product_image").delete().eq("product_id", id),
    supabaseAdmin.from("review").delete().eq("product_id", id),
  ]);

  const { error } = await supabaseAdmin.from("product").delete().eq("id", id);
  if (error) {
    redirect(`/admin/products?_flash=${encodeURIComponent(error.message)}&_type=error`);
  }

  revalidatePath("/admin/products");
  redirect("/admin/products?_flash=Product+deleted&_type=success");
}

export interface ProductFormData {
  name: string;
  price: string;
  orig?: string;
  category_id?: number | null;
  sub_category_id?: number | null;
  brand_id?: number | null;
  cat_name?: string;
  badge?: string;
  product_type: string;
  stock_status: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  img: string;
  size_chart?: string;
  short_desc?: string;
  desc?: string;
  gallery: string[];
  attribute_ids: number[];
  attribute_values: Record<string, number[]>;
  variations: Array<{
    attr_options: Record<string, string>;
    price?: string;
    stock_status: string;
    img_url?: string;
  }>;
}

function formatPriceField(val?: string): string | null {
  if (!val) return null;
  const clean = val.replace("₹", "").trim();
  if (!clean) return null;
  return `₹${clean}`;
}

export async function createProductAction(
  data: ProductFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { v4: uuid } = await import("uuid");
    const id = uuid();

    const { error: productError } = await supabaseAdmin.from("product").insert({
      id,
      name: data.name,
      price: formatPriceField(data.price) ?? "₹0",
      orig: formatPriceField(data.orig),
      category_id: data.category_id || null,
      sub_category_id: data.sub_category_id || null,
      brand_id: data.brand_id || null,
      cat_name: data.cat_name || null,
      badge: data.badge || null,
      product_type: data.product_type || "simple",
      stock_status: data.stock_status || "instock",
      is_featured: data.is_featured ?? false,
      is_new_arrival: data.is_new_arrival ?? false,
      img: data.img,
      size_chart: data.size_chart || null,
      short_desc: data.short_desc || null,
      desc: data.desc || null,
    });

    if (productError) return { success: false, error: productError.message };

    // Gallery images, attributes, and variations are all independent of
    // each other (only variation_option rows depend on variation ids) —
    // batch-insert each group in one round-trip instead of one request per
    // row. A product with, say, 5 images + 3 attributes + 4 variations used
    // to mean 12+ sequential network calls just for this step alone.
    const galleryPromise = data.gallery.length > 0
      ? supabaseAdmin.from("product_image").insert(data.gallery.map((imgUrl) => ({ product_id: id, img_url: imgUrl })))
      : Promise.resolve(null);

    const attrsPromise = data.attribute_ids.length > 0
      ? supabaseAdmin.from("product_attribute").insert(data.attribute_ids.map((attrId) => ({ product_id: id, attribute_id: attrId })))
      : Promise.resolve(null);

    const variationsPromise = data.variations.length > 0
      ? supabaseAdmin
          .from("product_variation")
          .insert(
            data.variations.map((v) => ({
              product_id: id,
              price: formatPriceField(v.price),
              stock_status: v.stock_status || "instock",
              img_url: v.img_url || null,
            }))
          )
          .select("id")
      : Promise.resolve({ data: null });

    const [, , variationsResult] = await Promise.all([galleryPromise, attrsPromise, variationsPromise]);

    if (variationsResult && variationsResult.data) {
      const newVars = variationsResult.data as { id: number }[];
      // Insert order is preserved by PostgREST for a single insert call, so
      // newVars[i] corresponds to data.variations[i].
      const optionRows = newVars.flatMap((v, i) =>
        Object.values(data.variations[i].attr_options).map((valueId) => ({
          variation_id: v.id,
          attribute_value_id: Number(valueId),
        }))
      );
      if (optionRows.length > 0) {
        await supabaseAdmin.from("variation_option").insert(optionRows);
      }
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Unknown error" };
  }
}

export async function updateProductAction(
  productId: string,
  data: ProductFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: updateError } = await supabaseAdmin
      .from("product")
      .update({
        name: data.name,
        price: formatPriceField(data.price) ?? "₹0",
        orig: formatPriceField(data.orig),
        category_id: data.category_id || null,
        sub_category_id: data.sub_category_id || null,
        brand_id: data.brand_id || null,
        cat_name: data.cat_name || null,
        badge: data.badge || null,
        product_type: data.product_type || "simple",
        stock_status: data.stock_status || "instock",
        is_featured: data.is_featured ?? false,
        is_new_arrival: data.is_new_arrival ?? false,
        img: data.img,
        size_chart: data.size_chart || null,
        short_desc: data.short_desc || null,
        desc: data.desc || null,
      })
      .eq("id", productId);

    if (updateError) return { success: false, error: updateError.message };

    // Gallery, attributes, and variations live in separate tables, so the
    // three "replace" groups below are independent of each other and run
    // in parallel. Within each group, delete must still finish before
    // insert starts (an unconditional delete-by-product_id running
    // concurrently with an insert for that same product_id would wipe out
    // the rows just inserted) — but batching every row of a group into one
    // insert call, instead of one request per row, turns what used to be
    // dozens of sequential round-trips (scaling with gallery/attribute/
    // variation count) into a fixed handful regardless of size.
    await Promise.all([
      // Gallery
      supabaseAdmin.from("product_image").delete().eq("product_id", productId).then(() =>
        data.gallery.length > 0
          ? supabaseAdmin.from("product_image").insert(data.gallery.map((imgUrl) => ({ product_id: productId, img_url: imgUrl })))
          : null
      ),
      // Attributes
      supabaseAdmin.from("product_attribute").delete().eq("product_id", productId).then(() =>
        data.attribute_ids.length > 0
          ? supabaseAdmin.from("product_attribute").insert(data.attribute_ids.map((attrId) => ({ product_id: productId, attribute_id: attrId })))
          : null
      ),
      // Variations (+ their options)
      (async () => {
        const { data: existingVars } = await supabaseAdmin
          .from("product_variation")
          .select("id")
          .eq("product_id", productId);

        const existingVarIds = (existingVars ?? []).map((v) => v.id);
        if (existingVarIds.length > 0) {
          await supabaseAdmin.from("variation_option").delete().in("variation_id", existingVarIds);
        }
        await supabaseAdmin.from("product_variation").delete().eq("product_id", productId);

        if (data.variations.length === 0) return;

        const { data: newVars } = await supabaseAdmin
          .from("product_variation")
          .insert(
            data.variations.map((v) => ({
              product_id: productId,
              price: formatPriceField(v.price),
              stock_status: v.stock_status || "instock",
              img_url: v.img_url || null,
            }))
          )
          .select("id");

        if (newVars) {
          const optionRows = newVars.flatMap((v, i) =>
            Object.values(data.variations[i].attr_options).map((valueId) => ({
              variation_id: v.id,
              attribute_value_id: Number(valueId),
            }))
          );
          if (optionRows.length > 0) {
            await supabaseAdmin.from("variation_option").insert(optionRows);
          }
        }
      })(),
    ]);

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Unknown error" };
  }
}

/* ── Inventory ───────────────────────────────────────────────────────────── */
export async function updateInventoryStockAction(formData: FormData) {
  const productId = formData.get("product_id") as string;
  const status    = formData.get("stock_status") as string;
  await supabaseAdmin.from("product").update({ stock_status: status }).eq("id", productId);
  revalidatePath("/admin/inventory");
  redirect("/admin/inventory?_flash=Stock+updated&_type=success");
}

/* ── Config ──────────────────────────────────────────────────────────────── */
export async function updateConfigAction(formData: FormData) {
  const entries = Array.from(formData.entries());
  const updates = entries
    .filter(([key]) => key.startsWith("config_"))
    .map(([key, value]) => ({ key: key.replace("config_", ""), value: String(value) }));

  // One batch upsert instead of one round-trip per setting — a save on
  // this page was previously as slow as its slowest field count.
  if (updates.length > 0) {
    await supabaseAdmin.from("app_config").upsert(updates, { onConflict: "key" });
  }

  revalidatePath("/admin/config");
  redirect("/admin/config?_flash=Configuration+saved&_type=success");
}
