"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { site } from "@/config/site";
import { primaryNav } from "@/data/nav";
import { services } from "@/data/services";
import { useHeaderState } from "@/lib/hooks";
import { cn } from "@edss/utils/cn";
import { Wordmark } from "@edss/icons";
import { ButtonLink } from "@edss/ui/button";

export function Header() {
  const pathname = usePathname();
  const { scrolled, hidden } = useHeaderState();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    setServicesOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setServicesOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[var(--z-sticky)] transition-transform duration-500",
          hidden && !servicesOpen && !mobileOpen && "-translate-y-full",
        )}
      >
        <div
          className={cn(
            "transition-[background-color,border-color,backdrop-filter] duration-300",
            scrolled || servicesOpen
              ? "border-b border-[var(--color-line)] bg-[color-mix(in_oklch,var(--color-paper)_92%,transparent)] backdrop-blur-md"
              : "border-b border-transparent bg-transparent",
          )}
        >
          <div className="container-wide flex h-[72px] items-center justify-between gap-6 md:h-[80px]">
            <Link href="/" aria-label={`${site.name} — home`} className="text-[var(--color-ink)]">
              <Wordmark className="h-5 w-auto md:h-6" />
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
              {primaryNav.map((item) => {
                const isServices = item.href === "/services";
                const active =
                  pathname === item.href ||
                  (pathname?.startsWith(`${item.href}/`) && item.href !== "/");
                if (isServices) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      aria-expanded={servicesOpen}
                      aria-controls={panelId}
                      onClick={() => setServicesOpen((v) => !v)}
                      className={cn(
                        "kicker relative px-3 py-2 text-[color:var(--color-ink)] uppercase transition-colors hover:text-[var(--color-ink)]",
                        (active || servicesOpen) &&
                          "after:absolute after:right-3 after:-bottom-0.5 after:left-3 after:h-px after:bg-[var(--color-gold)]",
                      )}
                    >
                      {item.label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "kicker relative px-3 py-2 text-[color:var(--color-ink)] uppercase transition-colors",
                      active &&
                        "after:absolute after:right-3 after:-bottom-0.5 after:left-3 after:h-px after:bg-[var(--color-gold)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <ButtonLink
                href="/contact"
                intent="primary"
                size="sm"
                className="hidden md:inline-flex"
              >
                Book a call
              </ButtonLink>
              <button
                type="button"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                onClick={() => setMobileOpen((v) => !v)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] text-[var(--color-ink)] md:hidden"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <MegaPanel id={panelId} open={servicesOpen} onClose={() => setServicesOpen(false)} />
      </header>

      <MobileSheet
        open={mobileOpen}
        pathname={pathname ?? "/"}
        onClose={() => setMobileOpen(false)}
      />

      {/* Scroll-locked spacer */}
      <div aria-hidden className="h-[72px] md:h-[80px]" />
    </>
  );
}

function MegaPanel({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            aria-hidden
            className="fixed inset-0 top-[72px] z-[var(--z-panel)] bg-black/20 md:top-[80px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35 }}
            onClick={onClose}
          />
          <motion.div
            id={id}
            role="dialog"
            aria-label="Services"
            className="absolute top-full right-0 left-0 z-[calc(var(--z-panel)+1)] border-b border-[var(--color-line)] bg-[var(--color-paper)]"
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="container-wide grid grid-cols-1 gap-x-8 gap-y-10 py-12 md:grid-cols-12 md:py-16">
              <div className="md:col-span-3">
                <span className="kicker">Practices</span>
                <h2 className="mt-4 font-[family-name:var(--font-display)] leading-[1.05] tracking-[-0.02em] text-[var(--color-ink)] text-[var(--text-h3)]">
                  Eleven capabilities. One studio.
                </h2>
                <p className="mt-4 max-w-[36ch] text-[var(--color-muted)]">
                  Choose a practice to see engagement models, deliverables, and what a first
                  conversation looks like.
                </p>
                <Link
                  href="/services"
                  className="link-underline kicker mt-8 inline-block text-[var(--color-ink)] uppercase"
                  onClick={onClose}
                >
                  See all services →
                </Link>
              </div>

              <ul className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:col-span-9 lg:grid-cols-3">
                {services.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      onClick={onClose}
                      className="group flex items-baseline gap-4 border-b border-[var(--color-line)] py-3 transition-colors hover:border-[var(--color-ink)]"
                    >
                      <span className="num w-8 text-sm text-[var(--color-muted)]">{s.index}</span>
                      <span className="flex-1">
                        <span className="block font-[family-name:var(--font-display)] text-[1.25rem] leading-tight tracking-[-0.02em] text-[var(--color-ink)] group-hover:text-[var(--color-ink)]">
                          {s.title}
                        </span>
                        <span className="mt-1 block text-[0.9rem] text-[color:var(--color-muted)]">
                          {s.kicker}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="translate-x-0 text-[var(--color-gold-2)] transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MobileSheet({
  open,
  pathname,
  onClose,
}: {
  open: boolean;
  pathname: string;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-nav"
          role="dialog"
          aria-label="Menu"
          className="fixed inset-0 z-[var(--z-modal)] flex flex-col bg-[var(--color-ink)] text-[var(--color-paper)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
        >
          <div className="container-wide flex h-[72px] items-center justify-between">
            <span className="kicker text-[color:var(--color-muted-2)]">Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-[color-mix(in_oklch,var(--color-paper)_20%,transparent)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav aria-label="Primary" className="container-wide flex-1 overflow-y-auto pb-12">
            <ul className="mt-6 divide-y divide-[color-mix(in_oklch,var(--color-paper)_10%,transparent)]">
              {primaryNav.map((item) => {
                const active =
                  pathname === item.href ||
                  (pathname.startsWith(`${item.href}/`) && item.href !== "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between py-5 font-[family-name:var(--font-display)] text-[2rem] leading-none tracking-[-0.02em]"
                      aria-current={active ? "page" : undefined}
                    >
                      <span>{item.label}</span>
                      <span aria-hidden className="text-[var(--color-gold)]">
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-10">
              <span className="kicker text-[color:var(--color-muted-2)]">Practices</span>
              <ul className="mt-4 grid grid-cols-1 gap-2">
                {services.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="flex items-baseline gap-4 py-2 text-[color-mix(in_oklch,var(--color-paper)_86%,transparent)] hover:text-[var(--color-paper)]"
                    >
                      <span className="num w-6 text-xs opacity-60">{s.index}</span>
                      <span>{s.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-col gap-3">
              <ButtonLink href="/contact" intent="onInkFilled" size="lg">
                Book a call
              </ButtonLink>
              <a
                href={`https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(site.contact.whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="kicker link-underline inline-flex items-center gap-2 self-start text-[color-mix(in_oklch,var(--color-paper)_78%,transparent)] uppercase"
              >
                WhatsApp us instead →
              </a>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
