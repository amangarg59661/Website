import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";

export function PageIntro({
  kicker,
  title,
  lede,
  aside,
}: {
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <Container className="pt-24 md:pt-32 pb-16 md:pb-20">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10">
        <Reveal as="div" className="md:col-span-8">
          <span className="kicker">{kicker}</span>
          <h1 className="mt-8 font-[family-name:var(--font-display)] text-[var(--text-h1)] leading-[1.02] tracking-[-0.03em] text-[var(--color-ink)] max-w-[20ch]">
            {title}
          </h1>
          {lede && <div className="lede mt-8 max-w-[62ch]">{lede}</div>}
        </Reveal>
        {aside && (
          <Reveal delay={0.15} as="div" className="md:col-span-4 md:pl-10 md:border-l md:border-[var(--color-line)]">
            {aside}
          </Reveal>
        )}
      </div>
    </Container>
  );
}
