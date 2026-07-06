import Link from "next/link";
import { services } from "@/data/services";
import { Container } from "@/components/layout/Container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { ArrowUpRight } from "lucide-react";

export function ServiceIndex({
  headline = "Eleven practices. One editorial studio.",
  kicker = "Practices",
  limit,
}: {
  headline?: string;
  kicker?: string;
  limit?: number;
}) {
  const items = limit ? services.slice(0, limit) : services;
  return (
    <Container>
      <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-12">
        <Reveal as="div" className="md:sticky md:top-[100px] md:col-span-4 md:self-start">
          <span className="kicker">{kicker}</span>
          <h2 className="h2 mt-4 max-w-[16ch]">{headline}</h2>
          <p className="lede mt-4">
            Each practice runs on its own operating model — a schedule, a team, a way of measuring
            done. Follow one to see the shape.
          </p>
          <Link
            href="/services"
            className="link-underline kicker mt-6 inline-block text-[var(--color-ink)] uppercase"
          >
            See all practices →
          </Link>
        </Reveal>

        <Stagger className="md:col-span-8">
          <ul className="border-t border-[var(--color-line)]">
            {items.map((s) => (
              <StaggerItem key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-6 border-b border-[var(--color-line)] px-0 py-7 transition-[padding,background-color] duration-500 hover:bg-[var(--color-stone)] hover:px-4 md:py-9"
                >
                  <span className="num text-sm text-[var(--color-muted)]">{s.index}</span>
                  <span className="min-w-0">
                    <span className="block font-[family-name:var(--font-display)] text-[clamp(1.4rem,1rem+1.6vw,2.25rem)] leading-[1.05] tracking-[-0.02em] text-[var(--color-ink)]">
                      {s.title}
                    </span>
                    <span className="mt-2 block max-w-[54ch] text-[color:var(--color-muted)]">
                      {s.kicker}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="h-5 w-5 text-[var(--color-muted-2)] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--color-gold-2)]"
                  />
                </Link>
              </StaggerItem>
            ))}
          </ul>
        </Stagger>
      </div>
    </Container>
  );
}
