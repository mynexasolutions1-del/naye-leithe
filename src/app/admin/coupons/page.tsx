import { supabaseAdmin } from "@/lib/supabase/admin";
import CouponsClient from "./CouponsClient";
import type { Coupon } from "@/types/db";

export default async function AdminCouponsPage() {
  const { data: coupons } = await supabaseAdmin
    .from("coupon")
    .select("*")
    .order("id", { ascending: false });

  return <CouponsClient coupons={(coupons as Coupon[]) ?? []} />;
}
