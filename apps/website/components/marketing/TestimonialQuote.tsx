import testimonials from "@/content/testimonials.json";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";

export function TestimonialQuote({ index = 0 }: { index?: number }) {
  const t = testimonials[index] ?? testimonials[0];
  if (!t) return null;
  return (
    <Container>
      <Reveal className="mx-auto max-w-[68ch] text-center">
        <span className="kicker">In their own words</span>
        <blockquote className="mt-6">
          <p className="font-[family-name:var(--font-display)] text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] leading-[1.2] tracking-[-0.02em] text-[var(--color-ink)]">
            &ldquo;{t.quote}&rdquo;
          </p>
          <footer className="kicker mt-8">
            <span className="text-[var(--color-ink)]">{t.author}</span>
            <span className="mx-3 text-[var(--color-line-strong)]">·</span>
            <span className="text-[var(--color-muted)]">{t.role}</span>
          </footer>
        </blockquote>
      </Reveal>
    </Container>
  );
}
