"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cases, type Case } from "@/data/portfolio";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils/cn";

const INDUSTRIES = ["All", ...Array.from(new Set(cases.map((c) => c.industry)))];

export function PortfolioGrid({ initial }: { initial?: Case[] }) {
  const [filter, setFilter] = useState<string>("All");
  const list = (initial ?? cases).filter((c) => filter === "All" || c.industry === filter);

  return (
    <Container wide>
      <div className="sticky top-[72px] z-[var(--z-raised)] flex flex-wrap items-center justify-between gap-4 border-y border-[var(--color-line)] bg-[color-mix(in_oklch,var(--color-paper)_88%,transparent)] py-4 backdrop-blur md:top-[80px]">
        <span className="kicker">Filter</span>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {INDUSTRIES.map((i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setFilter(i)}
                aria-pressed={filter === i}
                className={cn(
                  "kicker relative py-1 text-[var(--color-muted)] uppercase transition-colors hover:text-[var(--color-ink)]",
                  filter === i &&
                    "text-[var(--color-ink)] after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-[var(--color-gold)]",
                )}
              >
                {i}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2">
        {list.map((c, idx) => (
          <li key={c.slug} className={cn(idx % 3 === 0 && "md:col-span-2")}>
            <CaseCard c={c} large={idx % 3 === 0} />
          </li>
        ))}
      </ul>

      {list.length === 0 && (
        <p className="lede mt-12 text-center">
          No case studies in this industry yet. Try another filter, or{" "}
          <Link href="/contact" className="link-underline">
            write to us
          </Link>
          .
        </p>
      )}
    </Container>
  );
}

export function CaseCard({ c, large }: { c: Case; large?: boolean }) {
  return (
    <Link href={`/portfolio/${c.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-stone)]">
        <Image
          src={c.hero.src}
          alt={c.hero.alt}
          width={1600}
          height={large ? 900 : 1000}
          sizes={large ? "(min-width:1024px) 90vw, 100vw" : "(min-width:768px) 50vw, 100vw"}
          className={cn(
            "w-full object-cover transition-[transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]",
            large ? "aspect-[16/8]" : "aspect-[4/5]",
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <span className="kicker absolute top-4 left-4 text-[color-mix(in_oklch,var(--color-paper)_88%,transparent)] uppercase">
          {c.industry} · {c.region}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto] items-baseline gap-4">
        <div className="min-w-0">
          <p className="kicker">
            {c.client} · {c.year}
          </p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(1.35rem,1rem+1.4vw,2rem)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)] decoration-[var(--color-gold)] decoration-1 underline-offset-8 group-hover:underline">
            {c.title}
          </h3>
        </div>
        <span
          aria-hidden
          className="kicker text-[var(--color-gold-2)] transition-transform group-hover:translate-x-1"
        >
          →
        </span>
      </div>
    </Link>
  );
}
