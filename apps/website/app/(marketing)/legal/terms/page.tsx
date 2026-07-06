import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/PageIntro";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { legal } from "@/config/legal";
import { site } from "@/config/site";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms of use for ${site.legalName}.`,
};

export default function TermsPage() {
  return (
    <>
      <PageIntro
        kicker={`Effective ${formatDate(legal.effectiveDate)}`}
        title={<>Terms of Use</>}
        lede={
          <>
            These terms govern your use of {site.url}. By using the site, you agree to them. If you
            don&apos;t, please don&apos;t.
          </>
        }
      />

      <Section className="border-t border-[var(--color-line)]">
        <Container reading>
          <article className="prose">
            <h2>The site</h2>
            <p>
              This site is published by {legal.entity}, registered in {legal.jurisdiction}. It is a
              marketing surface — case studies, essays, and the studio&apos;s point of view. Nothing
              on it constitutes a binding proposal, contract, or professional advice.
            </p>

            <h2>Intellectual property</h2>
            <p>
              All content — words, images, code, marks — is either owned by the studio or licensed
              for our use. You may quote briefly with attribution and a link. You may not republish
              essays or case studies wholesale without permission. Client marks belong to their
              respective owners.
            </p>

            <h2>Acceptable use</h2>
            <p>
              Please don&apos;t scrape the site, attempt to breach it, submit malicious payloads via
              the contact form, or use it in ways that would embarrass a competent lawyer.
            </p>

            <h2>External links</h2>
            <p>
              We link to external sites we find worth reading. We are not responsible for their
              content, availability, or how they behave.
            </p>

            <h2>Warranties &amp; liability</h2>
            <p>
              The site is provided &quot;as is&quot;. To the extent permitted by law, we exclude all
              implied warranties, and our liability for anything arising from your use of the site
              is limited to the sum of INR one hundred (₹100).
            </p>

            <h2>Changes</h2>
            <p>
              We may revise these terms. The effective date at the top of the page reflects the last
              revision.
            </p>

            <h2>Governing law</h2>
            <p>
              These terms are governed by the laws of India. Disputes will be brought before the
              courts of {legal.registeredAt}.
            </p>

            <h2>Contact</h2>
            <p>
              For questions about these terms, write to{" "}
              <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>.
            </p>
          </article>
        </Container>
      </Section>
    </>
  );
}
