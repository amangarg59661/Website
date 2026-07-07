const API_BASE_ORIGIN = new URL(
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api.edss.example",
).origin;
const WS_BASE_ORIGIN = process.env.NEXT_PUBLIC_WS_BASE ?? "wss://api.edss.example";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  transpilePackages: [
    "@edss/analytics",
    "@edss/api",
    "@edss/auth",
    "@edss/design-system",
    "@edss/hooks",
    "@edss/icons",
    "@edss/types",
    "@edss/ui",
    "@edss/utils",
    "@edss/validation",
  ],
  experimental: {
    strictNextHead: true,
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
    ],
  },
  env: { API_BASE_ORIGIN, WS_BASE_ORIGIN },
};

export default nextConfig;
