"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@edss/utils/cn";

/**
 * Container-scoped pointer parallax. Children translate on pointer move within
 * the passed containerRef. Depth via data-depth on each child (0..1).
 */
export function PointerParallax({
  containerRef,
  children,
  className,
  strength = 20,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const wrap = wrapRef.current;
    if (!container || !wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };

    const onMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    function loop() {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      const layers = wrap!.querySelectorAll<HTMLElement>("[data-depth]");
      layers.forEach((el) => {
        const d = parseFloat(el.dataset.depth ?? "0.3");
        el.style.transform = `translate3d(${-cur.x * strength * d}px, ${-cur.y * strength * d}px, 0)`;
      });
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [containerRef, strength]);

  return (
    <div ref={wrapRef} className={cn(className)}>
      {children}
    </div>
  );
}
