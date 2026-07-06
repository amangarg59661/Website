import type { Metadata } from "next";
import faqs from "@/content/faqs.json";
import { PageIntro } from "@/components/marketing/PageIntro";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { CtaBand } from "@/components/marketing/CtaBand";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { faqLd, JsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Frequently asked",
  description: "How we structure engagements, how our team works, and how to work with us.",
};

export default function FaqsPage() {
  const allItems = faqs.flatMap((g) => g.items);
  return (
    <>
      <PageIntro
        kicker="Questions we hear often"
        title={<>Practical answers to the questions clients ask on the first call.</>}
        lede={
          <>
            If your question isn&apos;t answered here, write to us. Every inquiry is read by a
            partner, not a bot.
          </>
        }
      />

      <Section className="border-t border-[var(--color-line)]">
        <Container reading>
          <FaqAccordion groups={faqs} />
        </Container>
      </Section>

      <CtaBand kicker="Still curious" heading="Half an hour on a call answers most questions." />

      <JsonLd data={faqLd(allItems)} />
    </>
  );
}
