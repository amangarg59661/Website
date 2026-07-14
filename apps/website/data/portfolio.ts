export type Case = {
  slug: string;
  client: string;
  title: string;
  industry: string;
  year: number;
  services: string[];
  region: string;
  summary: string;
  hero: { src: string; alt: string };
  metrics: { label: string; value: string }[];
  narrative: { heading: string; body: string }[];
  stack: string[];
  credit: { role: string; name: string }[];
};

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=2000&q=80";

export const cases: Case[] = [
  {
    slug: "monolith-refactor",
    client: "Northwind Financial",
    title: "A 12-year monolith, refactored without a rewrite",
    industry: "Financial Services",
    year: 2025,
    services: ["Custom Software", "Maintenance & Support"],
    region: "London",
    summary:
      "Untangling a decade of accreted logic into a modern service topology — with zero downtime and no customer-visible regressions across an eight-quarter modernisation.",
    hero: { src: HERO_FALLBACK, alt: "Financial dashboard on split screens" },
    metrics: [
      { label: "Legacy LOC decommissioned", value: "1.2M" },
      { label: "Deploy frequency change", value: "×48" },
      { label: "P1 incidents", value: "-73%" },
      { label: "Rewrite avoided", value: "$14M" },
    ],
    narrative: [
      {
        heading: "The situation",
        body: "A twelve-year Rails monolith serving thirty-two internal teams. Deploys once every three weeks. New feature velocity in single digits per quarter.",
      },
      {
        heading: "The wedge",
        body: "We refused the rewrite. Instead: a service topology that grew module by module, kept the monolith as the record system, and let the new architecture prove itself before earning trust.",
      },
      {
        heading: "The compounding",
        body: "Deploy frequency crossed daily in month five. New features shipped in weeks, not quarters. The monolith remains — but it is now a shell around forty-one composable services.",
      },
    ],
    stack: ["Rails", "Kotlin", "Kafka", "Postgres", "gRPC"],
    credit: [
      { role: "Engagement lead", name: "R. Iyer" },
      { role: "Principal engineer", name: "M. Fernandes" },
      { role: "Architect", name: "S. Patel" },
    ],
  },
  {
    slug: "saas-rebuild",
    client: "Meridian Health",
    title: "A HIPAA-ready clinical SaaS, from scratch to first paying customer in eleven weeks",
    industry: "Digital Health",
    year: 2025,
    services: ["SaaS Development", "UI/UX Design"],
    region: "Boston",
    summary:
      "Multi-tenant clinical workflow platform for oncology practices, engineered for compliance from day one and shipped to the first paying customer in a single quarter.",
    hero: {
      src: "/portfolio/saas-rebuild-hero.jpg",
      alt: "Clinical workflow interface",
    },
    metrics: [
      { label: "Time to first customer", value: "11 wks" },
      { label: "Onboarding to activation", value: "12 min" },
      { label: "SOC 2 Type I", value: "Wk 14" },
      { label: "Contracted ARR at wk 30", value: "$1.8M" },
    ],
    narrative: [
      {
        heading: "The brief",
        body: "Build the clinical workflow layer for oncology practices — HIPAA-compliant, multi-tenant, and shipping paying customers before the founder's next board meeting.",
      },
      {
        heading: "The shape",
        body: "We treated compliance as a schedule item, not a scramble. HIPAA-aware architecture from the schema up. Auth, audit logs, and BAAs on the critical path.",
      },
      {
        heading: "The result",
        body: "First customer live at week eleven. SOC 2 Type I at week fourteen. Contracted ARR crossed seven figures inside seven months.",
      },
    ],
    stack: ["Next.js", "PostgreSQL", "Vault", "Cloudflare", "Stripe Billing"],
    credit: [
      { role: "Engagement lead", name: "K. Nair" },
      { role: "Design lead", name: "A. Chen" },
    ],
  },
  {
    slug: "ai-ops",
    client: "Halden Logistics",
    title: "An AI operations layer that returned 4,200 human hours a month",
    industry: "Logistics",
    year: 2026,
    services: ["AI Automation", "Custom Software"],
    region: "Rotterdam",
    summary:
      "Automated the intake, routing, and drafting layer of a customs brokerage — measured on hours returned, not model choice.",
    hero: {
      src: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=2000&q=80",
      alt: "Logistics operations center at night",
    },
    metrics: [
      { label: "Hours returned monthly", value: "4,200" },
      { label: "Documents auto-drafted", value: "83%" },
      { label: "Error rate vs manual", value: "-64%" },
      { label: "Payback period", value: "6 wks" },
    ],
    narrative: [
      {
        heading: "The shape",
        body: "Customs paperwork is repetitive, high-stakes, and adversarial with the rest of the day. We watched the intake desk for two weeks before writing anything.",
      },
      {
        heading: "The wiring",
        body: "Ingest via email; extraction with an evaluator harness; draft in the operators' existing tool. Nothing new to check. Nothing new to learn.",
      },
      {
        heading: "The compounding",
        body: "The team stopped staying late. Error rate — the metric they actually cared about — fell 64% because the AI never rushed.",
      },
    ],
    stack: ["Anthropic", "Python", "Temporal", "Airtable", "Google Workspace"],
    credit: [{ role: "Engagement lead", name: "J. Larsen" }],
  },
  {
    slug: "brand-refresh",
    client: "Praelium Wealth",
    title: "The rebrand a private bank could live with for twenty years",
    industry: "Private Banking",
    year: 2025,
    services: ["Branding", "Website Development"],
    region: "Zürich",
    summary:
      "A hundred-and-forty-year-old private bank, refreshed with restraint. New wordmark, new typography, new digital surface — every asset earning its place.",
    hero: {
      src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80",
      alt: "Refined interior of a private bank",
    },
    metrics: [
      { label: "Assets governed", value: "312" },
      { label: "Wordmark iterations", value: "47" },
      { label: "Client survey approval", value: "94%" },
      { label: "New relationships in Y1", value: "+18%" },
    ],
    narrative: [
      {
        heading: "The brief",
        body: "The bank was afraid of looking like the fintechs they compete with. And afraid of looking like they were pretending not to.",
      },
      {
        heading: "The approach",
        body: "Restraint. A custom serif drawn by hand. A palette derived from the bank's original letterhead. A digital surface that would look at home in the vault.",
      },
      {
        heading: "The reception",
        body: "94% client approval on the private survey. New relationships up 18% year-over-year. The refresh will outlive the next three CEOs.",
      },
    ],
    stack: ["Custom typography", "Sanity", "Next.js"],
    credit: [
      { role: "Creative director", name: "L. Kohler" },
      { role: "Type designer", name: "S. Berger" },
    ],
  },
  {
    slug: "performance-scale",
    client: "Verdant Home",
    title: "A DTC home brand, scaled from $6M to $58M with an unchanged agency budget",
    industry: "Direct to Consumer",
    year: 2026,
    services: ["Performance Marketing", "Video Editing"],
    region: "Los Angeles",
    summary:
      "Rebuilt the paid-acquisition engine around creative velocity and LTV-aware bidding. Ten-fold growth on flat spend.",
    hero: {
      src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=80",
      alt: "Modern interior product shot",
    },
    metrics: [
      { label: "Revenue growth", value: "9.7×" },
      { label: "MER", value: "5.2 → 8.9" },
      { label: "Weekly creative output", value: "×6" },
      { label: "Payback period", value: "42d" },
    ],
    narrative: [
      {
        heading: "The situation",
        body: "Growth had plateaued. Meta bore all the acquisition. Creative was produced monthly. Attribution was a Google Sheet.",
      },
      {
        heading: "The rebuild",
        body: "Six-fold creative velocity. Channel diversification into TikTok and LinkedIn (yes, LinkedIn). Media mix modelling wired to a monthly board deck.",
      },
      {
        heading: "The compounding",
        body: "Revenue crossed ten-fold in fourteen months on flat spend. MER climbed from 5.2 to 8.9. The founder took a real holiday.",
      },
    ],
    stack: ["Meta Ads", "TikTok", "Google", "Northbeam", "Hex"],
    credit: [
      { role: "Growth lead", name: "T. Ramírez" },
      { role: "Creative producer", name: "P. Costa" },
    ],
  },
  {
    slug: "mobile-first",
    client: "Nadi River Cooperative",
    title: "A mobile app for river cooperatives — used by 47,000 boatmen daily",
    industry: "Public Service",
    year: 2026,
    services: ["Mobile Apps", "UI/UX Design"],
    region: "Assam, India",
    summary:
      "A field-first mobile app for a river-shipping cooperative — offline-tolerant, low-bandwidth, and shipped to devices as old as 2015.",
    hero: {
      src: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=2000&q=80",
      alt: "River landscape at dusk",
    },
    metrics: [
      { label: "Daily active users", value: "47k" },
      { label: "Offline-only sessions", value: "38%" },
      { label: "Median device age", value: "5.3 yrs" },
      { label: "Install size", value: "8.4 MB" },
    ],
    narrative: [
      {
        heading: "The constraint",
        body: "The device fleet was eight years old. Half the network was 2G. A functioning cellular signal was not a design assumption.",
      },
      {
        heading: "The build",
        body: "Offline-first architecture. Aggressive protobuf sync. UI drawn to survive at 240 nits in outdoor sun. Language support for four regional scripts.",
      },
      {
        heading: "The impact",
        body: "47,000 daily users. Ledger disputes down 82%. The cooperative renewed the contract for four more years.",
      },
    ],
    stack: ["Kotlin", "Room", "gRPC", "Protobuf"],
    credit: [
      { role: "Product lead", name: "V. Bora" },
      { role: "Lead engineer", name: "D. Gogoi" },
    ],
  },
];

export const casesBySlug = Object.fromEntries(cases.map((c) => [c.slug, c])) as Record<
  string,
  Case
>;
