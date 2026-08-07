import "./admin.css";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminToast from "@/components/admin/AdminToast";
import type { ContactMessage } from "@/types/db";

export const metadata = { title: "Admin — Naye Leithe" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth + notification-bell data fetched in parallel — the auth check
  // itself is now near-instant (see getAdminUser: proxy.ts already
  // verified this request via Supabase and forwarded the identity through
  // a trusted header, so there's no second network round-trip here).
  const [user, { data: newMessages, count: newMessageCount }] = await Promise.all([
    getAdminUser(),
    supabaseAdmin
      .from("contact_message")
      .select("*", { count: "exact" })
      .eq("status", "New")
      .order("date", { ascending: false })
      .limit(5),
  ]);

  // Guard: only the admin email may access these routes
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/login?next=/admin");
  }

  return (
    <div className="admin-container" id="adminContainer">
      <AdminSidebar />

      <div className="main-content">
        {/* Sticky top bar */}
        <AdminHeader
          notifications={(newMessages ?? []) as ContactMessage[]}
          notifCount={newMessageCount ?? 0}
        />

        {/* URL-param-driven flash toasts */}
        <Suspense fallback={null}>
          <AdminToast />
        </Suspense>

        {/* Page content */}
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}
