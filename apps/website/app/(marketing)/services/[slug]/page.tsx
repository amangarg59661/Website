import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { services, servicesBySlug } from "@/data/services";
import { PageIntro } from "@/components/marketing/PageIntro";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { ProcessRail } from "@/components/marketing/ProcessRail";
import { CtaBand } from "@/components/marketing/CtaBand";
import { CaseCard } from "@/components/marketing/PortfolioGrid";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { JsonLd, breadcrumbLd, faqLd, serviceLd } from "@/lib/seo/jsonld";
import { cases } from "@/data/portfolio";
import { site } from "@/config/site";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = servicesBySlug[slug];
  if (!s) return {};
  return {
    title: s.title,
    description: s.summary,
    alternates: { canonical: `${site.url}/services/${s.slug}` },
    openGraph: { title: s.title, description: s.summary, url: `${site.url}/services/${s.slug}` },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = servicesBySlug[slug];
  if (!s) notFound();

  const related = services
    .filter((x) => x.category === s.category && x.slug !== s.slug)
    .slice(0, 3);
  const relatedCases = cases.filter((c) => c.services.includes(s.title)).slice(0, 2);

  return (
    <>
      <PageIntro
        kicker={`Practice · ${s.index} · ${s.category}`}
        title={<>{s.title}</>}
        lede={<>{s.lede}</>}
        aside={
          <div className="space-y-6">
            <div>
              <span className="kicker">Engagement</span>
              <p className="mt-2 text-[var(--color-ink)]">{s.meta.engagement}</p>
            </div>
            <div>
              <span className="kicker">Team</span>
              <p className="mt-2 text-[var(--color-ink)]">{s.meta.team}</p>
            </div>
            <div>
              <span className="kicker">Timeline</span>
              <p className="mt-2 text-[var(--color-ink)]">{s.meta.timeline}</p>
            </div>
          </div>
        }
      />

      {/* Outcomes + Deliverables */}
      <Section className="border-t border-[var(--color-line)]">
        <Container>
          <div className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-2">
            <Reveal as="div">
              <span className="kicker">Outcomes</span>
              <h2 className="h3 mt-4 max-w-[20ch]">What you take away.</h2>
              <ul className="mt-8 border-t border-[var(--color-line-strong)]">
                {s.outcomes.map((o, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-4 border-b border-[var(--color-line)] py-4"
                  >
                    <span className="num w-6 pt-1 text-xs text-[var(--color-gold-2)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-relaxed text-[var(--color-ink)]">{o}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1} as="div">
              <span className="kicker">Deliverables</span>
              <h2 className="h3 mt-4 max-w-[20ch]">What we ship.</h2>
              <ul className="mt-8 border-t border-[var(--color-line-strong)]">
                {s.deliverables.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-4 border-b border-[var(--color-line)] py-4"
                  >
                    <span className="num w-6 pt-1 text-xs text-[var(--color-muted)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-relaxed text-[var(--color-ink)]">{d}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Method */}
      <Section className="border-t border-[var(--color-line)]">
        <ProcessRail
          kicker="Method"
          heading={`How a ${s.title.toLowerCase()} engagement runs.`}
          steps={s.method}
        />
      </Section>

      {/* Related cases */}
      {relatedCases.length > 0 && (
        <Section className="border-t border-[var(--color-line)]">
          <Container wide>
            <div className="mb-10 flex items-baseline justify-between">
              <div>
                <span className="kicker">Selected work</span>
                <h2 className="h2 mt-4 max-w-[24ch]">What this practice has shipped recently.</h2>
              </div>
              <Link href="/portfolio" className="link-underline kicker hidden uppercase md:inline">
                All work →
              </Link>
            </div>
            <Stagger className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
              {relatedCases.map((c) => (
                <StaggerItem key={c.slug}>
                  <CaseCard c={c} />
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </Section>
      )}

      {/* FAQ */}
      <Section className="border-t border-[var(--color-line)]">
        <Container>
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-12">
            <Reveal as="div" className="md:col-span-4">
              <span className="kicker">Frequently asked</span>
              <h2 className="h2 mt-4 max-w-[16ch]">Questions we hear on the first call.</h2>
            </Reveal>
            <div className="md:col-span-8">
              <FaqAccordion groups={[{ items: s.faq }]} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Related practices */}
      {related.length > 0 && (
        <Section size="sm" className="border-t border-[var(--color-line)]">
          <Container>
            <span className="kicker">Adjacent practices</span>
            <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/services/${r.slug}`}
                    className="group block border-t border-[var(--color-line-strong)] pt-4 transition-colors hover:border-[var(--color-ink)]"
                  >
                    <span className="num text-sm text-[var(--color-muted)]">{r.index}</span>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-[1.35rem] leading-tight tracking-[-0.02em] text-[var(--color-ink)] group-hover:text-[var(--color-ink)]">
                      {r.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{r.kicker}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <CtaBand
        kicker={`Practice · ${s.title}`}
        heading={`Start a ${s.title.toLowerCase()} conversation.`}
      />

      <JsonLd
        data={serviceLd({
          name: s.title,
          description: s.summary,
          slug: s.slug,
          category: s.category,
        })}
      />
      <JsonLd data={faqLd(s.faq)} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: site.url },
          { name: "Services", url: `${site.url}/services` },
          { name: s.title, url: `${site.url}/services/${s.slug}` },
        ])}
      />
    </>
  );
}
