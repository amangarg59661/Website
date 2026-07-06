import { Container } from "@/components/layout/Container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";

export function ProcessRail({
  kicker = "How we work",
  heading = "A schedule you can put in a board deck.",
  steps,
}: {
  kicker?: string;
  heading?: string;
  steps: { title: string; body: string }[];
}) {
  return (
    <Container>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-12">
        <Reveal as="div" className="md:col-span-4">
          <span className="kicker">{kicker}</span>
          <h2 className="mt-4 h2 max-w-[18ch]">{heading}</h2>
        </Reveal>
        <Stagger className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
          {steps.map((s, i) => (
            <StaggerItem key={s.title}>
              <div className="flex items-baseline gap-4 border-t border-[var(--color-line-strong)] pt-6">
                <span className="num text-[var(--color-muted)] text-sm w-8">0{i + 1}</span>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-[clamp(1.25rem,1rem+1vw,1.75rem)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[var(--color-muted)] max-w-[46ch] leading-[1.7]">
                    {s.body}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Container>
  );
}
