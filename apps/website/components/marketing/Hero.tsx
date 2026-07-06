"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { site } from "@/config/site";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@edss/ui/button";
import { RevealLines } from "@/components/motion/Reveal";
import { PointerParallax } from "@/components/motion/Parallax";
import { MagneticCta } from "@/components/motion/MagneticCta";

const HeroShader = dynamic(
  () => import("@/components/motion/HeroShader").then((m) => m.HeroShader),
  { ssr: false, loading: () => null },
);
const CursorLens = dynamic(
  () => import("@/components/motion/CursorLens").then((m) => m.CursorLens),
  { ssr: false, loading: () => null },
);

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={containerRef}
      className="on-ink relative isolate flex min-h-[92vh] items-center overflow-hidden"
      style={{ cursor: "none" }}
      data-hero
    >
      {/* Static poster gradient — LCP-friendly, visible under shader while it boots
          and used entirely as the backdrop when reduced-motion / no WebGL. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          backgroundColor: "var(--color-ink)",
          backgroundImage:
            "radial-gradient(65% 55% at 78% 20%, color-mix(in oklch, var(--color-gold) 28%, transparent), transparent 62%), radial-gradient(55% 55% at 14% 82%, color-mix(in oklch, var(--color-ink-2) 100%, transparent), transparent 68%)",
        }}
      />

      {/* WebGL shader — mounted only client-side, exits on reduced-motion */}
      <div aria-hidden className="absolute inset-0 -z-10 opacity-95">
        <HeroShader className="h-full w-full" />
      </div>

      {/* Grain */}
      <div className="noise pointer-events-none absolute inset-0 -z-10" />

      {/* Bottom fade — keeps text legible over the shader */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3"
        style={{
          background:
            "linear-gradient(to bottom, transparent, color-mix(in oklch, var(--color-ink) 82%, transparent) 60%, var(--color-ink) 100%)",
        }}
      />

      <Container className="relative w-full py-24 md:py-32">
        <PointerParallax containerRef={containerRef} strength={22}>
          {/* Meta ribbon */}
          <motion.div
            data-depth="0.15"
            className="kicker flex flex-wrap items-center gap-3 text-[color-mix(in_oklch,var(--color-paper)_74%,transparent)] will-change-transform"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-gold)]" aria-hidden />
            <span>Now booking · Q3 2026</span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{site.hq}</span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <Link
              href="/portfolio/monolith-refactor"
              className="link-underline text-[var(--color-paper)]"
              data-cursor="hover"
            >
              New: Northwind Financial — legacy modernisation
            </Link>
          </motion.div>

          {/* Editorial headline */}
          <h1
            data-depth="0.45"
            className="mt-14 font-[family-name:var(--font-display)] leading-[0.95] tracking-[-0.045em] text-[var(--color-paper)] text-[var(--text-display)] will-change-transform md:mt-20"
          >
            <RevealLines
              lines={["The studio you", "hire when the work", "has to be right."]}
              className="block"
            />
          </h1>

          <motion.p
            data-depth="0.3"
            className="mt-10 max-w-[60ch] leading-[1.5] text-[color-mix(in_oklch,var(--color-paper)_84%,transparent)] text-[var(--text-lede)] will-change-transform md:mt-14"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
          >
            Elite Digital is a boutique studio for the technology work your company&apos;s
            reputation depends on — custom software, SaaS, mobile, AI automation, growth, and the
            design that ties them together. Small teams. Senior operators. Compounding results.
          </motion.p>

          <motion.div
            data-depth="0.2"
            className="mt-12 flex flex-wrap items-center gap-6 will-change-transform md:mt-16"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={reduce ? undefined : { opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
          >
            <MagneticCta href="/contact">
              <span
                className="inline-flex h-14 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-paper)] px-7 font-medium text-[var(--color-ink)] transition-colors hover:bg-[color-mix(in_oklch,var(--color-paper)_92%,var(--color-ink))]"
                style={{ cursor: "none" }}
              >
                Book a consultation
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </MagneticCta>
            <ButtonLink href="/portfolio" intent="onInk" size="lg" className="cursor-none">
              See selected work
            </ButtonLink>
          </motion.div>

          {/* Ledger */}
          <motion.dl
            data-depth="0.1"
            className="mt-16 grid max-w-3xl grid-cols-2 gap-6 border-t border-[color-mix(in_oklch,var(--color-paper)_18%,transparent)] pt-8 will-change-transform md:mt-24 md:grid-cols-4"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.9 }}
          >
            {[
              ["Founded", "2021"],
              ["Retention", "91%"],
              ["Countries served", "22"],
              ["Ships / quarter", "12"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="kicker text-[color-mix(in_oklch,var(--color-paper)_60%,transparent)]">
                  {k}
                </dt>
                <dd className="num mt-2 font-[family-name:var(--font-display)] text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-none tracking-[-0.02em] text-[var(--color-paper)]">
                  {v}
                </dd>
              </div>
            ))}
          </motion.dl>
        </PointerParallax>

        {/* Scroll cue */}
        <a
          href="#next"
          className="kicker absolute right-8 bottom-8 hidden items-center gap-3 text-[color-mix(in_oklch,var(--color-paper)_74%,transparent)] transition-colors hover:text-[var(--color-paper)] md:flex"
          data-cursor="hover"
        >
          Scroll <ArrowUpRight className="h-4 w-4 rotate-45" aria-hidden />
        </a>
      </Container>

      {/* Custom cursor — scoped to hero */}
      <CursorLens containerRef={containerRef} />
    </section>
  );
}
