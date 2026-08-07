"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { cleanValue } from "@/lib/utils";
import type { Address, Order, OrderItem, Product } from "@/types/db";

type Tab = "orders" | "details" | "addresses";

interface Props {
  dbUser: {
    id: number;
    email: string;
    username?: string;
    phone?: string;
    address?: string;
    city?: string;
    zipcode?: string;
  };
  orders: Order[];
  addresses: Address[];
}

export default function ProfileClient({ dbUser, orders, addresses: initialAddresses }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
  const [isPending, startTransition] = useTransition();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [addAddrMsg, setAddAddrMsg] = useState<string | null>(null);

  // Order detail modal
  const [orderModal, setOrderModal] = useState<Order | null>(null);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/");
    });
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Cancel this order?")) return;
    const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      router.refresh();
    } else {
      alert(data.message ?? "Could not cancel order.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: fd.get("username"), phone: fd.get("phone") }),
    });
    const data = await res.json();
    setProfileMsg(data.success ? "Changes saved!" : (data.message ?? "Error saving."));
  };

  const handleAddAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      label: fd.get("label"),
      full_name: fd.get("full_name"),
      phone: fd.get("phone"),
      address_line_1: fd.get("address_line_1"),
      address_line_2: fd.get("address_line_2"),
      city: fd.get("city"),
      state: fd.get("state"),
      pincode: fd.get("pincode"),
      country: fd.get("country") || "India",
      is_default: fd.get("is_default") === "on",
    };
    const res = await fetch("/api/profile/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setAddresses(data.addresses);
      setShowAddForm(false);
      setAddAddrMsg("Address saved!");
    } else {
      setAddAddrMsg(data.message ?? "Error saving address.");
    }
  };

  const handleSetDefault = async (addrId: number) => {
    const res = await fetch(`/api/profile/address/${addrId}/default`, { method: "POST" });
    const data = await res.json();
    if (data.success) setAddresses(data.addresses);
  };

  const handleDeleteAddress = async (addrId: number) => {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(`/api/profile/address/${addrId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) setAddresses(addresses.filter((a) => a.id !== addrId));
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="user-info-brief">
            <div className="avatar-circle">
              {(dbUser.email[0] ?? "?").toUpperCase()}
            </div>
            <h3>{dbUser.username ?? "Valued Customer"}</h3>
            <p>{dbUser.email}</p>
          </div>
          <div className="profile-nav">
            <button className={`nav-btn${tab === "orders" ? " active" : ""}`} onClick={() => setTab("orders")}>
              <i className="fas fa-shopping-bag" /> My Orders
            </button>
            <button className={`nav-btn${tab === "details" ? " active" : ""}`} onClick={() => setTab("details")}>
              <i className="fas fa-user-edit" /> Account Details
            </button>
            <button className={`nav-btn${tab === "addresses" ? " active" : ""}`} onClick={() => setTab("addresses")}>
              <i className="fas fa-map-marker-alt" /> My Addresses
            </button>
            <Link href="/wishlist" className="nav-btn">
              <i className="fas fa-heart" /> Wishlist
            </Link>
            <button className="nav-btn logout" onClick={handleLogout} disabled={isPending}>
              <i className="fas fa-sign-out-alt" /> Logout
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="profile-content">
          <div className="profile-card">

            {/* Orders Tab */}
            {tab === "orders" && (
              <div id="orders" className="tab-content active">
                <h2 className="section-title">My Orders</h2>
                {orders.length > 0 ? (
                  <div className="orders-list">
                    {orders.map((order) => (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <div>
                            <span className="label">Order #</span>
                            <span className="val">{order.order_number}</span>
                          </div>
                          <div>
                            <span className="label">Date</span>
                            <span className="val">
                              {order.date ? new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </span>
                          </div>
                          <div className={`status-chip ${order.status.toLowerCase().replace(/\s+/g, "-")}`}>
                            {order.status}
                          </div>
                        </div>
                        <div className="order-footer">
                          <span>Total: <strong>{order.total_amount}</strong></span>
                          <div className="order-actions" style={{ display: "flex", gap: 10 }}>
                            {["pending", "processing", "pending payment"].includes(order.status.toLowerCase()) && (
                              <button
                                className="cancel-order-btn"
                                onClick={() => handleCancelOrder(order.id)}
                                style={{ background: "none", border: "1px solid #ef4444", color: "#ef4444", padding: "6px 15px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              className="view-details"
                              onClick={() => setOrderModal(order)}
                              style={{ background: "var(--crimson)", color: "white", border: "none", padding: "6px 15px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-shopping-basket" />
                    <p>You haven&apos;t placed any orders yet.</p>
                    <Link href="/shop" className="btn-shop">Start Shopping</Link>
                  </div>
                )}
              </div>
            )}

            {/* Details Tab */}
            {tab === "details" && (
              <div id="details" className="tab-content active">
                <h2 className="section-title">Account Details</h2>
                {profileMsg && (
                  <div style={{ padding: "10px 14px", background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 8, marginBottom: "1.5rem" }}>
                    {profileMsg}
                  </div>
                )}
                <form onSubmit={handleUpdateProfile} className="details-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name / Username</label>
                      <input type="text" name="username" defaultValue={cleanValue(dbUser.username)} placeholder="Enter your name" />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" value={dbUser.email} readOnly style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed", color: "#64748b", borderColor: "#e2e8f0" }} />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="text" name="phone" defaultValue={cleanValue(dbUser.phone)} placeholder="+91 XXXXX XXXXX" />
                    </div>
                  </div>
                  <button type="submit" className="btn-save">Save Changes</button>
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {tab === "addresses" && (
              <div id="addresses" className="tab-content active">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>My Addresses</h2>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-save"
                    style={{ marginTop: 0, padding: "8px 20px" }}
                  >
                    + Add New Address
                  </button>
                </div>

                {addAddrMsg && (
                  <div style={{ padding: "10px 14px", background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 8, marginBottom: "1.5rem" }}>
                    {addAddrMsg}
                  </div>
                )}

                {/* Add Address Form */}
                {showAddForm && (
                  <div style={{ background: "#fff", padding: "2rem", borderRadius: 12, marginBottom: "2rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }}>
                    <h3 style={{ marginBottom: "1.5rem", fontSize: "1.4rem", fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }}>Add New Address</h3>
                    <form onSubmit={handleAddAddress} className="details-form">
                      <style>{`
                        .lf label { color: #475569; font-weight: 500; font-size: 0.85rem; margin-bottom: 5px; display: block; }
                        .lf input { width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; color: #1e293b; border-radius: 8px; padding: 10px 14px; margin-bottom: 1rem; box-sizing: border-box; }
                        .lf input:focus { border-color: var(--crimson); outline: none; background: #fff; }
                        .lg2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1.5rem; }
                        @media (max-width: 600px) { .lg2 { grid-template-columns: 1fr; } }
                      `}</style>
                      <div className="lf">
                        <label>Label (e.g. Home, Work)</label>
                        <input type="text" name="label" placeholder="Home" />
                        <label>Full Name *</label>
                        <input type="text" name="full_name" required placeholder="Full Name" />
                        <label>Phone Number *</label>
                        <input type="text" name="phone" required placeholder="+91 XXXXX XXXXX" />
                        <label>Address Line 1 *</label>
                        <input type="text" name="address_line_1" required placeholder="Flat / House No., Street" />
                        <label>Address Line 2</label>
                        <input type="text" name="address_line_2" placeholder="Area / Locality (optional)" />
                        <div className="lg2">
                          <div><label>City *</label><input type="text" name="city" required /></div>
                          <div><label>State</label><input type="text" name="state" /></div>
                          <div><label>Pincode *</label><input type="text" name="pincode" required /></div>
                          <div><label>Country</label><input type="text" name="country" defaultValue="India" /></div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
                          <input type="checkbox" name="is_default" id="set_default" style={{ width: "auto" }} />
                          <label htmlFor="set_default" style={{ margin: 0, color: "#1a1a1a" }}>Set as default address</label>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button type="submit" style={{ background: "var(--crimson)", color: "white", fontWeight: 600, padding: "10px 24px", border: "none", borderRadius: 8, cursor: "pointer" }}>Save Address</button>
                          <button type="button" onClick={() => setShowAddForm(false)} style={{ background: "transparent", color: "#64748b", border: "1px solid #cbd5e1", padding: "10px 24px", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* Address cards */}
                {addresses.length > 0 ? (
                  <div className="addresses-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="address-card"
                        style={{ border: `2px solid ${addr.is_default ? "var(--crimson)" : "#f1f1f1"}`, padding: "1.5rem", borderRadius: 12, background: "#fff", position: "relative" }}
                      >
                        {addr.is_default && (
                          <span style={{ position: "absolute", top: -10, right: 15, background: "var(--crimson)", color: "white", padding: "2px 10px", borderRadius: 10, fontSize: "0.75rem", fontWeight: "bold" }}>
                            Default
                          </span>
                        )}
                        <h4 style={{ marginBottom: "0.5rem", fontSize: "1.1rem", color: "#1a1a1a" }}>
                          {addr.full_name}
                          {addr.label && (
                            <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, fontSize: "0.8rem", color: "#475569", marginLeft: 8 }}>
                              {addr.label}
                            </span>
                          )}
                        </h4>
                        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "0.2rem" }}>📞 {addr.phone}</p>
                        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "0.2rem", lineHeight: 1.4 }}>
                          📍 {addr.address_line_1}
                          {addr.address_line_2 && <><br />{addr.address_line_2}</>}<br />
                          {addr.city}, {addr.state} {addr.pincode}<br />
                          {addr.country}
                        </p>
                        <div style={{ display: "flex", gap: 10, marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f1f1f1" }}>
                          {!addr.is_default && (
                            <button
                              onClick={() => handleSetDefault(addr.id)}
                              style={{ background: "none", border: "none", color: "var(--crimson)", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", marginLeft: "auto" }}
                          >
                            <i className="fas fa-trash" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-map-marked-alt" />
                    <p>You haven&apos;t saved any addresses yet.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Order Detail Modal */}
      {orderModal && (
        <div
          className="modal"
          style={{ display: "block", position: "fixed", zIndex: 1000, left: 0, top: 0, width: "100%", height: "100%", overflow: "auto", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOrderModal(null); }}
        >
          <div
            className="modal-content"
            style={{ background: "#fefefe", margin: "5% auto", padding: 0, width: "90%", maxWidth: 700, borderRadius: 20, boxShadow: "0 20px 50px rgba(0,0,0,0.15)", animation: "modalSlide 0.4s ease" }}
          >
            <div style={{ padding: "20px 30px", borderBottom: "1px solid #f1f1f1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }}>Order Details</h2>
              <span
                onClick={() => setOrderModal(null)}
                style={{ color: "#aaa", fontSize: 28, fontWeight: "bold", cursor: "pointer", lineHeight: 1 }}
              >&times;</span>
            </div>
            <div style={{ padding: 30 }}>
              {/* Order info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: 10 }}>
                <div><span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Order Number</span><strong>#{orderModal.order_number}</strong></div>
                <div><span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Date</span><strong>{orderModal.date ? new Date(orderModal.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</strong></div>
                <div><span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Status</span><span className={`status-chip ${orderModal.status.toLowerCase().replace(/\s+/g, "-")}`}>{orderModal.status}</span></div>
                <div><span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Payment</span><strong>{orderModal.payment_status}</strong></div>
                <div style={{ gridColumn: "span 2" }}><span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Total</span><strong style={{ fontSize: "1.2rem", color: "var(--crimson)" }}>{orderModal.total_amount}</strong></div>
              </div>

              {/* Items */}
              {(orderModal.items ?? []).map((item: OrderItem) => {
                const p = item.product as Product | undefined;
                return (
                  <div key={item.id} className="modal-item" style={{ display: "flex", gap: 20, padding: "15px 0", borderBottom: "1px solid #f8f8f8", alignItems: "center" }}>
                    {p && (
                      <img src={p.img} alt={p.name} style={{ width: 70, height: 90, objectFit: "cover", borderRadius: 10 }} />
                    )}
                    <div className="item-info">
                      <h4 style={{ margin: "0 0 5px 0", fontSize: "1rem", color: "#1a1a1a" }}>{p?.name ?? "Product"}</h4>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                        Qty: {item.quantity} × {item.price_at_time}
                      </p>
                      {item.variation_details && (
                        <span className="variation-tag" style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", color: "#475569", marginTop: 4, display: "inline-block" }}>
                          {item.variation_details}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Shipping address */}
              {orderModal.shipping_address && (
                <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: 10 }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: 8 }}>Shipping Address</span>
                  <pre style={{ margin: 0, fontFamily: "inherit", fontSize: "0.9rem", color: "#1a1a1a", whiteSpace: "pre-wrap" }}>
                    {orderModal.shipping_address}
                  </pre>
                </div>
              )}
            </div>
          </div>
          <style>{`@keyframes modalSlide { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  );
}
