"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Item = { q: string; a: string };
type Group = { category?: string; items: Item[] };

export function FaqAccordion({
  groups,
  className,
}: {
  groups: Group[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-12", className)}>
      {groups.map((g, gi) => (
        <div key={g.category ?? gi}>
          {g.category && <p className="kicker mb-6">{g.category}</p>}
          <Accordion.Root type="multiple" className="border-t border-[var(--color-line)]">
            {g.items.map((item, i) => (
              <Accordion.Item
                key={i}
                value={`${gi}-${i}`}
                className="border-b border-[var(--color-line)]"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-start justify-between gap-6 py-6 md:py-8 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2">
                    <span className="font-[family-name:var(--font-display)] text-[clamp(1.15rem,0.95rem+0.9vw,1.5rem)] leading-[1.2] tracking-[-0.01em] text-[var(--color-ink)]">
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      className="flex-shrink-0 mt-1 h-6 w-6 grid place-items-center border border-[var(--color-line-strong)] rounded-full text-[var(--color-ink)] group-hover:border-[var(--color-ink)] transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 group-data-[state=open]:hidden" />
                      <Minus className="h-3.5 w-3.5 hidden group-data-[state=open]:block" />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-open data-[state=closed]:animate-accordion-closed">
                  <p className="pb-8 pr-12 max-w-[64ch] text-[var(--color-muted)] leading-[1.7]">
                    {item.a}
                  </p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      ))}
    </div>
  );
}
