import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/PageIntro";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { legal } from "@/config/legal";
import { site } from "@/config/site";
import { formatDate } from "@edss/utils/format";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${site.legalName}.`,
};

export default function PrivacyPage() {
  return (
    <>
      <PageIntro
        kicker={`Effective ${formatDate(legal.effectiveDate)}`}
        title={<>Privacy Policy</>}
        lede={
          <>
            {legal.entity} (&quot;the studio&quot;, &quot;we&quot;) publishes this policy so anyone
            who visits or writes to us knows what data we collect, why, and how long we keep it.
          </>
        }
      />

      <Section className="border-t border-[var(--color-line)]">
        <Container reading>
          <article className="prose">
            <h2>Information we collect</h2>
            <p>
              We collect only what you send us, and what your browser sends automatically. When you
              submit the contact form, we receive your name, email, phone number, preferred meeting
              time, and message. When you visit any page on this site, our server records the
              request URL, referrer, IP address, and user agent for a short retention window.
            </p>

            <h2>How we use it</h2>
            <p>
              Inquiries are used to reply to you, schedule the call you requested, and — if the
              conversation moves to an engagement — draft a proposal. We do not share, sell, or rent
              inquiry data to any third party. Aggregate, anonymised traffic data is used to
              understand how the site is used and to improve it.
            </p>

            <h2>Third-party services</h2>
            <p>
              The site is hosted on Vercel. Contact emails are delivered by Resend. Analytics is
              handled by Vercel Analytics (privacy-preserving; no cookies). Fonts are self-hosted;
              no external font CDN is used. WhatsApp links open the WhatsApp application, which is
              governed by Meta&apos;s privacy policy.
            </p>

            <h2>Cookies</h2>
            <p>
              We use one cookie category: strictly necessary. No advertising cookies. No cross-site
              tracking cookies. If we ever add a category, we will surface a banner with granular
              consent.
            </p>

            <h2>Retention</h2>
            <p>
              Inquiry emails are retained in the studio&apos;s CRM for the duration of the
              engagement plus twenty-four months. Server logs are retained for thirty days. On
              request, we will delete any personal data we hold about you within thirty days.
            </p>

            <h2>Your rights</h2>
            <p>
              Under GDPR, CCPA/CPRA, and the DPDPA (India), you may request access to, correction
              of, or deletion of personal data we hold. Write to{" "}
              <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>. We respond within
              thirty days.
            </p>

            <h2>Children</h2>
            <p>
              This site is directed at professionals. We do not knowingly collect data from
              individuals under sixteen.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              We update this policy when material changes are warranted. The effective date at the
              top reflects the last revision. Substantive changes will be summarised in the
              studio&apos;s next journal essay.
            </p>

            <h2>Contact</h2>
            <p>
              For anything privacy-related, write to{" "}
              <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>. For everything
              else, <a href="/contact">contact us here</a>.
            </p>
          </article>
        </Container>
      </Section>
    </>
  );
}
