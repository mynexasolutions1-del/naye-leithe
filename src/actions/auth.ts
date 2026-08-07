"use server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAction(email: string, password: string) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Return the actual error — never auto-send a password reset.
    // "Invalid login credentials" means the account doesn't exist in Supabase
    // Auth yet (only in the legacy user table), or the password is wrong.
    return {
      success: false,
      message: "Invalid email or password. Please check your credentials.",
    };
  }

  revalidatePath("/");
  return { success: true };
}

export async function signupAction(email: string, password: string, name: string) {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");

  // Create the account pre-confirmed via the admin API — no confirmation
  // email is sent and no click-through step is required. (Email
  // confirmation + password reset are disabled for now; revisit later.)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) return { success: false, message: error.message };

  if (data.user) {
    await supabaseAdmin.from("user").insert({
      email,
      username: name,
      auth_uid: data.user.id,
      is_admin: false,
    });
  }

  // Sign them in immediately so they land logged in, not stuck at login.
  const supabase = await createSupabaseServer();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { success: true, message: "Account created! Please log in.", loggedIn: false };
  }

  revalidatePath("/");
  return { success: true, message: "Account created!", loggedIn: true };
}

export async function logoutAction() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
