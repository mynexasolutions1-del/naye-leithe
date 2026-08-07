import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 30;

const statusClass: Record<string, string> = {
  Processing: "info", Pending: "pending",
  "Pending Payment": "pending-payment",
  Shipped: "shipped", Delivered: "delivered", Cancelled: "cancelled",
};

const STATUS_TABS = ["", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp     = await searchParams;
  const page   = parseInt(sp.page ?? "1", 10);
  const from   = (page - 1) * PAGE_SIZE;
  const to     = from + PAGE_SIZE - 1;
  const active = sp.status ?? "";

  let query = supabaseAdmin
    .from("order")
    .select("*, user:user(id, email, username)", { count: "exact" })
    .order("date", { ascending: false });
  if (active) query = query.eq("status", active);

  const { data: orders, count } = await query.range(from, to);
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (active) params.set("status", active);
    params.set("page", String(p));
    return `/admin/orders?${params.toString()}`;
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Orders</h1>
          <p>{count ?? 0} orders</p>
        </div>
        {/* Status tabs */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {STATUS_TABS.map((s) => (
            <Link
              key={s || "all"}
              href={s ? `/admin/orders?status=${encodeURIComponent(s)}` : "/admin/orders"}
              className={`btn btn-sm ${active === s ? "btn-primary" : "btn-outline"}`}
            >
              {s || "All"}
            </Link>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((order: any) => (
                <tr key={order.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.95rem", fontWeight: 700 }}>{order.order_number}</td>
                  <td style={{ fontWeight: 500 }}>{order.user?.username || order.user?.email || "—"}</td>
                  <td style={{ fontWeight: 600 }}>{order.total_amount}</td>
                  <td style={{ color: "var(--text-muted)" }}>{order.payment_method}</td>
                  <td><span className={`status-badge ${statusClass[order.status] ?? ""}`}>{order.status}</span></td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    {order.date ? new Date(order.date).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className="btn btn-sm btn-outline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {(orders ?? []).length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} buildUrl={buildUrl} />
    </>
  );
}
