import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/PageIntro";
import { CtaBand } from "@/components/marketing/CtaBand";
import { TestimonialQuote } from "@/components/marketing/TestimonialQuote";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { serviceCategories, services } from "@/data/services";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services",
  description: "Eleven practices — engineering, growth, and design — run as one editorial studio.",
};

export default function ServicesPage() {
  return (
    <>
      <PageIntro
        kicker="Practices"
        title={<>Eleven practices, one operating model.</>}
        lede={
          <>
            Each practice runs on its own schedule, its own team, and its own way of measuring done
            — but every engagement follows the studio&apos;s single operating manual. Diagnose,
            contract, ship, steward.
          </>
        }
        aside={
          <div>
            <span className="kicker">Categories</span>
            <ul className="mt-4 space-y-3">
              {serviceCategories.map((c) => (
                <li key={c}>
                  <p className="font-[family-name:var(--font-display)] text-[1.35rem] leading-tight tracking-[-0.02em]">
                    {c}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {services.filter((s) => s.category === c).length} practices
                  </p>
                </li>
              ))}
            </ul>
          </div>
        }
      />

      {serviceCategories.map((cat) => (
        <Section key={cat} className="border-t border-[var(--color-line)]" size="sm">
          <Container>
            <div className="mb-10 grid grid-cols-1 items-baseline gap-x-8 gap-y-10 md:grid-cols-12">
              <Reveal className="md:col-span-4">
                <span className="kicker">{cat}</span>
              </Reveal>
              <Reveal delay={0.1} className="md:col-span-8">
                <h2 className="max-w-[26ch] font-[family-name:var(--font-display)] text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] leading-[1.05] tracking-[-0.02em]">
                  {cat === "Engineering" &&
                    "Systems the CTO puts on the roadmap and the CFO calls an asset."}
                  {cat === "Growth" &&
                    "Compounding demand — not campaigns you re-shoot every quarter."}
                  {cat === "Design" &&
                    "Craft that behaves as coherently in the spreadsheet as it does on the wall."}
                </h2>
              </Reveal>
            </div>
            <Stagger className="border-t border-[var(--color-line)]">
              {services
                .filter((s) => s.category === cat)
                .map((s) => (
                  <StaggerItem key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-6 border-b border-[var(--color-line)] px-0 py-8 transition-colors hover:bg-[var(--color-stone)] hover:px-4"
                    >
                      <span className="num w-6 text-sm text-[var(--color-muted)]">{s.index}</span>
                      <span>
                        <span className="block font-[family-name:var(--font-display)] text-[clamp(1.35rem,1rem+1.4vw,2rem)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]">
                          {s.title}
                        </span>
                        <span className="mt-2 block max-w-[56ch] text-[var(--color-muted)]">
                          {s.summary}
                        </span>
                      </span>
                      <span className="kicker text-[var(--color-gold-2)] transition-transform group-hover:translate-x-1">
                        Read →
                      </span>
                    </Link>
                  </StaggerItem>
                ))}
            </Stagger>
          </Container>
        </Section>
      ))}

      <TestimonialQuote index={2} />
      <CtaBand />
    </>
  );
}
