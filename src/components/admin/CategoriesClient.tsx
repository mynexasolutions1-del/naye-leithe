"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCategoryAction, updateCategoryAction, deleteCategoryAction,
  createSubcategoryAction, updateSubcategoryAction, deleteSubcategoryAction,
} from "@/actions/admin";
import { uploadFile } from "@/lib/adminImageUpload";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import type { Category, SubCategory } from "@/types/db";

type CategoryWithSubs = Category & { subcategories: SubCategory[] };

interface Props {
  categories: CategoryWithSubs[];
  countMap: Record<number, number>;
}

/* ── Icons ───────────────────────────────────────────────────────────────── */
function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h6l2 2h8a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

/* ── Component ──────────────────────────────────────────────────────────── */
export default function CategoriesClient({ categories, countMap }: Props) {
  const [categoryModal,    setCategoryModal]    = useState<{ mode: "create" } | { mode: "edit"; cat: Category } | null>(null);
  const [subcategoryModal, setSubcategoryModal] = useState<{ mode: "create"; categoryId?: number } | { mode: "edit"; sub: SubCategory } | null>(null);

  return (
    <>
      <div className="page-header">
        <div className="header-left">
          <h1>Categories</h1>
          <p>Manage product categories and collections.</p>
        </div>
        <div className="header-right" style={{ display: "flex", gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={() => setSubcategoryModal({ mode: "create" })}>
            + Add SubCategory
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setCategoryModal({ mode: "create" })}>
            + Add New Category
          </button>
        </div>
      </div>

      <div className="section-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Product Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div className="category-cell">
                      {cat.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cat.img} alt={cat.name} className="cat-thumb" />
                      ) : (
                        <div className="cat-thumb cat-thumb-placeholder"><FolderIcon /></div>
                      )}
                      <div className="category-info">
                        <strong>{cat.name}</strong>
                        <div className="subcategory-list">
                          {(cat.subcategories ?? []).map((sub) => (
                            <span key={sub.id} className="subcat-tag">
                              {sub.img && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={sub.img} alt="" />
                              )}
                              <button
                                type="button"
                                className="subcat-name-btn"
                                title="Edit subcategory"
                                onClick={() => setSubcategoryModal({ mode: "edit", sub })}
                              >
                                {sub.name}
                              </button>
                              <ConfirmDeleteButton
                                action={deleteSubcategoryAction}
                                name="sub_id"
                                value={String(sub.id)}
                                message={`Remove subcategory "${sub.name}"?`}
                                className="subcat-remove-btn"
                                label="Remove"
                              >
                                ×
                              </ConfirmDeleteButton>
                            </span>
                          ))}
                          {(cat.subcategories ?? []).length === 0 && (
                            <span className="subcat-empty">No subcategories yet</span>
                          )}
                          <button
                            type="button"
                            className="subcat-add-btn"
                            onClick={() => setSubcategoryModal({ mode: "create", categoryId: cat.id })}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{countMap[cat.id] ?? 0}</td>
                  <td><span className="status-badge success">Active</span></td>
                  <td>
                    <div className="admin-action-btns">
                      <button
                        type="button"
                        className="btn-icon"
                        title="Edit category"
                        onClick={() => setCategoryModal({ mode: "edit", cat })}
                      >
                        <PencilIcon />
                      </button>
                      <ConfirmDeleteButton
                        action={deleteCategoryAction}
                        name="category_id"
                        value={String(cat.id)}
                        message={`Delete category "${cat.name}"? This may affect products assigned to it.`}
                        className="btn-icon delete"
                        label="Delete category"
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    No categories yet. Click &ldquo;+ Add New Category&rdquo; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {categoryModal && (
        <CategoryModal
          initial={categoryModal.mode === "edit" ? categoryModal.cat : null}
          onClose={() => setCategoryModal(null)}
        />
      )}

      {subcategoryModal && (
        <SubcategoryModal
          categories={categories}
          initial={subcategoryModal.mode === "edit" ? subcategoryModal.sub : null}
          defaultCategoryId={subcategoryModal.mode === "create" ? subcategoryModal.categoryId : undefined}
          onClose={() => setSubcategoryModal(null)}
        />
      )}
    </>
  );
}

/* ── Category modal (create / edit) ────────────────────────────────────── */
function CategoryModal({ initial, onClose }: { initial: Category | null; onClose: () => void }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [name,       setName]       = useState(initial?.name ?? "");
  const [imgFile,    setImgFile]    = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState(initial?.img ?? "");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Category name is required."); return; }
    setSaving(true);
    setError("");
    try {
      let img = imgPreview;
      if (imgFile) img = await uploadFile(imgFile, "categories");

      const result = isEdit
        ? await updateCategoryAction(initial!.id, { name, img })
        : await createCategoryAction({ name, img });

      if (!result.success) throw new Error(result.error ?? "Failed to save category.");

      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to save category. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={() => !saving && onClose()}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2>{isEdit ? "Edit Category" : "Add New Category"}</h2>
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
            <label className="admin-label">Category Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarees"
              className="admin-input"
              autoFocus
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Category Image</label>
            {imgPreview && (
              <div className="current-img-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgPreview} alt="Category" />
                <span>{imgFile ? "New image selected" : "Current image"}</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="admin-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImgFile(file);
                setImgPreview(URL.createObjectURL(file));
              }}
            />
            <p className="form-hint">Upload a representative image for this category.</p>
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="admin-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Subcategory modal (create / edit) ─────────────────────────────────── */
function SubcategoryModal({
  categories,
  initial,
  defaultCategoryId,
  onClose,
}: {
  categories: Category[];
  initial: SubCategory | null;
  defaultCategoryId?: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!initial;

  const [categoryId, setCategoryId] = useState(String(initial?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? ""));
  const [name,       setName]       = useState(initial?.name ?? "");
  const [imgFile,    setImgFile]    = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState(initial?.img ?? "");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())   { setError("Subcategory name is required."); return; }
    if (!categoryId)    { setError("Please select a category."); return; }
    setSaving(true);
    setError("");
    try {
      let img = imgPreview;
      if (imgFile) img = await uploadFile(imgFile, "subcategories");

      const data = { category_id: parseInt(categoryId), name, img };
      const result = isEdit
        ? await updateSubcategoryAction(initial!.id, data)
        : await createSubcategoryAction(data);

      if (!result.success) throw new Error(result.error ?? "Failed to save subcategory.");

      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to save subcategory. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={() => !saving && onClose()}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2>{isEdit ? "Edit Subcategory" : "Add Subcategory"}</h2>
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
            <label className="admin-label">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="admin-input"
              required
            >
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Subcategory Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Blouses"
              className="admin-input"
              autoFocus
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Subcategory Image (Optional)</label>
            {imgPreview && (
              <div className="current-img-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgPreview} alt="Subcategory" />
                <span>{imgFile ? "New image selected" : "Current image"}</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="admin-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImgFile(file);
                setImgPreview(URL.createObjectURL(file));
              }}
            />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="admin-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Subcategory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
