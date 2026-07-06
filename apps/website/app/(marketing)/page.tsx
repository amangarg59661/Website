import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/marketing/Hero";
import { LogoMarquee } from "@/components/marketing/LogoMarquee";
import { ServiceIndex } from "@/components/marketing/ServiceIndex";
import { StatLedger } from "@/components/marketing/StatLedger";
import { TestimonialQuote } from "@/components/marketing/TestimonialQuote";
import { CtaBand } from "@/components/marketing/CtaBand";
import { CaseCard } from "@/components/marketing/PortfolioGrid";
import { JournalCard } from "@/components/marketing/JournalCard";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";
import { cases } from "@/data/portfolio";
import { articles } from "@/data/blog";

export const metadata: Metadata = {
  title: {
    absolute: "Elite Digital — A boutique studio for global technology teams",
  },
  description:
    "Custom software, SaaS, mobile, AI automation, growth marketing, and design — engineered for companies that treat their brand as an asset.",
};

export default function HomePage() {
  const featuredCases = cases.slice(0, 3);
  const featuredArticles = articles.slice(0, 3);

  return (
    <>
      <Hero />

      {/* Logo marquee — muted, grayscale */}
      <Section size="sm" id="next">
        <Container wide>
          <div className="mb-8 flex items-center justify-between">
            <span className="kicker">Clients &amp; collaborators</span>
            <Link href="/portfolio" className="link-underline kicker uppercase">
              Selected work →
            </Link>
          </div>
          <LogoMarquee />
        </Container>
      </Section>

      {/* Practice index — the surface signature list */}
      <Section labelledBy="practices" className="border-t border-[var(--color-line)]">
        <ServiceIndex kicker="Practices" />
      </Section>

      {/* Editorial statement + featured case */}
      <Section labelledBy="belief">
        <Container>
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-12">
            <Reveal as="div" className="md:col-span-5">
              <span id="belief" className="kicker">
                A belief
              </span>
              <p className="mt-6 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.6rem,1.2rem+1.6vw,2.5rem)] leading-[1.15] tracking-[-0.02em] text-[var(--color-ink)]">
                Every product a company ships is a promise it will keep for the next decade. We
                build the ones that keep.
              </p>
              <p className="lede mt-8 max-w-[54ch]">
                We are not the largest studio, nor the fastest. We are the studio you hire when the
                work is going to be used, seen, and re-read for years. Senior operators lead every
                engagement; the people who pitch are the people who ship.
              </p>
              <div className="mt-10 flex gap-6">
                <Link
                  href="/about"
                  className="link-underline kicker text-[var(--color-ink)] uppercase"
                >
                  About the studio →
                </Link>
                <Link
                  href="/portfolio"
                  className="link-underline kicker text-[var(--color-ink)] uppercase"
                >
                  Selected work →
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.15} as="div" className="md:col-span-7">
              {featuredCases[0] && <CaseCard c={featuredCases[0]} large />}
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Ledger */}
      <Section className="border-t border-[var(--color-line)]">
        <StatLedger />
      </Section>

      {/* Two more cases */}
      <Section>
        <Container wide>
          <div className="mb-10 flex items-baseline justify-between">
            <div>
              <span className="kicker">Selected work</span>
              <h2 className="h2 mt-4 max-w-[22ch]">A shape you can trace across industries.</h2>
            </div>
            <Link href="/portfolio" className="link-underline kicker hidden uppercase md:inline">
              See all work →
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
            {featuredCases.slice(1).map((c) => (
              <li key={c.slug}>
                <CaseCard c={c} />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Testimonial */}
      <Section className="border-y border-[var(--color-line)]" size="sm">
        <TestimonialQuote index={0} />
      </Section>

      {/* Journal preview */}
      <Section>
        <Container>
          <div className="mb-6 flex items-baseline justify-between">
            <div>
              <span className="kicker">The journal</span>
              <h2 className="h2 mt-4 max-w-[22ch]">Long-form writing from the studio.</h2>
            </div>
            <Link href="/blog" className="link-underline kicker hidden uppercase md:inline">
              All essays →
            </Link>
          </div>
          <div className="border-t border-[var(--color-line)]">
            {featuredArticles.map((a, i) => (
              <JournalCard key={a.slug} a={a} large={i === 0} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Consultation band */}
      <CtaBand />
    </>
  );
}
