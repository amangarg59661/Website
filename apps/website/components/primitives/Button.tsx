import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,color,border,transform] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-gold)] disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      intent: {
        primary:
          "bg-[var(--color-ink)] text-[var(--color-paper)] border border-[var(--color-ink)] hover:bg-[var(--color-ink-2)]",
        gold: "bg-[var(--color-gold)] text-[var(--color-ink)] border border-[var(--color-gold)] hover:bg-[color-mix(in_oklch,var(--color-gold)_92%,black)]",
        ghost:
          "bg-transparent text-[var(--color-ink)] border border-[var(--color-line-strong)] hover:border-[var(--color-ink)]",
        onInk:
          "bg-transparent text-[var(--color-paper)] border border-[color-mix(in_oklch,var(--color-paper)_28%,transparent)] hover:border-[var(--color-paper)]",
        onInkFilled:
          "bg-[var(--color-paper)] text-[var(--color-ink)] border border-[var(--color-paper)] hover:bg-[color-mix(in_oklch,var(--color-paper)_92%,var(--color-ink))]",
      },
      size: {
        sm: "h-9 px-3.5 text-[0.85rem] rounded-[var(--radius-sm)]",
        md: "h-11 px-5 text-[0.9rem] rounded-[var(--radius-sm)]",
        lg: "h-14 px-7 text-[0.95rem] rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: { intent: "primary", size: "md" },
  },
);

type Base = VariantProps<typeof button> & { withArrow?: boolean; children: ReactNode };
type ButtonProps = Base & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkProps = Base & { href: string; external?: boolean; className?: string };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, withArrow, children, ...props }, ref) => (
    <button ref={ref} className={cn(button({ intent, size }), className)} {...props}>
      {children}
      {withArrow && <ArrowUpRight aria-hidden className="h-4 w-4" />}
    </button>
  ),
);
Button.displayName = "Button";

export function ButtonLink({
  href,
  external,
  intent,
  size,
  withArrow,
  className,
  children,
}: LinkProps) {
  const cls = cn(button({ intent, size }), className);
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
        {withArrow && <ArrowUpRight aria-hidden className="h-4 w-4" />}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      {withArrow && <ArrowUpRight aria-hidden className="h-4 w-4" />}
    </Link>
  );
}
