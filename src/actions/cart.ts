"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const CART_COOKIE = "nl_cart";
type CartMap = Record<string, number>;

async function readCart(): Promise<CartMap> {
  const cookieStore = await cookies();
  try {
    const raw = cookieStore.get(CART_COOKIE)?.value;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeCart(cart: CartMap) {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE, JSON.stringify(cart), {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    path: "/",
  });
}

export async function addToCartAction(productId: string, varId?: string, qty = 1) {
  const cart = await readCart();
  const key = varId ? `var:${varId}` : productId;
  cart[key] = (cart[key] ?? 0) + qty;
  await writeCart(cart);
  return { success: true, cartCount: Object.values(cart).reduce((a, b) => a + b, 0) };
}

export async function updateCartAction(key: string, qty: number) {
  const cart = await readCart();
  if (qty <= 0) delete cart[key];
  else cart[key] = qty;
  await writeCart(cart);
  revalidatePath("/cart");
  return { success: true };
}

export async function removeFromCartAction(key: string) {
  const cart = await readCart();
  delete cart[key];
  await writeCart(cart);
  revalidatePath("/cart");
  return { success: true };
}

export async function clearCartAction() {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE, "", { maxAge: 0, path: "/" });
}

export async function getCartAction(): Promise<CartMap> {
  return readCart();
}
