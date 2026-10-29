// Tests: small programs that check the rules behave the way we expect.
// Run them with `npm test`.

import { describe, expect, it } from 'vitest'
import { canPlace, isSolved, occupancy, place, remove } from './board'
import type { Placements, Puzzle } from './types'

// A hand-made 5×5 puzzle. "#" is blocked, "." is empty:
//
//   . . . . #
//   . . . . .
//   . . # . .
//   . . # . .
//   . . . . .
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

// One way to fill it:
//
//   A A B B #
//   A A B B C
//   D D # E C
//   D D # E C
//   D D F F C
const solution: Placements = {
  A: { row: 0, col: 0, rotated: false },
  B: { row: 0, col: 2, rotated: false },
  C: { row: 1, col: 4, rotated: false },
  D: { row: 2, col: 0, rotated: false },
  E: { row: 2, col: 3, rotated: false },
  F: { row: 4, col: 2, rotated: false },
}

describe('canPlace', () => {
  it('allows a piece on empty cells', () => {
    expect(canPlace(puzzle, {}, 'A', { row: 0, col: 0, rotated: false })).toBe(true)
  })

  it('rejects a piece hanging off the edge', () => {
    expect(canPlace(puzzle, {}, 'C', { row: 2, col: 0, rotated: false })).toBe(false) // 4 tall from row 2
    expect(canPlace(puzzle, {}, 'F', { row: 1, col: 4, rotated: false })).toBe(false) // 2 wide from the last column
  })

  it('rejects a piece covering a blocked cell', () => {
    expect(canPlace(puzzle, {}, 'E', { row: 2, col: 2, rotated: false })).toBe(false)
  })

  it('rejects a piece overlapping another piece', () => {
    const placements = place({}, 'A', { row: 0, col: 0, rotated: false })
    expect(canPlace(puzzle, placements, 'B', { row: 1, col: 1, rotated: false })).toBe(false)
  })

  it('swaps width and height when rotated', () => {
    // C is 1 wide and 4 tall. Rotated, it lies flat: 4 wide, 1 tall.
    expect(canPlace(puzzle, {}, 'C', { row: 4, col: 0, rotated: false })).toBe(false)
    expect(canPlace(puzzle, {}, 'C', { row: 4, col: 0, rotated: true })).toBe(true)
  })

  it('lets a placed piece move onto cells it already covers', () => {
    const placements = place({}, 'A', { row: 0, col: 0, rotated: false })
    // Shifting one step right overlaps A's old spot, which shouldn't count against it.
    expect(canPlace(puzzle, placements, 'A', { row: 0, col: 1, rotated: false })).toBe(true)
  })
})

describe('place and remove', () => {
  it('puts a piece on the board and takes it off again', () => {
    const placed = place({}, 'F', { row: 4, col: 2, rotated: false })
    expect(occupancy(puzzle, placed)[4][2]).toBe('F')
    expect(occupancy(puzzle, remove(placed, 'F'))[4][2]).toBe(null)
  })
})

describe('isSolved', () => {
  it('is false while cells are still empty', () => {
    expect(isSolved(puzzle, {})).toBe(false)
    expect(isSolved(puzzle, remove(solution, 'F'))).toBe(false)
  })

  it('is true once every empty cell is covered', () => {
    expect(isSolved(puzzle, solution)).toBe(true)
  })
})
