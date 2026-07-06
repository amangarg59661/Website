export type NavItem = { label: string; href: string; external?: boolean };

export const primaryNav: NavItem[] = [
  { label: "Work", href: "/portfolio" },
  { label: "Services", href: "/services" },
  { label: "Studio", href: "/about" },
  { label: "Journal", href: "/blog" },
  { label: "Careers", href: "/careers" },
];

export const footerNav = {
  services: [
    { label: "Custom Software", href: "/services/custom-software" },
    { label: "SaaS Development", href: "/services/saas" },
    { label: "Website Development", href: "/services/website" },
    { label: "Mobile Apps", href: "/services/mobile-app" },
    { label: "AI Automation", href: "/services/ai-automation" },
    { label: "Digital Marketing", href: "/services/digital-marketing" },
    { label: "Performance Marketing", href: "/services/performance-marketing" },
    { label: "Video Editing", href: "/services/video-editing" },
    { label: "UI/UX Design", href: "/services/ui-ux" },
    { label: "Branding", href: "/services/branding" },
    { label: "Maintenance & Support", href: "/services/maintenance-support" },
  ],
  studio: [
    { label: "About", href: "/about" },
    { label: "Selected Work", href: "/portfolio" },
    { label: "Journal", href: "/blog" },
    { label: "FAQ", href: "/faqs" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/legal/privacy" },
    { label: "Terms of Use", href: "/legal/terms" },
  ],
} as const;
