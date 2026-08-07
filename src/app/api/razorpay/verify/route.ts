import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, order_id } = data;

    // Get key secret from app_config
    const { data: secretRow } = await supabaseAdmin
      .from("app_config")
      .select("value")
      .eq("key", "razorpay_key_secret")
      .single();

    if (!secretRow) return Response.json({ success: false, message: "Config error" }, { status: 500 });

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig = crypto
      .createHmac("sha256", secretRow.value)
      .update(body)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return Response.json({ success: false, message: "Payment verification failed" }, { status: 400 });
    }

    // Update order
    const { data: order } = await supabaseAdmin
      .from("order")
      .select("total_amount, payment_method")
      .eq("id", order_id)
      .single();

    if (order) {
      const totalClean = parseFloat(
        order.total_amount.replace("₹", "").replace(/,/g, "").trim()
      );

      let amountPaid = totalClean;
      let paymentStatus = "Paid";

      if (order.payment_method === "Partial") {
        const { data: pctRow } = await supabaseAdmin
          .from("app_config")
          .select("value")
          .eq("key", "partial_payment_percentage")
          .single();
        const pct = parseInt(pctRow?.value ?? "50");
        amountPaid = totalClean * (pct / 100);
        paymentStatus = "Partially Paid";
      }

      await supabaseAdmin.from("order").update({
        status: "Processing",
        payment_status: paymentStatus,
        amount_paid: amountPaid,
        razorpay_payment_id: razorpay_payment_id,
      }).eq("id", order_id);
    }

    // Clear cart and coupon cookies
    const cookieStore = await cookies();
    cookieStore.set("nl_cart", "", { maxAge: 0, path: "/" });
    cookieStore.set("nl_coupon", "", { maxAge: 0, path: "/" });

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
