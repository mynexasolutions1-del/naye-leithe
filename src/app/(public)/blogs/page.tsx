import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blogs — Naye Leithe Fashion Stories",
};

const BLOG_CARDS = [
  {
    img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80",
    tag: "Trends",
    title: "The Return of Ethnic Florals",
    excerpt: "Why botanical prints are taking over the spring/summer collection this year.",
  },
  {
    img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
    tag: "Heritage",
    title: "Behind the Weave: Handloom Silk",
    excerpt: "An intimate look at the master weavers preserving ancient Indian traditions.",
  },
  {
    img: "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=600&q=80",
    tag: "Jewellery",
    title: "Choosing Jewellery for Your Face Shape",
    excerpt: "How to pick the perfect Jhumkas or necklaces that complement your features.",
  },
];

export default function BlogsPage() {
  return (
    <>
      <style>{`
        .blogs-page {
          padding: 40px 48px 100px;
          background: var(--warm-white);
        }
        .page-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .page-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          margin-bottom: 12px;
          color: var(--text);
        }
        .page-header p {
          color: var(--muted);
          max-width: 600px;
          margin: 0 auto;
        }

        .featured-blog {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          background: var(--cream);
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 80px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
        }
        .blog-img {
          background-size: cover;
          background-position: center;
          min-height: 400px;
        }
        .blog-content {
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .blog-tag {
          color: var(--gold);
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          margin-bottom: 16px;
          letter-spacing: 1px;
        }
        .blog-content h2 {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          margin-bottom: 20px;
          line-height: 1.3;
        }
        .blog-content p {
          font-size: 16px;
          color: var(--muted);
          line-height: 1.8;
          margin-bottom: 30px;
        }
        .read-more {
          text-decoration: none;
          color: var(--crimson);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .read-more:hover { text-decoration: underline; }

        .blog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }
        .blog-card { cursor: pointer; }
        .blog-card-img {
          height: 250px;
          background-size: cover;
          background-position: center;
          border-radius: 16px;
          margin-bottom: 20px;
          transition: transform 0.4s ease;
        }
        .blog-card:hover .blog-card-img {
          transform: translateY(-10px);
        }
        .blog-card-tag {
          font-size: 11px;
          font-weight: 700;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }
        .blog-card h3 {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          margin-bottom: 12px;
        }
        .blog-card p {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 15px;
        }
        .blog-link {
          color: var(--crimson);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }
        .blog-link:hover { text-decoration: underline; }

        @media (max-width: 900px) {
          .blogs-page { padding: 30px 20px 60px; }
          .page-header h1 { font-size: 30px; }
          .featured-blog { grid-template-columns: 1fr; }
          .blog-img { min-height: 260px; }
          .blog-content { padding: 30px 24px; }
          .blog-content h2 { font-size: 24px; }
          .blog-grid { grid-template-columns: 1fr; gap: 30px; }
        }
        @media (min-width: 901px) and (max-width: 1100px) {
          .blog-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="blogs-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-tag"><span>✦</span> Our Journal</div>
          <h1>Fashion Stories &amp; Styling Tips</h1>
          <p>Explore the latest trends, styling guides, and the heritage behind our collections.</p>
        </div>

        {/* Featured post */}
        <div className="featured-blog">
          <div
            className="blog-img"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&q=80')" }}
          />
          <div className="blog-content">
            <div className="blog-tag">Styling Guide</div>
            <h2>Mastering the Art of Draping: A Saree Guide</h2>
            <p>From the classic Nivi drape to modern contemporary styles, discover how to make every saree look effortless and elegant.</p>
            <a href="#" className="read-more">Read Full Story <span>→</span></a>
          </div>
        </div>

        {/* Blog grid */}
        <div className="blog-grid">
          {BLOG_CARDS.map((card) => (
            <div className="blog-card" key={card.title}>
              <div
                className="blog-card-img"
                style={{ backgroundImage: `url('${card.img}')` }}
              />
              <div className="blog-card-info">
                <div className="blog-card-tag">{card.tag}</div>
                <h3>{card.title}</h3>
                <p>{card.excerpt}</p>
                <a href="#" className="blog-link">Read More</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
