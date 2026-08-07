import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";
import { safePrice, optimizeCloudinary, formatPrice } from "@/lib/utils";
import CheckoutClient from "./CheckoutClient";
import type { Address, Coupon, Product } from "@/types/db";

export const metadata: Metadata = { title: "Checkout | Naye Leithe" };

interface CheckoutItem {
  key: string;
  name: string;
  image: string;
  qty: number;
  price: number;
  variantLabel?: string;
}

export default async function CheckoutPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/checkout");

  const cookieStore = await cookies();
  const cartRaw = cookieStore.get("nl_cart")?.value;
  const cart: Record<string, number> = cartRaw ? JSON.parse(cartRaw) : {};

  if (!Object.keys(cart).length) redirect("/cart");

  // Resolve cart items
  const items: CheckoutItem[] = [];
  for (const [key, qty] of Object.entries(cart)) {
    if (qty <= 0) continue;
    if (key.startsWith("var:")) {
      const varId = parseInt(key.split(":")[1]);
      const { data: v } = await supabaseAdmin
        .from("product_variation")
        .select("*, product(*), options:variation_option(*,attribute_value(*,attribute(*)))")
        .eq("id", varId)
        .single();
      if (!v) continue;
      const p = v.product as Product;
      const label = (v.options ?? [])
        .map((o: { attribute_value?: { attribute?: { name?: string }; value?: string } }) =>
          `${o.attribute_value?.attribute?.name}: ${o.attribute_value?.value}`
        )
        .join(", ");
      items.push({
        key,
        name: p.name,
        image: optimizeCloudinary(v.img_url ?? p.img, 120),
        qty,
        price: safePrice(v.price ?? p.price),
        variantLabel: label || undefined,
      });
    } else {
      const { data: p } = await supabaseAdmin
        .from("product")
        .select("*")
        .eq("id", key)
        .single();
      if (!p) continue;
      items.push({
        key,
        name: p.name,
        image: optimizeCloudinary(p.img, 120),
        qty,
        price: safePrice(p.price),
      });
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  // Shipping + payment method config
  const { data: configs } = await supabaseAdmin
    .from("app_config")
    .select("key,value")
    .in("key", [
      "shipping_enabled", "shipping_charges", "free_shipping_above",
      "payment_method_cod", "payment_method_online",
      "partial_payment_enabled", "partial_payment_percentage",
    ]);
  const cfg = Object.fromEntries((configs ?? []).map((c: { key: string; value: string }) => [c.key, c.value]));
  const shippingEnabled = cfg.shipping_enabled === "true";
  const shippingCharges = safePrice(cfg.shipping_charges);
  const freeShippingAbove = safePrice(cfg.free_shipping_above) || 999;
  const shippingCost = shippingEnabled && subtotal < freeShippingAbove ? shippingCharges : 0;

  const codEnabled = cfg.payment_method_cod === "true";
  const onlinePaymentEnabled = cfg.payment_method_online === "true";
  // Per the settings page's own stated rule: Partial Payment only applies
  // if BOTH COD and Online are enabled (it's "some online, rest via COD").
  const partialPaymentEnabled = cfg.partial_payment_enabled === "true" && codEnabled && onlinePaymentEnabled;
  const partialPaymentPercentage = parseInt(cfg.partial_payment_percentage ?? "50", 10) || 50;

  // Applied coupon
  const couponRaw = cookieStore.get("nl_coupon")?.value;
  let appliedCoupon: { code: string; discount_amount: number } | null = null;
  try {
    if (couponRaw) appliedCoupon = JSON.parse(couponRaw);
  } catch {}

  // Available coupons
  const { data: activeCoupons } = await supabaseAdmin
    .from("coupon")
    .select("*")
    .eq("is_active", true)
    .gte("usage_limit", 1);

  // User addresses
  const { data: dbUser } = await supabaseAdmin
    .from("user")
    .select("id, username, phone, address, city, zipcode, email")
    .eq("auth_uid", user.id)
    .single();

  const { data: addresses } = await supabaseAdmin
    .from("address")
    .select("*")
    .eq("user_id", dbUser?.id ?? 0)
    .order("is_default", { ascending: false });

  return (
    <CheckoutClient
      items={items}
      subtotal={subtotal}
      shippingCost={shippingCost}
      appliedCoupon={appliedCoupon}
      activeCoupons={(activeCoupons ?? []) as Coupon[]}
      addresses={(addresses ?? []) as Address[]}
      dbUser={dbUser}
      codEnabled={codEnabled}
      onlinePaymentEnabled={onlinePaymentEnabled}
      partialPaymentEnabled={partialPaymentEnabled}
      partialPaymentPercentage={partialPaymentPercentage}
    />
  );
}
