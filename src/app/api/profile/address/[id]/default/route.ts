import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) return Response.json({ success: false }, { status: 401 });

  const { data: dbUser } = await supabaseAdmin
    .from("user")
    .select("id")
    .eq("auth_uid", user.id)
    .single();
  if (!dbUser) return Response.json({ success: false }, { status: 404 });

  // Unset all defaults for this user
  await supabaseAdmin
    .from("address")
    .update({ is_default: false })
    .eq("user_id", dbUser.id);

  // Set new default
  await supabaseAdmin
    .from("address")
    .update({ is_default: true })
    .eq("id", parseInt(id))
    .eq("user_id", dbUser.id);

  const { data: addresses } = await supabaseAdmin
    .from("address")
    .select("*")
    .eq("user_id", dbUser.id)
    .order("is_default", { ascending: false });

  return Response.json({ success: true, addresses: addresses ?? [] });
}
