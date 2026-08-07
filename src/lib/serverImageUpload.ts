import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_FOLDERS = new Set(["products", "categories", "subcategories", "attributes"]);

/**
 * Server-side Cloudinary upload — for use inside Server Actions that
 * receive a File via FormData directly (no client-side fetch("/api/...")
 * round trip needed). Mirrors /api/admin/upload's folder allowlist.
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: "products" | "categories" | "subcategories" | "attributes" = "products"
): Promise<string> {
  const safeFolder = ALLOWED_FOLDERS.has(folder) ? folder : "products";
  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: `naya-leithe/${safeFolder}`, resource_type: "image" },
        (err, res) => (err ? reject(err) : resolve(res as { secure_url: string }))
      )
      .end(buffer);
  });

  return result.secure_url;
}
