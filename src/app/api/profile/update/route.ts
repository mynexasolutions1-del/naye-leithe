import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) return Response.json({ success: false, message: "Not authenticated" }, { status: 401 });

  const { username, phone } = await request.json();

  const { data: dbUser } = await supabaseAdmin
    .from("user")
    .select("id")
    .eq("auth_uid", user.id)
    .single();
  if (!dbUser) return Response.json({ success: false, message: "User not found" }, { status: 404 });

  await supabaseAdmin
    .from("user")
    .update({ username: username || null, phone: phone || null })
    .eq("id", dbUser.id);

  return Response.json({ success: true });
}
