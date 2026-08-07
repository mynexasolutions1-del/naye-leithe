import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createAttributeValueAction, deleteAttributeValueAction, updateAttributeValueImageAction } from "@/actions/admin";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";

export const dynamic = "force-dynamic";

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export default async function ManageAttributeValuesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attrId = parseInt(id, 10);
  if (isNaN(attrId)) notFound();

  const { data: attribute } = await supabaseAdmin
    .from("attribute")
    .select("*, values:attribute_value(*)")
    .eq("id", attrId)
    .single();

  if (!attribute) notFound();

  const values = (attribute.values ?? []).sort((a: any, b: any) => a.value.localeCompare(b.value));

  return (
    <>
      <div className="admin-breadcrumb">
        <Link href="/admin/attributes">Attributes</Link> / {attribute.name}
      </div>

      <div className="page-header">
        <div className="header-left">
          <h1>Manage Values: {attribute.name}</h1>
          <p>Add or remove possible values for this attribute, and attach a reference image to each.</p>
        </div>
      </div>

      <div className="manage-values-grid">
        <div className="order-detail-card">
          <div className="card-title">Add New Value</div>
          <div className="card-body">
            <form action={createAttributeValueAction}>
              <input type="hidden" name="attribute_id" value={attribute.id} />
              <div className="admin-form-group">
                <label className="admin-label">Value Content *</label>
                <input
                  type="text"
                  name="value"
                  className="admin-input"
                  placeholder="e.g. -0.50 or Red"
                  required
                  autoFocus
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Value Image (Optional)</label>
                <input type="file" name="image" accept="image/*" className="admin-input" />
                <p className="form-hint">e.g. a swatch photo for a color value.</p>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                Add Value
              </button>
            </form>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Value</th>
                <th>Image</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {values.map((v: any) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600 }}>{v.value}</td>
                  <td>
                    <form action={updateAttributeValueImageAction} className="value-image-form">
                      <input type="hidden" name="value_id" value={v.id} />
                      <input type="hidden" name="attribute_id" value={attribute.id} />
                      {v.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.image_url} alt="" className="attr-value-thumb" />
                      )}
                      <input type="file" name="image" accept="image/*" required className="value-image-file-input" />
                      <button type="submit" className="btn-icon" title={v.image_url ? "Replace image" : "Upload image"}>
                        <UploadIcon />
                      </button>
                    </form>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <ConfirmDeleteButton
                      action={deleteAttributeValueAction}
                      name="value_id"
                      value={String(v.id)}
                      message={`Remove value "${v.value}" from ${attribute.name}?`}
                      className="btn btn-sm btn-danger"
                      label="Remove"
                    >
                      Remove
                    </ConfirmDeleteButton>
                  </td>
                </tr>
              ))}

              {values.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                    No values yet. Add one on the left.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
