"use client";
import { useEffect } from "react";

/** Attaches drag-scroll + inertia to all carousel/category tracks on mount */
export default function DragScroll() {
  useEffect(() => {
    const tracks = document.querySelectorAll<HTMLElement>(
      ".categories-track, .carousel-track, .testimonials-grid, [id$='-track'], .hero-cards"
    );

    const cleanups: (() => void)[] = [];

    tracks.forEach((track) => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let velocity = 0;
      let lastX = 0;
      let rafId = 0;

      const beginDrag = (e: MouseEvent | TouchEvent) => {
        if (e instanceof MouseEvent && e.button !== 0) return;
        isDown = true;
        startX = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
        scrollLeft = track.scrollLeft;
        lastX = startX;
        velocity = 0;
        cancelAnimationFrame(rafId);
        track.style.transition = "none";
        track.style.cursor = "grabbing";
      };

      const duringDrag = (e: MouseEvent | TouchEvent) => {
        if (!isDown) return;
        const x = e instanceof TouchEvent ? e.touches[0].clientX : e.clientX;
        track.scrollLeft = scrollLeft - (x - startX);
        velocity = x - lastX;
        lastX = x;
      };

      const endDrag = () => {
        if (!isDown) return;
        isDown = false;
        track.style.cursor = "grab";
        const applyInertia = () => {
          if (Math.abs(velocity) < 0.1) return;
          track.scrollLeft -= velocity;
          velocity *= 0.95;
          rafId = requestAnimationFrame(applyInertia);
        };
        rafId = requestAnimationFrame(applyInertia);
      };

      track.addEventListener("mousedown", beginDrag as EventListener);
      track.addEventListener("mousemove", duringDrag as EventListener);
      window.addEventListener("mouseup", endDrag);
      track.addEventListener("touchstart", beginDrag as EventListener, { passive: true });
      track.addEventListener("touchmove", duringDrag as EventListener, { passive: true });
      track.addEventListener("touchend", endDrag);

      cleanups.push(() => {
        track.removeEventListener("mousedown", beginDrag as EventListener);
        track.removeEventListener("mousemove", duringDrag as EventListener);
        window.removeEventListener("mouseup", endDrag);
        track.removeEventListener("touchstart", beginDrag as EventListener);
        track.removeEventListener("touchmove", duringDrag as EventListener);
        track.removeEventListener("touchend", endDrag);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
