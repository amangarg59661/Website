import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageIntro } from "@/components/marketing/PageIntro";
import { CtaBand } from "@/components/marketing/CtaBand";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@edss/ui/button";
import { formatDate } from "@edss/utils/format";
import { site } from "@/config/site";
import { fetchRole, fetchRoles } from "@/lib/careers/fetch";
import { ApplyForm } from "@/components/marketing/ApplyForm";

/**
 * C-4: single-role page. Data source swapped to backend fetch with ISR;
 * layout, motion, aside, prose section and CTA all preserved. Apply flow
 * changed from mailto to a real form section at the bottom of the page.
 * Aside "Apply" button anchors to that form.
 *
 * `revalidate` must be a literal integer for Next's build-time analysis
 * to pick it up — keep in sync with REVALIDATE_SECONDS in lib/careers/fetch.
 */
export const revalidate = 300;

export async function generateStaticParams() {
  const roles = await fetchRoles();
  return roles.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await fetchRole(slug);
  if (!r) return {};
  return { title: r.title, description: r.summary };
}

export default async function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await fetchRole(slug);
  if (!r) notFound();

  return (
    <>
      <PageIntro
        kicker={`Careers · ${r.team}${r.posted ? ` · Posted ${formatDate(r.posted)}` : ""}`}
        title={<>{r.title}</>}
        lede={<>{r.summary}</>}
        aside={
          <div className="space-y-5">
            <div>
              <span className="kicker">Location</span>
              <p className="mt-2 text-[var(--color-ink)]">{r.location}</p>
            </div>
            <div>
              <span className="kicker">Type</span>
              <p className="mt-2 text-[var(--color-ink)]">{r.type}</p>
            </div>
            {r.commitment && (
              <div>
                <span className="kicker">Commitment</span>
                <p className="mt-2 text-[var(--color-ink)]">{r.commitment}</p>
              </div>
            )}
            <ButtonLink href="#apply" intent="primary" size="md" withArrow>
              Apply
            </ButtonLink>
          </div>
        }
      />

      <Section className="border-t border-[var(--color-line)]">
        <Container reading>
          <article className="prose">
            <h2>What you&apos;ll do</h2>
            <ul>
              {(r.responsibilities ?? []).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <h2>What we&apos;re looking for</h2>
            <ul>
              {(r.requirements ?? []).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <h2>How to apply</h2>
            <p>
              Fill in the form below. We reply personally to every application within two weeks.
              Referrals are always welcome. If you would rather send a private note,{" "}
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a> works too.
            </p>
          </article>

          <div id="apply" className="mt-16 scroll-mt-24 border-t border-[var(--color-line)] pt-12">
            <span className="kicker">Apply</span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] leading-tight tracking-[-0.02em] text-[var(--color-ink)]">
              Send your application for {r.title}.
            </h2>
            <div className="mt-8">
              <ApplyForm slug={r.slug} roleTitle={r.title} />
            </div>
          </div>

          <div className="mt-16 border-t border-[var(--color-line)] pt-8">
            <Link href="/careers" className="link-underline kicker uppercase">
              ← All open roles
            </Link>
          </div>
        </Container>
      </Section>

      <CtaBand kicker="Questions" heading="If you're not sure it fits, ask. We answer briefly." />
    </>
  );
}
