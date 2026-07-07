"use client";

import { useState } from "react";

export type TwoFaState =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "invalid" }
  | { kind: "rate-limited"; retryAfterSec: number }
  | { kind: "verified" };

export function use2faChallenge() {
  const [state, setState] = useState<TwoFaState>({ kind: "idle" });
  return { state, setState };
}
