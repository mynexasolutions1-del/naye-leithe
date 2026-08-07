import { cookies } from "next/headers";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import WishlistClient from "./WishlistClient";
import type { Product } from "@/types/db";

export const metadata: Metadata = { title: "My Wishlist — Naye Leithe" };

export default async function WishlistPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("nl_wishlist")?.value;
  let wishlistIds: string[] = [];
  try { wishlistIds = raw ? JSON.parse(raw) : []; } catch { wishlistIds = []; }

  let products: Product[] = [];
  if (wishlistIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("product")
      .select("*, category(*), images:product_image(*,attribute_value(*))")
      .in("id", wishlistIds);
    products = (data ?? []) as Product[];
  }

  return (
    <div className="wishlist-page">
      <div className="cart-container">
        <div className="cart-header">
          <div className="header-tag"><span>✦</span> My Favorites</div>
          <h1>Your Curated Wishlist</h1>
          <p>
            You have {wishlistIds.length} item{wishlistIds.length !== 1 ? "s" : ""} saved for later
          </p>
        </div>

        <WishlistClient initialProducts={products} />
      </div>
    </div>
  );
}
