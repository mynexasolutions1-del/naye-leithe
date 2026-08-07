/** Parse price strings like "₹1,299" → 1299 */
export function safePrice(priceStr?: string | null): number {
  if (!priceStr) return 0;
  try {
    return parseFloat(priceStr.replace("₹", "").replace(/,/g, "").trim()) || 0;
  } catch {
    return 0;
  }
}

/** Format number as "₹1,299" */
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Add ₹ prefix if not already present */
export function withRupee(price?: string | null): string {
  if (!price) return "";
  return price.includes("₹") ? price : `₹${price}`;
}

/** Treat literal "None" / "null" / "undefined" strings as empty. Some rows
 *  in this database were migrated from a Python/Flask backend where a
 *  missing value got stringified (`str(None)`) instead of stored as SQL
 *  NULL — this neutralizes that artifact wherever a value is shown back
 *  to a user (e.g. pre-filling a form field). */
export function cleanValue(v?: string | null): string {
  if (!v) return "";
  const trimmed = v.trim();
  if (trimmed.length === 0) return "";
  if (["none", "null", "undefined"].includes(trimmed.toLowerCase())) return "";
  return v;
}

/** Slugify a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Optimise a Cloudinary URL to a given width */
export function optimizeCloudinary(url: string, width = 400): string {
  if (!url) return url;
  if (!url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`);
}

/** Get total items in cart */
export function cartCount(cart: Record<string, number>): number {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

/** Parse the nl_cart cookie value the same way every route already does
 *  (cart/checkout pages, checkout action) — shared here so the layout can
 *  compute the exact same initial state server-side, for CartProvider. */
export function parseCartCookie(raw?: string | null): Record<string, number> {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Parse the nl_wishlist cookie value, mirroring parseCartCookie. */
export function parseWishlistCookie(raw?: string | null): string[] {
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
