// Seeded random numbers. Math.random() gives different numbers every time;
// this gives the same sequence for the same seed, so a puzzle made from
// seed 42 today is identical to one made from seed 42 next year.

/** mulberry32: a tiny, well-known generator. Returns numbers from 0 (inclusive) to 1 (exclusive). */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
