export const easings = {
  outQuart: [0.22, 1, 0.36, 1] as const,
  outExpo: [0.16, 1, 0.3, 1] as const,
} as const;

export const durationsMs = {
  fast: 180,
  default: 320,
  slow: 640,
  cinematic: 1200,
} as const;

export const durationsSec = {
  fast: durationsMs.fast / 1000,
  default: durationsMs.default / 1000,
  slow: durationsMs.slow / 1000,
  cinematic: durationsMs.cinematic / 1000,
} as const;
