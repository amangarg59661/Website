import staticCareers from "@/content/careers.json";

/**
 * C-4: careers roles are moderated on the backend. Marketing page fetches
 * from GET {NEXT_PUBLIC_API_BASE}/careers with ISR revalidate so the page
 * stays fast and the admin edits go live within {revalidate} seconds.
 *
 * If the backend is unreachable at build or request time the static
 * content/careers.json bundle is served so the marketing site never
 * ships an empty careers page. The static list is also seed data —
 * V17 migration seeds these exact three roles into careers.job_postings.
 *
 * No styling or theme changes anywhere in the render tree per client
 * preservation rule. This module is a data adapter only.
 */

export type Role = {
  slug: string;
  title: string;
  team: string;
  location: string;
  type: string;
  commitment?: string;
  posted?: string;
  summary: string;
  responsibilities?: string[];
  requirements?: string[];
};

type BackendPosting = {
  id: string;
  slug: string;
  title: string;
  team: string;
  location: string;
  employmentType: string;
  commitment?: string | null;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  status: string;
  postedAt?: string | null;
  publishedAt?: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

// 5-minute ISR keeps the page fast; admin flips live within that window.
export const REVALIDATE_SECONDS = 300;

function toRole(p: BackendPosting): Role {
  return {
    slug: p.slug,
    title: p.title,
    team: p.team,
    location: p.location,
    type: p.employmentType,
    commitment: p.commitment ?? undefined,
    posted: p.postedAt ?? undefined,
    summary: p.summary,
    responsibilities: p.responsibilities,
    requirements: p.requirements,
  };
}

const staticRoles = staticCareers as Role[];

export async function fetchRoles(): Promise<Role[]> {
  if (!API_BASE) return staticRoles;
  try {
    const res = await fetch(`${API_BASE}/careers?limit=200`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["careers"] },
    });
    if (!res.ok) return staticRoles;
    const body: unknown = await res.json();
    if (!Array.isArray(body)) return staticRoles;
    const parsed = (body as BackendPosting[])
      .filter((p) => p && typeof p.slug === "string")
      .map(toRole);
    return parsed.length > 0 ? parsed : staticRoles;
  } catch {
    return staticRoles;
  }
}

export async function fetchRole(slug: string): Promise<Role | null> {
  if (!API_BASE) {
    return staticRoles.find((r) => r.slug === slug) ?? null;
  }
  try {
    const res = await fetch(`${API_BASE}/careers/${encodeURIComponent(slug)}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["careers", `careers:${slug}`] },
    });
    if (!res.ok) {
      return staticRoles.find((r) => r.slug === slug) ?? null;
    }
    const body = (await res.json()) as BackendPosting;
    if (!body || typeof body.slug !== "string") {
      return staticRoles.find((r) => r.slug === slug) ?? null;
    }
    return toRole(body);
  } catch {
    return staticRoles.find((r) => r.slug === slug) ?? null;
  }
}
