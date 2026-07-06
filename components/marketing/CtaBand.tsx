import { site } from "@/config/site";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/primitives/Button";
import { Reveal } from "@/components/motion/Reveal";

export function CtaBand({
  kicker = "Consultation",
  heading = "Half an hour, one specific question, no pitch.",
  body = "We publish availability weekly. Bring a live problem — a stalled roadmap, a plateaued growth curve, a codebase in slow decline. We will spend the call on that, or refer you to someone better placed if we cannot help.",
  primary = "Book a call",
  secondary = "WhatsApp us",
}: {
  kicker?: string;
  heading?: string;
  body?: string;
  primary?: string;
  secondary?: string;
}) {
  return (
    <section className="on-ink relative overflow-hidden">
      <Container className="py-24 md:py-32 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10 items-end">
          <Reveal as="div" className="md:col-span-8">
            <span className="kicker">{kicker}</span>
            <h2 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2rem,1.4rem+2.4vw,3.75rem)] leading-[1.03] tracking-[-0.03em] max-w-[22ch]">
              {heading}
            </h2>
            <p className="lede mt-6 max-w-[58ch]">{body}</p>
          </Reveal>
          <Reveal as="div" delay={0.15} className="md:col-span-4 flex md:justify-end gap-3 flex-col md:items-end">
            <ButtonLink href="/contact" intent="onInkFilled" size="lg" withArrow>
              {primary}
            </ButtonLink>
            <ButtonLink
              href={`https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(site.contact.whatsappMessage)}`}
              external
              intent="onInk"
              size="lg"
            >
              {secondary}
            </ButtonLink>
          </Reveal>
        </div>
        {/* Horizon rule */}
        <div aria-hidden className="mt-16 h-px bg-[color-mix(in_oklch,var(--color-paper)_18%,transparent)]" />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 kicker text-[color-mix(in_oklch,var(--color-paper)_74%,transparent)]">
          <p>Response · {site.contact.responseTime}</p>
          <p>{site.hq}</p>
          <p>Direct · {site.contact.phone}</p>
          <p>Email · {site.contact.email}</p>
        </div>
      </Container>
    </section>
  );
}
