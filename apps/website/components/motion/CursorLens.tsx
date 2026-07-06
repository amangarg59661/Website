"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom cursor "lens" — dot + trailing ring that follows the pointer,
 * scales on hover of interactive targets, hides on touch / reduced-motion.
 * Scale via transform (no width/height animation → no layout thrash).
 */
export function CursorLens({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isCoarse || reduce) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;

    const dotPos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    const target = { x: -100, y: -100 };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      setVisible(inside);
      target.x = e.clientX;
      target.y = e.clientY;
    };
    const onLeave = () => setVisible(false);

    const enter = () => setHovering(true);
    const leave = () => setHovering(false);
    const interactive = () =>
      container.querySelectorAll<HTMLElement>(
        "a, button, [role='button'], input, textarea, [data-cursor='hover']",
      );
    const attachHover = () =>
      interactive().forEach((el) => {
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
      });
    const detachHover = () =>
      interactive().forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });

    function loop() {
      dotPos.x += (target.x - dotPos.x) * 0.55;
      dotPos.y += (target.y - dotPos.y) * 0.55;
      ringPos.x += (target.x - ringPos.x) * 0.16;
      ringPos.y += (target.y - ringPos.y) * 0.16;

      const ringScale = hovering ? 2 : 1;
      const dotScale = hovering ? 1.6 : 1;

      dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%,-50%) scale(${dotScale})`;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%,-50%) scale(${ringScale})`;

      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("pointermove", onMove);
    document.addEventListener("mouseleave", onLeave);
    attachHover();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      detachHover();
    };
  }, [containerRef, hovering]);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[90] rounded-full"
        style={{
          width: 36,
          height: 36,
          border: "1px solid color-mix(in oklch, var(--color-gold) 65%, transparent)",
          mixBlendMode: "difference",
          opacity: visible ? 1 : 0,
          transition: "opacity 220ms cubic-bezier(0.22,1,0.36,1)",
          willChange: "transform, opacity",
        }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[90] rounded-full"
        style={{
          width: 6,
          height: 6,
          background: "var(--color-gold)",
          opacity: visible ? 1 : 0,
          transition: "opacity 220ms cubic-bezier(0.22,1,0.36,1)",
          willChange: "transform, opacity",
        }}
      />
    </>
  );
}
