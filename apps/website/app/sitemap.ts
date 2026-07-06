import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { services } from "@/data/services";
import { cases } from "@/data/portfolio";
import { articles, articleCategories } from "@/data/blog";
import careers from "@/content/careers.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const now = new Date();

  const roots: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/services",
    "/portfolio",
    "/blog",
    "/faqs",
    "/careers",
    "/contact",
    "/legal/privacy",
    "/legal/terms",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));

  const svcs: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${base}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const portfolio: MetadataRoute.Sitemap = cases.map((c) => ({
    url: `${base}/portfolio/${c.slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  const blog: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const blogCats: MetadataRoute.Sitemap = articleCategories
    .filter((c) => c !== "All")
    .map((c) => ({
      url: `${base}/blog/category/${c.toLowerCase()}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    }));

  const careerRoles: MetadataRoute.Sitemap = (careers as { slug: string; posted: string }[]).map(
    (r) => ({
      url: `${base}/careers/${r.slug}`,
      lastModified: new Date(r.posted),
      changeFrequency: "weekly",
      priority: 0.5,
    }),
  );

  return [...roots, ...svcs, ...portfolio, ...blog, ...blogCats, ...careerRoles];
}
