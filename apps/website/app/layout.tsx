import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { display, sans, mono } from "@edss/design-system/fonts";
import { PostHogProvider, PageviewTracker } from "@edss/analytics/client";
import { Analytics } from "@vercel/analytics/react";
import "@/styles/globals.css";
import { defaultMetadata } from "@/config/seo";
import { JsonLd, organizationLd } from "@/lib/seo/jsonld";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

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
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[var(--z-toast)] focus:rounded focus:bg-[var(--color-ink)] focus:px-4 focus:py-2 focus:text-[var(--color-paper)]"
        >
          Skip to content
        </a>
        <PostHogProvider>
          <Suspense fallback={null}>
            <PageviewTracker />
          </Suspense>
          <SmoothScroll />
          {children}
          <JsonLd data={organizationLd()} />
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
