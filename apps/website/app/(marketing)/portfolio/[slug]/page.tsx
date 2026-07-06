import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cases, casesBySlug } from "@/data/portfolio";
import { PageIntro } from "@/components/marketing/PageIntro";
import { CtaBand } from "@/components/marketing/CtaBand";
import { CaseCard } from "@/components/marketing/PortfolioGrid";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { breadcrumbLd, JsonLd } from "@/lib/seo/jsonld";
import { site } from "@/config/site";

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = casesBySlug[slug];
  if (!c) return {};
  return {
    title: `${c.client} — ${c.title}`,
    description: c.summary,
    alternates: { canonical: `${site.url}/portfolio/${c.slug}` },
    openGraph: {
      title: `${c.client} — ${c.title}`,
      description: c.summary,
      images: [{ url: c.hero.src, width: 1600, height: 900 }],
    },
  };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = casesBySlug[slug];
  if (!c) notFound();

  const others = cases.filter((x) => x.slug !== c.slug).slice(0, 2);

  return (
    <>
      <PageIntro
        kicker={`Case · ${c.industry} · ${c.year}`}
        title={<>{c.title}</>}
        lede={<>{c.summary}</>}
        aside={
          <div className="space-y-6">
            <div>
              <span className="kicker">Client</span>
              <p className="mt-2 text-[var(--color-ink)]">{c.client}</p>
            </div>
            <div>
              <span className="kicker">Region</span>
              <p className="mt-2 text-[var(--color-ink)]">{c.region}</p>
            </div>
            <div>
              <span className="kicker">Practices</span>
              <ul className="mt-2 space-y-1">
                {c.services.map((s) => (
                  <li key={s} className="text-[var(--color-ink)]">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
      />

      {/* Hero image */}
      <Section size="sm">
        <Container wide>
          <Reveal>
            <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-stone)]">
              <Image
                src={c.hero.src}
                alt={c.hero.alt}
                fill
                sizes="100vw"
                priority
                className="object-cover"
              />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Metrics ledger */}
      <Section className="border-t border-[var(--color-line)]" size="sm">
        <Container>
          <Stagger className="grid grid-cols-2 gap-[1px] border border-[var(--color-line)] bg-[var(--color-line)] md:grid-cols-4">
            {c.metrics.map((m) => (
              <StaggerItem
                key={m.label}
                className="flex min-h-[160px] flex-col justify-between bg-[var(--color-paper)] p-6 md:p-8"
              >
                <span className="kicker">{m.label}</span>
                <p className="num font-[family-name:var(--font-display)] text-[clamp(1.5rem,1rem+2vw,2.5rem)] leading-none tracking-[-0.02em] text-[var(--color-ink)]">
                  {m.value}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      {/* Narrative */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-12">
            <Reveal as="div" className="md:sticky md:top-[100px] md:col-span-4 md:self-start">
              <span className="kicker">The account</span>
              <p className="h3 mt-4 max-w-[16ch]">Three passes at the shape.</p>
              <p className="lede mt-6 max-w-[42ch]">
                A case is not a highlight reel. This is the actual account of the engagement — the
                problem, the shape of the answer, the compounding.
              </p>
            </Reveal>
            <div className="space-y-16 md:col-span-8">
              {c.narrative.map((n, i) => (
                <Reveal key={n.heading} delay={i * 0.08}>
                  <article>
                    <span className="kicker num text-[var(--color-gold-2)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-3 max-w-[24ch] font-[family-name:var(--font-display)] text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]">
                      {n.heading}
                    </h3>
                    <p className="mt-5 max-w-[62ch] leading-[1.7] text-[var(--color-muted)]">
                      {n.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Stack + credits */}
      <Section className="border-t border-[var(--color-line)]" size="sm">
        <Container>
          <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
            <Reveal>
              <span className="kicker">Stack</span>
              <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-3">
                {c.stack.map((t) => (
                  <li
                    key={t}
                    className="kicker rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] px-3 py-1 uppercase"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1}>
              <span className="kicker">Studio credits</span>
              <ul className="mt-4 space-y-2">
                {c.credit.map((cr) => (
                  <li key={cr.name} className="grid grid-cols-[10rem_1fr] gap-4">
                    <span className="kicker">{cr.role}</span>
                    <span className="text-[var(--color-ink)]">{cr.name}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Related work */}
      <Section className="border-t border-[var(--color-line)]">
        <Container wide>
          <div className="mb-10 flex items-baseline justify-between">
            <span className="kicker">More work</span>
            <Link href="/portfolio" className="link-underline kicker uppercase">
              All work →
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
            {others.map((o) => (
              <li key={o.slug}>
                <CaseCard c={o} />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaBand
        kicker="Talk to us"
        heading={`If ${c.client} rhymes with your problem, we should meet.`}
      />

      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: site.url },
          { name: "Portfolio", url: `${site.url}/portfolio` },
          { name: c.client, url: `${site.url}/portfolio/${c.slug}` },
        ])}
      />
    </>
  );
}
