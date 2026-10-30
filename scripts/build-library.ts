// Builds the puzzle library: src/game/library.json.
// Run it with `npm run build:library`. It takes several minutes, and only
// needs re-running when the piece sets or the rules for a good puzzle change.
//
// To go faster, build sizes side by side, then merge them:
//   npx tsx scripts/build-library.ts 9      (writes scripts/.parts/9.json)
//   npx tsx scripts/build-library.ts merge  (joins the parts into library.json)
//
// For each size: drop blockers in tough spots many times over, keep the
// layouts the pieces can fill in only a few ways, and rate each one for how
// hard it is for a person. Then leave out the easiest part of the pile, and
// spread the 24 puzzles evenly over what's left, easiest first.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { layoutKey, piecesFor, randomBlockers, rate, type Rated } from '../src/game/generate'
import { seededRandom } from '../src/game/rng'
import type { Library } from '../src/game/library'

const PUZZLES_PER_SIZE = 24
const TIERS = ['gentle', 'steady', 'tricky', 'deep'] as const
/** Enough candidates to choose a good spread from. */
const ENOUGH = 200
/** Stop looking after this long per size, even if there aren't ENOUGH. Big boards are slow to check. */
const timeLimitMs = (size: number) => (size >= 9 ? 12 : 6) * 60_000
/** The easiest share of candidates is never used: even the gentle boards should take some thought. */
const LEAVE_OUT_EASIEST = 0.4

const library: Library = { sizes: {} }
const parts = new URL('./.parts/', import.meta.url)
const arg = process.argv[2]

if (arg === 'merge') {
  for (let size = 5; size <= 10; size++) {
    library.sizes[size] = JSON.parse(readFileSync(new URL(`${size}.json`, parts), 'utf8'))
  }
  writeFileSync(new URL('../src/game/library.json', import.meta.url), JSON.stringify(library, null, 1) + '\n')
  console.log('Merged the parts into src/game/library.json')
  process.exit(0)
}

const only = arg ? [Number(arg)] : [5, 6, 7, 8, 9, 10]
for (const size of only) {
  const random = seededRandom(size * 1000)
  const found = new Map<string, Rated>()
  // Small boards have fewer layouts, so allow a few more solutions there.
  const maxSolutions = size <= 6 ? 3 : 2
  const started = Date.now()
  let tried = 0

  while (found.size < ENOUGH && Date.now() - started < timeLimitMs(size)) {
    const blocked = randomBlockers(size, random)
    if (!blocked) continue
    tried++
    const key = layoutKey(size, blocked)
    if (found.has(key)) continue
    const rated = rate(size, blocked, maxSolutions)
    if (rated) found.set(key, rated)
  }

  const ranked = [...found.values()].sort((a, b) => a.difficulty - b.difficulty)
  // Leave out the easiest, unless that would leave too few to choose from.
  const keepFrom = Math.min(
    Math.floor(ranked.length * LEAVE_OUT_EASIEST),
    Math.max(0, ranked.length - PUZZLES_PER_SIZE),
  )
  const pool = ranked.slice(keepFrom)
  const count = Math.min(PUZZLES_PER_SIZE, pool.length)
  const picked = Array.from(
    { length: count },
    (_, i) => pool[Math.round((i * (pool.length - 1)) / Math.max(count - 1, 1))],
  )

  library.sizes[size] = {
    pieces: piecesFor(size),
    puzzles: picked.map((p, i) => ({
      number: i + 1,
      tier: TIERS[Math.floor((i * TIERS.length) / count)],
      blocked: p.blocked,
      solutions: p.solutions,
      difficulty: Math.round(p.difficulty * 100) / 100,
    })),
  }
  const seconds = Math.round((Date.now() - started) / 1000)
  console.log(
    `${size}×${size}: ${tried} layouts tried, ${found.size} good, kept ${count} ` +
      `(difficulty ${picked[0]?.difficulty.toFixed(1)} to ${picked.at(-1)?.difficulty.toFixed(1)}), ${seconds}s`,
  )
}

if (arg) {
  mkdirSync(parts, { recursive: true })
  writeFileSync(new URL(`${arg}.json`, parts), JSON.stringify(library.sizes[Number(arg)], null, 1))
  console.log(`Wrote scripts/.parts/${arg}.json`)
} else {
  writeFileSync(new URL('../src/game/library.json', import.meta.url), JSON.stringify(library, null, 1) + '\n')
  console.log('Wrote src/game/library.json')
}
