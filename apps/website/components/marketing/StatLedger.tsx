import { ledger } from "@/data/stats";
import { Container } from "@/components/layout/Container";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";

export function StatLedger() {
  return (
    <Container>
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-12">
        <Reveal as="div" className="md:col-span-4">
          <span className="kicker">The ledger</span>
          <h2 className="h2 mt-4 max-w-[14ch]">Numbers that mean something to a CFO.</h2>
          <p className="lede mt-4">
            No exit-year fabrications. No round-number theatre. What we report internally, published
            without ceremony.
          </p>
        </Reveal>

        <Stagger className="grid grid-cols-2 gap-[1px] border border-[var(--color-line)] bg-[var(--color-line)] md:col-span-8 md:grid-cols-3">
          {ledger.map((s) => (
            <StaggerItem
              key={s.label}
              className="flex min-h-[180px] flex-col justify-between bg-[var(--color-paper)] p-6 md:p-8"
            >
              <span className="kicker">{s.label}</span>
              <div>
                <p className="num font-[family-name:var(--font-display)] text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-none tracking-[-0.03em] text-[var(--color-ink)]">
                  {s.value}
                </p>
                <p className="mt-2 text-sm text-[color:var(--color-muted)]">{s.meta}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Container>
  );
}
