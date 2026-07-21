import { FlatCompat } from "@eslint/eslintrc";
import { baseRules } from "./base.js";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/*.d.ts",
      "**/next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: baseRules,
  },
];
