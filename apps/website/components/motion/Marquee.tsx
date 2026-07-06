import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Marquee({
  children,
  className,
  reverse,
}: {
  children: ReactNode;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <div className={cn("marquee", className)} role="presentation" aria-hidden>
      <div className="marquee-track" style={{ animationDirection: reverse ? "reverse" : "normal" }}>
        {children}
      </div>
      <div className="marquee-track" style={{ animationDirection: reverse ? "reverse" : "normal" }}>
        {children}
      </div>
    </div>
  );
}
