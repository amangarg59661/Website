import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/PageIntro";
import { PortfolioGrid } from "@/components/marketing/PortfolioGrid";
import { CtaBand } from "@/components/marketing/CtaBand";
import { Section } from "@/components/layout/Section";

export const metadata: Metadata = {
  title: "Selected work",
  description:
    "Case studies from Elite Digital Solutions across finance, health, logistics, wealth, DTC, and public service.",
};

export default function PortfolioPage() {
  return (
    <>
      <PageIntro
        kicker="Selected work"
        title={<>Every case study a client asked us to publish.</>}
        lede={
          <>
            Roughly a third of our engagements are named here. The others cannot be, or their
            clients prefer them not to be. Every project below reflects a live, in-production result
            — and the client we worked with signed off on the words on the page.
          </>
        }
      />
      <Section>
        <PortfolioGrid />
      </Section>
      <CtaBand
        kicker="Talk to us"
        heading="If your problem rhymes with any of these, we should meet."
      />
    </>
  );
}
