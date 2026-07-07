import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { display, sans, mono } from "@edss/design-system/fonts";
import { PostHogProvider, PageviewTracker } from "@edss/analytics/client";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { MSWProvider } from "@/components/providers/MSWProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Elite Digital Solutions — Dashboard", template: "%s · EDSS" },
  description: "Business Operations Platform for Elite Digital Solutions Studio.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  width: "device-width",
  initialScale: 1,
};

const PRE_HYDRATION_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)theme=([^;]+)/);var t=m?decodeURIComponent(m[1]):"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? "";
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: PRE_HYDRATION_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <MSWProvider>
              <AuthProvider>
                <PostHogProvider>
                  <Suspense fallback={null}>
                    <PageviewTracker />
                  </Suspense>
                  <ToastProvider>{children}</ToastProvider>
                </PostHogProvider>
              </AuthProvider>
            </MSWProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
