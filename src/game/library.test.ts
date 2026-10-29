import { describe, expect, it } from 'vitest'
import { layoutKey, pieceSets } from './generate'
import { findPuzzle, library, sizes } from './library'
import { seededRandom } from './rng'
import { solve } from './solve'

describe('piece sets', () => {
  it('give an N×N board exactly N pieces, all different shapes', () => {
    for (const size of sizes) {
      const shapes = pieceSets[size].map(([w, h]) => `${Math.min(w, h)}x${Math.max(w, h)}`)
      expect(shapes).toHaveLength(size)
      expect(new Set(shapes).size).toBe(size)
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
        expect(solve(puzzle).solutions, `${size}-${entry.number}`).toBe(entry.solutions)
      }
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
