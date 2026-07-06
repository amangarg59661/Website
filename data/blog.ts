export type Article = {
  slug: string;
  title: string;
  description: string;
  category: "Engineering" | "AI" | "Design" | "Marketing";
  date: string;
  readingTime: string;
  author: { name: string; role: string };
  cover: { src: string; alt: string };
  body: string;
};

export const articles: Article[] = [
  {
    slug: "boring-durable-technology",
    title: "In defence of boring, durable technology",
    description:
      "Why the most interesting engineering teams are the ones you have never heard of, and the technology they choose deliberately.",
    category: "Engineering",
    date: "2026-06-24",
    readingTime: "8 min",
    author: { name: "R. Iyer", role: "Engagement Lead" },
    cover: {
      src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=80",
      alt: "Data center corridor",
    },
    body: `## The temptation of the new

Every architecture review begins the same way. There is a shiny thing, a case study that gestures at it, and a team that would like to try it.

Most of the time, we say no. Not because the shiny thing is bad — it is often exceptional — but because our clients are not paying us to try things. They are paying us to build systems that will still be running in seven years, quietly, without needing us.

## What "boring" actually means

We do not mean stagnant. We mean durable. Postgres is boring; it is also the most interesting piece of software in most of our stacks. Kotlin on the JVM is boring; the JIT still does things that surprise us in 2026.

Boring means: we know the failure modes. Our senior engineers have seen this technology fail, and know how it fails. The community around it is larger than any single vendor. Its trajectory is set.

## The compounding cost of novelty

Novel technology carries a cost that shows up on a delay. The library you chose in year one is unmaintained in year three. The AWS service you built on has been deprecated. The startup you were relying on has pivoted.

Each of these is survivable in isolation. In aggregate, they consume the roadmap.

## When novelty earns its place

Sometimes it does. LLMs earned their place quickly. gRPC earned its place slowly. React was a bet that paid off. Boring is a default, not a doctrine.

The test we use: does this novel thing let us serve the client in a way that boring cannot? If yes, we consider it. If no, we do not.

## What this looks like in practice

An engagement we ran last year — a healthcare platform for a client with SOC 2 on the roadmap — used exactly one interesting piece of technology, in exactly one place. The rest was Postgres, Kotlin, Next.js, Terraform, and Cloudflare. We shipped in eleven weeks. The client renewed for eighteen months.

That client is boring. Their business is not.`,
  },
  {
    slug: "wiring-not-model",
    title: "The interesting work in AI is not the model",
    description:
      "Everyone is arguing about which model is best. The teams shipping value are focused on the wiring around it.",
    category: "AI",
    date: "2026-06-11",
    readingTime: "6 min",
    author: { name: "K. Nair", role: "Principal Engineer" },
    cover: {
      src: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=2000&q=80",
      alt: "Circuit close-up",
    },
    body: `## The layer nobody demos

Model demos are seductive. The teams that keep customers, however, spend most of their time somewhere else: the layer where the model meets the workflow. Ingestion. Evaluation. Routing. Escalation. Handoff.

This is unglamorous work. It also compounds.

## What we mean by "wiring"

Wiring is: the queue that lets a workflow retry the model when it fails. The evaluator that catches a regression before it hits production. The rate limiter. The router that picks the cheapest capable model. The audit trail that lets a human review yesterday's decisions.

None of this is interesting on its own. All of it is what makes AI trustworthy inside an operation.

## The clients who ship

Our AI engagements that ship well share a shape. The client cares more about hours returned than about the model they are running. They budget for evaluation. They start with one workflow, not five. They keep a human in the loop for a quarter longer than we recommend.

The clients who do not ship well are the ones who came to us with a model in mind.

## What to look for

If you are starting an AI project internally: begin with the workflow. Watch someone do the work. Ask what would be different if it took two hours instead of two days. Then figure out which model helps.

The model is a commodity. The wiring is the moat.`,
  },
  {
    slug: "editorial-not-template",
    title: "Editorial marketing, engineered pipeline",
    description:
      "The best B2B websites read like magazines and ship like software.",
    category: "Marketing",
    date: "2026-05-28",
    readingTime: "7 min",
    author: { name: "T. Ramírez", role: "Growth Lead" },
    cover: {
      src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=80",
      alt: "Editorial spread",
    },
    body: `## A marketing site is a compounding asset

For most B2B companies, the marketing site is the highest-leverage surface they own. It is where every deal starts and — increasingly — where every deal ends. It is also where most companies invest the least.

## Why templates fail

Template landing pages fail slowly. They rank in the first year. They convert in the second. In the third, they look like every other site in the category. By the fourth, the sales team is quietly using PDFs instead.

The best B2B sites do the opposite. They start slower — they take longer to build — and they compound.

## What "editorial" means here

Editorial does not mean pretty. It means: the site has a point of view. The writing sounds like a person. The layout is designed to be read, not scanned. Each page earns its place, and each page teaches you something.

The Bloomberg-Terminal-plus-New-York-Times aesthetic that has taken over B2B marketing sites is a symptom, not a solution. The underlying craft is not visual. It is editorial.

## The pipeline

We ship editorial sites the same way we ship software. Content model first. Design system second. Build third. Instrument fourth. Publish weekly.

## Where the compounding shows up

Two years after launch, the sites we build for clients rank for the terms nobody was ranking for when we started. They convert at rates our clients quote in board decks. And, importantly, the sales team uses them.`,
  },
  {
    slug: "restraint-in-brand",
    title: "Restraint is the hardest brand direction to sell",
    description:
      "Why the brands that age best are the ones that spent the most time arguing about what to leave out.",
    category: "Design",
    date: "2026-05-14",
    readingTime: "9 min",
    author: { name: "L. Kohler", role: "Creative Director" },
    cover: {
      src: "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&w=2000&q=80",
      alt: "Minimal editorial layout",
    },
    body: `## The client always wants more

Every brand engagement I have run has, at some point, arrived at the following moment. The direction we recommend is quiet. The direction the client's stakeholders react to most enthusiastically is louder. And the pressure is on to add a little something.

Do not add the something. The something is what will look tired in three years.

## The economics of restraint

Loud brands are expensive to maintain. Every new asset must decide how loud to be. Every partner must be onboarded to the loudness. Every campaign is a negotiation.

Quiet brands are cheap to maintain. The next asset is easy to design because the brand did most of the deciding upfront.

## Why restraint feels risky in the room

Restraint reads as "less" in a presentation, even when it is more. The louder direction pops on the wall. The quieter direction lives on the surface.

We show restraint on the surface, in context, not on the wall. This makes the argument easier.

## What restraint looks like in the guidelines

A restrained brand guideline is often thin. Three typefaces, not eight. One accent colour, used sparingly. A photography direction that says no to more than yes.

The thinness is the point. Every constraint reduces the surface of decisions that need to happen next.

## When to break your own rules

Never in the first two years. After that, deliberately, once a year, on a single asset that everyone will pay attention to.`,
  },
];

export const articlesBySlug = Object.fromEntries(articles.map((a) => [a.slug, a])) as Record<
  string,
  Article
>;

export const articleCategories = ["All", "Engineering", "AI", "Design", "Marketing"] as const;
