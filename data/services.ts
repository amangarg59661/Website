export type ServiceCategory = "Engineering" | "Growth" | "Design";

export type Service = {
  slug: string;
  index: string;
  title: string;
  kicker: string;
  category: ServiceCategory;
  summary: string;
  lede: string;
  outcomes: string[];
  deliverables: string[];
  method: { title: string; body: string }[];
  meta: { engagement: string; team: string; timeline: string };
  faq: { q: string; a: string }[];
};

export const services: Service[] = [
  {
    slug: "custom-software",
    index: "01",
    title: "Custom Software",
    kicker: "Engineered systems, precisely fit.",
    category: "Engineering",
    summary: "Bespoke platforms engineered for internal operations, enterprise workflow, and revenue-critical products.",
    lede: "We build platforms with the fit and finish of the world's best consumer software, engineered for the operational depth of enterprise. Sensible defaults, ruthless simplicity, and code that survives its first three re-orgs.",
    outcomes: [
      "Consolidate fragmented tools into one system of record",
      "Reduce operational cycle time by 30–70% within two quarters",
      "Ship internal tools users actually prefer to spreadsheets",
      "Build a product with the durability of infrastructure",
    ],
    deliverables: [
      "Technical discovery + system architecture blueprint",
      "Interactive prototypes signed off by stakeholders",
      "Production application with tests, CI/CD, and observability",
      "Runbook, on-call rotation guide, and handoff dossier",
    ],
    method: [
      { title: "Diagnose", body: "Two weeks embedded with the team owning the workflow. We map the current state before writing a line of code." },
      { title: "Architect", body: "System sketches, data model, integration surface. We choose boring, durable technology on purpose." },
      { title: "Build", body: "Weekly demos, no surprises. Feature-flagged rollouts. Every release ships with dashboards." },
      { title: "Steady state", body: "We hand the codebase back with a team ready to own it — or stay on retainer to keep steering." },
    ],
    meta: { engagement: "Retainer / project", team: "3–7 engineers, 1 lead", timeline: "8–20 weeks" },
    faq: [
      { q: "How do you scope engagements?", a: "A one-week paid discovery ends in a fixed-fee proposal. Nothing binding until you see the shape of the work." },
      { q: "Do you work with our existing engineering team?", a: "Frequently. We embed alongside your engineers, transfer patterns, and leave without leaving debt." },
    ],
  },
  {
    slug: "saas",
    index: "02",
    title: "SaaS Development",
    kicker: "Products with the shape of durable businesses.",
    category: "Engineering",
    summary: "Multi-tenant products engineered for the four-year horizon: onboarding, billing, retention, ops.",
    lede: "SaaS is not a technology decision, it is an operations decision. We build products where the seams — auth, billing, tenancy, permissions — behave properly from month one, so the surface can grow.",
    outcomes: [
      "Multi-tenant architecture that survives your first enterprise deal",
      "Metered billing and self-serve upgrades wired end-to-end",
      "Onboarding flows measured by activation, not signups",
      "A platform your CFO understands as an asset",
    ],
    deliverables: [
      "Tenant model + permissions matrix",
      "Billing integration (Stripe / Chargebee / Paddle)",
      "Admin console for CS and support",
      "Growth surface: onboarding, referral, in-product notifications",
    ],
    method: [
      { title: "Position", body: "Who converts, who stays, who pays. We build the product around the answer, not around a category." },
      { title: "Scaffold", body: "Auth, tenancy, billing, roles — the seams that make or break the second year — set right the first time." },
      { title: "Iterate", body: "Feature velocity paired with retention telemetry. We ship what compounds, not what demos." },
      { title: "Compound", body: "As you sell up-market, we harden the platform for security review, SSO, audit logs, uptime SLAs." },
    ],
    meta: { engagement: "Retainer + equity option", team: "4–8, cross-functional", timeline: "12–24 weeks to v1" },
    faq: [
      { q: "Do you build the initial version or take over an existing product?", a: "Both. Roughly a third of engagements are rescues — we inherit a codebase and refactor to a durable shape." },
      { q: "How do you handle security and compliance?", a: "SOC 2 readiness, HIPAA, GDPR — patterns we've shipped multiple times. Compliance is a schedule item, not a scramble." },
    ],
  },
  {
    slug: "website",
    index: "03",
    title: "Website Development",
    kicker: "Marketing sites engineered like products.",
    category: "Engineering",
    summary: "Marketing surfaces built to load fast, rank well, and convert reliably — with editorial polish, not template polish.",
    lede: "A marketing website is a compounding asset. We build them with the same attention to render performance, information architecture, and copy craft as any product engagement.",
    outcomes: [
      "Sub-two-second LCP on 4G, verified on real devices",
      "Organic traffic that compounds monthly instead of decaying",
      "Editorial layouts you cannot buy off a template marketplace",
      "A CMS your marketing team actually enjoys",
    ],
    deliverables: [
      "Content model + editorial workflow",
      "Design system and component library",
      "Fully responsive, accessible, Core Web Vitals-passing build",
      "CMS integration + analytics + A/B testing hooks",
    ],
    method: [
      { title: "Position", body: "Message before pixels. A workshop distills what the site must say, to whom, in what order." },
      { title: "Design", body: "Editorial layout systems, not landing-page templates. Typography-forward. Rhythm-driven." },
      { title: "Build", body: "Static-first architecture. Next.js, Astro, or plain HTML when it earns its place." },
      { title: "Grow", body: "SEO instrumentation, monthly performance reviews, iteration budget to keep the site improving." },
    ],
    meta: { engagement: "Fixed-fee", team: "1 designer + 2 engineers + strategist", timeline: "6–12 weeks" },
    faq: [
      { q: "Do you write copy too?", a: "We collaborate closely with copywriters we trust, or with your team. We do not generate copy from templates." },
      { q: "What CMS do you recommend?", a: "Sanity, Contentlayer, Payload, or a MDX-first setup depending on the editorial team." },
    ],
  },
  {
    slug: "mobile-app",
    index: "04",
    title: "Mobile Apps",
    kicker: "Native-feeling apps, cross-platform economics.",
    category: "Engineering",
    summary: "iOS + Android apps engineered for battery, network, and the App Store review process — not just the demo reel.",
    lede: "Mobile is where users notice every dropped frame. We build apps with the discipline of native — offline-first, battery-conscious, review-ready — using shared architecture where it makes sense.",
    outcomes: [
      "Consistent 60fps on mid-tier devices",
      "First-day retention above your category benchmark",
      "App Store + Play Store approval on first submission",
      "A codebase your team can maintain",
    ],
    deliverables: [
      "Native iOS + Android build (Swift, Kotlin, or React Native as suited)",
      "Push, deep linking, offline sync, telemetry",
      "Store listing assets and submission dossier",
      "TestFlight / internal test track pipelines",
    ],
    method: [
      { title: "Diagnose", body: "Which flows must be native? What can be shared? We start with the constraints." },
      { title: "Prototype", body: "TestFlight-ready in six weeks. Real hands, real signal." },
      { title: "Scale", body: "State management, background sync, observability — the invisible reasons apps feel expensive." },
      { title: "Ship", body: "We handle App Store review, phased rollout, and post-launch stability week-by-week." },
    ],
    meta: { engagement: "Retainer / project", team: "2–4 mobile + backend", timeline: "10–20 weeks" },
    faq: [
      { q: "React Native or fully native?", a: "Depends on the surface. Video, camera, and heavy animation earn native. Most consumer flows do fine on React Native." },
      { q: "Do you handle App Store submission?", a: "Yes. Rejection is expensive; we prepare submissions rigorously." },
    ],
  },
  {
    slug: "ai-automation",
    index: "05",
    title: "AI Automation",
    kicker: "AI inside your workflow, not around it.",
    category: "Engineering",
    summary: "Practical automation of the messy work: intake, routing, drafting, review. Measured on hours saved, not model choice.",
    lede: "The interesting work in AI is not the model — it is the wiring. We build automation that lives inside your existing tools, ships alongside humans, and is measured on hours returned to the calendar.",
    outcomes: [
      "10–40 hours per week returned across a team",
      "Automation the team trusts because they can inspect it",
      "Model choice you can swap without rewriting the surface",
      "Cost curves that improve with adoption instead of scaling with it",
    ],
    deliverables: [
      "Workflow discovery + automation candidate map",
      "Evals harness, prompt library, versioned pipelines",
      "Integration into Slack, email, CRM, ticketing, or product",
      "Governance: audit logs, escalation paths, human-in-the-loop",
    ],
    method: [
      { title: "Watch", body: "We shadow the team doing the work. Automation candidates emerge from the calendar, not the pitch deck." },
      { title: "Prototype", body: "Small, disposable, measurable. Two weeks per candidate. Winners graduate." },
      { title: "Wire", body: "Production integration into the tools already in flight. No new dashboards to check." },
      { title: "Govern", body: "Evals, monitoring, cost tracking, an off-switch. AI without governance is a liability." },
    ],
    meta: { engagement: "Retainer", team: "1–3 engineers + 1 researcher", timeline: "4–12 weeks per workflow" },
    faq: [
      { q: "Which models do you use?", a: "We build model-agnostic pipelines. Right model, right task, swap when the price/quality curve moves." },
      { q: "What about data privacy?", a: "Private cloud, on-prem, or self-hosted models — depending on your data classification." },
    ],
  },
  {
    slug: "digital-marketing",
    index: "06",
    title: "Digital Marketing",
    kicker: "Editorial marketing, engineered pipeline.",
    category: "Growth",
    summary: "SEO, content, and brand marketing built as a compounding asset — not a monthly report of vanity metrics.",
    lede: "Marketing done well is publishing done well, distributed at leverage. We build editorial calendars, SEO systems, and brand programs that make your audience seek you out.",
    outcomes: [
      "Compounding organic traffic and inbound demand",
      "A publishing cadence your team can sustain",
      "Brand assets — case studies, essays, video — that outlast a campaign",
      "Attribution that survives cookie deprecation",
    ],
    deliverables: [
      "Editorial calendar + topic model",
      "Long-form content, case studies, and thought leadership",
      "Technical SEO audit + structured data implementation",
      "Distribution: newsletter, social, syndication, PR",
    ],
    method: [
      { title: "Position", body: "What we can say that competitors cannot. Wedge before volume." },
      { title: "Publish", body: "A quarterly editorial slate. Writing that a reader will finish." },
      { title: "Distribute", body: "Owned channels first, borrowed second, paid last. Compound before you rent." },
      { title: "Measure", body: "Attribution built to survive privacy shifts. Inbound demand as the north star." },
    ],
    meta: { engagement: "Retainer", team: "1 strategist + 1 writer + 1 editor", timeline: "Ongoing" },
    faq: [
      { q: "Do you write the content or edit ours?", a: "Both — depends on your team's capacity. We ghostwrite for founders, edit for internal writers, or produce end-to-end." },
      { q: "How long until we see results?", a: "Six months for measurable traffic, twelve for compounding. If someone promises faster, they're renting you traffic." },
    ],
  },
  {
    slug: "performance-marketing",
    index: "07",
    title: "Performance Marketing",
    kicker: "Paid media, adult supervision.",
    category: "Growth",
    summary: "Paid acquisition run by operators who have carried a real P&L. LTV-aware, creative-first, measurement built to survive privacy shifts.",
    lede: "Paid media is not a growth strategy; it is a distribution channel. We treat it like one — creative-first, LTV-aware, and measured against your CAC-payback bar, not a platform dashboard.",
    outcomes: [
      "CAC-payback inside your finance team's tolerance",
      "Creative velocity 3–5× your current output",
      "Attribution model your CFO trusts",
      "Diversified channel mix — no single-platform exposure",
    ],
    deliverables: [
      "Full-funnel account architecture (Meta, Google, LinkedIn, TikTok)",
      "Creative production pipeline + weekly test slate",
      "MMM + incrementality testing framework",
      "Executive dashboard: MER, CAC, LTV, contribution margin",
    ],
    method: [
      { title: "Audit", body: "Where is money leaking? Attribution, creative fatigue, targeting, LP experience. Two-week diagnostic." },
      { title: "Structure", body: "Account architecture rebuilt around your funnel, not the platform's default." },
      { title: "Scale", body: "Creative velocity paired with disciplined testing. Winners scale, losers die on schedule." },
      { title: "Diversify", body: "Reduce platform concentration. Own your data. Build measurement independent of the platforms." },
    ],
    meta: { engagement: "Retainer + % of spend", team: "1 lead + 1 creative + 1 analyst", timeline: "Ongoing" },
    faq: [
      { q: "Minimum spend to work with you?", a: "$40k/mo media spend is the floor where our operating model earns its cost. Below that, we recommend other partners." },
      { q: "Do you produce the creative?", a: "Yes. We think creative is where paid media is won." },
    ],
  },
  {
    slug: "video-editing",
    index: "08",
    title: "Video Editing",
    kicker: "Motion with a point of view.",
    category: "Design",
    summary: "Editorial motion, brand films, and product videos — cut with the discipline of documentary and the precision of product marketing.",
    lede: "Motion is punctuation. We produce brand films, product demos, and social cuts with the pacing of documentary editors and the precision of product marketers.",
    outcomes: [
      "A film library you use for years, not weeks",
      "Motion identity applied consistently across surfaces",
      "Sound design and grade that feels expensive",
      "Editable master files, not just deliverables",
    ],
    deliverables: [
      "Brand film (60–120s hero + 15/30s cuts)",
      "Product demo suite (0:30, 1:00, 2:00 lengths)",
      "Social edits, aspect variants, subtitle files",
      "Motion identity guide (title cards, lower thirds, transitions)",
    ],
    method: [
      { title: "Direct", body: "Story before shot list. What does this film need to make the viewer feel?" },
      { title: "Shoot", body: "Small crews, high control. We work with directors of photography we've collaborated with for years." },
      { title: "Edit", body: "Rough cuts within a week. Sound design and grade last, not first." },
      { title: "Deliver", body: "Every aspect ratio, every subtitle language, master and mezzanine files — you own the assets." },
    ],
    meta: { engagement: "Project", team: "Director + editor + colorist + sound", timeline: "4–8 weeks" },
    faq: [
      { q: "Do you also produce social-first vertical cuts?", a: "Yes. We deliver 9:16, 1:1, and 16:9 masters plus subtitle files by default." },
      { q: "Do you shoot original footage?", a: "Yes — with a director of photography and small crew. We also work with stock and existing footage when it earns its place." },
    ],
  },
  {
    slug: "ui-ux",
    index: "09",
    title: "UI/UX Design",
    kicker: "Interfaces that behave the way they look.",
    category: "Design",
    summary: "Design engineered for how your product actually behaves — with the research, the writing, and the front-end all in one room.",
    lede: "Interface design is not decoration on top of a spec. It is where the product actually gets designed. We work with the engineering team from week one, and ship design that survives contact with users.",
    outcomes: [
      "Interfaces the team ships without rework",
      "Design system built as component contracts, not screenshots",
      "Research grounded in your actual users, not personas",
      "Copy, motion, and empty states — the parts most teams skip",
    ],
    deliverables: [
      "Research plan + moderated user studies",
      "Interaction models, wireframes, prototype",
      "Full design system with token architecture",
      "UI copy library + motion spec",
    ],
    method: [
      { title: "Study", body: "Talk to real users. Watch them work. Assumptions retire on Fridays." },
      { title: "Frame", body: "Interaction models before pixels. What must the user do, feel, decide? In what order?" },
      { title: "Ship", body: "Designers embedded with engineers. Weekly critique. Motion, copy, and empty states shipped in the same PR." },
      { title: "Refine", body: "Usability testing on the live product, not the prototype. Continuous iteration." },
    ],
    meta: { engagement: "Retainer / project", team: "1 lead + 1 designer + 1 researcher", timeline: "8–16 weeks" },
    faq: [
      { q: "Do you use Figma?", a: "Yes, with a component-first system. Design tokens in code, mirrored in Figma via a token pipeline." },
      { q: "Can you work with our existing design system?", a: "Yes — we extend, audit, or rebuild depending on its shape." },
    ],
  },
  {
    slug: "branding",
    index: "10",
    title: "Branding",
    kicker: "A brand is the shape of a decision.",
    category: "Design",
    summary: "Identity systems that behave as coherently in a spreadsheet as they do in a keynote.",
    lede: "Brand is not a logo. Brand is the shape of a company's decisions — how it hires, sells, apologises, wins. We do identity work that reflects the shape, and equips your team to keep the shape as you scale.",
    outcomes: [
      "A visual identity used consistently across every surface",
      "Guidelines your team actually references",
      "Naming that survives legal review",
      "Verbal identity — voice, tone, and vocabulary",
    ],
    deliverables: [
      "Positioning + narrative platform",
      "Wordmark, symbol, colour, type, motion",
      "Guidelines: web reference site + PDF",
      "Applied templates: pitch deck, one-pager, social, product surface",
    ],
    method: [
      { title: "Position", body: "Who you serve, what you stand for, what you refuse. Positioning drives everything downstream." },
      { title: "Explore", body: "Three distinct directions, not eight variations. Bold enough to argue about." },
      { title: "Refine", body: "One direction chosen. Refined across a full application matrix." },
      { title: "Equip", body: "Guidelines + a live reference site. Templates for the surfaces your team touches weekly." },
    ],
    meta: { engagement: "Fixed-fee", team: "Creative director + 2 designers + strategist", timeline: "10–16 weeks" },
    faq: [
      { q: "Do you handle naming?", a: "Yes, including legal + linguistic review with partners we trust." },
      { q: "Do you refresh existing brands or start from zero?", a: "Both. Refresh work often has more constraints, and produces more interesting solutions." },
    ],
  },
  {
    slug: "maintenance-support",
    index: "11",
    title: "Maintenance & Support",
    kicker: "The uninteresting work, done exceptionally.",
    category: "Engineering",
    summary: "Long-tail support, upgrades, and reliability engineering for products already in production — yours or ours.",
    lede: "Most software fails from neglect, not defect. We provide long-term stewardship: security patches, dependency upgrades, incident response, and the quiet work that keeps products alive.",
    outcomes: [
      "Uptime you can put in a sales deck",
      "Dependencies never more than one major version behind",
      "Response times measured in minutes, not days",
      "A codebase your future team can inherit",
    ],
    deliverables: [
      "SLA-backed support (P0/P1/P2/P3 response bands)",
      "Weekly security + dependency review",
      "Quarterly reliability report",
      "On-call rotation + runbook",
    ],
    method: [
      { title: "Inherit", body: "Codebase audit. Runbook drafted. Observability wired. Two-week onboarding." },
      { title: "Steady state", body: "Weekly cadence: security, dependencies, small improvements, monitoring." },
      { title: "Respond", body: "On-call rotation with escalation. Incidents get post-mortems, not blame." },
      { title: "Improve", body: "Quarterly reliability review with the roadmap for the next quarter's investment." },
    ],
    meta: { engagement: "Monthly retainer", team: "2 engineers + 1 lead on rotation", timeline: "Ongoing" },
    faq: [
      { q: "Do you support products you didn't build?", a: "Yes, following a codebase audit. Some codebases need remediation before steady-state support is viable." },
      { q: "What is your incident response like?", a: "24/7 for P0/P1 tiers. Response, mitigation, root-cause, post-mortem within one business week." },
    ],
  },
];

export const servicesBySlug = Object.fromEntries(services.map((s) => [s.slug, s])) as Record<string, Service>;

export const serviceCategories: ServiceCategory[] = ["Engineering", "Growth", "Design"];
