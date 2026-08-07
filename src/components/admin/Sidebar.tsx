"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LineChart, Package, Warehouse, FolderOpen,
  Award, Tags, ShoppingBag, Users, Star, Mail, Ticket,
  Settings, ExternalLink, LogOut,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

const navItems = [
  { label: "Dashboard",  href: "/admin",            icon: LineChart },
  { label: "Products",   href: "/admin/products",   icon: Package },
  { label: "Inventory",  href: "/admin/inventory",  icon: Warehouse },
  { label: "Categories", href: "/admin/categories", icon: FolderOpen },
  { label: "Brands",     href: "/admin/brands",     icon: Award },
  { label: "Attributes", href: "/admin/attributes", icon: Tags },
  { label: "Orders",     href: "/admin/orders",     icon: ShoppingBag },
  { label: "Customers",  href: "/admin/customers",  icon: Users },
  { label: "Reviews",    href: "/admin/reviews",    icon: Star },
  { label: "Queries",    href: "/admin/queries",    icon: Mail },
  { label: "Coupons",    href: "/admin/coupons",    icon: Ticket },
  { label: "Settings",   href: "/admin/config",     icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/naye-leithe-logo.png" alt="Naye Leithe" className="admin-logo" />
        <div>
          <div className="brand-name">Naye Leithe</div>
          <div className="brand-tagline">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <ul>
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <li key={href} className={isActive ? "active" : ""}>
                <Link href={href}>
                  <Icon size={16} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <a href="/" target="_blank" rel="noopener noreferrer" className="view-site-btn">
          <ExternalLink size={14} />
          View Site
        </a>
        <button className="logout-btn" onClick={() => logoutAction()}>
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
}
