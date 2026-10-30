// Searches for piece sets that make hard puzzles with blockers in tough spots.
// Run with `npx tsx scripts/find-piece-sets.ts <size>`; it prints the best few
// sets it found. The winners are copied by hand into pieceSets in generate.ts.
//
// A set is a few rectangles, all different shapes, none as long as the board,
// whose areas add up to the board minus the blocked squares. For each
// candidate set we drop blockers in tough spots many times over and see:
//   - how often the board can still be filled (with only a few solutions);
//   - how hard those boards are for a person (see difficulty.ts).
// A set that rarely works is no use however hard it is, so it must clear a
// minimum first; after that, harder wins.

import { blockedArea, pieceSets, piecesFrom, randomBlockers, rate, type Shape } from '../src/game/generate'
import { seededRandom } from '../src/game/rng'

const size = Number(process.argv[2])
/** Optional: how much of the blocked area may sit on the edge (see edgeShareFor in generate.ts). */
const edgeShare = process.argv[3] ? Number(process.argv[3]) : undefined
/** Optional: the biggest piece allowed, in squares (default about a quarter of the board). */
const maxArea = process.argv[4] ? Number(process.argv[4]) : Math.max(9, (size * size) / 4)
// How many squares to block for each size, and how many candidate sets and tries to spend.
// The number of pieces is left free: whatever adds up exactly is tried.
const plan: Record<number, { blocked: number; sets: number; tries: number }> = {
  5: { blocked: 3, sets: 80, tries: 300 },
  6: { blocked: 4, sets: 70, tries: 250 },
  7: { blocked: 5, sets: 50, tries: 200 },
  8: { blocked: 6, sets: 40, tries: 160 },
  9: { blocked: 6, sets: 30, tries: 130 },
  10: { blocked: 7, sets: 24, tries: 110 },
}
const { blocked, tries } = plan[size]
const sets = process.argv[5] ? Number(process.argv[5]) : plan[size].sets
const maxSolutions = size <= 6 ? 3 : 2
const random = seededRandom(size * 9001)

// Every allowed shape: at least 2 squares, at most 4 wide, shorter than the board,
// and no bigger than about a quarter of it.
const pool: Shape[] = []
for (let w = 1; w <= 4; w++) {
  for (let h = Math.max(w, 2); h < size; h++) {
    if (w * h <= maxArea) pool.push([w, h])
  }
}

/**
 * A random set of different shapes whose areas add up exactly: shapes are
 * taken in a random order, each kept if it still fits under the total,
 * until the total is reached (or the attempt is abandoned).
 */
function randomSet(): Shape[] | null {
  const target = size * size - blocked
  for (let attempt = 0; attempt < 5000; attempt++) {
    const picked: Shape[] = []
    let total = 0
    for (const shape of [...pool].sort(() => random() - 0.5)) {
      const area = shape[0] * shape[1]
      if (total + area <= target) {
        picked.push(shape)
        total += area
      }
      if (total === target) return picked
    }
  }
  return null
}

type Result = { shapes: Shape[]; yieldRate: number; hardness: number }
const results: Result[] = []
const seen = new Set<string>()

// Today's set is tried too, with its own number of blocked squares, as the yardstick.
for (let s = -1; s < sets; s++) {
  const shapes = s < 0 ? pieceSets[size] : randomSet()
  const area = s < 0 ? blockedArea(size) : blocked
  if (!shapes) continue
  const key = shapes
    .map(([w, h]) => `${w}x${h}`)
    .sort()
    .join(' ')
  if (seen.has(key)) continue
  seen.add(key)
  const pieces = piecesFrom(shapes)
  const scores: number[] = []
  for (let t = 0; t < tries; t++) {
    const layout = randomBlockers(size, random, area, edgeShare)
    if (!layout) continue
    const rated = rate(size, layout, maxSolutions, pieces)
    if (rated) scores.push(rated.difficulty)
  }
  const yieldRate = scores.length / tries
  // The typical hardness of the better half: that's what the library will be picked from.
  const top = scores.sort((a, b) => b - a).slice(0, Math.max(1, Math.ceil(scores.length / 2)))
  const hardness = scores.length ? top.reduce((a, b) => a + b, 0) / top.length : 0
  results.push({ shapes, yieldRate, hardness })
  if (s < 0) console.log(`  today's set: hardness ${hardness.toFixed(2)}, yield ${(yieldRate * 100).toFixed(1)}%`)
}

// Must give a usable board at least 1 time in 100 (1 in 200 on 10×10, the hardest to fill); then the hardest wins.
const minimumYield = size >= 10 ? 0.005 : 0.01
const usable = results.filter((r) => r.yieldRate >= minimumYield).sort((a, b) => b.hardness - a.hardness)
const bestYield = Math.max(0, ...results.map((r) => r.yieldRate))
console.log(
  `${size}×${size}: ${results.length} sets tried, ${usable.length} usable, best yield ${(bestYield * 100).toFixed(1)}%`,
)
for (const r of usable.slice(0, 4)) {
  const shapes = [...r.shapes].sort(([a, b], [c, d]) => a * b - c * d)
  console.log(
    `  hardness ${r.hardness.toFixed(2)}  yield ${(r.yieldRate * 100).toFixed(1)}%  pieces ${shapes.length}  ${JSON.stringify(shapes)}`,
  )
}
