import "../style.css";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DragScroll from "@/components/ui/DragScroll";
import { parseCartCookie, parseWishlistCookie } from "@/lib/utils";
import type { Category } from "@/types/db";

// Cache categories for 5 min
const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const { data } = await supabaseAdmin
      .from("category")
      .select("*, subcategories:sub_category(*)");
    return (data as Category[]) ?? [];
  },
  ["nav-categories"],
  { revalidate: 300 }
);

// Cache announcement bar for 5 min
const getAnnouncement = unstable_cache(
  async (): Promise<string> => {
    const { data } = await supabaseAdmin
      .from("app_config")
      .select("value")
      .eq("key", "announcement_text")
      .single();
    return data?.value ?? "";
  },
  ["announcement-text"],
  { revalidate: 300 }
);

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, announcement, user, cookieStore] = await Promise.all([
    getCategories(),
    getAnnouncement(),
    getServerUser(),
    cookies(),
  ]);

  const isAdmin = user?.email === process.env.ADMIN_EMAIL;
  const initialCart = parseCartCookie(cookieStore.get("nl_cart")?.value);
  const initialWishlist = parseWishlistCookie(cookieStore.get("nl_wishlist")?.value);

  return (
    <CartProvider initialCart={initialCart}>
      {/* Font Awesome — several storefront components (checkout, contact,
          product, profile, shop sidebar) render <i className="fas fa-...">
          icons but nothing ever loaded the icon font, so they rendered as
          empty/broken glyphs. Scoped to the public layout since admin and
          auth pages use lucide-react / inline SVGs instead. */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
      <WishlistProvider initialWishlist={initialWishlist}>
        <ToastProvider>
          <div className="app">
            <Header
              categories={categories}
              isAdmin={isAdmin}
              announcementText={announcement}
            />
            <main>{children}</main>
            <Footer categories={categories} />
          </div>
          <DragScroll />
        </ToastProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
