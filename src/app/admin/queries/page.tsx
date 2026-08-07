import { supabaseAdmin } from "@/lib/supabase/admin";
import Pagination from "@/components/ui/Pagination";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { toggleContactMessageStatusAction, deleteContactMessageAction } from "@/actions/admin";
import type { ContactMessage } from "@/types/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const STATUS_TABS = ["", "New", "Read"];

export default async function AdminQueriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp     = await searchParams;
  const page   = parseInt(sp.page ?? "1", 10);
  const from   = (page - 1) * PAGE_SIZE;
  const to     = from + PAGE_SIZE - 1;
  const active = sp.status ?? "";

  let query = supabaseAdmin
    .from("contact_message")
    .select("*", { count: "exact" })
    .order("date", { ascending: false });
  if (active) query = query.eq("status", active);

  const { data: messages, count } = await query.range(from, to);
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const { count: newCount } = await supabaseAdmin
    .from("contact_message")
    .select("*", { count: "exact", head: true })
    .eq("status", "New");

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Contact Queries</h1>
          <p>{count ?? 0} messages{newCount ? ` · ${newCount} new` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {STATUS_TABS.map((s) => (
            <a
              key={s || "all"}
              href={s ? `/admin/queries?status=${s}` : "/admin/queries"}
              className={`btn btn-sm ${active === s ? "btn-primary" : "btn-outline"}`}
            >
              {s || "All"}
            </a>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Message</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {((messages ?? []) as ContactMessage[]).map((msg) => (
                <tr key={msg.id}>
                  <td style={{ fontWeight: 600 }}>{msg.name}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    <a href={`mailto:${msg.email}`} style={{ color: "inherit" }}>{msg.email}</a>
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.875rem" }} title={msg.message}>
                      {msg.message}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    {msg.date ? new Date(msg.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td>
                    <span className={`status-badge ${msg.status === "New" ? "info" : "inactive"}`}>
                      {msg.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-action-btns" style={{ justifyContent: "flex-end" }}>
                      <form action={toggleContactMessageStatusAction}>
                        <input type="hidden" name="message_id" value={msg.id} />
                        <input type="hidden" name="status" value={msg.status} />
                        <button type="submit" className="btn btn-sm btn-outline">
                          {msg.status === "New" ? "Mark as Read" : "Mark as New"}
                        </button>
                      </form>
                      <ConfirmDeleteButton
                        action={deleteContactMessageAction}
                        name="message_id"
                        value={String(msg.id)}
                        message={`Delete the query from "${msg.name}"?`}
                        className="btn-icon delete"
                        label="Delete query"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {(messages ?? []).length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No contact queries found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        buildUrl={(p) => `/admin/queries?page=${p}${active ? `&status=${active}` : ""}`}
      />
    </>
  );
}
