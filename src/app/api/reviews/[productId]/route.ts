import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  const user = await getServerUser();
  if (!user) {
    return Response.json({ success: false, message: "Please log in to submit a review." }, { status: 401 });
  }

  const body = await request.json();
  const { rating, comment } = body;

  if (!rating || rating < 1 || rating > 5) {
    return Response.json({ success: false, message: "Invalid rating." }, { status: 400 });
  }

  // Get user DB record
  const { data: dbUser } = await supabaseAdmin
    .from("user")
    .select("id, username, email")
    .eq("auth_uid", user.id)
    .single();

  if (!dbUser) {
    return Response.json({ success: false, message: "User not found." }, { status: 404 });
  }

  // Check existing review
  const { data: existing } = await supabaseAdmin
    .from("review")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", dbUser.id)
    .single();

  if (existing) {
    return Response.json({ success: false, message: "You have already reviewed this product." }, { status: 400 });
  }

  await supabaseAdmin.from("review").insert({
    product_id: productId,
    user_id: dbUser.id,
    customer_name: dbUser.username ?? dbUser.email,
    rating,
    comment: comment ?? null,
    status: "pending",
    is_featured: false,
    date: new Date().toISOString(),
  });

  return Response.json({ success: true, message: "Review submitted! It will appear after approval." });
}
