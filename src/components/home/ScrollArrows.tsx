"use client";
import { ReactNode } from "react";

interface Props {
  trackId: string;
  children?: ReactNode;
}

const ARROW_STYLE: React.CSSProperties = {
  width: 18,
  height: 18,
  display: "block",
  filter: "brightness(0) invert(1)",
};

export default function ScrollArrows({ trackId, children }: Props) {
  const scroll = (dir: number) => {
    const el = document.getElementById(trackId);
    if (el) el.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <>
      <button className="nav-arrow desktop-nav" onClick={() => scroll(-1)} aria-label="Scroll left">
        <svg style={ARROW_STYLE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      {children}
      <button className="nav-arrow desktop-nav" onClick={() => scroll(1)} aria-label="Scroll right">
        <svg style={ARROW_STYLE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </>
  );
}
