export function formatDate(input: string | Date, locale = "en-US") {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateShort(input: string | Date, locale = "en-US") {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
  }).format(date);
}

export function absoluteUrl(path: string, base?: string) {
  const origin =
    base ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://elitedigital.studio";
  if (path.startsWith("http")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}
