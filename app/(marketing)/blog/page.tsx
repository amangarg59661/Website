"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageIntro } from "@/components/marketing/PageIntro";
import { JournalCard } from "@/components/marketing/JournalCard";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { articleCategories, articles } from "@/data/blog";
import { cn } from "@/lib/utils/cn";

export default function BlogPage() {
  const [cat, setCat] = useState<(typeof articleCategories)[number]>("All");
  const list = useMemo(
    () => articles.filter((a) => cat === "All" || a.category === cat),
    [cat],
  );

  return (
    <>
      <PageIntro
        kicker="The journal"
        title={<>Writing from the studio.</>}
        lede={
          <>
            Long-form essays on engineering, AI, design, and marketing — the pieces we would
            publish even without a website. Read one on a Sunday.
          </>
        }
        aside={
          <div>
            <span className="kicker">Categories</span>
            <ul className="mt-4 space-y-2">
              {articleCategories.map((c) => (
                <li key={c}>
                  {c === "All" ? (
                    <button
                      onClick={() => setCat("All")}
                      className={cn(
                        "link-underline text-[var(--color-ink)]",
                        cat === "All" && "font-medium",
                      )}
                    >
                      All essays
                    </button>
                  ) : (
                    <Link
                      href={`/blog/category/${c.toLowerCase()}`}
                      className="link-underline text-[var(--color-ink)]"
                    >
                      {c}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Section className="border-t border-[var(--color-line)]">
        <Container>
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="kicker">Filter</span>
            {articleCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={cn(
                  "kicker uppercase relative px-3 py-1 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors",
                  cat === c &&
                    "text-[var(--color-ink)] after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:bg-[var(--color-gold)]",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="border-t border-[var(--color-line)]">
            {list.map((a, i) => (
              <JournalCard key={a.slug} a={a} large={i === 0} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
