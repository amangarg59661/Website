export const site = {
  name: "Elite Digital Solutions",
  legalName: "Elite Digital Solutions Studio",
  tagline: "A boutique studio for global technology teams.",
  description:
    "Custom software, SaaS, mobile, AI automation, growth marketing, and design — engineered for companies that treat their brand as an asset.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://elitedigital.studio",
  locale: "en-US",
  founded: 2021,
  hq: "Remote-first · Global",
  contact: {
    email: "hello@elitedigital.studio",
    phone: "+91 00000 00000",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "910000000000",
    whatsappMessage: "Hi Elite Digital — I'd like to book a consultation.",
    responseTime: "Within one business day",
  },
  social: {
    linkedin: "https://linkedin.com/company/elite-digital-studio",
    x: "https://x.com/elitedigital",
    github: "https://github.com/elite-digital",
    dribbble: "https://dribbble.com/elite-digital",
  },
  offices: [
    { city: "Bengaluru", country: "India", role: "Engineering & Design" },
    { city: "Dubai", country: "UAE", role: "Client Partnerships" },
    { city: "London", country: "UK", role: "Growth & Strategy" },
  ],
} as const;

export type Site = typeof site;
