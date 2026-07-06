import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import careersData from "@/content/careers.json";
import { PageIntro } from "@/components/marketing/PageIntro";
import { CtaBand } from "@/components/marketing/CtaBand";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/primitives/Button";
import { formatDate } from "@/lib/utils/format";
import { site } from "@/config/site";

type Role = {
  slug: string;
  title: string;
  team: string;
  location: string;
  type: string;
  commitment: string;
  posted: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
};

const roles = careersData as Role[];
const bySlug = Object.fromEntries(roles.map((r) => [r.slug, r])) as Record<string, Role>;

export function generateStaticParams() {
  return roles.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = bySlug[slug];
  if (!r) return {};
  return { title: r.title, description: r.summary };
}

export default async function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = bySlug[slug];
  if (!r) notFound();

  return (
    <>
      <PageIntro
        kicker={`Careers · ${r.team} · Posted ${formatDate(r.posted)}`}
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
            <div>
              <span className="kicker">Commitment</span>
              <p className="mt-2 text-[var(--color-ink)]">{r.commitment}</p>
            </div>
            <ButtonLink
              href={`mailto:${site.contact.email}?subject=Application — ${encodeURIComponent(r.title)}`}
              external
              intent="primary"
              size="md"
              withArrow
            >
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
              {r.responsibilities.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <h2>What we&apos;re looking for</h2>
            <ul>
              {r.requirements.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <h2>How to apply</h2>
            <p>
              Send a portfolio, a short note on why this role, and one recent piece of work
              you&apos;re proud of to{" "}
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>. We reply personally
              to every application within a week. Referrals are always welcome.
            </p>
          </article>

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
