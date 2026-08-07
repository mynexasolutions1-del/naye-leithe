import { supabaseAdmin } from "@/lib/supabase/admin";
import Pagination from "@/components/ui/Pagination";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import { approveReviewAction, rejectReviewAction, deleteReviewAction } from "@/actions/admin";

const PAGE_SIZE = 20;

export default async function AdminReviewsPage({
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
    .from("review")
    .select("*, product(id, name)", { count: "exact" })
    .order("date", { ascending: false });
  if (active) query = query.eq("status", active);

  const { data: reviews, count } = await query.range(from, to);
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const STATUS_TABS = ["", "Pending", "Approved", "Rejected"];

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Reviews</h1>
          <p>{count ?? 0} reviews</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {STATUS_TABS.map((s) => (
            <a
              key={s || "all"}
              href={s ? `/admin/reviews?status=${s}` : "/admin/reviews"}
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
                <th>Reviewer</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(reviews ?? []).map((review: any) => (
                <tr key={review.id}>
                  <td style={{ fontWeight: 600 }}>
                    {review.customer_name}
                    {review.customer_location && (
                      <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 400 }}>{review.customer_location}</span>
                    )}
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{review.product?.name ?? "—"}</td>
                  <td>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} style={{ color: i < review.rating ? "#f59e0b" : "#d1d5db" }}>★</span>
                    ))}
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.875rem" }}>{review.comment}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${review.status === "Approved" ? "approved" : review.status === "Rejected" ? "error" : "pending"}`}>
                      {review.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    {review.date ? new Date(review.date).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td>
                    <div className="admin-action-btns" style={{ justifyContent: "flex-end" }}>
                      {review.status !== "Approved" && (
                        <form action={approveReviewAction}>
                          <input type="hidden" name="review_id" value={review.id} />
                          <button type="submit" className="btn btn-sm" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "none" }}>Approve</button>
                        </form>
                      )}
                      {review.status !== "Rejected" && (
                        <form action={rejectReviewAction}>
                          <input type="hidden" name="review_id" value={review.id} />
                          <button type="submit" className="btn btn-sm btn-outline">Reject</button>
                        </form>
                      )}
                      <ConfirmDeleteButton
                        action={deleteReviewAction}
                        name="review_id"
                        value={String(review.id)}
                        message="Delete this review permanently?"
                        label="Delete review"
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {(reviews ?? []).length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No reviews found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        buildUrl={(p) => `/admin/reviews?page=${p}${active ? `&status=${active}` : ""}`}
      />
    </>
  );
}
