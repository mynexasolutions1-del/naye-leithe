"use client";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import type { Product } from "@/types/db";

interface Props {
  initialProducts: Product[];
}

export default function WishlistClient({ initialProducts }: Props) {
  const { wishlist, toggle } = useWishlist();
  const { showToast } = useToast();

  /* Keep only products still present in the wishlist cookie — removes
     disappear instantly without a page reload, matching Flask's JS behaviour */
  const products = initialProducts.filter((p) => wishlist.includes(p.id));

  const handleRemove = (productId: string) => {
    toggle(productId);
    showToast("Removed from wishlist", "info");
  };

  /* ── Empty state ───────────────────────────────────────────────────────── */
  if (products.length === 0) {
    return (
      <div className="empty-cart">
        <img
          src="https://api.iconify.design/lucide:heart.svg?color=%23efcad0"
          alt="empty wishlist"
        />
        <h2>Your wishlist is empty</h2>
        <p>Start exploring our collections and save your favorite pieces here.</p>
        <Link href="/shop" className="btn-primary">Shop Now</Link>
      </div>
    );
  }

  /* ── Items table (matches Flask wishlist.html exactly) ─────────────────── */
  return (
    <div className="cart-flex">
      <div className="cart-items-wrap">
        <table className="cart-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Action</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} id={`wish-card-${product.id}`}>
                {/* Product cell */}
                <td className="product-cell" data-label="Product">
                  <div className="cart-prod-info">
                    <Link href={`/product/${product.id}`}>
                      <img src={product.img} alt={product.name} />
                    </Link>
                    <div>
                      <div className="cart-prod-cat">
                        {product.cat_name ?? (product as { category?: { name?: string } }).category?.name}
                      </div>
                      <div className="cart-prod-name">
                        <Link
                          href={`/product/${product.id}`}
                          style={{ textDecoration: "none", color: "inherit", fontWeight: "inherit" }}
                        >
                          {product.name}
                        </Link>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td data-label="Price">{product.price}</td>

                {/* View Product button */}
                <td data-label="Cart">
                  <Link
                    href={`/product/${product.id}`}
                    className="btn-primary"
                    style={{
                      padding: "10px 20px",
                      fontSize: "13px",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    View Product
                  </Link>
                </td>

                {/* Remove button */}
                <td data-label="Remove">
                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(product.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <img
                      src="https://api.iconify.design/lucide:trash-2.svg?color=%238a7f78"
                      alt="remove"
                      width={20}
                      height={20}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="cart-footer-links">
          <Link href="/shop" className="continue-link">
            <img
              src="https://api.iconify.design/lucide:arrow-left.svg?color=%238b1a2a"
              alt="arrow"
              width={16}
              height={16}
            />
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
