"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteProductAction } from "@/actions/admin";
import { optimizeCloudinary } from "@/lib/utils";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import type { Category } from "@/types/db";

function getAttributeNames(product: any): string[] {
  return (product.attributes ?? []).map((pa: any) => pa.attribute?.name ?? String(pa.attribute_id));
}

/* ── Edit pencil icon ────────────────────────────────────────────────────── */
function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

/* ── Props ───────────────────────────────────────────────────────────────── */
interface Props {
  products: any[];
  categories: Category[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentFilters: { category: string; status: string; search: string; sort: string };
}

/* ── Component ───────────────────────────────────────────────────────────── */
export default function ProductsClient({
  products,
  categories,
  totalCount,
  currentPage,
  totalPages,
  currentFilters,
}: Props) {
  const router    = useRouter();
  const tbodyRef  = useRef<HTMLTableSectionElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchValue, setSearchValue] = useState(currentFilters.search);

  function buildParams(overrides: Record<string, string> = {}) {
    const p = new URLSearchParams();
    if (currentFilters.category) p.set("category", currentFilters.category);
    if (currentFilters.status)   p.set("status",   currentFilters.status);
    if (currentFilters.search)   p.set("search",   currentFilters.search);
    if (currentFilters.sort && currentFilters.sort !== "newest") p.set("sort", currentFilters.sort);
    p.set("page", "1");
    Object.entries(overrides).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    return p.toString();
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchValue(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const p = new URLSearchParams();
      if (currentFilters.category) p.set("category", currentFilters.category);
      if (currentFilters.status)   p.set("status",   currentFilters.status);
      if (currentFilters.sort && currentFilters.sort !== "newest") p.set("sort", currentFilters.sort);
      if (value.trim()) p.set("search", value.trim());
      p.set("page", "1");
      router.push(`/admin/products${p.size ? `?${p.toString()}` : ""}`);
    }, 400);
  }

  function applyFilter(key: "category" | "status" | "sort", value: string) {
    const qs = buildParams({ [key]: value });
    router.push(`/admin/products${qs ? `?${qs}` : ""}`);
  }

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (currentFilters.category) params.set("category", currentFilters.category);
    if (currentFilters.status)   params.set("status",   currentFilters.status);
    if (currentFilters.search)   params.set("search",   currentFilters.search);
    if (currentFilters.sort && currentFilters.sort !== "newest") params.set("sort", currentFilters.sort);
    params.set("page", String(p));
    return `/admin/products?${params.toString()}`;
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Page header — matches Flask's page-header / header-left / header-right */}
      <div className="page-header">
        <div className="header-left">
          <h1>Products</h1>
          <p>Manage your inventory and product listings.</p>
        </div>
        <div className="header-right">
          <Link href="/admin/products/new" className="btn btn-primary">
            + Add New Product
          </Link>
        </div>
      </div>

      {/* Section card — wraps filters + table + pagination, matches Flask's .section-card */}
      <div className="section-card">

        <div className="table-filters">
          <div className="admin-filter-group">
            <select
              className="admin-select"
              value={currentFilters.category}
              onChange={(e) => applyFilter("category", e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <select
              className="admin-select"
              value={currentFilters.status}
              onChange={(e) => applyFilter("status", e.target.value)}
            >
              <option value="">All Status</option>
              <option value="instock">Active</option>
              <option value="outofstock">Out of Stock</option>
            </select>
            <select
              className="admin-select"
              value={currentFilters.sort}
              onChange={(e) => applyFilter("sort", e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">Name A–Z</option>
              <option value="za">Name Z–A</option>
            </select>
          </div>
          <div className="search-input">
            <input
              type="text"
              placeholder="Search products..."
              value={searchValue}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Table — matches Flask's .table-responsive / #productsTable */}
        <div className="table-responsive">
          <table id="productsTable">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Badge</th>
                <th>Attributes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {products.map((p) => {
                const attrNames = getAttributeNames(p);
                return (
                  <tr key={p.id}>
                    {/* Product cell */}
                    <td>
                      <div className="admin-product-cell">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={optimizeCloudinary(p.img, 60)} alt={p.name} />
                        <div className="product-info">
                          <strong>{p.name}</strong>
                          <span className="prod-id">ID: {String(p.id).slice(0, 8)}</span>
                          {p.product_type === "simple" && (
                            <span className="simple-tag">Simple Product</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>{p.cat_name ?? "—"}</td>

                    {/* Price */}
                    <td><span className="price-text">{p.price}</span></td>

                    {/* Badge */}
                    <td><span className="badge-tag">{p.badge ?? "—"}</span></td>

                    {/* Attributes */}
                    <td>
                      {p.product_type === "simple" ? (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      ) : attrNames.length > 0 ? (
                        <div className="attribute-summary">
                          {attrNames.map((name) => (
                            <div key={name} style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>{name}</div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>

                    {/* Status — Flask uses 'success' / 'warning' classes */}
                    <td>
                      <span className={`status-badge ${p.stock_status === "instock" ? "success" : "warning"}`}>
                        {p.stock_status === "instock" ? "Active" : "Out of Stock"}
                      </span>
                    </td>

                    {/* Actions — btn-icon style matching Flask */}
                    <td>
                      <div className="admin-action-btns">
                        <Link href={`/admin/products/${p.id}/edit`} className="btn-icon" title="Edit">
                          <PencilIcon />
                        </Link>
                        <ConfirmDeleteButton
                          action={deleteProductAction}
                          name="product_id"
                          value={String(p.id)}
                          message={`Are you sure you want to delete this product?`}
                          className="btn-icon delete"
                          label="Delete"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — matches Flask's .admin-pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination">
            {currentPage > 1 && (
              <Link href={pageUrl(currentPage - 1)} className="page-btn">‹ Prev</Link>
            )}
            <span className="page-info">
              Page {currentPage} of {totalPages} ({totalCount} products)
            </span>
            {currentPage < totalPages && (
              <Link href={pageUrl(currentPage + 1)} className="page-btn">Next ›</Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
