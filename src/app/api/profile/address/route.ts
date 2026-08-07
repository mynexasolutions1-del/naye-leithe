import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) return Response.json({ success: false, message: "Not authenticated" }, { status: 401 });

  const { data: dbUser } = await supabaseAdmin
    .from("user")
    .select("id")
    .eq("auth_uid", user.id)
    .single();
  if (!dbUser) return Response.json({ success: false, message: "User not found" }, { status: 404 });

  const body = await request.json();

  // If setting as default, unset others first
  if (body.is_default) {
    await supabaseAdmin
      .from("address")
      .update({ is_default: false })
      .eq("user_id", dbUser.id);
  }

  // Check if first address → auto-default
  const { count } = await supabaseAdmin
    .from("address")
    .select("*", { count: "exact", head: true })
    .eq("user_id", dbUser.id);

  await supabaseAdmin.from("address").insert({
    user_id: dbUser.id,
    label: body.label || null,
    full_name: body.full_name,
    phone: body.phone,
    address_line_1: body.address_line_1,
    address_line_2: body.address_line_2 || null,
    city: body.city,
    state: body.state || null,
    pincode: body.pincode,
    country: body.country || "India",
    is_default: body.is_default || (count ?? 0) === 0,
  });

  const { data: addresses } = await supabaseAdmin
    .from("address")
    .select("*")
    .eq("user_id", dbUser.id)
    .order("is_default", { ascending: false });

  return Response.json({ success: true, addresses: addresses ?? [] });
}
