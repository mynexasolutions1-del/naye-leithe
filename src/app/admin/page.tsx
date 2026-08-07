import { supabaseAdmin } from "@/lib/supabase/admin";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { ShoppingBag, Truck, Users, Package, ArrowUp } from "lucide-react";

const getDashboardData = unstable_cache(
  async () => {
    const [
      { count: totalOrders },
      { count: totalUsers },
      { count: totalProducts },
      { count: pendingOrders },
      { data: recentOrders },
      { data: revenueRows },
      { data: lowStock },
    ] = await Promise.all([
      supabaseAdmin.from("order").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("user").select("*",  { count: "exact", head: true }),
      supabaseAdmin.from("product").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("order").select("*", { count: "exact", head: true }).eq("status", "Pending"),
      supabaseAdmin
        .from("order")
        .select("id, order_number, total_amount, status, date, user:user(email, username)")
        .order("date", { ascending: false })
        .limit(8),
      supabaseAdmin.from("order").select("total_amount").eq("payment_status", "Paid"),
      supabaseAdmin.from("product").select("id, name, img, cat_name").eq("stock_status", "outofstock").limit(6),
    ]);

    const revenue = (revenueRows ?? []).reduce((sum: number, o: any) => {
      const n = parseFloat((o.total_amount ?? "0").replace("₹", "").replace(/,/g, "").trim());
      return sum + (isNaN(n) ? 0 : n);
    }, 0);

    return {
      totalOrders:   totalOrders   ?? 0,
      totalUsers:    totalUsers    ?? 0,
      totalProducts: totalProducts ?? 0,
      pendingOrders: pendingOrders ?? 0,
      recentOrders:  recentOrders  ?? [],
      revenue,
      lowStock:      lowStock      ?? [],
    };
  },
  ["admin-dashboard"],
  { revalidate: 60 }
);

const statusClass: Record<string, string> = {
  Processing: "info", Pending: "pending",
  "Pending Payment": "pending-payment",
  Shipped: "shipped", Delivered: "delivered", Cancelled: "cancelled",
};

export default async function AdminDashboard() {
  const { totalOrders, totalUsers, totalProducts, pendingOrders, recentOrders, revenue, lowStock } =
    await getDashboardData();

  const stats = [
    { label: "Total Sales",  value: `₹${revenue.toLocaleString("en-IN")}`, icon: ShoppingBag, change: "+12%", positive: true,  href: "/admin/orders" },
    { label: "Orders",       value: totalOrders,                            icon: Truck,       change: "+5%",  positive: true,  href: "/admin/orders" },
    { label: "Customers",    value: totalUsers,                             icon: Users,       change: "+8%",  positive: true,  href: "/admin/customers" },
    { label: "Products",     value: totalProducts,                          icon: Package,     change: "Active", positive: null, href: "/admin/products" },
  ];

  return (
    <>
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Welcome back, Admin</h1>
          <p>Here&apos;s what&apos;s happening with your store today.</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon, change, positive, href }) => (
          <Link key={label} href={href} className="stat-card">
            <div className="stat-icon" style={{ background: "var(--sand)", color: "var(--primary)" }}>
              <Icon size={20} />
            </div>
            <div className="stat-info">
              <h3>{label}</h3>
              <p className="stat-value">{value}</p>
              <span className={`stat-change${positive === true ? " positive" : ""}`}>
                {positive && <ArrowUp size={14} style={{ display: "inline", marginBottom: "-2px", marginRight: "2px" }} />}
                {change}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-sections">
        <div className="section-card recent-orders">
          <div className="card-header">
            <h2>Recent Orders</h2>
            <Link href="/admin/orders" className="view-all">View All</Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>ORDER ID</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 500 }}>{order.order_number}</td>
                    <td style={{ fontWeight: 500 }}>{order.user?.username || order.user?.email || "—"}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      {order.date ? new Date(order.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ fontWeight: 600 }}>{order.total_amount}</td>
                    <td><span className={`status-badge ${statusClass[order.status] ?? ""}`}>{order.status}</span></td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section-card low-stock">
          <div className="card-header">
            <h2>Low Stock Products</h2>
          </div>
          <ul className="stock-list">
            {lowStock.map((p: any) => (
              <li key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={p.name} />
                <div className="stock-info"><h4>{p.name}</h4><span>Out of Stock</span></div>
                <div className="stock-bar out-of-stock"></div>
              </li>
            ))}
            {lowStock.length === 0 && (
              <li style={{ justifyContent: "center", color: "var(--text-muted)", fontSize: "0.875rem", borderBottom: "none" }}>
                All products in stock 🎉
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
