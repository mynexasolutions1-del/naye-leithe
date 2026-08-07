"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { optimizeCloudinary } from "@/lib/utils";
import type { Product, ProductVariation, Review } from "@/types/db";

interface Props {
  product: Product;
  reviews: Review[];
  user: { id: string; email?: string } | null;
  initialVariation: ProductVariation | null;
}

interface DisplayReview {
  id: number;
  customer_name: string;
  rating: number;
  comment: string;
  date: string;
  verified?: boolean;
  date_str?: string;
  status?: string;
  is_featured?: boolean;
}

const DUMMY_REVIEWS: DisplayReview[] = [
  { id: -1, customer_name: "Ananya Sharma", rating: 5, comment: "Absolute perfection! The fabric is so breathable and the colors are even more vibrant in person. Fits true to size.", date: "May 12, 2024", verified: true },
  { id: -2, customer_name: "Rahul Verma", rating: 4, comment: "The craftsmanship is evident in every stitch. It's rare to find such quality at this price point. Fast shipping too!", date: "April 28, 2024", verified: true },
  { id: -3, customer_name: "Sneha Kapoor", rating: 5, comment: "A stunning piece that works for both formal and semi-formal events. I'm very impressed with the attention to detail.", date: "April 15, 2024", verified: true },
];

export default function ProductClient({ product, reviews, user, initialVariation }: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggle: toggleWishlist, isInWishlist } = useWishlist();

  const displayReviews: DisplayReview[] = reviews.length > 0
    ? reviews.map((r) => ({
        id: r.id,
        customer_name: r.customer_name ?? "Customer",
        rating: r.rating,
        comment: r.comment ?? "",
        date: r.date,
        verified: false,
      }))
    : DUMMY_REVIEWS;

  /* ── Variation state ─────────────────────────────────────── */
  const [selectedAttrs, setSelectedAttrs] = useState<Record<number, number>>(() => {
    if (!initialVariation) return {};
    const map: Record<number, number> = {};
    initialVariation.options?.forEach((opt) => {
      if (opt.attribute_value?.attribute_id !== undefined) {
        map[opt.attribute_value.attribute_id] = opt.attribute_value_id;
      }
    });
    return map;
  });

  const matchVariation = useCallback(
    (attrs: Record<number, number>): ProductVariation | null => {
      if (!product.variations?.length) return null;
      return (
        product.variations.find((v) => {
          if (!v.options?.length) return false;
          return v.options.every(
            (opt) =>
              opt.attribute_value?.attribute_id !== undefined &&
              attrs[opt.attribute_value.attribute_id] === opt.attribute_value_id
          );
        }) ?? null
      );
    },
    [product.variations]
  );

  const currentVariation = matchVariation(selectedAttrs);

  /* ── Gallery state ───────────────────────────────────────── */
  const getInitialImg = (): string => {
    if (initialVariation) {
      const colorOpt = initialVariation.options?.find((o) =>
        o.attribute_value?.attribute?.name?.toLowerCase().includes("color")
      );
      if (colorOpt) {
        const img = product.images?.find(
          (i) => i.attribute_value_id === colorOpt.attribute_value_id
        );
        if (img) return optimizeCloudinary(img.img_url, 800);
      }
    }
    return optimizeCloudinary(product.img, 800);
  };

  const [mainImg, setMainImg] = useState(getInitialImg);
  const [activeThumb, setActiveThumb] = useState<number | "main" | "size">("main");

  const handleAttrChange = (attrId: number, valId: number) => {
    const newAttrs = { ...selectedAttrs, [attrId]: valId };
    setSelectedAttrs(newAttrs);

    // Check if this is a color attribute → filter gallery
    const attrDef = product.attributes
      ?.find((a) => a.attribute_id === attrId)
      ?.attribute;
    if (attrDef?.name?.toLowerCase().includes("color")) {
      const colorImg = product.images?.find(
        (i) => i.attribute_value_id === valId
      );
      if (colorImg) {
        setMainImg(optimizeCloudinary(colorImg.img_url, 800));
        setActiveThumb(valId);
      }
    }

    // Find matching variation image
    const matched = matchVariation(newAttrs);
    if (matched?.img_url) {
      setMainImg(optimizeCloudinary(matched.img_url, 800));
    }

    // Update URL
    if (matched) {
      router.replace(`/product/${product.id}?v=${matched.id}`, { scroll: false });
    }
  };

  /* ── Add to cart ─────────────────────────────────────────── */
  const [addedMsg, setAddedMsg] = useState(false);

  const handleAddToCart = () => {
    const hasVariations = (product.variations?.length ?? 0) > 0;
    if (hasVariations) {
      if (!currentVariation) {
        alert("Please select all options (like Size and Color) before adding to bag.");
        return;
      }
      addToCart(`var:${currentVariation.id}`, 1);
    } else {
      addToCart(product.id, 1);
    }
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
  };

  /* ── Buy now ─────────────────────────────────────────────── */
  const handleBuyNow = () => {
    const hasVariations = (product.variations?.length ?? 0) > 0;
    if (hasVariations) {
      if (!currentVariation) {
        alert("Please select all options (like Size and Color) before proceeding.");
        return;
      }
      addToCart(`var:${currentVariation.id}`, 1);
    } else {
      addToCart(product.id, 1);
    }
    router.push("/checkout");
  };

  /* ── Review form ─────────────────────────────────────────── */
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setReviewMsg({ text: "Please select a star rating.", ok: false }); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${product.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewMsg({ text: data.message ?? "Review submitted!", ok: true });
        setRating(0); setComment("");
      } else {
        setReviewMsg({ text: data.message ?? "Error submitting review.", ok: false });
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Size chart modal ────────────────────────────────────── */
  const [showSizeChart, setShowSizeChart] = useState(false);

  /* ── Helpers ─────────────────────────────────────────────── */
  const displayPrice = currentVariation?.price ?? product.price;
  const displayStock = currentVariation?.stock_status ?? product.stock_status;
  const inWishlist = isInWishlist(product.id);

  return (
    <>
      <div className="detail-container">
        {/* LEFT: Gallery */}
        <div className="product-gallery">
          <div className="main-img">
            <img src={mainImg} alt={product.name} id="mainProductImg" />
          </div>

          <div className="gallery-thumbnails" id="galleryThumbs">
            {/* Main thumb */}
            <div
              className={`thumb${activeThumb === "main" ? " active" : ""}`}
              onClick={() => { setMainImg(optimizeCloudinary(product.img, 800)); setActiveThumb("main"); }}
              data-attr-val="none"
            >
              <img src={optimizeCloudinary(product.img, 150)} alt="Main" />
            </div>

            {/* Gallery images */}
            {product.images?.map((img) => {
              // Show if no variation selected, or if matches current color
              const colorAttrValId = currentVariation?.options?.find((o) =>
                o.attribute_value?.attribute?.name?.toLowerCase().includes("color")
              )?.attribute_value_id;
              const visible = !colorAttrValId || img.attribute_value_id === colorAttrValId || !img.attribute_value_id;
              return (
                <div
                  key={img.id}
                  className={`thumb${activeThumb === img.attribute_value_id ? " active" : ""}`}
                  style={{ display: visible ? "block" : "none" }}
                  data-attr-val={img.attribute_value_id ?? "none"}
                  onClick={() => { setMainImg(optimizeCloudinary(img.img_url, 800)); setActiveThumb(img.attribute_value_id ?? "main"); }}
                >
                  <img src={optimizeCloudinary(img.img_url, 150)} alt="Gallery" />
                </div>
              );
            })}

            {/* Size chart thumb */}
            {product.size_chart && product.size_chart.toLowerCase() !== "none" && product.size_chart.trim() && (
              <div
                className={`thumb${activeThumb === "size" ? " active" : ""}`}
                data-attr-val="none"
                onClick={() => { setMainImg(product.size_chart!); setActiveThumb("size"); }}
              >
                <img src={product.size_chart} alt="Size Chart" style={{ objectFit: "contain", background: "#fff" }} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Info */}
        <div className="product-info-sect">
          <div className="detail-cat">
            {product.category?.name ?? product.cat_name}
            {product.subcategory && (
              <><span className="cat-sep">/</span> {product.subcategory.name}</>
            )}
          </div>

          <h1>{product.name}</h1>

          <div className="detail-price-row">
            <span className="current-price" id="displayPrice">{displayPrice}</span>
            {product.orig && (
              <>
                <span className="orig-price">{product.orig}</span>
                <span className="discount-tag">Offer</span>
              </>
            )}
          </div>

          <div
            id="displayStock"
            className={`stock-status ${displayStock}`}
          >
            {displayStock === "instock"
              ? <><i className="fas fa-check-circle" /> In Stock</>
              : <><i className="fas fa-times-circle" /> Out of Stock</>
            }
          </div>

          {product.short_desc && product.short_desc.toLowerCase() !== "none" && (
            <p className="description" style={{ fontSize: 15, marginBottom: 24 }}>
              {product.short_desc}
            </p>
          )}

          {/* Attribute selectors */}
          {product.attributes?.map((pAttr) => {
            const attrName = pAttr.attribute?.name ?? "";
            const attrId = pAttr.attribute_id;
            // Collect used value IDs from variations
            const usedValueIds = new Set(
              product.variations?.flatMap((v) =>
                v.options
                  ?.filter((o) => o.attribute_value?.attribute_id === attrId)
                  .map((o) => o.attribute_value_id) ?? []
              ) ?? []
            );

            return (
              <div className="variant-sect" key={pAttr.id}>
                <div className="variant-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--text)" }}>{attrName}</h4>
                  {attrName.toLowerCase().includes("size") && product.size_chart && product.size_chart.toLowerCase() !== "none" && (
                    <button
                      type="button"
                      className="size-chart-link"
                      onClick={() => setShowSizeChart(true)}
                      style={{ background: "none", border: "none", color: "var(--crimson)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <i className="fas fa-ruler-combined" /> Size Guide
                    </button>
                  )}
                </div>
                <div className={`selector-group${attrName.toLowerCase().includes("color") ? " color-options" : ""}`} id={`attr-${attrId}`}>
                  <select
                    className="attr-select"
                    data-attr-id={attrId}
                    value={selectedAttrs[attrId] ?? ""}
                    onChange={(e) => handleAttrChange(attrId, parseInt(e.target.value))}
                  >
                    <option value="" disabled>Select {attrName}</option>
                    {pAttr.attribute?.values
                      ?.filter((v) => usedValueIds.has(v.id))
                      .map((val) => (
                        <option key={val.id} value={val.id}>{val.value}</option>
                      ))}
                  </select>
                </div>
              </div>
            );
          })}

          <div className="action-btns">
            <button
              className="add-to-cart"
              onClick={handleAddToCart}
              style={addedMsg ? { background: "#10b981", color: "#fff", borderColor: "#10b981" } : {}}
            >
              {addedMsg ? "Added to Bag!" : "Add to Cart"}
            </button>
            <button className="buy-now-btn" onClick={handleBuyNow}>
              Buy Now
            </button>
            <div className="wishlist-btn-large-wrap">
              <button
                className={`wishlist-btn-large${inWishlist ? " active" : ""}`}
                onClick={() => toggleWishlist(product.id)}
              >
                <img src="https://api.iconify.design/lucide:heart.svg?color=%238b1a2a" alt="wishlist" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Table */}
      <div className="product-description-table-container">
        <div className="desc-table-wrapper">
          <h3>Product Details</h3>
          <table className="product-desc-table">
            <tbody>
              <DescriptionRows desc={product.desc} />
              <tr>
                <th>Category</th>
                <td>{product.category?.name ?? product.cat_name}{product.subcategory ? ` / ${product.subcategory.name}` : ""}</td>
              </tr>
            </tbody>
          </table>
          <div className="trust-points-horizontal">
            <div className="point">✨ Authentic Handloom</div>
            <div className="point">🚚 Free Shipping across India</div>
            <div className="point">🔄 7-Day Easy Returns</div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="product-reviews-section">
        <div className="reviews-header-wrap">
          <h3>Customer Reviews</h3>
          <div className="rating-summary-brief">
            <div className="stars">★★★★★</div>
            <span>Based on {displayReviews.length} reviews</span>
          </div>
        </div>

        <div className="reviews-track-wrapper">
          <div className="reviews-track" id="reviews-track">
            {displayReviews.map((review, i) => (
              <div className="review-item" key={review.id ?? i}>
                <div className="review-meta">
                  <div className="reviewer-avatar">
                    {(review.customer_name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="reviewer-info">
                    <div className="reviewer-name">
                      {review.customer_name}
                      {review.verified && (
                        <span className="verified-badge">
                          <i className="fas fa-check-circle" /> Verified Buyer
                        </span>
                      )}
                    </div>
                    <div className="review-stars">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </div>
                  </div>
                  <div className="review-date">
                    {review.date
                      ? new Date(review.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : review.date_str}
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
          <div className="swipe-indicators">
            <span className="dot active" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      </div>

      {/* Review Submission */}
      <div className="final-review-submission">
        <div className="add-review-section">
          {user ? (
            <div className="add-review-box">
              <div className="add-review-header">
                <h4>Share Your Experience</h4>
                <p>Logged in as <strong>{user.email ?? "User"}</strong></p>
              </div>
              <form onSubmit={handleReviewSubmit}>
                {reviewMsg && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13.5,
                    background: reviewMsg.ok ? "#f0fdf4" : "#fef2f2",
                    color: reviewMsg.ok ? "#15803d" : "#b91c1c",
                    border: `1px solid ${reviewMsg.ok ? "#86efac" : "#fca5a5"}`,
                  }}>
                    {reviewMsg.text}
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label>Rating</label>
                    <div className="rating-input" id="starContainer">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className="star"
                          style={{ cursor: "pointer", fontSize: 24, color: i <= (hoverRating || rating) ? "var(--gold)" : "var(--muted)" }}
                          onMouseEnter={() => setHoverRating(i)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(i)}
                        >
                          {i <= (hoverRating || rating) ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="form-group flex-1">
                    <label>Your Review</label>
                    <textarea
                      name="comment"
                      placeholder="Describe your experience with the product..."
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="submit-review-btn" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
              </form>
            </div>
          ) : (
            <div className="login-to-review">
              <img src="https://api.iconify.design/lucide:lock.svg?color=%238b1a2a" alt="lock" />
              <h4>Want to leave a review?</h4>
              <p>Please log in to your account to share your thoughts about this product.</p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Link href="/login" className="btn-primary" style={{ background: "var(--crimson)", color: "#fff" }}>Log In Now</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div
          className="modal"
          style={{ display: "block" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSizeChart(false); }}
        >
          <div className="modal-content" style={{ maxWidth: 600, borderRadius: 20, overflow: "hidden", padding: 30, background: "#fff", position: "relative" }}>
            <span
              className="close-modal"
              onClick={() => setShowSizeChart(false)}
              style={{ position: "absolute", right: 20, top: 15, fontSize: 28, fontWeight: "bold", cursor: "pointer", color: "var(--muted)" }}
            >&times;</span>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 24, color: "var(--text)", borderBottom: "2px solid var(--cream)", paddingBottom: 12 }}>Size Guide</h3>
            {product.size_chart ? (
              <img src={product.size_chart} alt="Size Chart" style={{ width: "100%", height: "auto", objectFit: "contain", maxHeight: "70vh" }} />
            ) : (
              <DefaultSizeTable />
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── helpers ──────────────────────────────────────────────── */

function DescriptionRows({ desc }: { desc?: string | null }) {
  const raw = desc && desc.toLowerCase() !== "none"
    ? desc
    : "Exquisite fashion piece designed for elegance and comfort, crafted with the finest materials to ensure both style and durability.";

  const hasBullets = raw.includes("*") || raw.includes("\n");
  if (hasBullets && raw.includes(":")) {
    let lines = raw.split("\n");
    if (lines.length <= 2) lines = raw.split("*");
    return (
      <>
        {lines.map((line, i) => {
          const clean = line.replace(/\*\*/g, "").trim();
          if (!clean) return null;
          if (clean.includes(":")) {
            const [label, ...rest] = clean.split(":");
            return (
              <tr key={i}>
                <th>{label.replace(/\*/g, "").trim()}</th>
                <td>{rest.join(":").trim()}</td>
              </tr>
            );
          }
          return (
            <tr key={i}>
              <td colSpan={2} style={{ padding: 16, lineHeight: 1.6, color: "var(--muted)", borderBottom: "1px solid var(--sand)" }}>
                {clean.replace(/\*/g, "")}
              </td>
            </tr>
          );
        })}
      </>
    );
  }

  return (
    <tr>
      <th>Description</th>
      <td>{raw}</td>
    </tr>
  );
}

function DefaultSizeTable() {
  const rows = [
    ["S", "34 - 35", "26 - 27", "36 - 37"],
    ["M", "36 - 37", "28 - 29", "38 - 39"],
    ["L", "38 - 39", "30 - 31", "40 - 41"],
    ["XL", "40 - 42", "32 - 34", "42 - 44"],
    ["XXL", "44 - 46", "35 - 37", "46 - 48"],
  ];
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ background: "var(--cream)", borderBottom: "2px solid var(--sand)" }}>
            {["Size", "Bust (in)", "Waist (in)", "Hips (in)"].map((h) => (
              <th key={h} style={{ padding: 12, fontWeight: 700, color: "var(--text)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([size, ...vals]) => (
            <tr key={size} style={{ borderBottom: "1px solid var(--sand)" }}>
              <td style={{ padding: 12, fontWeight: 600 }}>{size}</td>
              {vals.map((v, i) => <td key={i} style={{ padding: 12 }}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
