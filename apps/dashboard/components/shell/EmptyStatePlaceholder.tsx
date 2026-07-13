import type { ReactNode } from "react";

/**
 * U-08 + U-09: gains an `action` prop for CTAs (defaulted by the module
 * to "Back to overview") and a `phase` prop that governs the kicker.
 * "coming-soon" keeps the eyebrow; "empty" flips to a neutral kicker so
 * the same primitive serves real empty-list states after Wave B.
 *
 * Kicker uses --color-gold-ink (dark gold) instead of --color-gold-2
 * to clear AA on paper. See risk-register U-09.
 */
export function EmptyStatePlaceholder({
  title,
  body,
  action,
  phase = "coming-soon",
}: {
  title: string;
  body: string;
  action?: ReactNode;
  phase?: "coming-soon" | "empty";
}) {
  return (
    <div className="mt-12 flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-strong)] p-16 text-center">
      <p className="kicker text-[var(--color-gold-ink)]">
        {phase === "coming-soon" ? "Arriving next" : "Nothing yet"}
      </p>
      <h2 className="h4">{title}</h2>
      <p className="max-w-[52ch] text-sm text-[var(--color-muted)]">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
