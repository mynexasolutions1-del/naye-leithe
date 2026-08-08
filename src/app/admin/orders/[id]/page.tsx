import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrderStatusAction, cancelOrderAction, deleteOrderAction } from "@/actions/admin";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { Package, User, MapPin, CreditCard, ChevronLeft } from "lucide-react";

const statusClass: Record<string, string> = {
  Processing: "info", Pending: "pending",
  "Pending Payment": "pending-payment",
  Shipped: "shipped", Delivered: "delivered", Cancelled: "cancelled",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: order } = await supabaseAdmin
    .from("order")
    .select("*, user:user(id, email, username, phone), items:order_item(*, product(id, name, img))")
    .eq("id", parseInt(id))
    .single();

  if (!order) notFound();

  const statuses = ["Pending", "Processing", "Shipped", "Delivered", "Pending Payment", "Cancelled"];

  return (
    <>
      <div className="admin-page-header">
        <div>
          <Link href="/admin/orders" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
            <ChevronLeft size={16} /> Back to Orders
          </Link>
          <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
            Order #{order.order_number}
            <span className={`status-badge ${statusClass[order.status] ?? ""}`} style={{ fontSize: "0.85rem", transform: "translateY(-2px)", fontFamily: "DM Sans, sans-serif" }}>
              {order.status}
            </span>
          </h1>
          <p style={{ marginTop: 4 }}>
            Placed on {order.date ? new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {order.status.toLowerCase() !== "cancelled" && (
            <ConfirmDeleteButton
              action={cancelOrderAction}
              name="order_id"
              value={String(order.id)}
              message="Cancel this order? This action cannot be easily undone."
              className="btn btn-danger"
              label="Cancel Order"
            >
              Cancel Order
            </ConfirmDeleteButton>
          )}
          <form action={updateOrderStatusAction} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input type="hidden" name="order_id" value={order.id} />
            <select name="status" defaultValue={order.status} className="admin-select">
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="submit" className="btn btn-primary">Update Status</button>
          </form>
          <ConfirmDeleteButton
            action={deleteOrderAction}
            name="order_id"
            value={String(order.id)}
            message="Permanently delete this order? This removes it and its line items for good — this cannot be undone. Any products only referenced by this order become deletable afterward."
            className="btn btn-danger"
            label="Delete Order"
          >
            Delete Order
          </ConfirmDeleteButton>
        </div>
      </div>

      <div className="order-detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="order-detail-card" style={{ marginBottom: 0 }}>
            <div className="card-title"><Package size={18} /> Order Items</div>
            <div className="admin-table-wrap" style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items ?? []).map((item: any) => {
                    const raw = parseFloat((item.price_at_time ?? "0").replace("Rs.","").replace("₹","").replace(/,/g,"").trim()) || 0;
                    return (
                      <tr key={item.id}>
                        <td>
                          {item.product?.id ? (
                            <Link href={`/admin/products/${item.product.id}/edit`} className="admin-product-cell" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}>
                              {item.product?.img && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.product.img} alt="" />
                              )}
                              <div className="product-info">
                                <strong>{item.product?.name ?? "—"}</strong>
                                {item.variation_details && <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>{item.variation_details}</span>}
                              </div>
                            </Link>
                          ) : (
                            <div className="admin-product-cell">
                              <div className="product-info">
                                <strong>Deleted Product</strong>
                              </div>
                            </div>
                          )}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>{item.price_at_time}</td>
                        <td style={{ fontWeight: 500 }}>x{item.quantity}</td>
                        <td className="price-text">₹{(raw * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ padding: "16px", fontWeight: 700, fontSize: "1rem", textAlign: "right" }}>Total Amount</td>
                    <td className="price-text" style={{ padding: "16px", fontSize: "1.1rem" }}>{order.total_amount}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            <div className="order-detail-card" style={{ marginBottom: 0 }}>
              <div className="card-title"><CreditCard size={18} /> Payment Info</div>
              <div className="card-body">
                <div className="order-info-group"><label>Method</label><p>{order.payment_method}</p></div>
                <div className="order-info-group">
                  <label>Status</label>
                  <p><span className={`status-badge ${(order.payment_status ?? "").toLowerCase()}`}>{order.payment_status}</span></p>
                </div>
                {order.amount_paid != null && <div className="order-info-group"><label>Amount Paid</label><p className="price-text">₹{Number(order.amount_paid).toLocaleString("en-IN")}</p></div>}
                {order.razorpay_payment_id && <div className="order-info-group"><label>Razorpay ID</label><p style={{ fontFamily: "monospace", fontSize: "0.85rem", wordBreak: "break-all", color: "var(--text-muted)", marginTop: 4 }}>{order.razorpay_payment_id}</p></div>}
              </div>
            </div>

            <div className="order-detail-card" style={{ marginBottom: 0 }}>
              <div className="card-title"><MapPin size={18} /> Shipping Address</div>
              <div className="card-body">
                <pre style={{ fontFamily: "inherit", fontSize: "0.95rem", color: "var(--text-main)", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  {order.shipping_address || "—"}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="order-detail-card" style={{ marginBottom: 0 }}>
            <div className="card-title"><User size={18} /> Customer Details</div>
            <div className="card-body">
              <div className="order-info-group"><label>Name</label><p>{order.user?.username || "—"}</p></div>
              <div className="order-info-group"><label>Email</label><p>{order.user?.email}</p></div>
              {order.user?.phone && <div className="order-info-group"><label>Phone</label><p>{order.user.phone}</p></div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
