import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";
import { optimizeCloudinary } from "@/lib/utils";
import ProductClient from "./ProductClient";
import ProductCard from "@/components/shop/ProductCard";
import type { Product, Review } from "@/types/db";

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: product } = await supabaseAdmin
    .from("product")
    .select("name, short_desc, img")
    .eq("id", id)
    .single();

  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} | Naye Leithe`,
    description: product.short_desc ?? undefined,
    openGraph: { images: [product.img] },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { v } = await searchParams;

  const { data: product } = await supabaseAdmin
    .from("product")
    .select(
      `*, category(*), subcategory:sub_category(*),
       images:product_image(*,attribute_value(*,attribute(*))),
       attributes:product_attribute(*,attribute(*,values:attribute_value(*))),
       variations:product_variation(*,options:variation_option(*,attribute_value(*,attribute(*))))`
    )
    .eq("id", id)
    .single();

  if (!product) notFound();

  const { data: reviews } = await supabaseAdmin
    .from("review")
    .select("*")
    .eq("product_id", id)
    .eq("status", "approved")
    .order("date", { ascending: false })
    .limit(20);

  let related: Product[] = [];
  if (product.category_id) {
    const { data: rel } = await supabaseAdmin
      .from("product")
      .select("*, category(*), images:product_image(*,attribute_value(*))")
      .eq("category_id", product.category_id)
      .neq("id", product.id)
      .eq("stock_status", "instock")
      .limit(8);
    related = (rel ?? []) as Product[];
  }

  const user = await getServerUser();

  let selectedVariation = null;
  if (v && product.variations?.length) {
    selectedVariation = product.variations.find(
      (vr: { id: number }) => vr.id === parseInt(v)
    ) ?? null;
  }

  return (
    <>
      {/* All product-page-specific styles that live in Flask's inline <style> block */}
      <style>{`
        /* ── Stock status ─────────────────────────────────── */
        .stock-status {
          margin: 1rem 0;
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .stock-status.instock  { color: #10b981; }
        .stock-status.outofstock { color: #ef4444; }

        /* ── Buy Now button ──────────────────────────────── */
        .buy-now-btn {
          flex: 1;
          padding: 16px;
          background: var(--crimson);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
          letter-spacing: 0.3px;
        }
        .buy-now-btn:hover {
          background: var(--crimson-dark, #a13d4e);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(199, 86, 106, 0.35);
        }
        @media (max-width: 480px) {
          .buy-now-btn { padding: 14px; font-size: 14px; }
        }

        /* ── Wishlist large button ────────────────────────── */
        .wishlist-btn-large-wrap { display: flex; align-items: center; }
        .wishlist-btn-large {
          width: 56px;
          height: 56px;
          flex: 0 0 56px;
          border-radius: 12px;
          border: 2px solid var(--sand);
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        .wishlist-btn-large img { width: 22px; height: 22px; }
        .wishlist-btn-large:hover,
        .wishlist-btn-large.active {
          border-color: var(--crimson);
          background: #fdf2f2;
        }

        /* ── Size chart link ─────────────────────────────── */
        .size-chart-link {
          color: var(--crimson);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .size-chart-link:hover { text-decoration: underline; }

        /* ── Modal ───────────────────────────────────────── */
        .modal {
          display: none;
          position: fixed;
          z-index: 2000;
          left: 0; top: 0;
          width: 100%; height: 100%;
          background-color: rgba(0,0,0,0.6);
          backdrop-filter: blur(5px);
        }
        .modal-content {
          background-color: #fff;
          margin: 5% auto;
          padding: 30px;
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          position: relative;
        }
        .close-modal {
          position: absolute;
          right: 20px; top: 15px;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
          color: var(--muted);
        }

        /* ── Reviews section ─────────────────────────────── */
        .product-reviews-section {
          max-width: 1200px;
          margin: 60px auto;
          padding: 0 20px;
        }
        .reviews-header-wrap {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 30px;
          border-bottom: 2px solid var(--sand);
          padding-bottom: 15px;
        }
        .reviews-header-wrap h3 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: var(--text);
          margin: 0;
        }
        .rating-summary-brief { text-align: right; }
        .rating-summary-brief .stars {
          color: var(--gold);
          font-size: 20px;
          margin-bottom: 4px;
        }
        .rating-summary-brief span { font-size: 13px; color: var(--muted); }

        .reviews-track-wrapper { overflow: hidden; margin-bottom: 60px; }
        .reviews-track {
          display: flex;
          gap: 25px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 10px 0 30px;
          cursor: grab;
        }
        .reviews-track::-webkit-scrollbar { display: none; }

        .review-item {
          flex: 0 0 400px;
          background: #fff;
          padding: 30px;
          border-radius: 20px;
          border: 1px solid var(--sand);
          transition: transform 0.3s, box-shadow 0.3s;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
        }
        .review-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.06);
        }
        .review-meta {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          position: relative;
        }
        .reviewer-avatar {
          width: 48px; height: 48px;
          background: var(--sand);
          color: var(--crimson);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          flex-shrink: 0;
        }
        .reviewer-info { flex: 1; }
        .reviewer-name {
          font-weight: 700;
          font-size: 15px;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .verified-badge {
          font-size: 10px;
          color: #10b981;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .review-stars { color: var(--gold); font-size: 14px; margin-top: 2px; }
        .review-date {
          font-size: 11px;
          color: var(--muted);
          position: absolute;
          top: 0; right: 0;
        }
        .review-comment {
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--text);
          display: -webkit-box;
          -webkit-line-clamp: 4;
          line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* ── Swipe indicators ────────────────────────────── */
        .swipe-indicators {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
        }
        .dot {
          width: 6px; height: 6px;
          background: var(--sand-dark);
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        .dot.active {
          background: var(--crimson);
          width: 20px;
          border-radius: 3px;
        }

        /* ── Review submission section ────────────────────── */
        .final-review-submission {
          background: #fdf2f4;
          padding: 80px 20px;
          margin-top: 80px;
          border-top: 1px solid var(--sand);
        }
        .add-review-section { max-width: 850px; margin: 0 auto; }
        .add-review-box {
          background: #fff;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(139,26,42,0.05);
        }
        .add-review-header {
          margin-bottom: 30px;
          border-bottom: 1px solid var(--sand);
          padding-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .add-review-header h4 {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          margin: 0;
        }
        .add-review-header p { font-size: 13px; color: var(--muted); margin: 0; }

        .form-row { display: flex; gap: 40px; }
        .flex-1 { flex: 1; }
        .form-group { margin-bottom: 25px; }
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--text);
        }
        .form-group textarea {
          width: 100%;
          padding: 14px 18px;
          border-radius: 12px;
          border: 1.5px solid var(--sand);
          outline: none;
          font-family: inherit;
          transition: all 0.3s;
          background: #fff;
          resize: vertical;
        }
        .form-group textarea:focus {
          border-color: var(--crimson);
          box-shadow: 0 0 0 4px rgba(139,26,42,0.05);
        }
        .rating-input { display: flex; gap: 4px; }

        .submit-review-btn {
          width: 100%;
          padding: 16px;
          background: var(--crimson);
          color: #fff;
          border: none;
          border-radius: 35px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
        }
        @media (min-width: 992px) {
          .submit-review-btn {
            width: fit-content;
            padding: 16px 48px;
            margin: 20px auto 0;
            display: block;
          }
        }
        .submit-review-btn:hover {
          background: var(--crimson-dark);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(139,26,42,0.2);
        }

        /* ── Login to review ─────────────────────────────── */
        .login-to-review {
          text-align: center;
          padding: 60px 40px;
          background: #fff;
          border-radius: 24px;
          border: 2px dashed var(--sand);
        }
        .login-to-review img {
          width: 48px; height: 48px;
          margin-bottom: 20px;
        }
        .login-to-review h4 {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          margin-bottom: 12px;
        }
        .login-to-review p {
          color: var(--muted);
          font-size: 15px;
          margin-bottom: 30px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        /* ── Responsive tweaks ───────────────────────────── */
        @media (max-width: 992px) {
          .review-item { flex: 0 0 350px; }
          .form-row { flex-direction: column; gap: 0; }
        }
        @media (max-width: 480px) {
          .review-item { flex: 0 0 280px; padding: 20px; }
          .reviews-header-wrap { flex-direction: column; align-items: flex-start; gap: 10px; }
          .reviewer-avatar { width: 40px; height: 40px; font-size: 16px; }
          .review-date { position: static; margin-top: 8px; display: block; }
        }
      `}</style>

      <div className="product-detail-page">
        <ProductClient
          product={product as Product}
          reviews={(reviews ?? []) as Review[]}
          user={user}
          initialVariation={selectedVariation}
        />

        {related.length > 0 && (
          <section className="related-products">
            <h2 className="related-title">You May Also Like</h2>
            <div className="related-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
