import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans, Great_Vibes } from "next/font/google";
import "./globals.css";
/* NOTE: the storefront stylesheet (style.css) is intentionally NOT imported
   here. It's scoped to (public)/layout.tsx and (auth)/layout.tsx instead —
   several of its class names (.product-cell, .filter-group, .action-btns…)
   collide with admin.css, and importing it globally used to leak those
   rules into /admin and break the dashboard layout. */

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  // 700/800 are requested throughout admin.css (.stat-value, table headers,
  // category/attribute names, etc.) and style.css (.hero-tag, section
  // headings). Without the actual font files loaded at those weights, the
  // browser falls back to faux/synthetic bold — which renders visibly
  // lighter than real bold — so every weight actually used in CSS must be
  // loaded here.
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-dm",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vibes",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Naye Leithe – Discover Your Signature Style",
  description:
    "Discover Naye Leithe – your premium destination for authentic ethnic wear, designer sarees, bridal lehenga choli, and contemporary western fashion. Handcrafted with love in India.",
  keywords:
    "Naye Leithe, ethnic wear, sarees, lehenga, western wear, Indian fashion, designer clothing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} ${greatVibes.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
