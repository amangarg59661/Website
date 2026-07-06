import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/primitives/Button";

export const metadata: Metadata = {
  title: "Not found",
  description: "The page you were looking for is not here.",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="on-ink relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(50% 40% at 20% 30%, color-mix(in oklch, var(--color-gold) 20%, transparent), transparent 65%)",
            }}
          />
          <Container className="relative grid grid-cols-1 gap-x-8 gap-y-10 py-32 md:grid-cols-12 md:py-48">
            <div className="md:col-span-8">
              <span className="kicker">404 · Off-manuscript</span>
              <h1 className="mt-8 font-[family-name:var(--font-display)] text-[clamp(3rem,2rem+4vw,6rem)] leading-[0.98] tracking-[-0.045em]">
                The page you were looking for is not here.
              </h1>
              <p className="lede mt-8 max-w-[54ch]">
                Either the URL is off by a character, the page has moved, or we retired it in a
                redesign. All plausible. Sorry for the detour.
              </p>
              <div className="mt-12 flex flex-wrap gap-3">
                <ButtonLink href="/" intent="onInkFilled" size="lg">
                  Return home
                </ButtonLink>
                <ButtonLink href="/services" intent="onInk" size="lg">
                  See practices
                </ButtonLink>
                <ButtonLink href="/contact" intent="onInk" size="lg">
                  Contact
                </ButtonLink>
              </div>
            </div>
            <aside className="border-[color-mix(in_oklch,var(--color-paper)_18%,transparent)] md:col-span-4 md:border-l md:pl-10">
              <span className="kicker text-[color-mix(in_oklch,var(--color-paper)_60%,transparent)]">
                Popular pages
              </span>
              <ul className="mt-6 space-y-3">
                {[
                  ["Home", "/"],
                  ["Selected work", "/portfolio"],
                  ["Journal", "/blog"],
                  ["About the studio", "/about"],
                  ["Frequently asked", "/faqs"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href!} className="link-underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
