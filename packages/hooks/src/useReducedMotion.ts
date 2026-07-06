"use client";

import { useMediaQuery } from "./useMediaQuery.js";

export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
