import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  LabelHTMLAttributes,
} from "react";
import { forwardRef } from "react";
import { cn } from "@edss/utils/cn";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "kicker mb-2 block tracking-[0.14em] text-[color:var(--color-muted)] uppercase",
        className,
      )}
      {...props}
    />
  );
}

const fieldBase =
  "w-full bg-transparent text-[var(--color-ink)] placeholder:text-[color-mix(in_oklch,var(--color-muted)_88%,transparent)] border-0 border-b border-[var(--color-line-strong)] py-3 px-0 text-[var(--text-body-lg)] focus:outline-none focus:border-[var(--color-ink)] transition-colors";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={4}
    className={cn(fieldBase, "resize-none", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function FieldError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
      {children}
    </p>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm text-[var(--color-muted)]">{children}</p>;
}
