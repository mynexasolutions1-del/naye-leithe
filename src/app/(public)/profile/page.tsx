import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ProfileClient from "./ProfileClient";
import type { Address, Order } from "@/types/db";

export const metadata: Metadata = { title: "My Profile | Naye Leithe" };

export default async function ProfilePage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/profile");

  const { data: dbUser } = await supabaseAdmin
    .from("user")
    .select("*")
    .eq("auth_uid", user.id)
    .single();

  if (!dbUser) redirect("/login");

  const { data: orders } = await supabaseAdmin
    .from("order")
    .select("*, items:order_item(*,product(*))")
    .eq("user_id", dbUser.id)
    .order("date", { ascending: false });

  const { data: addresses } = await supabaseAdmin
    .from("address")
    .select("*")
    .eq("user_id", dbUser.id)
    .order("is_default", { ascending: false });

  return (
    <ProfileClient
      dbUser={dbUser}
      orders={(orders ?? []) as Order[]}
      addresses={(addresses ?? []) as Address[]}
    />
  );
}
