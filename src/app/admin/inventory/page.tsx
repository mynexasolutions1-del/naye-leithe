import { supabaseAdmin } from "@/lib/supabase/admin";
import { updateInventoryStockAction } from "@/actions/admin";
import Link from "next/link";
import { optimizeCloudinary } from "@/lib/utils";
import type { Product } from "@/types/db";

const PAGE_SIZE = 50;

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>;
}) {
  const { status, category, search } = await searchParams;

  let query = supabaseAdmin
    .from("product")
    .select("id, name, img, price, stock_status, cat_name")
    .order("cat_name")
    .order("name")
    .limit(PAGE_SIZE);

  if (status)   query = query.eq("stock_status", status);
  if (category) query = query.eq("cat_name", category);
  if (search)   query = query.ilike("name", `%${search}%`);

  const { data: products } = await query;

  const { data: categories } = await supabaseAdmin.from("category").select("id, name").order("name");

  const total   = (products ?? []).length;
  const instock = (products ?? []).filter((p: any) => p.stock_status === "instock").length;
  const outstock = total - instock;

  const STATUS_TABS = [
    { value: "",          label: "All Products", count: total },
    { value: "instock",   label: "In Stock",     count: instock },
    { value: "outofstock",label: "Out of Stock",  count: outstock },
  ];

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Inventory</h1>
          <p>Manage stock status for all products</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "1.5rem" }}>
        <div className="stat-card" style={{ cursor: "default" }}>
          <div className="stat-icon" style={{ background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>📦</div>
          <div className="stat-info"><h3>Total Products</h3><div className="stat-value">{total}</div></div>
        </div>
        <div className="stat-card" style={{ cursor: "default" }}>
          <div className="stat-icon" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>✓</div>
          <div className="stat-info"><h3>In Stock</h3><div className="stat-value" style={{ color: "#10b981" }}>{instock}</div></div>
        </div>
        <div className="stat-card" style={{ cursor: "default" }}>
          <div className="stat-icon" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>✗</div>
          <div className="stat-info"><h3>Out of Stock</h3><div className="stat-value" style={{ color: "#ef4444" }}>{outstock}</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="table-filters">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {STATUS_TABS.map(({ value, label, count }) => (
            <a
              key={value || "all"}
              href={value ? `/admin/inventory?status=${value}${category ? `&category=${category}` : ""}` : "/admin/inventory"}
              className={`btn btn-sm ${(status ?? "") === value ? "btn-primary" : "btn-outline"}`}
            >
              {label} ({count})
            </a>
          ))}
        </div>
        <form style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {status && <input type="hidden" name="status" value={status} />}
          <select name="category" defaultValue={category ?? ""} className="admin-select">
            <option value="">All Categories</option>
            {(categories ?? []).map((c: any) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <input name="search" placeholder="Search product…" defaultValue={search} className="admin-search-input" />
          <button type="submit" className="btn btn-secondary">Filter</button>
        </form>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Update Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {((products as Product[]) ?? []).map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-product-cell">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={optimizeCloudinary(p.img, 60)} alt={p.name} />
                      <div className="product-info">
                        <strong>{p.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{p.cat_name}</td>
                  <td style={{ fontWeight: 600 }}>{p.price}</td>
                  <td>
                    <span className={`status-badge ${p.stock_status === "instock" ? "instock" : "outofstock"}`}>
                      {p.stock_status === "instock" ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td>
                    <form action={updateInventoryStockAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="hidden" name="product_id" value={p.id} />
                      <select name="stock_status" defaultValue={p.stock_status} className="admin-select" style={{ fontSize: "0.82rem", padding: "6px 10px" }}>
                        <option value="instock">In Stock</option>
                        <option value="outofstock">Out of Stock</option>
                      </select>
                      <button type="submit" className="btn btn-sm btn-primary">Update</button>
                    </form>
                  </td>
                  <td>
                    <Link href={`/admin/products/${p.id}/edit`} className="btn-icon" title="Edit product">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
              {(products ?? []).length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
