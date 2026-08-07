"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateCartAction, removeFromCartAction } from "@/actions/cart";
import { safePrice, formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types/db";

interface Props {
  items: CartItem[];
  initialSubtotal: number;
}

export default function CartClient({ items: initialItems, initialSubtotal }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [subtotal, setSubtotal] = useState(initialSubtotal);
  const [isPending, startTransition] = useTransition();

  const recalcSubtotal = (updated: CartItem[]) => {
    const total = updated.reduce(
      (sum, item) => sum + safePrice(item.display_price) * item.quantity,
      0
    );
    setSubtotal(total);
  };

  const handleQtyChange = (key: string, newQty: number) => {
    if (newQty < 1) {
      handleRemove(key);
      return;
    }
    const updated = items.map((item) =>
      item.id === key
        ? {
            ...item,
            quantity: newQty,
            item_total: formatPrice(safePrice(item.display_price) * newQty),
          }
        : item
    );
    setItems(updated);
    recalcSubtotal(updated);

    startTransition(async () => {
      await updateCartAction(key, newQty);
    });
  };

  const handleRemove = (key: string) => {
    const updated = items.filter((item) => item.id !== key);
    setItems(updated);
    recalcSubtotal(updated);
    startTransition(async () => {
      await removeFromCartAction(key);
    });
  };

  if (items.length === 0) {
    return (
      <div className="empty-cart">
        <img src="https://api.iconify.design/lucide:shopping-bag.svg?color=%23d88c9a" alt="empty" />
        <h2>Your bag is empty</h2>
        <p>Looks like you haven&apos;t added anything to your bag yet.</p>
        <Link href="/shop" className="btn-primary">Discover Collections</Link>
      </div>
    );
  }

  return (
    <div className="cart-flex">
      {/* Left: Items */}
      <div className="cart-items-wrap">
        <table className="cart-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="product-cell" data-label="Product">
                  <div className="cart-prod-info">
                    <Link href={`/product/${item.product.id}`}>
                      <img
                        src={item.var_img ?? item.product.img}
                        alt={item.product.name}
                      />
                    </Link>
                    <div>
                      <div className="cart-prod-cat">
                        {item.product.category?.name ?? item.product.cat_name}
                      </div>
                      <div className="cart-prod-name">
                        <Link
                          href={`/product/${item.product.id}`}
                          style={{ textDecoration: "none", color: "inherit", fontWeight: "inherit" }}
                        >
                          {item.product.name}
                        </Link>
                      </div>
                      {item.options && item.options.length > 0 && (
                        <div className="cart-prod-variants">
                          {item.options.map((opt, i) => (
                            <span key={i}>{opt.name}: {opt.value}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td data-label="Price">{item.display_price}</td>
                <td data-label="Quantity">
                  <div className="qty-control">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                      disabled={isPending}
                    >-</button>
                    <input type="number" value={item.quantity} readOnly />
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                      disabled={isPending}
                    >+</button>
                  </div>
                </td>
                <td className="item-total-cell" data-label="Total">{item.item_total}</td>
                <td data-label="Action">
                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item.id)}
                    disabled={isPending}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                  >
                    <img
                      src="https://api.iconify.design/lucide:trash-2.svg?color=%238a7f78"
                      alt="remove"
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
            />
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Right: Summary */}
      <div className="cart-summary">
        <div className="summary-card">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span className="subtotal-val">{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span className="free-text">FREE</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-row total-row">
            <span>Estimated Total</span>
            <span className="subtotal-val">{formatPrice(subtotal)}</span>
          </div>
          <p className="tax-info">Tax included. Shipping calculated at checkout.</p>
          <Link
            href="/checkout"
            className="checkout-btn"
            style={{ display: "block", textAlign: "center", textDecoration: "none" }}
          >
            Proceed to Checkout
          </Link>
          <div className="secure-info">
            <img
              src="https://api.iconify.design/lucide:shield-check.svg?color=%235a7a3b"
              alt="secure"
            />
            Secure SSL Encryption &amp; Data Protection
          </div>
        </div>
      </div>
    </div>
  );
}
