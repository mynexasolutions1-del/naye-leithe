"use client";
import { useState, useTransition } from "react";
import { createCouponAction, deleteCouponAction, toggleCouponAction } from "@/actions/admin";
import type { Coupon } from "@/types/db";

interface Props { coupons: Coupon[]; }

function CouponsClient({ coupons }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Coupons</h1>
          <p>{coupons.length} coupons</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Coupon</button>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Uses Left</th>
                <th>Expires</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>{c.code}</td>
                  <td style={{ textTransform: "capitalize" }}>{c.type}</td>
                  <td style={{ fontWeight: 600 }}>{c.type === "flat" ? `Rs.${c.discount}` : `${c.discount}%`}</td>
                  <td style={{ color: "var(--text-muted)" }}>Rs.{c.threshold}</td>
                  <td style={{ color: "var(--text-muted)" }}>{c.usage_limit ?? "Unlimited"}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString("en-IN") : "Never"}
                  </td>
                  <td>
                    <span className={`status-badge ${c.is_active ? "active" : "inactive"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-action-btns" style={{ justifyContent: "flex-end" }}>
                      {/* Toggle active */}
                      <form action={toggleCouponAction}>
                        <input type="hidden" name="coupon_id" value={c.id} />
                        <input type="hidden" name="is_active" value={String(c.is_active)} />
                        <button type="submit" className="btn btn-sm btn-outline">
                          {c.is_active ? "Disable" : "Enable"}
                        </button>
                      </form>
                      {/* Delete */}
                      <form action={deleteCouponAction} onSubmit={(e) => { if (!confirm("Delete coupon " + c.code + "?")) e.preventDefault(); }}>
                        <input type="hidden" name="coupon_id" value={c.id} />
                        <button type="submit" className="btn-icon delete" title="Delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No coupons yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coupon Modal */}
      {showModal && (
        <div className="admin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="admin-modal">
            <h2>Add Coupon</h2>
            <form action={createCouponAction} onSubmit={() => setShowModal(false)}>
              <div className="admin-form-group">
                <label className="admin-label">Code *</label>
                <input name="code" className="admin-input" placeholder="e.g. SAVE20" required style={{ textTransform: "uppercase" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="admin-form-group">
                  <label className="admin-label">Type *</label>
                  <select name="type" className="admin-input" required>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (Rs.)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Discount *</label>
                  <input name="discount" type="number" step="0.01" className="admin-input" placeholder="20" required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Min Order (Rs.)</label>
                  <input name="threshold" type="number" step="0.01" className="admin-input" placeholder="0" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Usage Limit</label>
                  <input name="usage_limit" type="number" className="admin-input" placeholder="Unlimited" />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Expiry Date</label>
                <input name="expiry_date" type="date" className="admin-input" />
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Creating…" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CouponsClient;
