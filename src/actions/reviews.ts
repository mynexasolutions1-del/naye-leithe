"use server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addReviewAction(
  productId: string,
  rating: number,
  comment: string,
  customerName: string,
  customerLocation?: string
) {
  const user = await getServerUser();

  // Resolve user table id from auth uid
  let userId: number | null = null;
  if (user) {
    const { data } = await supabaseAdmin
      .from("user")
      .select("id")
      .eq("auth_uid", user.id)
      .single();
    userId = data?.id ?? null;
  }

  const { error } = await supabaseAdmin.from("review").insert({
    product_id: productId,
    user_id: userId,
    rating,
    comment,
    customer_name: customerName,
    customer_location: customerLocation ?? null,
    status: "Pending",
    is_featured: false,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/product/${productId}`);
  return { success: true, message: "Review submitted! It will be visible after approval." };
}
