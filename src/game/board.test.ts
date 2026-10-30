// Tests: small programs that check the rules behave the way we expect.
// Run them with `npm test`.

import { describe, expect, it } from 'vitest'
import { canPlace, clashes, isSolved, occupancy, onBoard, place, remove, turnInPlace } from './board'
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
  it('puts the piece moved last on top of the pile', () => {
    let placements = place({}, 'A', { row: 0, col: 0, rotated: false })
    placements = place(placements, 'B', { row: 1, col: 1, rotated: false })
    placements = place(placements, 'A', { row: 0, col: 0, rotated: false }) // touched again
    expect(Object.keys(placements)).toEqual(['B', 'A'])
    expect(occupancy(puzzle, placements)[1][1]).toBe('A') // A is on top where they overlap
  })
})

describe('onBoard', () => {
  it('allows any spot fully on the board, even over other pieces or blocked squares', () => {
    expect(onBoard(puzzle, 'E', { row: 2, col: 2, rotated: false })).toBe(true) // on a blocked square
    expect(onBoard(puzzle, 'C', { row: 2, col: 0, rotated: false })).toBe(false) // hangs off the bottom
  })
})

describe('clashes', () => {
  it('finds nothing when pieces sit side by side', () => {
    expect(clashes(puzzle, solution).cells).toEqual([])
  })

  it('finds the squares two pieces share, and both pieces', () => {
    // A covers the top-left 2×2; B, one step to the right, shares A's right-hand column.
    let placements = place({}, 'A', { row: 0, col: 0, rotated: false })
    placements = place(placements, 'B', { row: 0, col: 1, rotated: false })
    const { cells, pieces } = clashes(puzzle, placements)
    expect(cells).toEqual([
      { row: 0, col: 1, w: 1, h: 1 },
      { row: 1, col: 1, w: 1, h: 1 },
    ])
    expect([...pieces].sort()).toEqual(['A', 'B'])
    expect([...clashes(puzzle, placements).onTop]).toEqual(['B']) // B went down last, so it's on top
  })

  it('counts a piece lying on a blocked square', () => {
    const { cells, pieces } = clashes(puzzle, place({}, 'E', { row: 2, col: 2, rotated: false }))
    expect(cells).toHaveLength(2) // E is 1 by 2, and both its squares are blocked
    expect([...pieces]).toEqual(['E'])
  })
})

describe('turnInPlace', () => {
  it('turns a piece about its centre', () => {
    // C stands 1 wide and 4 tall in the last column. Lying down it is 4 wide,
    // centred where it stood, then nudged left so it stays on the board.
    expect(turnInPlace(puzzle, 'C', { row: 1, col: 4, rotated: false })).toEqual({ row: 3, col: 1, rotated: true })
  })

  it('turns back to where it started', () => {
    const start = { row: 1, col: 1, rotated: false }
    expect(turnInPlace(puzzle, 'A', turnInPlace(puzzle, 'A', start))).toEqual(start) // a square stays put
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

  it('is false while a piece lies on a blocked square, even if every open cell is covered', () => {
    // Swap E's spot for one on the blocked squares: its own cells go empty, so slide F over them too.
    const placements = place(solution, 'E', { row: 2, col: 2, rotated: false })
    expect(isSolved(puzzle, placements)).toBe(false)
  })
})
