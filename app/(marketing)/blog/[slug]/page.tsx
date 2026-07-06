import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { articles, articlesBySlug } from "@/data/blog";
import { PageIntro } from "@/components/marketing/PageIntro";
import { CtaBand } from "@/components/marketing/CtaBand";
import { JournalCard } from "@/components/marketing/JournalCard";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/motion/Reveal";
import { renderArticleBody } from "@/lib/mdx/renderArticle";
import { articleLd, breadcrumbLd, JsonLd } from "@/lib/seo/jsonld";
import { site } from "@/config/site";
import { formatDate } from "@/lib/utils/format";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = articlesBySlug[slug];
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `${site.url}/blog/${a.slug}` },
    openGraph: {
      title: a.title,
      description: a.description,
      type: "article",
      publishedTime: a.date,
      authors: [a.author.name],
      images: [{ url: a.cover.src, width: 1600, height: 900 }],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = articlesBySlug[slug];
  if (!a) notFound();

  const related = articles.filter((x) => x.slug !== a.slug && x.category === a.category).slice(0, 2);

  return (
    <>
      <PageIntro
        kicker={`Journal · ${a.category} · ${formatDate(a.date)}`}
        title={<>{a.title}</>}
        lede={<>{a.description}</>}
        aside={
          <div className="space-y-6">
            <div>
              <span className="kicker">By</span>
              <p className="mt-2 text-[var(--color-ink)]">{a.author.name}</p>
              <p className="text-sm text-[var(--color-muted)]">{a.author.role}</p>
            </div>
            <div>
              <span className="kicker">Reading time</span>
              <p className="mt-2 text-[var(--color-ink)]">{a.readingTime}</p>
            </div>
            <div>
              <span className="kicker">Category</span>
              <p className="mt-2">
                <Link
                  href={`/blog/category/${a.category.toLowerCase()}`}
                  className="link-underline text-[var(--color-ink)]"
                >
                  {a.category}
                </Link>
              </p>
            </div>
          </div>
        }
      />

      {/* Hero image */}
      <Section size="sm">
        <Container wide>
          <Reveal>
            <div className="relative aspect-[16/8] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-stone)]">
              <Image
                src={a.cover.src}
                alt={a.cover.alt}
                fill
                sizes="100vw"
                priority
                className="object-cover"
              />
            </div>
          </Reveal>
        </Container>
      </Section>

      <Section>
        <Container>
          <article className="prose dropcap mx-auto">{renderArticleBody(a.body)}</article>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section className="border-t border-[var(--color-line)]">
          <Container>
            <span className="kicker">Read next</span>
            <div className="mt-6 border-t border-[var(--color-line)]">
              {related.map((r) => (
                <JournalCard key={r.slug} a={r} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      <CtaBand
        kicker="Consultation"
        heading="Long-form writing is easy to disagree with. Book a call if you'd like to."
      />

      <JsonLd
        data={articleLd({
          title: a.title,
          description: a.description,
          slug: a.slug,
          datePublished: a.date,
          author: a.author.name,
          image: a.cover.src,
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", url: site.url },
          { name: "Journal", url: `${site.url}/blog` },
          { name: a.title, url: `${site.url}/blog/${a.slug}` },
        ])}
      />
    </>
  );
}
