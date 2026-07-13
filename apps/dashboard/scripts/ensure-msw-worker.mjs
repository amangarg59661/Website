#!/usr/bin/env node
/**
 * predev hook — regenerate public/mockServiceWorker.js from the installed
 * MSW package when it's absent. The worker is gitignored (S-03) so fresh
 * clones don't ship it. In prod it stays absent and MSWProvider throws.
 */
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const workerPath = resolve(here, "..", "public", "mockServiceWorker.js");

if (existsSync(workerPath)) {
  process.exit(0);
}

if (process.env.NEXT_PUBLIC_USE_MOCKS !== "true") {
  process.exit(0);
}

console.log("[msw] worker missing — regenerating via `msw init`");
execSync("npx msw init public/ --save", { stdio: "inherit", cwd: resolve(here, "..") });
