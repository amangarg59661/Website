import Link from "next/link";
import { site } from "@/config/site";
import { footerNav } from "@/data/nav";
import { Container } from "./Container";
import { Wordmark } from "@edss/icons";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="on-ink relative overflow-hidden">
      <Container wide className="pt-24 pb-10">
        <div className="grid grid-cols-2 gap-x-8 gap-y-14 md:grid-cols-12">
          <div className="col-span-2 md:col-span-4">
            <span className="kicker">The studio</span>
            <p className="mt-6 max-w-[28ch] font-[family-name:var(--font-display)] text-[clamp(1.4rem,1.1rem+1vw,2rem)] leading-[1.15] tracking-[-0.02em] text-[var(--color-paper)]">
              {site.tagline}
            </p>
            <p className="lede mt-6">{site.description}</p>

            <div className="mt-10">
              <span className="kicker">Contact</span>
              <ul className="mt-3 space-y-1">
                <li>
                  <a href={`mailto:${site.contact.email}`} className="link-underline">
                    {site.contact.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(site.contact.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline"
                  >
                    WhatsApp — {site.contact.phone}
                  </a>
                </li>
                <li className="mt-1 opacity-70">Response: {site.contact.responseTime}</li>
              </ul>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3 md:col-start-6">
            <span className="kicker">Services</span>
            <ul className="mt-4 space-y-2">
              {footerNav.services.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-[var(--color-gold)]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <span className="kicker">Studio</span>
            <ul className="mt-4 space-y-2">
              {footerNav.studio.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-[var(--color-gold)]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-3">
            <span className="kicker">Offices</span>
            <ul className="mt-4 space-y-3">
              {site.offices.map((o) => (
                <li key={o.city}>
                  <p className="font-[family-name:var(--font-display)] text-[1.1rem]">
                    {o.city}, {o.country}
                  </p>
                  <p className="text-sm opacity-70">{o.role}</p>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <span className="kicker">Follow</span>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(site.social).map(([k, v]) => (
                  <li key={k}>
                    <a
                      href={v}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline capitalize"
                    >
                      {k}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>

      {/* Horizon wordmark */}
      <div aria-hidden className="mt-16 mb-6 select-none">
        <div className="container-wide">
          <svg
            viewBox="0 0 1200 140"
            preserveAspectRatio="xMinYMid meet"
            className="h-auto w-full opacity-[0.14]"
          >
            <text
              x="0"
              y="120"
              fill="currentColor"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "160px",
                fontWeight: 300,
                letterSpacing: "-0.055em",
              }}
            >
              elite digital
            </text>
          </svg>
        </div>
      </div>

      <Container wide className="pb-12">
        <hr className="rule mb-8 opacity-40" />
        <div className="flex flex-col justify-between gap-6 text-sm opacity-70 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Wordmark className="h-4 w-auto" />
            <span>
              © {year} {site.legalName}
            </span>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {footerNav.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-underline">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="opacity-60">v1.0 · Bengaluru · London · Dubai</li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
