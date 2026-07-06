import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/data/blog";
import { formatDate } from "@/lib/utils/format";

export function JournalCard({ a, large }: { a: Article; large?: boolean }) {
  return (
    <Link href={`/blog/${a.slug}`} className="group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 py-8 md:py-10 border-b border-[var(--color-line)] hover:bg-[var(--color-stone)] transition-colors -mx-4 px-4">
      <div className={large ? "md:col-span-5" : "md:col-span-4"}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-stone)]">
          <Image
            src={a.cover.src}
            alt={a.cover.alt}
            fill
            sizes="(min-width:768px) 40vw, 100vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
          />
        </div>
      </div>
      <div className={large ? "md:col-span-7 flex flex-col justify-between" : "md:col-span-8 flex flex-col justify-between"}>
        <div>
          <div className="flex items-center gap-3 kicker">
            <span className="text-[var(--color-gold-2)]">{a.category}</span>
            <span className="text-[var(--color-line-strong)]">·</span>
            <span className="text-[var(--color-muted)]">{formatDate(a.date)}</span>
            <span className="text-[var(--color-line-strong)]">·</span>
            <span className="text-[var(--color-muted)]">{a.readingTime}</span>
          </div>
          <h3 className={`mt-4 font-[family-name:var(--font-display)] leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)] group-hover:underline decoration-[var(--color-gold)] underline-offset-8 decoration-1 ${large ? "text-[clamp(1.75rem,1.2rem+2vw,2.75rem)]" : "text-[clamp(1.35rem,1rem+1.4vw,2rem)]"}`}>
            {a.title}
          </h3>
          <p className="mt-3 max-w-[58ch] text-[var(--color-muted)]">{a.description}</p>
        </div>
        <p className="mt-6 kicker text-[var(--color-ink)]">By {a.author.name} <span className="text-[var(--color-muted)]">· {a.author.role}</span></p>
      </div>
    </Link>
  );
}
