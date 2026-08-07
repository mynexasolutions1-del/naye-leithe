"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function AdminToast() {
  const searchParams = useSearchParams();
  const router      = useRouter();
  const pathname    = usePathname();

  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);

  useEffect(() => {
    const msg  = searchParams.get("_flash");
    const type = searchParams.get("_type") ?? "success";
    if (!msg) return;

    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);

    // Strip flash params from URL (don't cause a new navigation)
    const params = new URLSearchParams(searchParams.toString());
    params.delete("_flash");
    params.delete("_type");
    const qs = params.size ? `?${params.toString()}` : "";
    router.replace(`${pathname}${qs}`, { scroll: false });

    // Auto-hide after 3.5 s
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  if (toasts.length === 0) return null;

  return (
    <div className="admin-toast-container">
      {toasts.map(({ id, msg, type }) => (
        <div key={id} className={`admin-toast ${type}`}>
          <span className="admin-toast-msg">{msg}</span>
          <button
            className="admin-toast-close"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== id))}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
