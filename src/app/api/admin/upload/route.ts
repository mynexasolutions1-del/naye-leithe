import { v2 as cloudinary } from "cloudinary";
import { getServerUser } from "@/lib/supabase/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

    // Allowlist the destination subfolder — never let client input build an
    // arbitrary Cloudinary path.
    const ALLOWED_FOLDERS = new Set(["products", "categories", "subcategories", "attributes"]);
    const requested = (formData.get("folder") as string) || "products";
    const folder = ALLOWED_FOLDERS.has(requested) ? requested : "products";

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: `naya-leithe/${folder}`, resource_type: "image" },
          (err, res) => (err ? reject(err) : resolve(res as { secure_url: string }))
        )
        .end(buffer);
    });

    return Response.json({ url: result.secure_url });
  } catch (err: any) {
    console.error("Admin upload error:", err);
    return Response.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
