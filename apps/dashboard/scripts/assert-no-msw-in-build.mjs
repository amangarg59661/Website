#!/usr/bin/env node
/**
 * S-03 build guard.
 *
 * `pre`  — before `next build`. If NEXT_PUBLIC_USE_MOCKS is truthy and
 *          NODE_ENV=production, abort. Prevents an accidental prod build
 *          that ships MSW.
 * `post` — after `next build`. Fails if `mockServiceWorker.js` landed in
 *          `.next/static/` or in the copied `public/` output. Defence
 *          against any future path that reintroduces the worker.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dashRoot = resolve(here, "..");
const mode = process.argv[2] ?? "pre";

if (mode === "pre") {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true" && process.env.NODE_ENV === "production") {
    console.error(
      "[build] Refusing to build: NEXT_PUBLIC_USE_MOCKS=true with NODE_ENV=production.",
    );
    process.exit(1);
  }
  process.exit(0);
}

const publicWorker = join(dashRoot, ".next", "static", "mockServiceWorker.js");
if (existsSync(publicWorker)) {
  console.error(
    "[build] Refusing to ship: mockServiceWorker.js found in .next/static output.",
  );
  process.exit(1);
}

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full);
    else if (entry === "mockServiceWorker.js") {
      console.error(`[build] Refusing to ship: found worker at ${full}`);
      process.exit(1);
    }
  }
}
walk(join(dashRoot, ".next"));
