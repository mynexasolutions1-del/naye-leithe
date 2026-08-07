"use client";

interface Props {
  trackId: string;
}

const ARROW_STYLE: React.CSSProperties = {
  width: 18,
  height: 18,
  display: "block",
  filter: "brightness(0) invert(1)",
};

export default function SectionNavMobile({ trackId }: Props) {
  const scroll = (dir: number) => {
    const el = document.getElementById(trackId);
    if (!el) return;
    const gap = parseInt(window.getComputedStyle(el).gap) || 16;
    const cardW = (el.firstElementChild as HTMLElement)?.offsetWidth ?? 300;
    el.scrollBy({ left: dir * (cardW + gap), behavior: "smooth" });
  };

  return (
    <div className="section-nav-mobile">
      <button
        className="nav-arrow"
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
      >
        <svg
          style={ARROW_STYLE}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        className="nav-arrow"
        onClick={() => scroll(1)}
        aria-label="Scroll right"
      >
        <svg
          style={ARROW_STYLE}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
