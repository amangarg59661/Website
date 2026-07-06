import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/PageIntro";
import { ContactForm } from "@/components/marketing/ContactForm";
import { WhatsAppCta } from "@/components/marketing/WhatsAppCta";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/config/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a consultation with Elite Digital Solutions. We reply within one business day.",
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        kicker="Consultation"
        title={<>Half an hour, one specific question, no pitch.</>}
        lede={
          <>
            Bring a live problem — a stalled roadmap, a plateaued growth curve, a codebase in slow
            decline. We&apos;ll spend the call on that, or refer you to someone better placed if we
            can&apos;t help.
          </>
        }
        aside={
          <div className="space-y-6">
            <div>
              <span className="kicker">Direct</span>
              <ul className="mt-3 space-y-2">
                <li>
                  <a
                    href={`mailto:${site.contact.email}`}
                    className="link-underline text-[var(--color-ink)]"
                  >
                    {site.contact.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${site.contact.phone}`}
                    className="link-underline text-[var(--color-ink)]"
                  >
                    {site.contact.phone}
                  </a>
                </li>
                <li>
                  <WhatsAppCta label="WhatsApp us" />
                </li>
              </ul>
            </div>
            <div>
              <span className="kicker">Response</span>
              <p className="mt-2 text-[var(--color-ink)]">{site.contact.responseTime}</p>
            </div>
            <div>
              <span className="kicker">Offices</span>
              <ul className="mt-2 space-y-1">
                {site.offices.map((o) => (
                  <li key={o.city} className="text-[var(--color-ink)]">
                    {o.city}, {o.country}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
      />

      <Section className="border-t border-[var(--color-line)]">
        <Container>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-12">
            <Reveal as="div" className="md:col-span-4">
              <span className="kicker">Inquiry</span>
              <h2 className="h2 mt-4 max-w-[16ch]">Tell us what you&apos;re solving.</h2>
              <p className="lede mt-6 max-w-[42ch]">
                Every field below is used. A partner will read your note personally and reply with a
                proposal for a first call — usually within a business day.
              </p>
              <p className="mt-8 max-w-[42ch] text-sm text-[var(--color-muted)]">
                If your inquiry is confidential, we&apos;re happy to sign an NDA before the first
                call. Just note it in the message.
              </p>
            </Reveal>

            <div className="md:col-span-8">
              <ContactForm />
            </div>
          </div>
        </Container>
      </Section>

      <Section size="sm" className="border-t border-[var(--color-line)]">
        <Container>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-baseline">
            <p className="lede max-w-[42ch]">
              For roles, applications go straight to{" "}
              <Link href="/careers" className="link-underline text-[var(--color-ink)]">
                the careers page
              </Link>{" "}
              — not this form.
            </p>
            <p className="text-sm text-[var(--color-muted)]">
              Legal ·{" "}
              <Link href="/legal/privacy" className="link-underline">
                Privacy
              </Link>{" "}
              ·{" "}
              <Link href="/legal/terms" className="link-underline">
                Terms
              </Link>
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
