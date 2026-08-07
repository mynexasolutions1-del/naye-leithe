"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { Category } from "@/types/db";

interface HeaderProps {
  categories: Category[];
  isAdmin?: boolean;
  announcementText?: string;
}

export default function Header({
  categories,
  isAdmin,
  announcementText,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggleMenu = () => setMenuOpen((v) => !v);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="main-header">
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <svg
          className="icon-img"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          <circle cx="17" cy="18" r="2" />
          <circle cx="7" cy="18" r="2" />
        </svg>
        <span>
          {announcementText || "FREE SHIPPING ON ALL ORDERS OVER ₹999"}
        </span>
        <Link href="/shop">Shop Now</Link>
      </div>

      {/* Navbar */}
      <nav>
        <Link href="/" className="nav-logo-link">
          <Image
            src="/naye-leithe-logo.png"
            alt="Naye Leithe"
            className="logo-img"
            width={40}
            height={40}
            priority
          />
          <div className="nav-logo">Naye Leithe</div>
        </Link>

        <div className={`nav-links${menuOpen ? " mobile-active" : ""}`} id="navLinks">
          <div className="mobile-menu-header">
            <div className="nav-logo">Naye Leithe</div>
            <button className="close-menu" onClick={toggleMenu}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8b1a2a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <Link href="/" className={pathname === "/" ? "active" : ""}>
            Home
          </Link>

          <div className="dropdown">
            <Link href="/shop" className={pathname.startsWith("/shop") ? "active" : ""}>
              Shop <ChevronDown size={11} style={{ display: "inline", marginLeft: 3 }} />
            </Link>
            <div className="dropdown-menu">
              {categories.map((cat) => (
                <div className="mega-col" key={cat.id}>
                  <div className="cat-group">
                    <Link href={`/shop?category=${encodeURIComponent(cat.name)}`}>
                      {cat.name}
                    </Link>
                  </div>
                  {cat.subcategories?.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/shop?subcategory=${encodeURIComponent(sub.name)}`}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <Link href="/blogs" className={pathname.startsWith("/blogs") ? "active" : ""}>
            Blogs
          </Link>
          <Link href="/about" className={pathname === "/about" ? "active" : ""}>
            About Us
          </Link>
          <Link href="/contact" className={pathname === "/contact" ? "active" : ""}>
            Contact Us
          </Link>
        </div>

        <div className="nav-actions">
          {/* Search */}
          <form onSubmit={handleSearch} className="nav-search">
            <svg
              className="icon-img"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8a7f78"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              name="search"
              placeholder="Search Products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          {/* Admin link */}
          {isAdmin && (
            <Link
              className="nav-icon-btn admin-link"
              href="/admin"
              title="Admin Dashboard"
            >
              <svg
                className="icon-img"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8b1a2a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </Link>
          )}

          {/* Profile */}
          <Link className="nav-icon-btn" href="/profile" title="My Account">
            <svg
              className="icon-img"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2d2d2d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

          {/* Wishlist */}
          <Link className="nav-icon-btn" href="/wishlist">
            <svg
              className="icon-img"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8b1a2a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span className="badge" id="wishlistBadge">
              {wishlistCount}
            </span>
          </Link>

          {/* Cart */}
          <Link className="nav-icon-btn" href="/cart">
            <svg
              className="icon-img"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2d2d2d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="badge" id="cartBadge">
              {cartCount}
            </span>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="menu-toggle" id="menuToggle" onClick={toggleMenu}>
          {menuOpen ? (
            <svg
              className="icon-img"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8b1a2a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg
              className="icon-img"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8b1a2a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          )}
        </div>
      </nav>

      <style>{`
        html { scroll-behavior: smooth; }
        .nav-icon-btn svg { width: 20px; height: 20px; }
        .social-btn svg { width: 14px; height: 14px; }
        .close-menu svg { width: 20px; height: 20px; }
        .nav-arrow svg { width: 20px; height: 20px; }
        .why-icon svg { width: 32px; height: 32px; }
        .nav-auth-link {
          padding: 8px 20px; background: #fff; border: 1.5px solid var(--crimson);
          color: var(--crimson); border-radius: 25px; text-decoration: none;
          font-weight: 700; font-size: 0.85rem; transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          letter-spacing: 0.5px; white-space: nowrap;
        }
        .nav-auth-link:hover { background: var(--crimson); color: #fff; box-shadow: 0 4px 12px rgba(139,26,42,0.2); transform: translateY(-1px); }
        .admin-link svg { filter: drop-shadow(0 2px 4px rgba(139,26,42,0.2)); }
        .nav-icon-btn { position: relative; transition: transform 0.2s; }
        .nav-icon-btn:hover { transform: scale(1.1); }
        .cat-group a { text-decoration: none; color: inherit; }
        .cat-group a:hover { color: var(--crimson); }
        .product-wishlist.active { background: var(--crimson); border-radius: 50%; padding: 4px; }
        .product-wishlist.active .icon-wishlist { stroke: #ffffff; fill: #ffffff; }
        .wishlist-btn-large { width: 50px; height: 50px; border-radius: 12px; border: 1.5px solid var(--sand); background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; }
        .wishlist-btn-large.active { background: var(--crimson); border-color: var(--crimson); }
        .wishlist-btn-large.active svg { filter: brightness(0) invert(1); }
        .nav-links a i { font-size: 11px; vertical-align: middle; margin-left: 4px; color: var(--crimson); transition: transform 0.3s; }
        .dropdown:hover .nav-links a i { transform: rotate(180deg); }
        .hero-tag span { color: var(--crimson); font-size: 16px; }
        .product-card { cursor: pointer; }
      `}</style>
    </header>
  );
}
