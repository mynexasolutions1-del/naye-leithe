"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProductAction, updateProductAction } from "@/actions/admin";
import { uploadFile } from "@/lib/adminImageUpload";
import type { Product, Category, SubCategory, Brand, Attribute, AttributeValue } from "@/types/db";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type ProductFull = Product & {
  images?: Array<{ id: number; img_url: string }>;
  attributes?: Array<{ attribute_id: number; attribute?: Attribute & { values?: AttributeValue[] } }>;
  variations?: Array<{
    id: number;
    price?: string;
    img_url?: string;
    stock_status: string;
    options?: Array<{
      attribute_value_id: number;
      attribute_value?: AttributeValue & { attribute_id?: number };
    }>;
  }>;
};

type LocalAttribute = Attribute & { values: AttributeValue[] };

interface VarRow {
  key: string;
  attrOptions: Record<string, string>; // {attrId → valueId}
  price: string;
  stock: string;
  imgFile?: File;
  imgPreview: string;
  existingImg: string;
}

interface Props {
  product?: ProductFull;
  categories: Category[];
  subcategories: SubCategory[];
  brands: Brand[];
  attributes: LocalAttribute[];
}

/* ── Component ──────────────────────────────────────────────────────────────── */
export default function ProductFormClient({ product, categories, subcategories, brands, attributes }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  /* ── Basic fields ── */
  const [name,          setName]          = useState(product?.name ?? "");
  const [price,         setPrice]         = useState(product?.price?.replace("₹", "") ?? "");
  const [orig,          setOrig]          = useState(product?.orig?.replace("₹", "") ?? "");
  const [categoryId,    setCategoryId]    = useState(String(product?.category_id ?? ""));
  const [subCategoryId, setSubCategoryId] = useState(String(product?.sub_category_id ?? ""));
  const [brandId,       setBrandId]       = useState(String(product?.brand_id ?? ""));
  const [badge,         setBadge]         = useState(product?.badge ?? "");
  const [productType,   setProductType]   = useState<"simple" | "variable">(product?.product_type ?? "simple");
  const [stockStatus,   setStockStatus]   = useState(product?.stock_status ?? "instock");
  const [isFeatured,    setIsFeatured]    = useState(product?.is_featured ?? false);
  const [isNewArrival,  setIsNewArrival]  = useState(product?.is_new_arrival ?? false);
  const [shortDesc,     setShortDesc]     = useState(product?.short_desc ?? "");
  const [desc,          setDesc]          = useState(product?.desc ?? "");

  /* ── Images ── */
  const [mainImgFile,      setMainImgFile]      = useState<File | null>(null);
  const [mainImgPreview,   setMainImgPreview]   = useState(product?.img ?? "");
  const [galleryFiles,     setGalleryFiles]     = useState<File[]>([]);
  const [removedGallery,   setRemovedGallery]   = useState<number[]>([]);
  const [sizeChartFile,    setSizeChartFile]    = useState<File | null>(null);
  const [sizeChartPreview, setSizeChartPreview] = useState(product?.size_chart ?? "");

  /* ── Attributes — localAttributes holds live list (new attrs added dynamically) ── */
  const [localAttributes, setLocalAttributes] = useState<LocalAttribute[]>(attributes);

  const initCheckedAttrs = new Set((product?.attributes ?? []).map((a) => a.attribute_id));
  const initCheckedValues = (): Map<number, Set<number>> => {
    const map = new Map<number, Set<number>>();
    if (!product) return map;
    const valToAttr = new Map<number, number>();
    for (const pa of product.attributes ?? []) {
      for (const av of pa.attribute?.values ?? []) valToAttr.set(av.id, pa.attribute_id);
    }
    for (const v of product.variations ?? []) {
      for (const o of v.options ?? []) {
        if (o.attribute_value?.attribute_id) valToAttr.set(o.attribute_value_id, o.attribute_value.attribute_id);
      }
    }
    for (const v of product.variations ?? []) {
      for (const o of v.options ?? []) {
        const attrId = valToAttr.get(o.attribute_value_id);
        if (attrId) {
          if (!map.has(attrId)) map.set(attrId, new Set());
          map.get(attrId)!.add(o.attribute_value_id);
        }
      }
    }
    return map;
  };

  const [checkedAttrs,  setCheckedAttrs]  = useState<Set<number>>(initCheckedAttrs);
  const [checkedValues, setCheckedValues] = useState<Map<number, Set<number>>>(initCheckedValues);

  /* ── Quick-add value inputs (per attribute) ── */
  const [quickAddInputs, setQuickAddInputs] = useState<Record<number, string>>({});

  /* ── New attribute modal ── */
  const [showNewAttrModal, setShowNewAttrModal] = useState(false);
  const [newAttrName,      setNewAttrName]      = useState("");
  const [newAttrSlug,      setNewAttrSlug]      = useState("");
  const [creatingAttr,     setCreatingAttr]     = useState(false);

  /* ── Variations ── */
  const initVariations = (): VarRow[] => {
    if (!product?.variations) return [];
    return product.variations.map((v) => ({
      key: String(v.id),
      attrOptions: Object.fromEntries(
        (v.options ?? []).map((o) => [String(o.attribute_value?.attribute_id ?? 0), String(o.attribute_value_id)])
      ),
      price:       v.price?.replace("₹", "") ?? "",
      stock:       v.stock_status ?? "instock",
      imgFile:     undefined,
      imgPreview:  v.img_url ?? "",
      existingImg: v.img_url ?? "",
    }));
  };
  const [variations, setVariations] = useState<VarRow[]>(initVariations);

  /* ── Submit state ── */
  const [submitting,   setSubmitting]   = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  /* ── Helpers ── */
  const filteredSubs = subcategories.filter((s) => !categoryId || s.category_id === parseInt(categoryId));

  const toggleAttr = useCallback((attrId: number, checked: boolean) => {
    setCheckedAttrs((prev) => {
      const next = new Set(prev);
      if (checked) next.add(attrId); else next.delete(attrId);
      return next;
    });
    if (!checked) {
      setCheckedValues((prev) => { const next = new Map(prev); next.delete(attrId); return next; });
    }
  }, []);

  const toggleValue = useCallback((attrId: number, valueId: number, checked: boolean) => {
    setCheckedValues((prev) => {
      const next = new Map(prev);
      const set  = new Set(next.get(attrId) ?? []);
      if (checked) set.add(valueId); else set.delete(valueId);
      next.set(attrId, set);
      return next;
    });
  }, []);

  /* ── Variations ── */
  function addVariation() {
    if (checkedAttrs.size === 0) { alert("Please select at least one attribute first."); return; }
    const defaultOptions: Record<string, string> = {};
    checkedAttrs.forEach((attrId) => {
      const vals = checkedValues.get(attrId);
      if (vals && vals.size > 0) defaultOptions[String(attrId)] = String([...vals][0]);
    });
    setVariations((prev) => [
      ...prev,
      { key: `new-${Date.now()}-${Math.random()}`, attrOptions: defaultOptions, price: "", stock: "instock", imgFile: undefined, imgPreview: "", existingImg: "" },
    ]);
  }

  function generateVariations() {
    const attrData = [...checkedAttrs].map((attrId) => ({
      attrId,
      values: [...(checkedValues.get(attrId) ?? [])],
    })).filter((a) => a.values.length > 0);
    if (attrData.length === 0) { alert("Please select attribute values first."); return; }
    let combos: Record<string, string>[] = [{}];
    for (const { attrId, values } of attrData) {
      const next: Record<string, string>[] = [];
      for (const existing of combos) {
        for (const v of values) next.push({ ...existing, [String(attrId)]: String(v) });
      }
      combos = next;
    }
    setVariations((prev) => [
      ...prev,
      ...combos.map((opts) => ({
        key: `gen-${Date.now()}-${Math.random()}`,
        attrOptions: opts,
        price: "",
        stock: "instock",
        imgFile: undefined,
        imgPreview: "",
        existingImg: "",
      })),
    ]);
  }

  function removeVariation(key: string) { setVariations((prev) => prev.filter((v) => v.key !== key)); }
  function updateVarOption(key: string, attrId: number, valueId: string) {
    setVariations((prev) => prev.map((v) => v.key === key ? { ...v, attrOptions: { ...v.attrOptions, [String(attrId)]: valueId } } : v));
  }
  function updateVarField(key: string, field: "price" | "stock", value: string) {
    setVariations((prev) => prev.map((v) => v.key === key ? { ...v, [field]: value } : v));
  }
  function updateVarImg(key: string, file: File) {
    const preview = URL.createObjectURL(file);
    setVariations((prev) => prev.map((v) => v.key === key ? { ...v, imgFile: file, imgPreview: preview } : v));
  }
  function applyBulkUpdate(bulkPrice: string, bulkStock: string) {
    setVariations((prev) => prev.map((v) => ({ ...v, ...(bulkPrice ? { price: bulkPrice } : {}), ...(bulkStock ? { stock: bulkStock } : {}) })));
  }

  /* ── Quick-add value ── */
  async function handleQuickAddValue(attrId: number) {
    const val = (quickAddInputs[attrId] ?? "").trim();
    if (!val) return;
    try {
      const res  = await fetch(`/api/admin/attributes/${attrId}/values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: val }),
      });
      const data = await res.json();
      if (data.success) {
        if (!data.existed) {
          setLocalAttributes((prev) =>
            prev.map((a) =>
              a.id === attrId
                ? { ...a, values: [...a.values, { id: data.id, attribute_id: attrId, value: data.value } as AttributeValue] }
                : a
            )
          );
        }
        // Auto-check the new/existing value
        setCheckedValues((prev) => {
          const next = new Map(prev);
          const set  = new Set(next.get(attrId) ?? []);
          set.add(data.id);
          next.set(attrId, set);
          return next;
        });
        setQuickAddInputs((prev) => ({ ...prev, [attrId]: "" }));
      } else {
        alert("Failed to add value: " + data.error);
      }
    } catch {
      alert("Failed to add value. Please try again.");
    }
  }

  /* ── Create new attribute ── */
  async function handleCreateAttribute() {
    const trimName = newAttrName.trim();
    if (!trimName) { alert("Please enter an attribute name."); return; }
    setCreatingAttr(true);
    try {
      const res  = await fetch("/api/admin/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimName, slug: newAttrSlug.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const newAttr: LocalAttribute = {
          id: data.id, name: data.name, slug: data.slug ?? "",
          type: "select", is_featured: false, values: [],
        };
        setLocalAttributes((prev) => [...prev, newAttr]);
        // Auto-check the new attribute
        setCheckedAttrs((prev) => { const next = new Set(prev); next.add(data.id); return next; });
        setShowNewAttrModal(false);
        setNewAttrName("");
        setNewAttrSlug("");
      } else {
        alert("Failed to create attribute: " + data.error);
      }
    } finally {
      setCreatingAttr(false);
    }
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mainImgPreview && !mainImgFile) { alert("Please select a main product image."); return; }

    setSubmitting(true);
    try {
      let imgUrl = mainImgPreview;
      if (mainImgFile) { setSubmitStatus("Uploading main image…"); imgUrl = await uploadFile(mainImgFile); }

      const gallery: string[] = [];
      for (const img of product?.images ?? []) {
        if (!removedGallery.includes(img.id)) gallery.push(img.img_url);
      }
      let gi = 0;
      for (const file of galleryFiles) {
        gi++;
        setSubmitStatus(`Uploading gallery image ${gi}/${galleryFiles.length}…`);
        gallery.push(await uploadFile(file));
      }

      let sizeChartUrl = sizeChartPreview;
      if (sizeChartFile) { setSubmitStatus("Uploading size chart…"); sizeChartUrl = await uploadFile(sizeChartFile); }

      const processedVars: VarRow[] = [];
      let vi = 0;
      for (const vr of variations) {
        vi++;
        let varImg = vr.existingImg;
        if (vr.imgFile) { setSubmitStatus(`Uploading variation ${vi} image…`); varImg = await uploadFile(vr.imgFile); }
        processedVars.push({ ...vr, existingImg: varImg, imgPreview: varImg });
      }

      const cat         = categories.find((c) => c.id === parseInt(categoryId));
      const productData = {
        name,
        price,
        orig: orig || undefined,
        category_id: categoryId ? parseInt(categoryId) : null,
        sub_category_id: subCategoryId ? parseInt(subCategoryId) : null,
        brand_id: brandId ? parseInt(brandId) : null,
        cat_name: cat?.name ?? "",
        badge: badge || undefined,
        product_type: productType,
        stock_status: stockStatus,
        is_featured: isFeatured,
        is_new_arrival: isNewArrival,
        img: imgUrl,
        size_chart: sizeChartUrl || undefined,
        short_desc: shortDesc || undefined,
        desc: desc || undefined,
        gallery,
        attribute_ids: [...checkedAttrs],
        attribute_values: Object.fromEntries([...checkedValues.entries()].map(([k, v]) => [String(k), [...v]])),
        variations: processedVars.map((vr) => ({
          attr_options: vr.attrOptions,
          price: vr.price || undefined,
          stock_status: vr.stock,
          img_url: vr.existingImg || undefined,
        })),
      };

      setSubmitStatus("Saving product…");
      const result = isEdit
        ? await updateProductAction(product!.id, productData)
        : await createProductAction(productData);

      if (!result.success) throw new Error(result.error ?? "Save failed");

      router.push(
        isEdit
          ? `/admin/products?_flash=Product+updated+successfully&_type=success`
          : `/admin/products?_flash=Product+created+successfully&_type=success`
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message ?? "Failed to save product. Please try again.");
      setSubmitting(false);
      setSubmitStatus("");
    }
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* Submit overlay */}
      {submitting && (
        <div className="submit-overlay">
          <div className="submit-overlay-card">
            <div className="submit-spinner" />
            <p>Processing &amp; Uploading…</p>
            <span>{submitStatus || "Please wait"}</span>
          </div>
        </div>
      )}

      {/* New attribute modal — matches Flask's #newAttrModal exactly */}
      {showNewAttrModal && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setShowNewAttrModal(false)}
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2>Add New Attribute</h2>
              <button
                type="button"
                onClick={() => setShowNewAttrModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Attribute Name *</label>
              <input
                type="text"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateAttribute(); } }}
                placeholder="e.g. Fabric or Sleeve"
                className="admin-input"
                autoFocus
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Attribute Slug (Optional)</label>
              <input
                type="text"
                value={newAttrSlug}
                onChange={(e) => setNewAttrSlug(e.target.value)}
                placeholder="e.g. fabric"
                className="admin-input"
              />
            </div>
            <div className="admin-modal-footer">
              <button type="button" onClick={() => setShowNewAttrModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleCreateAttribute} className="btn btn-primary" disabled={creatingAttr}>
                {creatingAttr ? "Creating…" : "Create Attribute"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="page-header">
        <h1>{isEdit ? "Edit Product" : "Add New Product"}</h1>
        <p>{isEdit ? "Update the details of your product listing." : "Create a new product listing in your store."}</p>
      </div>

      <div className="section-card">
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-grid">

            {/* Product Name */}
            <div className="form-group">
              <label>Product Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Floral Silk Saree" required />
            </div>

            {/* Regular Price */}
            <div className="form-group">
              <label>Regular Price (Shown as cutted)</label>
              <div className="input-with-prefix">
                <span className="prefix">₹</span>
                <input type="text" value={orig} onChange={(e) => setOrig(e.target.value)} placeholder="2,999" />
              </div>
            </div>

            {/* Sale Price */}
            <div className="form-group">
              <label>Sales Price (Highlighted)</label>
              <div className="input-with-prefix">
                <span className="prefix">₹</span>
                <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2,499" required />
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label>Category</label>
              <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubCategoryId(""); }} required>
                <option value="">Select Category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* SubCategory */}
            <div className="form-group">
              <label>SubCategory</label>
              <select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)}>
                <option value="">Select SubCategory…</option>
                {filteredSubs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Brand */}
            <div className="form-group">
              <label>Brand</label>
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                <option value="">Select Brand…</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Badge */}
            <div className="form-group">
              <label>Badge (Optional)</label>
              <input type="text" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="New, Trending, etc." />
            </div>

            {/* Product Type */}
            <div className="form-group">
              <label>Product Type</label>
              <select value={productType} onChange={(e) => setProductType(e.target.value as "simple" | "variable")}>
                <option value="simple">Simple Product</option>
                <option value="variable">Variable Product</option>
              </select>
            </div>

            {/* Stock Status */}
            <div className="form-group">
              <label>Stock Status</label>
              <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}>
                <option value="instock">In Stock</option>
                <option value="outofstock">Out of Stock</option>
              </select>
            </div>

            {/* Featured */}
            <div className="form-group featured-toggle">
              <label className="checkbox-container">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                <span className="checkmark" />
                Feature on Homepage
              </label>
              <p className="form-hint">Highlight this product in the &apos;Featured Products&apos; section.</p>
            </div>

            {/* New Arrival */}
            <div className="form-group new-arrival-toggle">
              <label className="checkbox-container">
                <input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} />
                <span className="checkmark" />
                Mark as New Arrival
              </label>
              <p className="form-hint">Highlight this product in the &apos;New Arrivals&apos; section.</p>
            </div>

            {/* ── Attributes Section — only relevant for variable products,
                since attributes here exist to drive variation generation ── */}
            <div
              id="attributeSelectionSection"
              className="form-group full-width"
              style={{ display: productType === "variable" ? "block" : "none" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ marginBottom: 0, fontWeight: 700, fontSize: "1.05rem" }}>
                  Select Product Attributes &amp; Options (Size, Color, etc.)
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewAttrModal(true)}
                  className="btn btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                >
                  + Add New Attribute
                </button>
              </div>
              <p className="form-hint" style={{ marginBottom: "1rem" }}>
                Choose which attributes (e.g. Size, Color, Fabric) apply to this product and select their available options.
              </p>

              <div className="attributes-selection-grid" id="mainAttributesGrid">
                {localAttributes.map((attr) => {
                  const isChecked  = checkedAttrs.has(attr.id);
                  const checkedVals = checkedValues.get(attr.id) ?? new Set<number>();
                  return (
                    <div key={attr.id} className="attr-selection-row-container">
                      {/* Attribute header row */}
                      <div className="attr-selection-row">
                        <label className="attr-checkbox-item">
                          <span className="chk-mini">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => toggleAttr(attr.id, e.target.checked)}
                            />
                            <span className="box" />
                          </span>
                          <span className="attr-name">{attr.name}</span>
                        </label>
                        {/* Quick-add value — matches Flask's .quick-add-value */}
                        <div className="quick-add-row">
                          <input
                            type="text"
                            value={quickAddInputs[attr.id] ?? ""}
                            onChange={(e) => setQuickAddInputs((prev) => ({ ...prev, [attr.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleQuickAddValue(attr.id); } }}
                            placeholder={`New ${attr.name}…`}
                          />
                          <button type="button" onClick={() => handleQuickAddValue(attr.id)}>Add</button>
                        </div>
                      </div>

                      {/* Values grid — always rendered; shown when attribute is checked */}
                      <div
                        className="attr-values-grid"
                        style={{ display: isChecked ? "flex" : "none" }}
                      >
                        {(attr.values ?? []).map((val) => (
                          <label key={val.id} className="attr-value-label">
                            <span className="chk-mini">
                              <input
                                type="checkbox"
                                checked={checkedVals.has(val.id)}
                                onChange={(e) => toggleValue(attr.id, val.id, e.target.checked)}
                              />
                              <span className="box" />
                            </span>
                            <span style={{ fontWeight: 500 }}>{val.value}</span>
                          </label>
                        ))}
                        {(attr.values ?? []).length === 0 && (
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            No values yet. Use &quot;Add&quot; above to add values.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {localAttributes.length === 0 && (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    No attributes found. Click &ldquo;+ Add New Attribute&rdquo; to create one.
                  </p>
                )}
              </div>
            </div>

            {/* Main Image */}
            <div className="form-group full-width">
              <label>Main Product Image</label>
              {mainImgPreview && (
                <div className="current-img-preview product-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mainImgPreview} alt="Product" />
                  <span>{mainImgFile ? "New image selected" : "Current Image"}</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setMainImgFile(file);
                  setMainImgPreview(URL.createObjectURL(file));
                }}
              />
              <p className="form-hint">Select the primary image for this product.</p>
            </div>

            {/* Gallery */}
            <div className="form-group full-width">
              <label>Product Gallery (Secondary Images)</label>
              <p className="form-hint">Upload additional images for the product gallery.</p>
              <input type="file" multiple accept="image/*" className="admin-input" onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))} />
              {(product?.images ?? []).length > 0 && (
                <div className="gallery-preview-grid" style={{ display: "flex", gap: 15, flexWrap: "wrap", marginTop: "1rem" }}>
                  {product!.images!.map((img) => (
                    <div key={img.id} className="gallery-preview-item" style={{ position: "relative", border: "1px solid #e2e8f0", padding: 5, borderRadius: 8 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.img_url} alt="Gallery" style={{ width: 70, height: 70, objectFit: "cover", borderRadius: 4 }} />
                      <div style={{ textAlign: "center", marginTop: 5 }}>
                        <label style={{ fontSize: "0.65rem", color: "#ef4444", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={removedGallery.includes(img.id)}
                            onChange={(e) => setRemovedGallery((prev) => e.target.checked ? [...prev, img.id] : prev.filter((i) => i !== img.id))}
                          />
                          {" "}Remove
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Size Chart */}
            <div className="form-group">
              <label>Size Chart Image</label>
              {sizeChartPreview && (
                <div className="current-img-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sizeChartPreview} alt="Size Chart" />
                  <span>{sizeChartFile ? "New chart selected" : "Current Chart"}</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSizeChartFile(file);
                  setSizeChartPreview(URL.createObjectURL(file));
                }}
              />
              <p className="form-hint">Upload an image of the size chart.</p>
            </div>

            {/* Short Description */}
            <div className="form-group full-width">
              <label>Short Description (Displays beside product image)</label>
              <textarea rows={2} value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="Brief summary or highlights…" />
            </div>

            {/* Long Description */}
            <div className="form-group full-width">
              <label>Long Description</label>
              <textarea rows={12} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe your product…" />
            </div>
          </div>

          {/* ── Variations — shown only for variable products ── */}
          <div
            id="variationsSection"
            style={{ display: productType === "variable" ? "block" : "none", marginTop: "2rem", borderTop: "2px solid #f1f5f9", paddingTop: "2rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ marginBottom: "0.25rem" }}>Product Variations</h3>
                <p className="form-hint">Define specific combinations of selected attributes and their price/stock.</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={generateVariations}
                  style={{ background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" }}
                >
                  ✨ Generate All Combinations
                </button>
                <button type="button" className="btn btn-secondary" onClick={addVariation}>
                  + Add Manual
                </button>
              </div>
            </div>

            {/* Bulk update bar */}
            <BulkUpdateBar onApply={applyBulkUpdate} />

            <div id="variationsList" className="variations-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
              {variations.map((vr, idx) => (
                <VariationRow
                  key={vr.key}
                  vr={vr}
                  index={idx + 1}
                  checkedAttrs={checkedAttrs}
                  checkedValues={checkedValues}
                  attributes={localAttributes}
                  onRemove={() => removeVariation(vr.key)}
                  onOptionChange={(attrId, valId) => updateVarOption(vr.key, attrId, valId)}
                  onPriceChange={(val) => updateVarField(vr.key, "price", val)}
                  onStockChange={(val) => updateVarField(vr.key, "stock", val)}
                  onImgChange={(file) => updateVarImg(vr.key, file)}
                />
              ))}
              {variations.length === 0 && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", padding: "1rem" }}>
                  No variations yet. Click &ldquo;Generate All Combinations&rdquo; or &ldquo;Add Manual&rdquo;.
                </p>
              )}
            </div>
          </div>

          {/* Form actions */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Processing…" : isEdit ? "Update Product" : "Save Product"}
            </button>
            <Link href="/admin/products" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </>
  );
}

/* ── BulkUpdateBar ─────────────────────────────────────────────────────────── */
function BulkUpdateBar({ onApply }: { onApply: (price: string, stock: string) => void }) {
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  return (
    <div className="bulk-update-bar">
      <span>Bulk Update:</span>
      <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
      <select value={stock} onChange={(e) => setStock(e.target.value)}>
        <option value="">Stock Status</option>
        <option value="instock">In Stock</option>
        <option value="outofstock">Out of Stock</option>
      </select>
      <button
        type="button"
        className="btn btn-sm btn-secondary"
        onClick={() => { onApply(price, stock); setPrice(""); setStock(""); }}
      >
        Apply to All
      </button>
    </div>
  );
}

/* ── VariationRow ──────────────────────────────────────────────────────────── */
interface VarRowProps {
  vr: VarRow;
  index: number;
  checkedAttrs: Set<number>;
  checkedValues: Map<number, Set<number>>;
  attributes: LocalAttribute[];
  onRemove: () => void;
  onOptionChange: (attrId: number, valueId: string) => void;
  onPriceChange: (val: string) => void;
  onStockChange: (val: string) => void;
  onImgChange: (file: File) => void;
}

function VariationRow({ vr, index, checkedAttrs, checkedValues, attributes, onRemove, onOptionChange, onPriceChange, onStockChange, onImgChange }: VarRowProps) {
  return (
    <div className="variation-item card">
      <div className="var-header">
        <span>Variation #{index}</span>
        <button type="button" className="btn-remove" onClick={onRemove} title="Remove">×</button>
      </div>
      <div className="var-body">
        {[...checkedAttrs].map((attrId) => {
          const attr = attributes.find((a) => a.id === attrId);
          if (!attr) return null;
          const vals       = [...(checkedValues.get(attrId) ?? [])];
          const selectedVal = vr.attrOptions[String(attrId)] ?? "";
          return (
            <div key={attrId} className="var-field var-attr-select">
              <label>{attr.name}</label>
              <select value={selectedVal} onChange={(e) => onOptionChange(attrId, e.target.value)}>
                {vals.map((vId) => {
                  const valObj = attr.values.find((v) => v.id === vId);
                  return <option key={vId} value={vId}>{valObj?.value ?? vId}</option>;
                })}
              </select>
            </div>
          );
        })}
        <div className="var-field var-price-input">
          <label>Price</label>
          <input type="text" value={vr.price} onChange={(e) => onPriceChange(e.target.value)} placeholder="Optional — same as base price" name="var_price[]" />
        </div>
        <div className="var-field var-stock-select">
          <label>Stock</label>
          <select value={vr.stock} onChange={(e) => onStockChange(e.target.value)} name="var_stock[]">
            <option value="instock">In Stock</option>
            <option value="outofstock">Out of Stock</option>
          </select>
        </div>
        <div className="var-field var-img-input">
          <label>Image</label>
          {vr.imgPreview ? (
            <div className="var-img-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vr.imgPreview} alt="Variation" />
            </div>
          ) : (
            <div className="var-img-preview var-img-preview-empty">No image</div>
          )}
          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImgChange(f); }} />
        </div>
      </div>
    </div>
  );
}
