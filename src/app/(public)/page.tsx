import { unstable_cache } from "next/cache";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ProductCard from "@/components/shop/ProductCard";
import ScrollArrows from "@/components/home/ScrollArrows";
import NewsletterForm from "@/components/home/NewsletterForm";
import type { Category, Product, Review } from "@/types/db";
import { slugify } from "@/lib/utils";

const PRODUCT_SELECT =
  "*, category(*), subcategory:sub_category(*), images:product_image(*), attributes:product_attribute(*, attribute(*))";

const getHomeData = unstable_cache(
  async () => {
    // First fetch categories so we know which cat_names to query
    const { data: categories } = await supabaseAdmin
      .from("category")
      .select("*, subcategories:sub_category(*)");

    const cats = (categories as Category[]) ?? [];

    // Fetch everything else in parallel — per-category queries limited to 8
    // at DB level instead of pulling 100 products and slicing in JS
    const [
      { data: newArrivals },
      { data: featured },
      { data: featuredReviews },
      ...catResults
    ] = await Promise.all([
      supabaseAdmin
        .from("product")
        .select(PRODUCT_SELECT)
        .eq("is_new_arrival", true)
        .order("id", { ascending: false })
        .limit(12),
      supabaseAdmin
        .from("product")
        .select(PRODUCT_SELECT)
        .eq("is_featured", true)
        .limit(12),
      supabaseAdmin
        .from("review")
        .select("*, product(*)")
        .eq("is_featured", true)
        .eq("status", "Approved"),
      ...cats.map((cat) =>
        supabaseAdmin
          .from("product")
          .select(PRODUCT_SELECT)
          .eq("cat_name", cat.name)
          .limit(8)
      ),
    ]);

    const categorySections = cats
      .map((cat, i) => ({
        name: cat.name,
        id: slugify(cat.name),
        products: (catResults[i]?.data as Product[]) ?? [],
      }))
      .filter((s) => s.products.length > 0);

    return {
      categories: cats,
      newArrivals: (newArrivals as Product[]) ?? [],
      featuredProducts: (featured as Product[]) ?? [],
      categorySections,
      featuredReviews: (featuredReviews as Review[]) ?? [],
    };
  },
  ["home-data"],
  { revalidate: 300, tags: ["products"] }
);

export default async function HomePage() {
  const { categories, newArrivals, featuredProducts, categorySections, featuredReviews } =
    await getHomeData();

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=75"
            alt="Hero Background"
            fetchPriority="high"
          />
        </div>
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-tag">
            <span>✦</span> Welcome to Naye Leithe
          </div>
          <h1>Discover Your Signature Style</h1>
          <div className="hero-btns">
            <a href="#new-arrivals" className="btn-primary">Shop now</a>
            <a href="#categories" className="btn-outline">View Collections</a>
          </div>
        </div>
        <div className="hero-cards">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${encodeURIComponent(cat.name)}`}
              className="hero-card"
              style={{
                backgroundImage: `url('${cat.img || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=70"}')`,
              }}
            >
              <div className="hero-card-label">{cat.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section" id="categories">
        <div className="section-header">
          <div className="section-center">
            <div className="section-title-container">
              <ScrollArrows trackId="categories-track">
                <h2 className="section-title">Our Collections</h2>
              </ScrollArrows>
            </div>
            <div className="view-all-container">
              <Link href="/shop" className="view-all-link">View All</Link>
            </div>
          </div>
        </div>
        <div className="categories-scroll-wrapper">
          <div className="categories-track fade-in" id="categories-track">
            {categories.map((cat) =>
              (cat.subcategories ?? []).map((sub) => (
                <Link
                  key={sub.id}
                  href={`/shop?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`}
                  className="cat-card"
                  style={{
                    backgroundImage: `url('${sub.img || cat.img || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=70"}')`,
                    textDecoration: "none",
                  }}
                >
                  <div className="cat-card-overlay">
                    <div className="cat-card-name">{sub.name}</div>
                    <div className="cat-pill">{cat.name}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section id="new-arrivals" style={{ background: "var(--cream)" }}>
        <div className="section-header">
          <div className="section-center">
            <div className="section-title-container">
              <ScrollArrows trackId="new-arrivals-track">
                <h2 className="section-title">New Arrivals</h2>
              </ScrollArrows>
            </div>
            <div className="view-all-container">
              <a href="/shop?new_arrival=1" className="view-all-link">View All</a>
            </div>
          </div>
        </div>
        <div className="scroll-carousel fade-in">
          <div className="carousel-track na-carousel-track" id="new-arrivals-track">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banners */}
      <div className="promo-banners fade-in">
        <div className="promo-banner">
          <div className="promo-banner-img">
            <img src="/saree_1.jpg" alt="Ethnic Collection" />
          </div>
          <div className="promo-banner-content">
            <div className="promo-banner-tag">Ethnic Collection</div>
            <h3>Bridal Lehenga Choli &amp; Designer Sarees</h3>
            <p>Handcrafted for every celebration. Explore our exclusive ethnic range.</p>
            <Link
              href="/shop?category=Ethnic+Wear"
              className="btn-white"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              Shop Ethnic
            </Link>
          </div>
        </div>
        <div className="promo-banner">
          <div className="promo-banner-content">
            <div className="promo-banner-tag">Western Trend</div>
            <h3>Cord Sets, Dresses &amp; Tops — New Season</h3>
            <p>Fresh cuts and contemporary silhouettes for the modern woman.</p>
            <Link
              href="/shop?category=Western+Wear"
              className="btn-white"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              Shop Western
            </Link>
          </div>
          <div className="promo-banner-img">
            <img src="/saree_2.jpeg" alt="Western Collection" />
          </div>
        </div>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="featured-section" id="featured" style={{ background: "var(--warm-white)" }}>
          <div className="section-header">
            <div className="section-center">
              <div className="section-title-container">
                <ScrollArrows trackId="featured-track">
                  <h2 className="section-title">Featured Products</h2>
                </ScrollArrows>
              </div>
              <div className="view-all-container">
                <Link href="/shop" className="view-all-link">View All</Link>
              </div>
            </div>
          </div>
          <div className="scroll-carousel fade-in">
            <div className="carousel-track na-carousel-track" id="featured-track">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Per-category sections — alternating bg matches Flask: odd→cream, even→warm-white */}
      {categorySections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          style={{ background: index % 2 === 0 ? "var(--cream)" : "var(--warm-white)" }}
        >
          <div className="section-header">
            <div className="section-center">
              <div className="section-title-container">
                <ScrollArrows trackId={`${section.id}-track`}>
                  <h2 className="section-title">{section.name}</h2>
                </ScrollArrows>
              </div>
              <div className="view-all-container">
                <Link href={`/shop?category=${encodeURIComponent(section.name)}`} className="view-all-link">
                  View All
                </Link>
              </div>
            </div>
          </div>
          <div className="scroll-carousel fade-in">
            <div className="carousel-track na-carousel-track" id={`${section.id}-track`}>
              {section.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Why Us — matches Flask order: before testimonials */}
      <div className="why-us fade-in">
        <div className="why-item">
          <div className="why-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#8b1a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
              <circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
            </svg>
          </div>
          <div className="why-title">Free Shipping</div>
          <div className="why-desc">On all orders above ₹999. Pan-India delivery.</div>
        </div>
        <div className="why-item">
          <div className="why-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#8b1a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </div>
          <div className="why-title">Easy Returns</div>
          <div className="why-desc">Hassle-free 7-day return policy on all products.</div>
        </div>
        <div className="why-item">
          <div className="why-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#8b1a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div className="why-title">Secure Payment</div>
          <div className="why-desc">100% secure payments via UPI, Cards &amp; Wallets.</div>
        </div>
        <div className="why-item">
          <div className="why-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#8b1a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12l4 6-10 13L2 9Z"/>
              <path d="M11 3 8 9l4 13 4-13-3-6"/>
              <path d="M2 9h20"/>
            </svg>
          </div>
          <div className="why-title">Premium Quality</div>
          <div className="why-desc">Handpicked &amp; quality-checked every single product.</div>
        </div>
      </div>

      {/* Testimonials — always shown, scrollable carousel with static reviews */}
      <section className="testimonials-section">
        <div className="section-header">
          <div className="section-center">
            <div className="section-title-container">
              <ScrollArrows trackId="testimonials-grid">
                <h2 className="section-title">What Our Customers Say</h2>
              </ScrollArrows>
            </div>
          </div>
        </div>
        <div className="scroll-carousel fade-in">
          <div className="testimonials-grid" id="testimonials-grid">
            {/* Dynamic DB reviews */}
            {featuredReviews.map((review) => (
              <div key={review.id} className="testimonial-card">
                <div className="testimonial-stars">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
                <div className="testimonial-text">&ldquo;{review.comment}&rdquo;</div>
                <div className="testimonial-author">
                  <div style={{ width: 40, height: 40, fontSize: 14, marginRight: 12, background: "var(--crimson)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", flexShrink: 0 }}>
                    {(review.customer_name?.[0] ?? "A").toUpperCase()}
                  </div>
                  <div>
                    <div className="testimonial-name">{review.customer_name}</div>
                    {review.customer_location && <div className="testimonial-loc">{review.customer_location}</div>}
                  </div>
                </div>
              </div>
            ))}
            {/* Static reviews — always shown */}
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <div className="testimonial-text">&ldquo;Absolutely loved my silk saree from Naye Leithe! The quality is outstanding and the colours are exactly as shown. Will definitely order again.&rdquo;</div>
              <div className="testimonial-author">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&q=80&fit=crop" className="testimonial-avatar" alt="Priya Sharma" />
                <div>
                  <div className="testimonial-name">Priya Sharma</div>
                  <div className="testimonial-loc">Mumbai, India</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <div className="testimonial-text">&ldquo;The cord set I ordered was so elegant and the stitching is perfect. Got so many compliments at the party! Fast delivery too.&rdquo;</div>
              <div className="testimonial-author">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&q=80&fit=crop" className="testimonial-avatar" alt="Riya Mehta" />
                <div>
                  <div className="testimonial-name">Riya Mehta</div>
                  <div className="testimonial-loc">Delhi, India</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <div className="testimonial-text">&ldquo;Bought a designer lehenga for my sister&apos;s wedding. The handloom work is exquisite. Truly premium quality at reasonable prices.&rdquo;</div>
              <div className="testimonial-author">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&q=80&fit=crop" className="testimonial-avatar" alt="Ananya Iyer" />
                <div>
                  <div className="testimonial-name">Ananya Iyer</div>
                  <div className="testimonial-loc">Bangalore, India</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <div className="testimonial-text">&ldquo;The jewellery collection is so unique. I ordered a kundan set and it looks way more expensive than it actually was. Love it!&rdquo;</div>
              <div className="testimonial-author">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=100&h=100&q=80&fit=crop" className="testimonial-avatar" alt="Megha Das" />
                <div>
                  <div className="testimonial-name">Megha Das</div>
                  <div className="testimonial-loc">Kolkata, India</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <div className="newsletter fade-in">
        <div className="nl-tag">Stay in Style</div>
        <h2>Join the Naye Leithe Circle</h2>
        <p>Get exclusive offers, early access to new arrivals, and style inspiration delivered to your inbox.</p>
        <NewsletterForm />
      </div>
    </>
  );
}

