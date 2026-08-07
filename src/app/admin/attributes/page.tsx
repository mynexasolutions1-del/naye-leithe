import { supabaseAdmin } from "@/lib/supabase/admin";
import AttributesClient from "@/components/admin/AttributesClient";
import type { Attribute } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function AdminAttributesPage() {
  const { data: attributes } = await supabaseAdmin
    .from("attribute")
    .select("*, values:attribute_value(*)")
    .order("name");

  return <AttributesClient attributes={(attributes ?? []) as Attribute[]} />;
}
