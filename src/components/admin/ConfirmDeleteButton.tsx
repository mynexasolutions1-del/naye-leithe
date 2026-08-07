"use client";

import { useRef, useState } from "react";

interface Props {
  action: (formData: FormData) => Promise<void>;
  name: string;
  value: string;
  label?: string;
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * A client button that opens a styled confirmation modal (matching the
 * admin panel's .admin-modal design) before submitting a server action.
 * Used in server component pages that need delete confirmation — avoids
 * the onSubmit-in-server-component limitation.
 */
export default function ConfirmDeleteButton({
  action,
  name,
  value,
  label = "Delete",
  message = "Are you sure you want to delete this item?",
  className = "btn-icon delete",
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={formRef} action={action} style={{ display: "contents" }}>
        <input type="hidden" name={name} value={value} />
        <button
          type="button"
          className={className}
          title={label}
          onClick={() => setOpen(true)}
        >
          {children ?? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          )}
        </button>
      </form>

      {open && (
        <div className="admin-modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="admin-modal confirm-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-delete-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" /><path d="M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h2 id="confirm-delete-title">Confirm Deletion</h2>
            <p className="confirm-delete-message">{message}</p>
            <div className="admin-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setOpen(false);
                  formRef.current?.requestSubmit();
                }}
                autoFocus
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
