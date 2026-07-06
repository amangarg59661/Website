import type { SVGProps } from "react";

export function Wordmark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 260 24"
      role="img"
      aria-label="Elite Digital Solutions"
      className={className}
      {...props}
    >
      <text
        x="0"
        y="18"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "22px",
          fontWeight: 400,
          letterSpacing: "-0.02em",
        }}
        fill="currentColor"
      >
        Elite Digital
      </text>
      <text
        x="132"
        y="18"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
        fill="currentColor"
        opacity="0.6"
      >
        Studio · Est 2021
      </text>
    </svg>
  );
}

export function Monogram({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label="EDSS"
      className={className}
      {...props}
    >
      <circle
        cx="20"
        cy="20"
        r="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          fontWeight: 400,
          letterSpacing: "-0.03em",
        }}
        fill="currentColor"
      >
        e
      </text>
    </svg>
  );
}

/* Simple abstract client logos — grayscale, brand-neutral SVG marks */
export function LogoMark({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.35rem",
        fontWeight: 500,
        letterSpacing: "-0.02em",
        color: "currentColor",
        whiteSpace: "nowrap",
        opacity: 0.7,
      }}
    >
      {label}
    </div>
  );
}
