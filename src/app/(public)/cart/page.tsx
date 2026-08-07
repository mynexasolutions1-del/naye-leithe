import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { safePrice, optimizeCloudinary, formatPrice } from "@/lib/utils";
import CartClient from "./CartClient";
import type { CartItem, Product, ProductVariation } from "@/types/db";

export const metadata: Metadata = { title: "Your Shopping Bag – Naye Leithe" };

export default async function CartPage() {
  const cookieStore = await cookies();
  const cartRaw = cookieStore.get("nl_cart")?.value;
  const cart: Record<string, number> = cartRaw ? JSON.parse(cartRaw) : {};

  const keys = Object.keys(cart);
  const items: CartItem[] = [];

  for (const key of keys) {
    const qty = cart[key];
    if (qty <= 0) continue;

    if (key.startsWith("var:")) {
      const varId = parseInt(key.split(":")[1]);
      const { data: variation } = await supabaseAdmin
        .from("product_variation")
        .select("*, product(*,category(*)), options:variation_option(*,attribute_value(*,attribute(*)))")
        .eq("id", varId)
        .single();

      if (!variation) continue;
      const p = variation.product as Product;
      const price = safePrice(variation.price ?? p.price);

      // Build options list
      const opts = (variation.options ?? []).map((o: {
        attribute_value?: { attribute?: { name?: string }; value?: string }
      }) => ({
        name: o.attribute_value?.attribute?.name ?? "",
        value: o.attribute_value?.value ?? "",
      }));

      // Color-based image
      const colorOpt = (variation.options ?? []).find((o: {
        attribute_value?: { attribute?: { name?: string }; attribute_value_id?: number }
      }) =>
        o.attribute_value?.attribute?.name?.toLowerCase().includes("color")
      );

      items.push({
        id: key,
        product: p,
        variation: variation as ProductVariation,
        quantity: qty,
        display_price: formatPrice(price),
        item_total: formatPrice(price * qty),
        var_img: variation.img_url
          ? optimizeCloudinary(variation.img_url, 200)
          : optimizeCloudinary(p.img, 200),
        options: opts,
      });
    } else {
      const productId = key.split("_")[0];
      const { data: product } = await supabaseAdmin
        .from("product")
        .select("*,category(*)")
        .eq("id", productId)
        .single();

      if (!product) continue;
      const price = safePrice(product.price);

      items.push({
        id: key,
        product: product as Product,
        quantity: qty,
        display_price: formatPrice(price),
        item_total: formatPrice(price * qty),
        var_img: optimizeCloudinary(product.img, 200),
      });
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + safePrice(item.display_price) * item.quantity,
    0
  );

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1>Your Shopping Bag</h1>
          <p>You have {items.length} item{items.length !== 1 ? "s" : ""} in your bag</p>
        </div>

        {items.length > 0 ? (
          <CartClient items={items} initialSubtotal={subtotal} />
        ) : (
          <div className="empty-cart">
            <img src="https://api.iconify.design/lucide:shopping-bag.svg?color=%23d88c9a" alt="empty" />
            <h2>Your bag is empty</h2>
            <p>Looks like you haven&apos;t added anything to your bag yet.</p>
            <Link href="/shop" className="btn-primary">Discover Collections</Link>
          </div>
        )}
      </div>
    </div>
  );
}
