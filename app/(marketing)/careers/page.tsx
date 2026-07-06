import type { Metadata } from "next";
import Link from "next/link";
import careersData from "@/content/careers.json";
import { PageIntro } from "@/components/marketing/PageIntro";
import { CtaBand } from "@/components/marketing/CtaBand";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { site } from "@/config/site";

type Role = {
  slug: string;
  title: string;
  team: string;
  location: string;
  type: string;
  summary: string;
};

const roles = careersData as Role[];

export const metadata: Metadata = {
  title: "Careers",
  description: "Roles at Elite Digital Solutions Studio. Small teams, senior operators.",
};

export default function CareersPage() {
  return (
    <>
      <PageIntro
        kicker="Careers"
        title={<>The studio is hiring, slowly, for a small number of specific roles.</>}
        lede={
          <>
            We hire in cohorts of two to four a year. Every role below is open right now. If
            nothing fits, keep an eye — or write to {site.contact.email} with a portfolio
            and a note.
          </>
        }
        aside={
          <div className="space-y-6">
            <div>
              <span className="kicker">People</span>
              <p className="mt-2 num font-[family-name:var(--font-display)] text-[2rem] leading-none">
                46
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">across three offices</p>
            </div>
            <div>
              <span className="kicker">Retention</span>
              <p className="mt-2 num font-[family-name:var(--font-display)] text-[2rem] leading-none">
                91%
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">year-over-year</p>
            </div>
          </div>
        }
      />

      <Section className="border-t border-[var(--color-line)]">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10">
            <Reveal as="div" className="md:col-span-4">
              <span className="kicker">Open roles</span>
              <h2 className="mt-4 h2 max-w-[16ch]">Three roles. Each held to the same bar.</h2>
              <p className="lede mt-6 max-w-[42ch]">
                We do not run open applications. Every role below has a shape and a partner
                sponsoring it. Read carefully; if it fits, apply.
              </p>
            </Reveal>

            <Stagger className="md:col-span-8 border-t border-[var(--color-line)]">
              {roles.length === 0 && (
                <p className="lede py-16">
                  No open roles this cycle. We&apos;ll re-open in the next quarter.
                </p>
              )}
              {roles.map((r) => (
                <StaggerItem key={r.slug}>
                  <Link
                    href={`/careers/${r.slug}`}
                    className="group grid grid-cols-1 md:grid-cols-[1fr_auto_auto] items-baseline gap-4 md:gap-8 py-8 border-b border-[var(--color-line)] hover:bg-[var(--color-stone)] transition-colors px-0 hover:px-4"
                  >
                    <div className="min-w-0">
                      <span className="kicker">{r.team}</span>
                      <h3 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.35rem,1rem+1.4vw,2rem)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]">
                        {r.title}
                      </h3>
                      <p className="mt-3 text-[var(--color-muted)] max-w-[52ch]">{r.summary}</p>
                    </div>
                    <span className="kicker text-[var(--color-muted)]">{r.location}</span>
                    <span className="kicker text-[var(--color-gold-2)] group-hover:translate-x-1 transition-transform">
                      Apply →
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Container>
      </Section>

      <CtaBand
        kicker="Not the right role?"
        heading="We keep interesting portfolios on file. Send one."
        primary="Contact us"
        secondary="WhatsApp"
      />
    </>
  );
}
