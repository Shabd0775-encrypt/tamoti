// Today's board: one puzzle a day, the same for everyone, chosen from the
// date alone (no server needed). Mostly the middle sizes, sometimes a quick
// 5×5 or a long 10×10, and never the same board two days running.

import { puzzleId, sizes, library } from './library'
import { seededRandom } from './rng'

// How often each size comes up, out of 10 days.
const sizeWeights: Record<number, number> = { 5: 1, 6: 2, 7: 2, 8: 2, 9: 2, 10: 1 }

/** Days since 1 January 2026 in the visitor's own calendar, so "today" changes at their midnight. */
export function dayNumber(date: Date): number {
  const start = Date.UTC(2026, 0, 1)
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((today - start) / 86_400_000)
}

function pick(day: number): string {
  const random = seededRandom(day * 2654435761)
  let roll = random() * 10
  let size = sizes[0]
  for (const s of sizes) {
    size = s
    if ((roll -= sizeWeights[s] ?? 0) < 0) break
  }
  const { puzzles } = library.sizes[size]
  return puzzleId(size, puzzles[Math.floor(random() * puzzles.length)].number)
}

/** The id of the day's puzzle, like "7-15". */
export function dailyPuzzleId(date = new Date()): string {
  const day = dayNumber(date)
  const today = pick(day)
  // Never repeat yesterday's board: if the draw lands on it, draw again.
  return today === pick(day - 1) ? pick(day + 10_000) : today
}
