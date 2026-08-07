"use server";
import { cookies } from "next/headers";

const WISHLIST_COOKIE = "nl_wishlist";

async function readWishlist(): Promise<string[]> {
  const cookieStore = await cookies();
  try {
    const raw = cookieStore.get(WISHLIST_COOKIE)?.value;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeWishlist(list: string[]) {
  const cookieStore = await cookies();
  cookieStore.set(WISHLIST_COOKIE, JSON.stringify(list), {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    path: "/",
  });
}

export async function toggleWishlistAction(productId: string) {
  const list = await readWishlist();
  const exists = list.includes(productId);
  const next = exists ? list.filter((id) => id !== productId) : [...list, productId];
  await writeWishlist(next);
  return { success: true, action: exists ? "removed" : "added", wishlistCount: next.length };
}

export async function getWishlistAction(): Promise<string[]> {
  return readWishlist();
}
