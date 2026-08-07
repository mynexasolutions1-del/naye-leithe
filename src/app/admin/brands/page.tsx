import { supabaseAdmin } from "@/lib/supabase/admin";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { createBrandAction, deleteBrandAction } from "@/actions/admin";
import type { Brand } from "@/types/db";

export default async function AdminBrandsPage() {
  const { data: brands } = await supabaseAdmin.from("brand").select("*").order("name");

  const brandIds = (brands ?? []).map((b: any) => b.id);
  const { data: productCounts } = brandIds.length
    ? await supabaseAdmin.from("product").select("brand_id").in("brand_id", brandIds)
    : { data: [] };

  const countMap: Record<number, number> = {};
  (productCounts ?? []).forEach((p: any) => { countMap[p.brand_id] = (countMap[p.brand_id] ?? 0) + 1; });

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Brands</h1>
          <p>{(brands ?? []).length} brands</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem", alignItems: "flex-start" }}>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Logo</th>
                <th>Brand Name</th>
                <th>Products</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {((brands as Brand[]) ?? []).map((brand) => (
                <tr key={brand.id}>
                  <td>
                    {brand.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brand.logo} alt={brand.name} style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8, border: "1px solid var(--border-color)" }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--sand)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontWeight: 700, fontSize: "1.2rem" }}>
                        {brand.name.slice(0,1)}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{brand.name}</td>
                  <td style={{ color: "var(--text-muted)" }}>{countMap[brand.id] ?? 0} products</td>
                  <td style={{ textAlign: "right" }}>
                    <ConfirmDeleteButton
                      action={deleteBrandAction}
                      name="brand_id"
                      value={String(brand.id)}
                      message={`Delete brand "${brand.name}"?`}
                      label="Delete brand"
                    />
                  </td>
                </tr>
              ))}
              {(brands ?? []).length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No brands yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="order-detail-card" style={{ position: "sticky", top: "80px" }}>
          <div className="card-title">Add New Brand</div>
          <div className="card-body">
            <form action={createBrandAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="admin-form-group">
                <label className="admin-label">Brand Name *</label>
                <input name="name" className="admin-input" placeholder="e.g. Ritu Kumar" required />
              </div>
              <button type="submit" className="btn btn-primary">Add Brand</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
