import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { articleCategories, articles } from "@/data/blog";
import { PageIntro } from "@/components/marketing/PageIntro";
import { JournalCard } from "@/components/marketing/JournalCard";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";

export function generateStaticParams() {
  return articleCategories.filter((c) => c !== "All").map((c) => ({ slug: c.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = articleCategories.find((c) => c.toLowerCase() === slug);
  if (!cat) return {};
  return {
    title: `${cat} — Journal`,
    description: `Long-form writing from the studio on ${cat.toLowerCase()}.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = articleCategories.find((c) => c.toLowerCase() === slug);
  if (!cat || cat === "All") notFound();
  const list = articles.filter((a) => a.category === cat);

  return (
    <>
      <PageIntro
        kicker={`Journal · ${cat}`}
        title={<>Writing on {cat.toLowerCase()}.</>}
        lede={<>{list.length} essays.</>}
        aside={
          <div>
            <span className="kicker">Categories</span>
            <ul className="mt-4 space-y-2">
              {articleCategories.map((c) => (
                <li key={c}>
                  <Link
                    href={c === "All" ? "/blog" : `/blog/category/${c.toLowerCase()}`}
                    className={`link-underline ${c === cat ? "font-medium text-[var(--color-ink)]" : "text-[var(--color-muted)]"}`}
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        }
      />

      <Section className="border-t border-[var(--color-line)]">
        <Container>
          <div className="border-t border-[var(--color-line)]">
            {list.length === 0 && <p className="lede py-16">Nothing in this category yet.</p>}
            {list.map((a, i) => (
              <JournalCard key={a.slug} a={a} large={i === 0} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
