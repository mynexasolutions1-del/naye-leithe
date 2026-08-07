import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildUrl: (page: number) => string;
}

export default function Pagination({
  currentPage,
  totalPages,
  buildUrl,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="pagination" style={{ display: "flex", gap: 8, justifyContent: "center", margin: "32px 0", flexWrap: "wrap" }}>
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          className="page-btn"
          style={{ padding: "8px 14px", border: "1px solid var(--sand-dark)", borderRadius: 6, color: "var(--crimson)", textDecoration: "none", fontSize: 14 }}
        >
          ← Prev
        </Link>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} style={{ padding: "8px 4px", color: "var(--muted)" }}>…</span>
        ) : (
          <Link
            key={p}
            href={buildUrl(p)}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 14,
              border: p === currentPage ? "1px solid var(--crimson)" : "1px solid var(--sand-dark)",
              background: p === currentPage ? "var(--crimson)" : "transparent",
              color: p === currentPage ? "#fff" : "var(--text)",
            }}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1)}
          className="page-btn"
          style={{ padding: "8px 14px", border: "1px solid var(--sand-dark)", borderRadius: 6, color: "var(--crimson)", textDecoration: "none", fontSize: 14 }}
        >
          Next →
        </Link>
      )}
    </div>
  );
}
