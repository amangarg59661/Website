import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Sans, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "@/styles/globals.css";
import { defaultMetadata } from "@/config/seo";
import { JsonLd, organizationLd } from "@/lib/seo/jsonld";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-provider",
  axes: ["opsz", "SOFT"],
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-provider",
  weight: ["400", "500", "600"],
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-provider",
  weight: ["400", "500"],
});

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[var(--z-toast)] focus:bg-[var(--color-ink)] focus:text-[var(--color-paper)] focus:px-4 focus:py-2 focus:rounded"
        >
          Skip to content
        </a>
        <SmoothScroll />
        {children}
        <JsonLd data={organizationLd()} />
        <Analytics />
      </body>
    </html>
  );
}
