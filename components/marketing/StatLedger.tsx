import { ledger } from "@/data/stats";
import { Container } from "@/components/layout/Container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";

export function StatLedger() {
  return (
    <Container>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10">
        <Reveal as="div" className="md:col-span-4">
          <span className="kicker">The ledger</span>
          <h2 className="mt-4 h2 max-w-[14ch]">
            Numbers that mean something to a CFO.
          </h2>
          <p className="lede mt-4">
            No exit-year fabrications. No round-number theatre. What we report internally, published without ceremony.
          </p>
        </Reveal>

        <Stagger className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-[1px] bg-[var(--color-line)] border border-[var(--color-line)]">
          {ledger.map((s) => (
            <StaggerItem
              key={s.label}
              className="bg-[var(--color-paper)] p-6 md:p-8 flex flex-col justify-between min-h-[180px]"
            >
              <span className="kicker">{s.label}</span>
              <div>
                <p className="num font-[family-name:var(--font-display)] text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-none tracking-[-0.03em] text-[var(--color-ink)]">
                  {s.value}
                </p>
                <p className="mt-2 text-[color:var(--color-muted)] text-sm">{s.meta}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Container>
  );
}
