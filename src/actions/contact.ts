"use server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function submitContactMessageAction(
  name: string,
  email: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  const cleanName    = name?.trim();
  const cleanEmail   = email?.trim();
  const cleanMessage = message?.trim();

  if (!cleanName || !cleanEmail || !cleanMessage) {
    return { success: false, message: "Please fill in every field." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  const { error } = await supabaseAdmin.from("contact_message").insert({
    name: cleanName,
    email: cleanEmail,
    message: cleanMessage,
    status: "New",
    date: new Date().toISOString(),
  });

  if (error) {
    return { success: false, message: "Something went wrong. Please try again." };
  }

  revalidatePath("/admin/queries");
  return { success: true, message: "Thank you for reaching out. We'll get back to you within 24 hours." };
}
