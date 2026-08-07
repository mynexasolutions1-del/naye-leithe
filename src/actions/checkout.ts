"use server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const CART_COOKIE = "nl_cart";
const COUPON_COOKIE = "nl_coupon";

type CartMap = Record<string, number>;

function safePrice(p?: string | null) {
  if (!p) return 0;
  return parseFloat(p.replace("₹", "").replace(/,/g, "").trim()) || 0;
}

async function getDbUserId() {
  const user = await getServerUser();
  if (!user) return null;
  const { data } = await supabaseAdmin
    .from("user")
    .select("id")
    .eq("auth_uid", user.id)
    .single();
  return data?.id as number | null;
}

async function getConfig(key: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value ?? null;
}

export async function applyCouponAction(code: string, subtotal: number) {
  const { data: coupon } = await supabaseAdmin
    .from("coupon")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (!coupon) return { success: false, message: "Invalid or inactive coupon code." };
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date())
    return { success: false, message: "Coupon has expired." };
  if (coupon.usage_limit <= 0)
    return { success: false, message: "Coupon limit has been reached." };
  if (subtotal < coupon.threshold)
    return {
      success: false,
      message: `Minimum order ₹${coupon.threshold} required for this coupon.`,
    };

  let discount =
    coupon.type === "flat"
      ? coupon.discount
      : subtotal * (coupon.discount / 100);
  discount = Math.min(discount, subtotal);

  // Store coupon in cookie
  const couponCookieStore = await cookies();
  couponCookieStore.set(
    COUPON_COOKIE,
    JSON.stringify({
      code: coupon.code,
      type: coupon.type,
      discount_val: coupon.discount,
      discount_amount: discount,
    }),
    { maxAge: 60 * 60 * 24, sameSite: "lax", path: "/" }
  );

  return { success: true, discount, message: "Coupon applied!" };
}

export async function removeCouponAction() {
  const cs = await cookies();
  cs.set(COUPON_COOKIE, "", { maxAge: 0, path: "/" });
  return { success: true };
}

export async function placeOrderAction(data: {
  payment_method: "COD" | "Online" | "Partial";
  address_id: string;
  full_name?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  label?: string;
  save_address?: boolean;
}) {
  const userId = await getDbUserId();
  if (!userId) return { success: false, message: "Not logged in" };

  const cookieStore = await cookies();
  const cartRaw = cookieStore.get(CART_COOKIE)?.value;
  const cart: CartMap = cartRaw ? JSON.parse(cartRaw) : {};
  if (!Object.keys(cart).length) return { success: false, message: "Cart is empty" };

  // Enforce the admin's payment-method settings server-side too — the
  // checkout UI already hides disabled methods, but a stale page load or a
  // direct call here shouldn't be able to bypass what the store owner
  // configured.
  const [codEnabledCfg, onlineEnabledCfg, partialEnabledCfg] = await Promise.all([
    getConfig("payment_method_cod"),
    getConfig("payment_method_online"),
    getConfig("partial_payment_enabled"),
  ]);
  const codEnabled = codEnabledCfg === "true";
  const onlineEnabled = onlineEnabledCfg === "true";
  const partialEnabled = partialEnabledCfg === "true" && codEnabled && onlineEnabled;

  const methodAllowed =
    (data.payment_method === "COD" && codEnabled) ||
    (data.payment_method === "Online" && onlineEnabled) ||
    (data.payment_method === "Partial" && partialEnabled);
  if (!methodAllowed) {
    return { success: false, message: "That payment method isn't available right now." };
  }

  // Calculate totals
  let total = 0;
  const itemsToAdd: {
    product_id: string;
    variation_id: number | null;
    qty: number;
    price: number;
  }[] = [];

  for (const [pid, qty] of Object.entries(cart)) {
    if (pid.startsWith("var:")) {
      const varId = parseInt(pid.split(":")[1]);
      const { data: v } = await supabaseAdmin
        .from("product_variation")
        .select("*, product(*)")
        .eq("id", varId)
        .single();
      if (v) {
        const price = safePrice(v.price);
        total += price * qty;
        itemsToAdd.push({ product_id: v.product_id, variation_id: v.id, qty, price });
      }
    } else {
      const pId = pid.split("_")[0];
      const { data: p } = await supabaseAdmin
        .from("product")
        .select("id, price")
        .eq("id", pId)
        .single();
      if (p) {
        const price = safePrice(p.price);
        total += price * qty;
        itemsToAdd.push({ product_id: p.id, variation_id: null, qty, price });
      }
    }
  }

  // Shipping
  const shippingEnabled = (await getConfig("shipping_enabled")) === "true";
  let shippingCost = 0;
  let freeShippingAbove = 999;
  let shippingCharges = 0;
  if (shippingEnabled) {
    shippingCharges = safePrice(await getConfig("shipping_charges"));
    freeShippingAbove = safePrice(await getConfig("free_shipping_above")) || 999;
  }

  // Coupon
  const couponRaw = cookieStore.get(COUPON_COOKIE)?.value;
  let discountAmount = 0;
  let couponCode: string | null = null;
  if (couponRaw) {
    const couponData = JSON.parse(couponRaw);
    couponCode = couponData.code;
    const { data: coupon } = await supabaseAdmin
      .from("coupon")
      .select("*")
      .eq("code", couponData.code)
      .eq("is_active", true)
      .single();
    if (coupon && coupon.usage_limit > 0) {
      discountAmount =
        coupon.type === "flat"
          ? coupon.discount
          : total * (coupon.discount / 100);
      discountAmount = Math.min(discountAmount, total);
      // Decrement usage
      await supabaseAdmin
        .from("coupon")
        .update({
          usage_limit: coupon.usage_limit - 1,
          is_active: coupon.usage_limit - 1 > 0,
        })
        .eq("id", coupon.id);
    }
  }

  const discountedSubtotal = Math.max(0, total - discountAmount);
  if (shippingEnabled && discountedSubtotal < freeShippingAbove) {
    shippingCost = shippingCharges;
  }
  const finalTotal = discountedSubtotal + shippingCost;

  // Resolve shipping address
  let shippingAddrStr = "";
  if (data.address_id === "new") {
    const addr2 = data.address_line_2 ? `${data.address_line_2}\n` : "";
    shippingAddrStr = `${data.full_name}\n${data.address_line_1}\n${addr2}${data.city}, ${data.state} ${data.pincode}\n${data.country || "India"}\nPhone: ${data.phone}`;

    if (data.save_address) {
      const { count } = await supabaseAdmin
        .from("address")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      await supabaseAdmin.from("address").insert({
        user_id: userId,
        label: data.label || "Home",
        full_name: data.full_name,
        phone: data.phone,
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2 || null,
        city: data.city,
        state: data.state || null,
        pincode: data.pincode,
        country: data.country || "India",
        is_default: (count ?? 0) === 0,
      });
    }
  } else {
    const { data: addr } = await supabaseAdmin
      .from("address")
      .select("*")
      .eq("id", parseInt(data.address_id))
      .eq("user_id", userId)
      .single();
    if (addr) {
      const addr2 = addr.address_line_2 ? `${addr.address_line_2}\n` : "";
      shippingAddrStr = `${addr.full_name}\n${addr.address_line_1}\n${addr2}${addr.city}, ${addr.state} ${addr.pincode}\n${addr.country}\nPhone: ${addr.phone}`;
    }
  }

  // order.order_number is varchar(20) — the previous decimal-timestamp
  // format (`ORD-${Date.now()}-XXXX`) produced 22 characters, which failed
  // this column's length constraint on every single order. Base36-encoding
  // the timestamp keeps it well under the limit (17 chars) with no loss of
  // uniqueness.
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;

  // Create order
  const { data: newOrder, error: orderError } = await supabaseAdmin
    .from("order")
    .insert({
      order_number: orderNumber,
      user_id: userId,
      date: new Date().toISOString(),
      total_amount: `₹${finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      payment_method: data.payment_method,
      status: data.payment_method === "COD" ? "Processing" : "Pending Payment",
      payment_status: "Unpaid",
      shipping_address: shippingAddrStr,
    })
    .select("id")
    .single();

  if (orderError || !newOrder) return { success: false, message: orderError?.message };

  // Create order items — one batch insert instead of one round-trip per
  // line item (a 4-item cart used to mean 4 sequential inserts here).
  if (itemsToAdd.length > 0) {
    await supabaseAdmin.from("order_item").insert(
      itemsToAdd.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        variation_id: item.variation_id,
        quantity: item.qty,
        price_at_time: `₹${item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      }))
    );
  }

  if (data.payment_method === "COD") {
    // Clear cart and coupon
    cookieStore.set(CART_COOKIE, "", { maxAge: 0, path: "/" });
    cookieStore.set(COUPON_COOKIE, "", { maxAge: 0, path: "/" });
    return { success: true, method: "COD", redirect: "/profile", order_number: orderNumber };
  }

  // Online / Partial — create Razorpay order
  const rzpKeyId = await getConfig("razorpay_key_id");
  const rzpKeySecret = await getConfig("razorpay_key_secret");
  if (!rzpKeyId || !rzpKeySecret)
    return { success: false, message: "Payment gateway not configured." };

  let amountToPay = finalTotal;
  if (data.payment_method === "Partial") {
    const partialPct = parseInt((await getConfig("partial_payment_percentage")) ?? "50");
    amountToPay = finalTotal * (partialPct / 100);
  }

  const Razorpay = (await import("razorpay")).default;
  const client = new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret });

  try {
    const rzpOrder = await client.orders.create({
      amount: Math.round(amountToPay * 100),
      currency: "INR",
      receipt: orderNumber,
    } as Parameters<typeof client.orders.create>[0]);

    await supabaseAdmin
      .from("order")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", newOrder.id);

    return {
      success: true,
      method: data.payment_method,
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      order_id: newOrder.id,
      order_number: orderNumber,
      key_id: rzpKeyId,
    };
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
}
