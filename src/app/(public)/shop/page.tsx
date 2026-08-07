import { supabaseAdmin } from "@/lib/supabase/admin";
import ProductCard from "@/components/shop/ProductCard";
import ShopSidebar from "./ShopSidebar";
import type { Category, Product } from "@/types/db";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Shop — Naye Leithe" };

const PAGE_SIZE = 20;

interface SearchParams {
  category?: string;
  subcategory?: string;
  search?: string;
  sort_by?: string;
  price_max?: string;
  on_sale?: string;
  new_arrival?: string;
  page?: string;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1", 10);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Active filters
  const activeCategories = sp.category ? sp.category.split(",") : [];
  const activeSubcategories = sp.subcategory ? sp.subcategory.split(",") : [];
  const onSale = !!sp.on_sale;
  const priceMax = parseInt(sp.price_max ?? "10000");
  const sort = sp.sort_by ?? "newest";

  // Build query
  let query = supabaseAdmin
    .from("product")
    .select(
      "*, category(*), subcategory:sub_category(*), images:product_image(*,attribute_value(*)), attributes:product_attribute(*, attribute(*))",
      { count: "exact" }
    );

  if (sp.search) query = query.ilike("name", `%${sp.search}%`);
  if (sp.category) query = query.eq("cat_name", sp.category);
  if (sp.subcategory) {
    const { data: sub } = await supabaseAdmin
      .from("sub_category")
      .select("id")
      .eq("name", sp.subcategory)
      .single();
    if (sub) query = query.eq("sub_category_id", sub.id);
  }
  if (onSale) query = query.not("orig", "is", null).neq("orig", "");
  if (sp.new_arrival) query = query.eq("is_new_arrival", true);

  if (sort === "newest") query = query.order("id", { ascending: false });

  query = query.range(from, to);

  const { data: products, count } = await query;
  let filtered = (products as Product[]) ?? [];

  // Post-fetch filters (price sort, price max)
  if (sp.price_max) {
    const max = parseFloat(sp.price_max);
    filtered = filtered.filter((p) => {
      const price = parseFloat(p.price.replace("₹", "").replace(/,/g, "").trim()) || 0;
      return price <= max;
    });
  }
  const parseP = (s: string) => parseFloat(s.replace("₹", "").replace(/,/g, "")) || 0;
  if (sort === "price_asc") filtered.sort((a, b) => parseP(a.price) - parseP(b.price));
  if (sort === "price_desc") filtered.sort((a, b) => parseP(b.price) - parseP(a.price));

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Categories for sidebar
  const { data: categories } = await supabaseAdmin
    .from("category")
    .select("*, subcategories:sub_category(*)");
  const cats = (categories as Category[]) ?? [];

  // Build pagination URL
  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (sp.category) params.set("category", sp.category);
    if (sp.subcategory) params.set("subcategory", sp.subcategory);
    if (sp.search) params.set("search", sp.search);
    if (sp.sort_by) params.set("sort_by", sp.sort_by);
    if (sp.price_max) params.set("price_max", sp.price_max);
    if (sp.on_sale) params.set("on_sale", sp.on_sale);
    if (sp.new_arrival) params.set("new_arrival", sp.new_arrival);
    params.set("page", String(p));
    return `/shop?${params.toString()}`;
  }

  // Pagination pages array
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <>
      <style>{`
        .shop-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-top: 4rem;
          margin-bottom: 2rem;
        }
        .page-btn {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--sand);
          border-radius: 50%;
          color: var(--text);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .page-btn:hover { border-color: var(--crimson); color: var(--crimson); }
        .page-btn.active { background: var(--crimson); color: #fff; border-color: var(--crimson); }
        .page-dots { color: var(--muted); }

        .filter-category-item { margin-bottom: 1.2rem; }
        .category-parent {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text);
          margin-bottom: 0.6rem;
          cursor: pointer;
        }
        .category-parent input[type="checkbox"] {
          accent-color: var(--crimson);
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .subcategory-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding-left: 2rem;
          margin-top: 0.5rem;
          border-left: 1px solid var(--sand);
        }
        .subcategory-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--muted);
          cursor: pointer;
          transition: color 0.2s;
        }
        .subcategory-item:hover { color: var(--crimson); }
        .subcategory-item input[type="checkbox"] {
          accent-color: var(--crimson);
          width: 14px;
          height: 14px;
        }
        .subcategory-name { line-height: 1.2; }
        .all-prod-label {
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--crimson);
          cursor: pointer;
        }
        .all-prod-label input { accent-color: var(--crimson); }
      `}</style>

      <div className="shop-page">
        {/* Banner */}
        <div className="shop-banner">
          <div className="shop-banner-content">
            <h1>Shop Our Collection</h1>
            <p>Exquisite Ethnic &amp; Contemporary Wear for the Modern Woman</p>
          </div>
        </div>

        <div className="shop-container">
          {/* Sidebar (Client Component — mobile toggle + auto-submit) */}
          <ShopSidebar
            categories={cats}
            activeCategories={activeCategories}
            activeSubcategories={activeSubcategories}
            onSale={onSale}
            priceMax={priceMax}
            sortBy={sort}
          />

          {/* Product grid */}
          <main className="shop-products">
            <div className="shop-products-header">
              <span>
                Showing {filtered.length}{count && count > PAGE_SIZE ? ` of ${count}` : ""} products
                {sp.search ? ` for "${sp.search}"` : ""}
                {sp.category ? ` in ${sp.category}` : ""}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: "80px 0", textAlign: "center" }}>
                <p style={{ color: "var(--muted)", fontSize: "1.1rem", marginBottom: 24 }}>
                  No products found.
                </p>
                <Link href="/shop" className="btn-primary">Browse All</Link>
              </div>
            ) : (
              <div className="shop-grid">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="shop-pagination">
                {page > 1 && (
                  <Link href={buildUrl(page - 1)} className="page-btn">
                    <i className="fas fa-chevron-left" />
                  </Link>
                )}
                {pages.map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="page-dots">...</span>
                  ) : (
                    <Link
                      key={p}
                      href={buildUrl(p as number)}
                      className={`page-btn${p === page ? " active" : ""}`}
                    >
                      {p}
                    </Link>
                  )
                )}
                {page < totalPages && (
                  <Link href={buildUrl(page + 1)} className="page-btn">
                    <i className="fas fa-chevron-right" />
                  </Link>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
