"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAttributeAction, updateAttributeAction, deleteAttributeAction } from "@/actions/admin";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import type { Attribute } from "@/types/db";

interface Props {
  attributes: Attribute[];
}

export default function AttributesClient({ attributes }: Props) {
  const [modal, setModal] = useState<{ mode: "create" } | { mode: "edit"; attr: Attribute } | null>(null);

  return (
    <>
      <div className="page-header">
        <div className="header-left">
          <h1>Product Attributes</h1>
          <p>Global properties like Color, Size, or Power (SPH) for variable products.</p>
        </div>
        <div className="header-right">
          <button type="button" className="btn btn-primary" onClick={() => setModal({ mode: "create" })}>
            + Add New Attribute
          </button>
        </div>
      </div>

      <div className="section-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Values</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => {
                const values = attr.values ?? [];
                return (
                  <tr key={attr.id}>
                    <td style={{ fontWeight: 700 }}>{attr.name}</td>
                    <td><span className="slug-text">{attr.slug}</span></td>
                    <td>
                      <div className="attr-values-row">
                        {values.map((v) => (
                          <span key={v.id} className="attr-value-pill">
                            {v.image_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={v.image_url} alt="" className="attr-value-thumb" />
                            )}
                            {v.value}
                          </span>
                        ))}
                        {values.length === 0 && (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No values yet</span>
                        )}
                        <Link href={`/admin/attributes/${attr.id}`} className="attr-manage-link">
                          Manage ({values.length}) →
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div className="admin-action-btns" style={{ justifyContent: "flex-end" }}>
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => setModal({ mode: "edit", attr })}>
                          Edit
                        </button>
                        <Link href={`/admin/attributes/${attr.id}`} className="btn btn-sm btn-outline">
                          Manage Values
                        </Link>
                        <ConfirmDeleteButton
                          action={deleteAttributeAction}
                          name="attribute_id"
                          value={String(attr.id)}
                          message={`Delete attribute "${attr.name}"? This will also remove its ${values.length} value${values.length === 1 ? "" : "s"} and detach it from any products.`}
                          className="btn btn-sm btn-danger"
                          label="Delete"
                        >
                          Delete
                        </ConfirmDeleteButton>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {attributes.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    No attributes yet. Click &ldquo;+ Add New Attribute&rdquo; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <AttributeModal
          initial={modal.mode === "edit" ? modal.attr : null}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

/* ── Create / edit attribute modal ─────────────────────────────────────── */
function AttributeModal({ initial, onClose }: { initial: Attribute | null; onClose: () => void }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [name,   setName]   = useState(initial?.name ?? "");
  const [slug,   setSlug]   = useState(initial?.slug ?? "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Attribute name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const result = isEdit
        ? await updateAttributeAction(initial!.id, { name, slug })
        : await createAttributeAction({ name, slug });

      if (!result.success) throw new Error(result.error ?? "Failed to save attribute.");

      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to save attribute. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={() => !saving && onClose()}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2>{isEdit ? "Edit Attribute" : "Add New Attribute"}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-label">Attribute Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fabric or Sleeve"
              className="admin-input"
              autoFocus
              required
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Attribute Slug (Optional)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. fabric"
              className="admin-input"
            />
            <p className="form-hint">Leave blank to auto-generate from the name.</p>
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="admin-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Attribute"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
