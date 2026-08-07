import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getServerUser();
  if (!user) return Response.json({ success: false, message: "Not authenticated" }, { status: 401 });

  const { data: dbUser } = await supabaseAdmin
    .from("user")
    .select("id")
    .eq("auth_uid", user.id)
    .single();
  if (!dbUser) return Response.json({ success: false, message: "User not found" }, { status: 404 });

  const { data: order } = await supabaseAdmin
    .from("order")
    .select("id, user_id, status")
    .eq("id", parseInt(id))
    .single();

  if (!order || order.user_id !== dbUser.id) {
    return Response.json({ success: false, message: "Order not found." }, { status: 404 });
  }

  const cancellable = ["pending", "processing", "pending payment"];
  if (!cancellable.includes(order.status.toLowerCase())) {
    return Response.json({ success: false, message: "This order cannot be cancelled." }, { status: 400 });
  }

  await supabaseAdmin
    .from("order")
    .update({ status: "Cancelled", cancel_reason: "Cancelled by customer" })
    .eq("id", order.id);

  return Response.json({ success: true });
}
