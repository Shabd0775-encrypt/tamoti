import { describe, expect, it } from 'vitest'
import { blockedArea, layoutKey, pieceSets, toughPositions } from './generate'
import { countSolutions } from './difficulty'
import { findPuzzle, library, sizes } from './library'
import { seededRandom } from './rng'
import { solve } from './solve'

describe('piece sets', () => {
  it('are all different shapes, none as long as the board (past 5×5), leaving a few squares to block', () => {
    for (const size of sizes) {
      const shapes = pieceSets[size].map(([w, h]) => `${Math.min(w, h)}x${Math.max(w, h)}`)
      expect(new Set(shapes).size, `${size}`).toBe(shapes.length)
      // 5×5 keeps its original set, which has one strip the full width of the board (see pieceSets).
      if (size > 5) expect(Math.max(...pieceSets[size].flat()), `${size}`).toBeLessThan(size)
      expect(blockedArea(size), `${size}`).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('library', () => {
  it('has puzzles for every size from 5 to 10', () => {
    expect(sizes).toEqual([5, 6, 7, 8, 9, 10])
  })

  it('only holds puzzles with exactly the number of solutions it claims', () => {
    for (const size of sizes) {
      for (const entry of library.sizes[size].puzzles) {
        const { puzzle } = findPuzzle(`${size}-${entry.number}`)!
        const counted = countSolutions(puzzle, 50, 5_000_000)
        expect(counted.finished, `${size}-${entry.number}`).toBe(true)
        expect(counted.solutions, `${size}-${entry.number}`).toBe(entry.solutions)
        // A second, independent check with the original solver, where it's quick enough.
        if (size <= 7) expect(solve(puzzle).solutions, `${size}-${entry.number}`).toBe(entry.solutions)
      }
    }
  })

  it('puts blockers in tough spots: no corners; past 5×5, none touching and mostly away from the edge', () => {
    for (const size of sizes) {
      for (const p of library.sizes[size].puzzles) {
        expect(toughPositions(size, p.blocked), `${size}-${p.number}`).toBe(true)
      }
    }
  })

  it('gets harder through each size, from gentle to deep', () => {
    for (const size of sizes) {
      const scores = library.sizes[size].puzzles.map((p) => p.difficulty ?? 0)
      expect(scores, `${size}`).toEqual([...scores].sort((a, b) => a - b))
    }
  })

  it('never holds the same layout twice, even rotated or mirrored', () => {
    for (const size of sizes) {
      const keys = library.sizes[size].puzzles.map((p) => layoutKey(size, p.blocked))
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('returns null for a puzzle that does not exist', () => {
    expect(findPuzzle('4-1')).toBeNull()
    expect(findPuzzle('8-99')).toBeNull()
  })
})

describe('layoutKey', () => {
  it('is the same for a layout and its mirror image', () => {
    const layout = [{ row: 0, col: 0, w: 1, h: 2 }]
    const mirrored = [{ row: 0, col: 4, w: 1, h: 2 }]
    expect(layoutKey(5, layout)).toBe(layoutKey(5, mirrored))
  })
})

describe('seededRandom', () => {
  it('repeats the same numbers for the same seed', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
})
