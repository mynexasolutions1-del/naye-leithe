"use client";
import Link from "next/link";
import { Search, Bell, ChevronDown, Settings, LogOut, ExternalLink } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import type { ContactMessage } from "@/types/db";

export default function AdminHeader({
  notifications = [],
  notifCount = 0,
}: {
  /** Most recent unread ("New") contact queries — real data, not a placeholder. */
  notifications?: ContactMessage[];
  notifCount?: number;
}) {
  function toggleSidebar() {
    document.getElementById("adminContainer")?.classList.toggle("sidebar-open");
  }

  return (
    <header className="top-header">
      {/* Left: hamburger + search */}
      <div className="header-left">
        <button className="mobile-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="search-bar">
          <Search size={16} />
          <input placeholder="Search anything..." />
        </div>
      </div>

      {/* Right: bell + profile */}
      <div className="header-right">
        {/* Notifications — real unread contact queries */}
        <div className="notifications-dropdown">
          <button className="header-icon-btn" aria-label="Notifications">
            <Bell size={18} />
            {notifCount > 0 && (
              <span className="notif-badge">{notifCount > 9 ? "9+" : notifCount}</span>
            )}
          </button>
          <div className="dropdown-content" style={{ minWidth: 280 }}>
            <div className="dropdown-header">
              <span>Notifications</span>
            </div>
            {notifications.length === 0 ? (
              <div className="empty-notif">No new notifications</div>
            ) : (
              <>
                {notifications.map((msg) => (
                  <Link
                    key={msg.id}
                    href="/admin/queries?status=New"
                    className="dropdown-link"
                    style={{ display: "block", padding: "0.6rem 1rem", whiteSpace: "normal" }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{msg.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                      {msg.message}
                    </div>
                  </Link>
                ))}
                <a href="/admin/queries?status=New" className="dropdown-link" style={{ textAlign: "center", fontWeight: 600 }}>
                  View all
                </a>
              </>
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="admin-profile-dropdown">
          <div className="user-profile">
            <div className="profile-circle">AD</div>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-main)" }}>Admin</span>
            <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
          </div>
          <div className="dropdown-content">
            <div className="dropdown-header">My Account</div>
            <a href="/admin/config">
              <Settings size={15} />
              Settings
            </a>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink size={15} />
              View Site
            </a>
            <hr />
            <button className="dropdown-link text-danger" onClick={() => logoutAction()}>
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
