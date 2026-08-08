import Link from "next/link";
import type { Category } from "@/types/db";

interface FooterProps {
  categories: Category[];
}

export default function Footer({ categories }: FooterProps) {
  return (
    <footer style={{ overflowX: "hidden", boxSizing: "border-box" }}>
      <div className="footer-grid">
        {/* Brand column */}
        <div className="footer-brand">
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="nav-logo">Naye Leithe</span>
          </Link>
          <p>
            Your destination for authentic ethnic and contemporary fashion. Every
            piece tells a story of craftsmanship and elegance.
          </p>
          <div className="footer-social">
            {/* Instagram */}
            <a className="social-btn" href="https://instagram.com/nayeleithe" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            {/* Facebook */}
            <a className="social-btn" href="https://facebook.com/nayeleithe" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            {/* Pinterest */}
            <a className="social-btn" href="https://pinterest.com/nayeleithe" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
              <svg viewBox="0 0 24 24" fill="#ffffff">
                <path d="M8 12a4 4 0 1 1 8 0c0 2.5-1.5 4.5-3 5.5l-1 4.5h-2l.5-2c-1.5-.5-2.5-2-2.5-4zm4-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
              </svg>
            </a>
            {/* YouTube */}
            <a className="social-btn" href="https://youtube.com/@nayeleithe" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.12 49.12 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.12 49.12 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                <path d="m10 15 5-3-5-3z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Shop column — dynamic from DB */}
        <div className="footer-col">
          <h4>Shop</h4>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/shop?category=${encodeURIComponent(cat.name)}`}>
              {cat.name}
            </Link>
          ))}
          <Link href="/shop">New Arrivals</Link>
        </div>

        {/* Help column */}
        <div className="footer-col">
          <h4>Help</h4>
          <Link href="/profile">Track Order</Link>
          <Link href="/shipping">Shipping Policy</Link>
          <Link href="/refund">Refund &amp; Cancellation</Link>
          <Link href="/contact">Contact Us</Link>
        </div>

        {/* Company column */}
        <div className="footer-col">
          <h4>Company</h4>
          <Link href="/about">About Us</Link>
          <Link href="/about#story">Our Story</Link>
          <Link href="/blogs">Blog</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms &amp; Conditions</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2024 Naye Leithe. All rights reserved. Made with ❤️ in India.</p>
        <div className="payment-icons">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://api.iconify.design/logos:visa.svg" style={{ height: 20 }} alt="Visa" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://api.iconify.design/logos:mastercard.svg" style={{ height: 20 }} alt="Mastercard" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://api.iconify.design/logos:google-pay.svg" style={{ height: 20 }} alt="Google Pay" loading="lazy" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://api.iconify.design/logos:apple-pay.svg" style={{ height: 20 }} alt="Apple Pay" loading="lazy" />
        </div>
      </div>
    </footer>
  );
}
