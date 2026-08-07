"use client";
import Link from "next/link";
import { useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import { optimizeCloudinary, withRupee } from "@/lib/utils";
import type { Product, ProductVariation } from "@/types/db";

interface ProductCardProps {
  product: Product;
  variation?: ProductVariation | null;
}

/** Resolve display image: use variation color image if available */
function resolveImage(product: Product, variation?: ProductVariation | null): string {
  let img = product.img;
  if (variation?.options && product.images) {
    const colorOpt = variation.options.find((opt) =>
      opt.attribute_value?.attribute?.name?.toLowerCase().includes("color")
    );
    if (colorOpt) {
      const colorImg = product.images.find(
        (pi) => pi.attribute_value_id === colorOpt.attribute_value_id
      );
      if (colorImg) img = colorImg.img_url;
    }
  }
  return img;
}

/** Resolve variation color label */
function resolveColorLabel(variation?: ProductVariation | null): string {
  if (!variation?.options) return "";
  const colorOpt = variation.options.find((opt) =>
    opt.attribute_value?.attribute?.name?.toLowerCase().includes("color")
  );
  return colorOpt ? `- ${colorOpt.attribute_value?.value}` : "";
}

export default function ProductCard({ product, variation }: ProductCardProps) {
  const { addToCart, count } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const inWishlist = isInWishlist(product.id);
  const displayImg = resolveImage(product, variation);
  const displayPrice = variation?.price ?? product.price;
  const colorLabel = resolveColorLabel(variation);
  const productUrl = variation
    ? `/product/${product.id}?v=${variation.id}`
    : `/product/${product.id}`;
  const hasAttributes = (product.attributes?.length ?? 0) > 0 && !variation;

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const key = variation ? `var:${variation.id}` : product.id;
      addToCart(key, 1);
      showToast("Added to cart!", "success");
    },
    [product.id, variation, addToCart, showToast]
  );

  const handleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const added = toggle(product.id);
      showToast(added ? "Added to wishlist" : "Removed from wishlist", "info");
    },
    [product.id, toggle, showToast]
  );

  return (
    <div
      className="product-card"
      onClick={() => (window.location.href = productUrl)}
    >
      <div className="product-img-wrap">
        <Link href={productUrl} onClick={(e) => e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={optimizeCloudinary(displayImg, 400)}
            alt={product.name}
            loading="lazy"
          />
        </Link>

        {product.badge && product.badge.toLowerCase() !== "none" && (
          <span className={`product-badge ${product.badge.toLowerCase()}`}>
            {product.badge}
          </span>
        )}

        <div
          className={`product-wishlist${inWishlist ? " active" : ""}`}
          onClick={handleWishlist}
        >
          <svg
            className="icon-img icon-wishlist"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8b1a2a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </div>

        {/* Mobile overlay (new arrivals section) */}
        <div className="na-mobile-overlay">
          <div className="na-mobile-name">{product.name}</div>
          <div className="na-mobile-price">{withRupee(displayPrice)}</div>
        </div>
      </div>

      <div className="product-info">
        <div className="product-category">
          {product.category?.name ?? product.cat_name}
          {product.subcategory && ` / ${product.subcategory.name}`}
        </div>

        <div className="product-name">
          {product.name}
          {colorLabel && ` ${colorLabel}`}
        </div>

        <div className="product-prices">
          <span className="product-price">{withRupee(displayPrice)}</span>
          {product.orig && product.orig.toLowerCase() !== "none" && (
            <span className="product-price-original">{withRupee(product.orig)}</span>
          )}
        </div>

        {hasAttributes ? (
          <Link
            href={`/product/${product.id}`}
            className="product-add-btn"
            style={{
              textAlign: "center",
              textDecoration: "none",
              display: "block",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            Select Options
          </Link>
        ) : (
          <button
            className="product-add-btn"
            data-id={product.id}
            data-var-id={variation?.id ?? ""}
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
