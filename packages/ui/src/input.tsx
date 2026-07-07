"use client";
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@edss/utils/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-transparent px-3 text-[var(--text-body)] text-[var(--color-ink)] transition-colors placeholder:text-[color-mix(in_oklch,var(--color-muted)_88%,transparent)] focus:border-[var(--color-ink)] focus:outline-none aria-[invalid=true]:border-[var(--color-danger)]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
