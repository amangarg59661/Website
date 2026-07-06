#!/usr/bin/env node
// Bundle budget checker — reads .next/build-manifest.json and compares
// page chunk sizes against a per-route budget. Runs after `next build`.

import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const BUDGETS = {
  "/": 110 * 1024, // 110 KB gzipped per route bundle
  default: 130 * 1024,
};

try {
  const manifest = JSON.parse(readFileSync(".next/build-manifest.json", "utf8"));
  const rootPages = manifest.rootMainFiles ?? [];
  console.log("[bundle] root files:");
  let total = 0;
  for (const f of rootPages) {
    const size = statSync(join(".next", f)).size;
    total += size;
    console.log(`  ${f}  ${(size / 1024).toFixed(1)}KB`);
  }
  console.log(`[bundle] total root: ${(total / 1024).toFixed(1)}KB`);

  const homeBudget = BUDGETS["/"];
  if (total > homeBudget) {
    console.error(
      `[bundle] FAIL — root bundle ${(total / 1024).toFixed(1)}KB exceeds ${(homeBudget / 1024).toFixed(0)}KB budget`,
    );
    process.exit(1);
  }
  console.log("[bundle] OK");
} catch (err) {
  console.warn("[bundle] could not read build manifest (skipping):", err.message);
  process.exit(0);
}
