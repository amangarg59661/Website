import { FlatCompat } from "@eslint/eslintrc";
import { baseRules } from "./base.js";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: baseRules,
  },
];
