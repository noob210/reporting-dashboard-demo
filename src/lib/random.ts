/** FNV-1a string hash, used to derive stable seeds from readable keys. */
export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Small, fast seeded PRNG (mulberry32). Same seed, same sequence, on server and client. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns a deterministic random generator for the given key parts. */
export function seeded(...parts: Array<string | number>): () => number {
  return mulberry32(hashString(parts.join("|")));
}

/** Deterministic value in [min, max) for the given key parts. */
export function seededBetween(min: number, max: number, ...parts: Array<string | number>): number {
  return min + seeded(...parts)() * (max - min);
}
