import { supabaseAdmin } from "@/lib/supabase/admin";
import SettingsClient from "@/components/admin/SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const { data: configs } = await supabaseAdmin.from("app_config").select("*");
  const cfg: Record<string, string> = {};
  (configs ?? []).forEach((c: any) => { cfg[c.key] = c.value; });

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Store Settings</h1>
          <p>Manage your payment methods, shipping charges, and store configurations.</p>
        </div>
      </div>

      <SettingsClient cfg={cfg} />
    </>
  );
}
