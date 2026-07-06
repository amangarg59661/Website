"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Props = {
  href: string;
  external?: boolean;
  children: ReactNode;
  className?: string;
  strength?: number;
};

/**
 * Magnetic CTA — button pulls toward the cursor when inside a radius,
 * spring-returns on leave. Translate only (composited).
 */
export function MagneticCta({
  href,
  external,
  children,
  className,
  strength = 0.35,
}: Props) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    const cur = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const radius = Math.max(rect.width, rect.height) * 1.6;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        target.x = dx * strength;
        target.y = dy * strength;
      } else {
        target.x = 0;
        target.y = 0;
      }
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    function loop() {
      cur.x += (target.x - cur.x) * 0.18;
      cur.y += (target.y - cur.y) * 0.18;
      inner!.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  const content = (
    <span
      ref={innerRef}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap will-change-transform",
        className,
      )}
    >
      {children}
    </span>
  );

  const wrapCls = "inline-block";

  if (external) {
    return (
      <span ref={wrapRef} className={wrapCls}>
        <a href={href} target="_blank" rel="noopener noreferrer" data-cursor="hover">
          {content}
        </a>
      </span>
    );
  }
  return (
    <span ref={wrapRef} className={wrapCls}>
      <Link href={href} data-cursor="hover">
        {content}
      </Link>
    </span>
  );
}
