import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getServerUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const attrId = parseInt(id, 10);
  if (isNaN(attrId)) {
    return NextResponse.json({ success: false, error: "Invalid attribute ID" }, { status: 400 });
  }

  let body: { value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const value = body.value?.trim();
  if (!value) {
    return NextResponse.json({ success: false, error: "Value is required" }, { status: 400 });
  }

  // Check if value already exists for this attribute
  const { data: existing } = await supabaseAdmin
    .from("attribute_value")
    .select("id, value")
    .eq("attribute_id", attrId)
    .ilike("value", value)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, existed: true, id: existing.id, value: existing.value });
  }

  const { data, error } = await supabaseAdmin
    .from("attribute_value")
    .insert({ attribute_id: attrId, value })
    .select("id, value")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, existed: false, id: data.id, value: data.value });
}
