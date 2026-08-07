import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import Pagination from "@/components/ui/Pagination";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { deleteCustomerAction } from "@/actions/admin";

const PAGE_SIZE = 30;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const sp   = await searchParams;
  const page = parseInt(sp.page ?? "1", 10);
  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  let query = supabaseAdmin
    .from("user")
    .select("id, email, username, phone, join_date", { count: "exact" })
    .order("join_date", { ascending: false });
  if (sp.search) query = query.ilike("email", `%${sp.search}%`);

  const { data: users, count } = await query.range(from, to);

  const userIds = (users ?? []).map((u: any) => u.id);
  const { data: orderCounts } = userIds.length
    ? await supabaseAdmin.from("order").select("user_id").in("user_id", userIds)
    : { data: [] };

  const countMap: Record<number, number> = {};
  (orderCounts ?? []).forEach((o: any) => { countMap[o.user_id] = (countMap[o.user_id] ?? 0) + 1; });

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Customers</h1>
          <p>{count ?? 0} registered customers</p>
        </div>
        <form style={{ display: "flex", gap: "0.5rem" }}>
          <input name="search" placeholder="Search by email..." defaultValue={sp.search} className="admin-search-input" style={{ minWidth: 220 }} />
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
      </div>

      <div className="admin-table-wrap">
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((user: any) => {
                const initials = (user.username || user.email || "?").slice(0, 1).toUpperCase();
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="avatar-circle">{initials}</div>
                        <span style={{ fontWeight: 600 }}>{user.username || "—"}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{user.email}</td>
                    <td style={{ color: "var(--text-muted)" }}>{user.phone || "—"}</td>
                    <td>
                      <Link href={`/admin/orders?customer_id=${user.id}`} style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none", fontSize: "0.875rem" }}>
                        {countMap[user.id] ?? 0} orders
                      </Link>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      {user.join_date ? new Date(user.join_date).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td>
                      <ConfirmDeleteButton
                        action={deleteCustomerAction}
                        name="user_id"
                        value={String(user.id)}
                        message={`Delete customer ${user.email}? This cannot be undone.`}
                        label="Delete customer"
                      />
                    </td>
                  </tr>
                );
              })}
              {(users ?? []).length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} buildUrl={(p) => `/admin/customers?page=${p}${sp.search ? `&search=${sp.search}` : ""}`} />
    </>
  );
}
