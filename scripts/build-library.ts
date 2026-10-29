// Builds the puzzle library: src/game/library.json.
// Run it with `npm run build:library`. It takes a minute or two, and only
// needs re-running when the piece sets or the rules for a good puzzle change.

import { writeFileSync } from 'node:fs'
import { layoutKey, piecesFor, randomBlockers, rate, type Rated } from '../src/game/generate'
import { seededRandom } from '../src/game/rng'
import type { Library } from '../src/game/library'

const PUZZLES_PER_SIZE = 24
const TIERS = ['gentle', 'steady', 'tricky', 'deep'] as const
const MAX_ATTEMPTS = 6000
/** Enough candidates to choose a good spread from. */
const ENOUGH = 240

const library: Library = { sizes: {} }

for (let size = 5; size <= 10; size++) {
  const random = seededRandom(size * 1000)
  const found = new Map<string, Rated>()
  // Small boards have fewer layouts, so allow a few more solutions there.
  const maxSolutions = size <= 6 ? 6 : 4

  for (let attempt = 0; attempt < MAX_ATTEMPTS && found.size < ENOUGH; attempt++) {
    const blocked = randomBlockers(size, random)
    if (!blocked) continue
    const key = layoutKey(size, blocked)
    if (found.has(key)) continue
    const rated = rate(size, blocked, maxSolutions)
    if (rated) found.set(key, rated)
  }

  // Easiest first, then pick evenly across the whole range.
  const ranked = [...found.values()].sort((a, b) => a.difficulty - b.difficulty)
  const count = Math.min(PUZZLES_PER_SIZE, ranked.length)
  const picked = Array.from({ length: count }, (_, i) => ranked[Math.round((i * (ranked.length - 1)) / Math.max(count - 1, 1))])

  library.sizes[size] = {
    pieces: piecesFor(size),
    puzzles: picked.map((p, i) => ({
      number: i + 1,
      tier: TIERS[Math.floor((i * TIERS.length) / count)],
      blocked: p.blocked,
      solutions: p.solutions,
    })),
  }
  console.log(`${size}×${size}: ${found.size} good layouts found, kept ${count}`)
}

writeFileSync(new URL('../src/game/library.json', import.meta.url), JSON.stringify(library, null, 1) + '\n')
console.log('Wrote src/game/library.json')
