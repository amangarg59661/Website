export function EmptyStatePlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-12 flex flex-col items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-strong)] p-16 text-center">
      <p className="kicker text-[var(--color-gold-2)]">Coming soon</p>
      <h2 className="h4">{title}</h2>
      <p className="max-w-[52ch] text-sm text-[var(--color-muted)]">{body}</p>
    </div>
  );
}
