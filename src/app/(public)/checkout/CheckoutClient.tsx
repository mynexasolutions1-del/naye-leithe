"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { placeOrderAction, applyCouponAction, removeCouponAction } from "@/actions/checkout";
import { formatPrice, cleanValue } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import type { Address, Coupon } from "@/types/db";

interface CheckoutItem {
  key: string;
  name: string;
  image: string;
  qty: number;
  price: number;
  variantLabel?: string;
}

interface Props {
  items: CheckoutItem[];
  subtotal: number;
  shippingCost: number;
  appliedCoupon: { code: string; discount_amount: number } | null;
  activeCoupons: Coupon[];
  addresses: Address[];
  dbUser: { id: number; username?: string; phone?: string; address?: string; city?: string; zipcode?: string; email?: string } | null;
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  partialPaymentEnabled: boolean;
  partialPaymentPercentage: number;
}

export default function CheckoutClient({
  items,
  subtotal,
  shippingCost,
  appliedCoupon: initialCoupon,
  activeCoupons,
  addresses,
  dbUser,
  codEnabled,
  onlinePaymentEnabled,
  partialPaymentEnabled,
  partialPaymentPercentage,
}: Props) {
  const router = useRouter();
  const { clearCart } = useCart();
  const [isPending, startTransition] = useTransition();

  const [coupon, setCoupon] = useState(initialCoupon);
  const [couponCode, setCouponCode] = useState(initialCoupon?.code ?? "");
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Default to whichever method is actually enabled — previously this was
  // hardcoded to "COD", which broke checkout entirely if an admin disabled COD.
  const defaultPaymentMethod: "COD" | "Online" | "Partial" =
    codEnabled ? "COD" : onlinePaymentEnabled ? "Online" : "COD";
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "Online" | "Partial">(defaultPaymentMethod);
  const noPaymentMethodsAvailable = !codEnabled && !onlinePaymentEnabled;
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.is_default)?.id?.toString() ?? (addresses.length > 0 ? addresses[0].id.toString() : "new")
  );
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const discount = coupon?.discount_amount ?? 0;
  const total = Math.max(0, subtotal - discount) + shippingCost;
  const partialAmountDue = total * (partialPaymentPercentage / 100);

  const handleCoupon = () => {
    if (coupon) {
      // Remove
      startTransition(async () => {
        await removeCouponAction();
        setCoupon(null);
        setCouponCode("");
        setCouponMsg({ text: "Coupon removed.", ok: false });
      });
    } else {
      // Apply
      startTransition(async () => {
        const res = await applyCouponAction(couponCode, subtotal);
        if (res.success) {
          setCoupon({ code: couponCode.toUpperCase(), discount_amount: res.discount! });
          setCouponMsg({ text: res.message ?? "Applied!", ok: true });
        } else {
          setCouponMsg({ text: res.message ?? "Invalid coupon.", ok: false });
        }
      });
    }
  };

  const handlePlaceOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    if (paymentMethod !== "COD" && !razorpayReady) {
      setOrderError("Payment gateway is still loading — please wait a moment and try again.");
      return;
    }

    setOrderError(null);
    startTransition(async () => {
      const res = await placeOrderAction({
        payment_method: paymentMethod,
        address_id: selectedAddressId,
        full_name: fd.get("full_name") as string,
        phone: fd.get("phone") as string,
        address_line_1: fd.get("address_line_1") as string,
        address_line_2: fd.get("address_line_2") as string,
        city: fd.get("city") as string,
        state: fd.get("state") as string,
        pincode: fd.get("pincode") as string,
        country: (fd.get("country") as string) || "India",
        label: fd.get("label") as string,
        save_address: fd.get("save_address") === "yes",
      });

      if (!res.success) {
        setOrderError(res.message ?? "Something went wrong.");
        return;
      }

      if (res.method === "COD") {
        clearCart();
        setOrderNumber(res.order_number ?? null);
        setOrderSuccess(true);
        setTimeout(() => router.push("/profile"), 4000);
        return;
      }

      // Online / Partial — hand off to Razorpay's checkout widget. The
      // order already exists server-side as "Pending Payment"; only a
      // successful, signature-verified payment moves it to "Processing".
      const RazorpayCtor = (window as unknown as { Razorpay?: new (opts: unknown) => { open: () => void; on: (evt: string, cb: (r: unknown) => void) => void } }).Razorpay;
      if (!RazorpayCtor) {
        setOrderError("Payment gateway failed to load. Please refresh and try again.");
        return;
      }

      const rzp = new RazorpayCtor({
        key: res.key_id,
        amount: res.amount,
        currency: res.currency,
        name: "Naye Leithe",
        description: res.method === "Partial" ? `Partial payment — Order ${res.order_number}` : `Order ${res.order_number}`,
        order_id: res.razorpay_order_id,
        prefill: {
          name: cleanValue(dbUser?.username) || undefined,
          email: dbUser?.email || undefined,
          contact: cleanValue(dbUser?.phone) || undefined,
        },
        theme: { color: "#c7566a" },
        handler: async (response: unknown) => {
          const r = response as { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
          setVerifying(true);
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...r, order_id: res.order_id }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              clearCart();
              setOrderNumber(res.order_number ?? null);
              setOrderSuccess(true);
              setTimeout(() => router.push("/profile"), 4000);
            } else {
              setOrderError(verifyData.message ?? "Payment verification failed. If money was deducted, contact support with your order number: " + res.order_number);
            }
          } catch {
            setOrderError("Could not verify payment. If money was deducted, contact support with your order number: " + res.order_number);
          } finally {
            setVerifying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setOrderError(`Payment cancelled. Your order (${res.order_number}) is saved as Pending Payment — you can retry from My Orders.`);
          },
        },
      });

      rzp.on("payment.failed", (response: unknown) => {
        const r = response as { error?: { description?: string } };
        setOrderError(r.error?.description ?? "Payment failed. Please try again.");
      });

      rzp.open();
    });
  };

  const razorpayScript = (
    <Script
      src="https://checkout.razorpay.com/v1/checkout.js"
      strategy="afterInteractive"
      onLoad={() => setRazorpayReady(true)}
    />
  );

  if (orderSuccess) {
    return (
      <>
        {razorpayScript}
        <div className="checkout-page">
          <div className="order-success-card">
            <div className="order-success-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2>Order Placed Successfully!</h2>
            {orderNumber && <p className="order-success-number">Order #{orderNumber}</p>}
            <p className="order-success-sub">Thank you for shopping with Naye Leithe. Taking you to your orders…</p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 24 }}
              onClick={() => router.push("/profile")}
            >
              Go to My Orders
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {razorpayScript}
      {verifying && (
        <div className="payment-verifying-overlay">
          <div className="payment-verifying-card">
            <div className="submit-spinner" />
            <p>Verifying your payment…</p>
          </div>
        </div>
      )}
      <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-main">
          <h2>Shipping &amp; Billing Details</h2>
          <form id="checkoutForm" onSubmit={handlePlaceOrder}>
            <div className="form-section">
              <h3>Shipping Address</h3>

              {/* Saved addresses */}
              {addresses.length > 0 && (
                <div className="saved-addresses" style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem", marginBottom: "1.5rem" }}>
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className="address-select-card"
                      style={{
                        display: "flex", alignItems: "flex-start", padding: "1rem",
                        border: `1px solid ${selectedAddressId === addr.id.toString() ? "var(--crimson)" : "#e2e8f0"}`,
                        borderRadius: 12, cursor: "pointer", background: "#fff", transition: "0.2s",
                      }}
                    >
                      <input
                        type="radio"
                        name="selected_address_id"
                        value={addr.id.toString()}
                        checked={selectedAddressId === addr.id.toString()}
                        onChange={() => setSelectedAddressId(addr.id.toString())}
                        style={{ marginTop: 5, marginRight: 15, accentColor: "var(--crimson)" }}
                      />
                      <div>
                        <strong style={{ display: "block", marginBottom: 5, color: "#1a1a1a" }}>
                          {addr.full_name}
                          {addr.label && (
                            <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, fontSize: "0.8rem", color: "#475569", marginLeft: 8 }}>
                              {addr.label}
                            </span>
                          )}
                        </strong>
                        <span style={{ display: "block", color: "#666", fontSize: "0.9rem" }}>{addr.address_line_1}</span>
                        {addr.address_line_2 && <span style={{ display: "block", color: "#666", fontSize: "0.9rem" }}>{addr.address_line_2}</span>}
                        <span style={{ display: "block", color: "#666", fontSize: "0.9rem" }}>{addr.city}, {addr.state} {addr.pincode}</span>
                        <span style={{ display: "block", color: "#666", fontSize: "0.9rem" }}>{addr.country}</span>
                        <span style={{ display: "block", color: "#666", fontSize: "0.9rem", marginTop: 5 }}>📞 {addr.phone}</span>
                      </div>
                    </label>
                  ))}

                  <label
                    className="address-select-card"
                    style={{
                      display: "flex", alignItems: "center", padding: "1rem",
                      border: `1px solid ${selectedAddressId === "new" ? "var(--crimson)" : "#e2e8f0"}`,
                      borderRadius: 12, cursor: "pointer", background: "#fff",
                    }}
                  >
                    <input
                      type="radio"
                      name="selected_address_id"
                      value="new"
                      checked={selectedAddressId === "new"}
                      onChange={() => setSelectedAddressId("new")}
                      style={{ marginRight: 15, accentColor: "var(--crimson)" }}
                    />
                    <strong style={{ color: "#1a1a1a" }}>Write different address</strong>
                  </label>
                </div>
              )}

              {/* New address fields */}
              <div
                id="new-address-fields"
                style={{
                  display: selectedAddressId === "new" ? "block" : "none",
                  background: "#fff", padding: "2rem", borderRadius: 12,
                  marginBottom: "2rem", border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                }}
              >
                <style>{`
                  .lfc label { color: #475569; font-weight: 500; font-size: 0.85rem; margin-bottom: 5px; display: block; }
                  .lfc input, .lfc textarea { width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: #1e293b; border-radius: 8px; padding: 10px 14px; margin-bottom: 1rem; transition: 0.2s; box-sizing: border-box; }
                  .lfc input:focus, .lfc textarea:focus { border-color: var(--crimson); outline: none; background: #fff; box-shadow: 0 0 0 3px rgba(139,26,42,0.1); }
                  .lgc { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1.5rem; }
                  @media (max-width: 600px) { .lgc { grid-template-columns: 1fr; } }
                `}</style>
                <div className="lfc">
                  <label>Label (e.g. Home, Work)</label>
                  <input type="text" name="label" placeholder="Home" />
                  <label>Full Name</label>
                  <input type="text" name="full_name" placeholder="Full Name" defaultValue={cleanValue(dbUser?.username)} required={selectedAddressId === "new"} />
                  <label>Phone Number</label>
                  <input type="text" name="phone" placeholder="+91 XXXXX XXXXX" defaultValue={cleanValue(dbUser?.phone)} required={selectedAddressId === "new"} />
                  <label>Address Line 1 *</label>
                  <input type="text" name="address_line_1" placeholder="Flat / House No., Street" defaultValue={cleanValue(dbUser?.address)} required={selectedAddressId === "new"} />
                  <label>Address Line 2</label>
                  <input type="text" name="address_line_2" placeholder="Area / Locality (optional)" />
                  <div className="lgc">
                    <div><label>City *</label><input type="text" name="city" placeholder="City" defaultValue={cleanValue(dbUser?.city)} required={selectedAddressId === "new"} /></div>
                    <div><label>State</label><input type="text" name="state" placeholder="State" /></div>
                    <div><label>Pincode *</label><input type="text" name="pincode" placeholder="Pincode" defaultValue={cleanValue(dbUser?.zipcode)} required={selectedAddressId === "new"} /></div>
                    <div><label>Country</label><input type="text" name="country" defaultValue="India" /></div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer", color: "#1a1a1a" }}>
                    <input type="checkbox" name="save_address" value="yes" style={{ width: "auto", marginRight: 10, accentColor: "var(--crimson)" }} defaultChecked />
                    Save this address to my account
                  </label>
                </div>
              </div>
            </div>

            {orderError && (
              <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#b91c1c", borderRadius: 8, marginBottom: "1.5rem", border: "1px solid #fca5a5" }}>
                {orderError}
              </div>
            )}
          </form>
        </div>

        {/* Sidebar */}
        <aside className="checkout-sidebar">
          <div className="order-summary-card">
            <h3>Order Summary</h3>

            <div className="summary-items">
              {items.map((item) => (
                <div key={item.key} className="summary-item" style={{ display: "flex", alignItems: "center", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #f1f1f1" }}>
                  <img src={item.image} alt={item.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, marginRight: 15 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ display: "block", fontWeight: 500, fontSize: "0.95rem", color: "#1a1a1a" }}>{item.name}</span>
                    {item.variantLabel && <span style={{ color: "#666", fontSize: "0.8rem" }}>{item.variantLabel}</span>}
                    <span style={{ color: "#666", fontSize: "0.85rem" }}>Qty: {item.qty}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: "#1a1a1a" }}>{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="coupon-section" style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #f1f5f9" }}>
              <h4 style={{ marginBottom: "0.8rem", fontSize: "0.95rem", color: "#1a1a1a", fontWeight: 600 }}>Have a Promo Code?</h4>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Enter Coupon Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!coupon}
                  style={{ flex: 1, padding: 10, border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.9rem", textTransform: "uppercase" }}
                />
                <button
                  type="button"
                  onClick={handleCoupon}
                  disabled={isPending}
                  style={{ background: "var(--crimson)", color: "white", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                >
                  {coupon ? "Remove" : "Apply"}
                </button>
              </div>
              {couponMsg && (
                <div style={{ fontSize: "0.85rem", marginTop: 8, fontWeight: 600, color: couponMsg.ok ? "#10b981" : "#ef4444" }}>
                  {couponMsg.text}
                </div>
              )}

              {activeCoupons.length > 0 && !coupon && (
                <div style={{ marginTop: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, display: "block", marginBottom: 5 }}>Available Coupons (Click to fill):</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {activeCoupons.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setCouponCode(c.code)}
                        style={{ background: "#fdf2f4", border: "1px dashed var(--crimson)", color: "var(--crimson)", padding: "5px 10px", borderRadius: 6, fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                        title={`Min order: ₹${c.threshold} - Get ${c.discount}${c.type === "percentage" ? "%" : " ₹"} off`}
                      >
                        {c.code}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "2px solid #f1f5f9", fontSize: "1rem", color: "#555" }}>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.8rem", fontSize: "1rem", color: "#10b981" }}>
                <span>Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.8rem", fontSize: "1rem", color: "#555" }}>
              <span>Shipping</span>
              <span>{shippingCost > 0 ? formatPrice(shippingCost) : "FREE"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9", fontWeight: 800, fontSize: "1.25rem" }}>
              <span>Total Amount</span>
              <span style={{ color: "var(--crimson)" }}>{formatPrice(total)}</span>
            </div>

            {/* Payment Method */}
            <div style={{ marginTop: "1.5rem" }}>
              <h4 style={{ marginBottom: "0.8rem", fontSize: "0.95rem", color: "#1a1a1a", fontWeight: 600 }}>Select Payment Method</h4>

              {noPaymentMethodsAvailable ? (
                <div style={{ padding: 14, background: "#fef2f2", color: "#b91c1c", borderRadius: 10, fontSize: "0.85rem", border: "1px solid #fca5a5" }}>
                  No payment methods are currently available. Please contact support.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {codEnabled && (
                    <label style={{ display: "flex", alignItems: "center", padding: 12, border: `1px solid ${paymentMethod === "COD" ? "var(--crimson)" : "#e2e8f0"}`, borderRadius: 10, cursor: "pointer", background: "#fff" }}>
                      <input
                        type="radio"
                        name="payment_method"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        form="checkoutForm"
                        style={{ marginRight: 12, accentColor: "var(--crimson)" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500, fontSize: "0.9rem" }}>
                        <i className="fas fa-money-bill-wave" style={{ color: "var(--crimson)" }} />
                        <span>Cash on Delivery</span>
                      </div>
                    </label>
                  )}

                  {onlinePaymentEnabled && (
                    <label style={{ display: "flex", alignItems: "center", padding: 12, border: `1px solid ${paymentMethod === "Online" ? "var(--crimson)" : "#e2e8f0"}`, borderRadius: 10, cursor: "pointer", background: "#fff" }}>
                      <input
                        type="radio"
                        name="payment_method"
                        value="Online"
                        checked={paymentMethod === "Online"}
                        onChange={() => setPaymentMethod("Online")}
                        form="checkoutForm"
                        style={{ marginRight: 12, accentColor: "var(--crimson)" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500, fontSize: "0.9rem" }}>
                        <i className="fas fa-credit-card" style={{ color: "var(--crimson)" }} />
                        <span>Pay Online</span>
                      </div>
                    </label>
                  )}

                  {partialPaymentEnabled && (
                    <label style={{ display: "flex", alignItems: "center", padding: 12, border: `1px solid ${paymentMethod === "Partial" ? "var(--crimson)" : "#e2e8f0"}`, borderRadius: 10, cursor: "pointer", background: "#fff" }}>
                      <input
                        type="radio"
                        name="payment_method"
                        value="Partial"
                        checked={paymentMethod === "Partial"}
                        onChange={() => setPaymentMethod("Partial")}
                        form="checkoutForm"
                        style={{ marginRight: 12, accentColor: "var(--crimson)" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500, fontSize: "0.9rem" }}>
                        <i className="fas fa-hand-holding-usd" style={{ color: "var(--crimson)" }} />
                        <span>Pay {partialPaymentPercentage}% Now ({formatPrice(partialAmountDue)}), Rest on Delivery</span>
                      </div>
                    </label>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              form="checkoutForm"
              disabled={isPending || noPaymentMethodsAvailable}
              className="checkout-btn"
              style={{ width: "100%", marginTop: "1.5rem", display: "block", border: "none", textAlign: "center", cursor: "pointer" }}
            >
              {isPending ? "Placing Order…" : "Place Order"}
            </button>

            <div className="payment-icons" style={{ display: "flex", gap: 15, alignItems: "center", justifyContent: "center", marginTop: "1.5rem", opacity: 0.8 }}>
              <img src="https://api.iconify.design/logos:visa.svg" style={{ height: 15 }} alt="visa" />
              <img src="https://api.iconify.design/logos:mastercard.svg" style={{ height: 20 }} alt="mastercard" />
              <img src="https://api.iconify.design/logos:google-pay.svg" style={{ height: 20 }} alt="gpay" />
              <img src="https://api.iconify.design/logos:apple-pay.svg" style={{ height: 20 }} alt="applepay" />
            </div>
          </div>
        </aside>
      </div>
      </div>
    </>
  );
}
