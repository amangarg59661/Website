"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@edss/utils/cn";

type Item = { q: string; a: string };
type Group = { category?: string; items: Item[] };

export function FaqAccordion({ groups, className }: { groups: Group[]; className?: string }) {
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
                  <Accordion.Trigger className="group flex w-full items-start justify-between gap-6 py-6 text-left focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:outline-none md:py-8">
                    <span className="font-[family-name:var(--font-display)] text-[clamp(1.15rem,0.95rem+0.9vw,1.5rem)] leading-[1.2] tracking-[-0.01em] text-[var(--color-ink)]">
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      className="mt-1 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-ink)] transition-colors group-hover:border-[var(--color-ink)]"
                    >
                      <Plus className="h-3.5 w-3.5 group-data-[state=open]:hidden" />
                      <Minus className="hidden h-3.5 w-3.5 group-data-[state=open]:block" />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="data-[state=open]:animate-accordion-open data-[state=closed]:animate-accordion-closed overflow-hidden">
                  <p className="max-w-[64ch] pr-12 pb-8 leading-[1.7] text-[var(--color-muted)]">
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
