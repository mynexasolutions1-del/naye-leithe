import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "res.cloudinary.com" },
      { hostname: "images.unsplash.com" },
      { hostname: "api.iconify.design" },
      { hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
    // Admin pages are all `force-dynamic` and must always show current data.
    // Without this, Next's client-side Router Cache can still serve an
    // in-memory RSC payload from an earlier visit/prefetch (e.g. the
    // Products page as it looked before a redesign, or before new products
    // existed) when navigating via <Link>, which is why the page looked
    // unstyled/incomplete until a hard refresh forced a fresh fetch.
    // NOTE: `static` has a hard minimum of 30 — Next.js silently rejects
    // (and reverts to its own default of 300) any value below that, which
    // is exactly what happened the first time this was set to 0.
    staleTimes: {
      // 0 disabled the router cache entirely — every <Link> click re-fetched
      // from the server even for pages whose data hadn't changed. 30s gives
      // public pages a short client-side cache; admin pages use force-dynamic
      // so they bypass this and always fetch fresh.
      dynamic: 30,
      static: 300,
    },
  },
};

export default nextConfig;
