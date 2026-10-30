// Tests for the fast solution counter and the human-style difficulty rating.

import { describe, expect, it } from 'vitest'
import { isSolved, place } from './board'
import { countSolutions, reasoning } from './difficulty'
import { solve } from './solve'
import type { Puzzle } from './types'

// The hand-made 5×5 from the board tests: six ways to fill it, at most.
const puzzle: Puzzle = {
  size: 5,
  blocked: [
    { row: 0, col: 4, w: 1, h: 1 },
    { row: 2, col: 2, w: 1, h: 2 },
  ],
  pieces: [
    { id: 'A', w: 2, h: 2 },
    { id: 'B', w: 2, h: 2 },
    { id: 'C', w: 1, h: 4 },
    { id: 'D', w: 2, h: 3 },
    { id: 'E', w: 1, h: 2 },
    { id: 'F', w: 2, h: 1 },
  ],
}

describe('countSolutions', () => {
  it('counts the same solutions as the original solver', () => {
    expect(countSolutions(puzzle, 1000).solutions).toBe(solve(puzzle).solutions)
  })

  it('stops counting at the cap', () => {
    expect(countSolutions(puzzle, 1).solutions).toBe(1)
  })

  it('returns a first solution that really fills the board', () => {
    const { first } = countSolutions(puzzle, 1)
    expect(first && isSolved(puzzle, first)).toBe(true)
  })

  it('leaves fixed pieces where they are', () => {
    const fixed = place({}, 'A', { row: 0, col: 0, rotated: false })
    const { first } = countSolutions(puzzle, 1, 100_000, fixed)
    expect(first?.A).toEqual({ row: 0, col: 0, rotated: false })
    expect(first && isSolved(puzzle, first)).toBe(true)
  })

  it('finds nothing on a board that cannot be filled', () => {
    const impossible: Puzzle = { size: 3, blocked: [{ row: 1, col: 1, w: 1, h: 1 }], pieces: [{ id: 'A', w: 3, h: 3 }] }
    expect(countSolutions(impossible, 5)).toEqual({ solutions: 0, finished: true, first: undefined })
  })
})

describe('reasoning', () => {
  it('needs no guessing when every move is forced', () => {
    // One 2×2 piece on a 2×2 board: it can only go one place.
    const easy: Puzzle = { size: 2, blocked: [], pieces: [{ id: 'A', w: 2, h: 2 }] }
    expect(reasoning(easy)).toEqual({ guessing: 0, guesses: 0, forcedAtStart: 1 })
  })

  it('rates a board that needs trying things as needing some guessing', () => {
    const r = reasoning(puzzle)!
    expect(r.guessing).toBeGreaterThan(0)
  })
})
