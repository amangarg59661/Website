import { clients } from "@/data/clients";
import { Marquee } from "@/components/motion/Marquee";

export function LogoMarquee({ ink }: { ink?: boolean }) {
  return (
    <div className={ink ? "text-[color-mix(in_oklch,var(--color-paper)_74%,transparent)]" : "text-[var(--color-muted)]"}>
      <Marquee>
        {clients.map((c) => (
          <span
            key={c.name}
            className="font-[family-name:var(--font-display)] text-[clamp(1.4rem,1.1rem+1vw,2rem)] tracking-[-0.02em] whitespace-nowrap"
          >
            {c.name}
            <span className="mx-6 opacity-50">·</span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}
