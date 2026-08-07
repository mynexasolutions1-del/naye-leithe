import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";

export async function DELETE(
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

  await supabaseAdmin
    .from("address")
    .delete()
    .eq("id", parseInt(id))
    .eq("user_id", dbUser.id);

  return Response.json({ success: true });
}
