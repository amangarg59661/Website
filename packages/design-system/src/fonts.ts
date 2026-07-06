import { Fraunces, IBM_Plex_Sans, Geist_Mono } from "next/font/google";

export const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-provider",
  axes: ["opsz", "SOFT"],
});

export const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-provider",
  weight: ["400", "500", "600"],
});

export const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-provider",
  weight: ["400", "500"],
});
