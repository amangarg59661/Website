import { http, HttpResponse } from "msw";

/**
 * Staff careers moderation surface. Seeds mirror the backend V17
 * migration so the dashboard shows realistic data in dev even without
 * a running backend.
 */

type Posting = {
  id: string;
  slug: string;
  title: string;
  team: string;
  location: string;
  employment_type: string;
  commitment?: string | null;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  currency?: string | null;
  status: "draft" | "published" | "archived";
  posted_at?: string | null;
  published_at?: string | null;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Application = {
  id: string;
  job_posting_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string | null;
  resume_url?: string | null;
  cover_letter: string;
  status: "new" | "reviewing" | "contacted" | "rejected" | "hired";
  reviewer_note?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by_user_id?: string | null;
};

const now = () => new Date().toISOString();

const seedPostings: Posting[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "senior-fullstack-engineer",
    title: "Senior Full-Stack Engineer",
    team: "Engineering",
    location: "Remote — Global (India / EU / Americas overlap)",
    employment_type: "Full-time",
    commitment: "40h / week",
    summary:
      "Lead technical delivery on multi-quarter engagements across finance, health, and logistics clients. TypeScript + one strong backend language.",
    responsibilities: [
      "Own the technical shape of engagements from discovery to handoff",
      "Architect and ship platforms that survive their first re-org",
      "Mentor two to three engineers and set the bar for craft",
    ],
    requirements: [
      "6+ years shipping production systems",
      "Deep TypeScript. One of Kotlin / Go / Elixir / Rust at production depth.",
      "Comfort with ambiguity — engagements start before the spec exists",
    ],
    status: "published",
    posted_at: "2026-06-14",
    published_at: "2026-06-14T00:00:00.000Z",
    created_at: "2026-06-14T00:00:00.000Z",
    updated_at: "2026-06-14T00:00:00.000Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111112",
    slug: "brand-designer",
    title: "Brand Designer",
    team: "Design",
    location: "Bengaluru or Remote (EU / GCC overlap)",
    employment_type: "Full-time",
    commitment: "40h / week",
    summary:
      "Identity work for boutique clients across finance, wealth, and technology. Typography-first. Craft over speed.",
    responsibilities: [
      "Lead identity engagements from positioning to guidelines",
      "Work with type designers and photographers we collaborate with",
      "Present directly to founders and boards",
    ],
    requirements: [
      "5+ years brand identity work — portfolio speaks first",
      "Fluency in typography, colour theory, and print production",
      "Comfort presenting work to executives",
    ],
    status: "published",
    posted_at: "2026-06-01",
    published_at: "2026-06-01T00:00:00.000Z",
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "11111111-1111-4111-8111-111111111113",
    slug: "growth-strategist",
    title: "Growth Strategist",
    team: "Growth",
    location: "London or Remote (Americas overlap)",
    employment_type: "Full-time",
    commitment: "40h / week",
    summary:
      "Run performance marketing engagements for DTC and B2B clients. Carry a P&L. Own attribution the CFO can defend.",
    responsibilities: [
      "Own CAC / LTV / MER on client accounts spending $500k–$5M/mo",
      "Design and run incrementality studies",
      "Present to CMOs and CEOs weekly",
    ],
    requirements: [
      "5+ years managing paid media spend at scale",
      "Fluency across Meta, Google, TikTok, LinkedIn — and the measurement stack around them",
      "Comfort with SQL, Python, or dbt",
    ],
    status: "published",
    posted_at: "2026-05-20",
    published_at: "2026-05-20T00:00:00.000Z",
    created_at: "2026-05-20T00:00:00.000Z",
    updated_at: "2026-05-20T00:00:00.000Z",
  },
];

const seedApplications: Application[] = [
  {
    id: "22222222-2222-4222-8222-222222222201",
    job_posting_id: "11111111-1111-4111-8111-111111111111",
    applicant_name: "Isha Prabhu",
    applicant_email: "isha.prabhu@example.com",
    applicant_phone: "+91 98765 43210",
    resume_url: "https://linkedin.com/in/example-isha",
    cover_letter:
      "I have led four platform re-writes in the last decade and I care most about the one that stayed in production. I'd like to keep doing that here.",
    status: "new",
    submitted_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    job_posting_id: "11111111-1111-4111-8111-111111111111",
    applicant_name: "Kabir Menon",
    applicant_email: "kabir.menon@example.com",
    applicant_phone: null,
    resume_url: "https://kabirmenon.com",
    cover_letter:
      "TypeScript everywhere. Elixir for the last two years. Comfortable being the person who owns the deployment.",
    status: "reviewing",
    reviewer_note: "Portfolio looks strong. Schedule intro next week.",
    submitted_at: new Date(Date.now() - 4 * 86400_000).toISOString(),
    reviewed_at: new Date(Date.now() - 1 * 86400_000).toISOString(),
    reviewed_by_user_id: "u_admin_1",
  },
  {
    id: "22222222-2222-4222-8222-222222222203",
    job_posting_id: "11111111-1111-4111-8111-111111111112",
    applicant_name: "Meera Anand",
    applicant_email: "meera@studio-anand.co",
    applicant_phone: null,
    resume_url: "https://dribbble.com/example-meera",
    cover_letter:
      "Identity work for two small banks and a private hospital. Would love to build a wordmark that outlives a rebrand.",
    status: "contacted",
    reviewer_note: "Sent intro email 3 days ago; awaiting reply.",
    submitted_at: new Date(Date.now() - 9 * 86400_000).toISOString(),
    reviewed_at: new Date(Date.now() - 3 * 86400_000).toISOString(),
    reviewed_by_user_id: "u_admin_1",
  },
];

let postings = [...seedPostings];
const applications = [...seedApplications];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

function findPosting(id: string): Posting | undefined {
  return postings.find((p) => p.id === id);
}

export const careersHandlers = [
  http.get("*/staff/careers", () => HttpResponse.json(postings)),

  http.get("*/staff/careers/:id", ({ params }) => {
    const p = findPosting(params.id as string);
    return p
      ? HttpResponse.json(p)
      : HttpResponse.json(
          { code: "NOT_FOUND", message: "Job posting not found." },
          { status: 404 },
        );
  }),

  http.post("*/staff/careers", async ({ request }) => {
    const body = (await request.json()) as {
      slug?: string;
      title: string;
      team: string;
      location: string;
      employmentType: string;
      commitment?: string;
      summary: string;
      responsibilities: string[];
      requirements: string[];
      salaryRangeMin?: number;
      salaryRangeMax?: number;
      currency?: string;
    };
    const slug = body.slug ?? slugify(body.title);
    if (postings.some((p) => p.slug === slug)) {
      return HttpResponse.json(
        { code: "VALIDATION_FAILED", message: `Slug already in use: ${slug}` },
        { status: 400 },
      );
    }
    const created: Posting = {
      id: crypto.randomUUID(),
      slug,
      title: body.title,
      team: body.team,
      location: body.location,
      employment_type: body.employmentType,
      commitment: body.commitment ?? null,
      summary: body.summary,
      responsibilities: body.responsibilities ?? [],
      requirements: body.requirements ?? [],
      salary_range_min: body.salaryRangeMin ?? null,
      salary_range_max: body.salaryRangeMax ?? null,
      currency: body.currency ?? null,
      status: "draft",
      posted_at: null,
      published_at: null,
      archived_at: null,
      created_at: now(),
      updated_at: now(),
    };
    postings = [created, ...postings];
    return HttpResponse.json(created, { status: 200 });
  }),

  http.patch("*/staff/careers/:id", async ({ params, request }) => {
    const p = findPosting(params.id as string);
    if (!p) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    const body = (await request.json()) as Partial<{
      title: string;
      team: string;
      location: string;
      employmentType: string;
      commitment: string;
      summary: string;
      responsibilities: string[];
      requirements: string[];
      salaryRangeMin: number;
      salaryRangeMax: number;
      currency: string;
    }>;
    if (body.title !== undefined) p.title = body.title;
    if (body.team !== undefined) p.team = body.team;
    if (body.location !== undefined) p.location = body.location;
    if (body.employmentType !== undefined) p.employment_type = body.employmentType;
    if (body.commitment !== undefined) p.commitment = body.commitment;
    if (body.summary !== undefined) p.summary = body.summary;
    if (body.responsibilities !== undefined) p.responsibilities = body.responsibilities;
    if (body.requirements !== undefined) p.requirements = body.requirements;
    if (body.salaryRangeMin !== undefined) p.salary_range_min = body.salaryRangeMin;
    if (body.salaryRangeMax !== undefined) p.salary_range_max = body.salaryRangeMax;
    if (body.currency !== undefined) p.currency = body.currency;
    p.updated_at = now();
    return HttpResponse.json(p);
  }),

  http.post("*/staff/careers/:id/publish", ({ params }) => {
    const p = findPosting(params.id as string);
    if (!p) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    if (p.status !== "draft") {
      return HttpResponse.json(
        {
          code: "VALIDATION_FAILED",
          message: `Only draft postings can be published (current: ${p.status}).`,
        },
        { status: 400 },
      );
    }
    p.status = "published";
    p.published_at = now();
    p.posted_at = new Date().toISOString().slice(0, 10);
    p.updated_at = now();
    return HttpResponse.json(p);
  }),

  http.post("*/staff/careers/:id/archive", ({ params }) => {
    const p = findPosting(params.id as string);
    if (!p) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    p.status = "archived";
    p.archived_at = now();
    p.updated_at = now();
    return HttpResponse.json(p);
  }),

  http.delete("*/staff/careers/:id", ({ params }) => {
    const p = findPosting(params.id as string);
    if (!p) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    if (p.status !== "draft") {
      return HttpResponse.json(
        {
          code: "VALIDATION_FAILED",
          message: "Only draft postings can be deleted; archive published postings instead.",
        },
        { status: 400 },
      );
    }
    postings = postings.filter((x) => x.id !== p.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/staff/careers/:id/applications", ({ params }) => {
    const list = applications
      .filter((a) => a.job_posting_id === params.id)
      .sort((a, b) => (a.submitted_at < b.submitted_at ? 1 : -1));
    return HttpResponse.json(list);
  }),

  http.patch("*/staff/careers/applications/:id", async ({ params, request }) => {
    const app = applications.find((a) => a.id === params.id);
    if (!app) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    const body = (await request.json()) as { status: Application["status"]; note?: string };
    if (!["new", "reviewing", "contacted", "rejected", "hired"].includes(body.status as string)) {
      return HttpResponse.json(
        { code: "VALIDATION_FAILED", message: "Unknown application status." },
        { status: 400 },
      );
    }
    app.status = body.status;
    app.reviewer_note = body.note ?? null;
    app.reviewed_at = now();
    app.reviewed_by_user_id = "u_admin_1";
    return HttpResponse.json(app);
  }),
];
