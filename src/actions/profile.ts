"use server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getUserId(): Promise<number | null> {
  const user = await getServerUser();
  if (!user) return null;
  const { data } = await supabaseAdmin
    .from("user")
    .select("id")
    .eq("auth_uid", user.id)
    .single();
  return data?.id ?? null;
}

export async function addAddressAction(formData: FormData) {
  const userId = await getUserId();
  if (!userId) return { success: false, message: "Not logged in" };

  const { count } = await supabaseAdmin
    .from("address")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const isFirst = (count ?? 0) === 0;

  const { error } = await supabaseAdmin.from("address").insert({
    user_id: userId,
    label: formData.get("label") as string,
    full_name: formData.get("full_name") as string,
    phone: formData.get("phone") as string,
    address_line_1: formData.get("address_line_1") as string,
    address_line_2: (formData.get("address_line_2") as string) || null,
    city: formData.get("city") as string,
    state: (formData.get("state") as string) || null,
    pincode: formData.get("pincode") as string,
    country: (formData.get("country") as string) || "India",
    is_default: isFirst,
  });

  if (error) return { success: false, message: error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function deleteAddressAction(addressId: number) {
  const userId = await getUserId();
  if (!userId) return { success: false };
  await supabaseAdmin
    .from("address")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);
  revalidatePath("/profile");
  return { success: true };
}

export async function setDefaultAddressAction(addressId: number) {
  const userId = await getUserId();
  if (!userId) return { success: false };
  await supabaseAdmin
    .from("address")
    .update({ is_default: false })
    .eq("user_id", userId);
  await supabaseAdmin
    .from("address")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", userId);
  revalidatePath("/profile");
  return { success: true };
}

export async function cancelOrderAction(orderId: number, reason?: string) {
  const userId = await getUserId();
  if (!userId) return { success: false };
  const { error } = await supabaseAdmin
    .from("order")
    .update({ status: "Cancelled", cancel_reason: reason ?? "Cancelled by customer" })
    .eq("id", orderId)
    .eq("user_id", userId);
  if (error) return { success: false, message: error.message };
  revalidatePath("/profile");
  return { success: true };
}
