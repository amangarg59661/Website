import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/marketing/PageIntro";
import { StatLedger } from "@/components/marketing/StatLedger";
import { TestimonialQuote } from "@/components/marketing/TestimonialQuote";
import { CtaBand } from "@/components/marketing/CtaBand";
import { LogoMarquee } from "@/components/marketing/LogoMarquee";
import { ProcessRail } from "@/components/marketing/ProcessRail";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "The studio",
  description:
    "A boutique studio for global technology teams, founded in 2021. Bengaluru, London, Dubai.",
};

const beliefs = [
  {
    n: "01",
    t: "Small teams, senior operators.",
    b: "The people who pitch are the people who ship. No sales team handing off to a delivery team. Three-to-eight-person engagements led by partners.",
  },
  {
    n: "02",
    t: "Boring, durable technology.",
    b: "We chose most of our stack six years ago and remain unbored. Novelty is a decision we make with reasons — never as a default.",
  },
  {
    n: "03",
    t: "Handover as a design goal.",
    b: "Every engagement is designed to leave a team behind who no longer needs us. Retention comes from choice, not lock-in.",
  },
  {
    n: "04",
    t: "Craft, measurable.",
    b: "Beautiful work that does not perform is decoration. Performing work that is ugly is disposable. We refuse the trade.",
  },
];

const partners = [
  { name: "Rukmini Iyer", role: "Engagement Lead · Engineering", location: "Bengaluru" },
  { name: "Kavya Nair", role: "Principal Engineer · SaaS & AI", location: "Bengaluru" },
  { name: "Luca Kohler", role: "Creative Director · Brand", location: "London" },
  { name: "Tomás Ramírez", role: "Growth Lead · Performance", location: "London" },
  { name: "Vinita Bora", role: "Product Lead · Mobile & Public Service", location: "Guwahati" },
  { name: "Marcus Fernandes", role: "Principal Engineer · Platform", location: "Lisbon" },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        kicker="The studio · Est 2021"
        title={<>A studio for the technology work that has to be right.</>}
        lede={
          <>
            Elite Digital is a boutique studio. Forty-six people, three offices, one operating
            model — small teams of senior operators, led by partners, working under the client&apos;s
            constraints instead of around them. We started in Bengaluru in {site.founded}. We
            remain deliberately unfashionable.
          </>
        }
        aside={
          <div className="space-y-6">
            <div>
              <span className="kicker">Founded</span>
              <p className="mt-2 num font-[family-name:var(--font-display)] text-[2rem] leading-none">
                {site.founded}
              </p>
            </div>
            <div>
              <span className="kicker">People</span>
              <p className="mt-2 num font-[family-name:var(--font-display)] text-[2rem] leading-none">
                46
              </p>
            </div>
            <div>
              <span className="kicker">Offices</span>
              <ul className="mt-2 space-y-1">
                {site.offices.map((o) => (
                  <li key={o.city} className="text-[var(--color-ink)]">
                    {o.city}, {o.country}
                    <span className="text-[var(--color-muted)] ml-2 text-sm">{o.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
      />

      {/* Beliefs */}
      <Section labelledBy="beliefs" className="border-t border-[var(--color-line)]">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-14">
            <Reveal as="div" className="md:col-span-4">
              <span id="beliefs" className="kicker">
                What we believe
              </span>
              <h2 className="mt-4 h2 max-w-[16ch]">Four principles, one operating manual.</h2>
              <p className="lede mt-6 max-w-[42ch]">
                Every decision we make — hiring, pricing, retainer terms, the way we run
                Fridays — comes back to these.
              </p>
            </Reveal>
            <Stagger className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
              {beliefs.map((b) => (
                <StaggerItem key={b.n}>
                  <div className="border-t border-[var(--color-line-strong)] pt-6">
                    <div className="flex items-baseline gap-4">
                      <span className="num text-sm text-[var(--color-muted)] w-6">{b.n}</span>
                      <h3 className="font-[family-name:var(--font-display)] text-[clamp(1.25rem,1rem+1vw,1.65rem)] leading-[1.15] tracking-[-0.02em]">
                        {b.t}
                      </h3>
                    </div>
                    <p className="mt-4 pl-10 text-[var(--color-muted)] leading-[1.7] max-w-[52ch]">
                      {b.b}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Container>
      </Section>

      {/* Process rail */}
      <Section>
        <ProcessRail
          heading="A schedule you can put in a board deck."
          steps={[
            { title: "Diagnose", body: "One to two weeks embedded with the team owning the problem. Paid discovery. Deliverable is the shape of the engagement, not the pitch." },
            { title: "Contract", body: "Fixed-fee proposal with a schedule, a team, and the exact people. Signed in writing. Never billed by the hour." },
            { title: "Ship", body: "Weekly demos and written updates on Fridays. Feature-flagged rollouts. No surprises at review." },
            { title: "Steward", body: "We hand back a codebase, a brand, or a growth engine — with a team ready to own it, or a retainer to keep steering." },
          ]}
        />
      </Section>

      {/* Ledger */}
      <Section className="border-t border-[var(--color-line)]">
        <StatLedger />
      </Section>

      {/* Partners */}
      <Section className="border-t border-[var(--color-line)]">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10">
            <Reveal as="div" className="md:col-span-4">
              <span className="kicker">Partners</span>
              <h2 className="mt-4 h2 max-w-[14ch]">The people who run the engagements.</h2>
              <p className="lede mt-6 max-w-[42ch]">
                Six partners, forty engineers, designers, editors, and strategists. No junior handoffs.
              </p>
              <Link href="/careers" className="link-underline kicker uppercase mt-6 inline-block">
                Join the studio →
              </Link>
            </Reveal>
            <Stagger className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
              {partners.map((p) => (
                <StaggerItem key={p.name}>
                  <div className="border-t border-[var(--color-line-strong)] pt-6">
                    <p className="font-[family-name:var(--font-display)] text-[1.35rem] leading-tight tracking-[-0.02em] text-[var(--color-ink)]">
                      {p.name}
                    </p>
                    <p className="mt-1 text-[var(--color-muted)]">{p.role}</p>
                    <p className="mt-3 kicker">{p.location}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Container>
      </Section>

      {/* Clients marquee */}
      <Section size="sm" className="border-t border-[var(--color-line)]">
        <Container wide>
          <span className="kicker block mb-8">Selected clients</span>
          <LogoMarquee />
        </Container>
      </Section>

      <TestimonialQuote index={1} />

      <CtaBand
        kicker="Introduce yourself"
        heading="If our shape matches your shape, we should meet."
      />
    </>
  );
}
