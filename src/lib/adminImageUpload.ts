"use client";

/* ── Shared client-side image helpers for admin forms ─────────────────────
   Used by ProductFormClient and CategoriesClient (and any future admin
   form) to downscale a picked image before sending it to Cloudinary via
   /api/admin/upload. Keeping this in one place avoids re-implementing the
   same canvas/compression logic per form.
   ─────────────────────────────────────────────────────────────────────────── */

/** Downscale + re-encode an image file to keep uploads small and fast. */
export async function compressImage(file: File, maxW = 1000, maxH = 1000, quality = 0.72): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        if (h > maxH) { w = Math.round((w * maxH) / h); h = maxH; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => resolve(new File([blob!], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })),
          "image/jpeg", quality
        );
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Compress and upload a file to Cloudinary via /api/admin/upload, returning its URL. */
export async function uploadFile(file: File, folder: "products" | "categories" | "subcategories" = "products"): Promise<string> {
  const compressed = await compressImage(file);
  const fd = new FormData();
  fd.append("file", compressed);
  fd.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Upload failed (${res.status})`);
  }
  return (await res.json()).url as string;
}
