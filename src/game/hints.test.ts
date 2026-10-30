// Tests for hints, on the same hand-made 5×5 puzzle as the board tests.

import { describe, expect, it } from 'vitest'
import { canPlace, place } from './board'
import { hint, parseSolutionKey, solutionKey } from './hints'
import type { Puzzle } from './types'

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

describe('hint', () => {
  it('on an empty board, places a piece in the top-left corner', () => {
    const h = hint(puzzle, {})
    expect(h.kind).toBe('place')
    if (h.kind !== 'place') return
    expect(h.at.row).toBe(0)
    expect(h.at.col).toBe(0)
    expect(canPlace(puzzle, {}, h.pieceId, h.at)).toBe(true)
  })

  it('keeps going from pieces that can still be part of a solution', () => {
    const placements = place({}, 'A', { row: 0, col: 0, rotated: false })
    const h = hint(puzzle, placements)
    expect(h.kind).toBe('place')
    if (h.kind !== 'place') return
    expect(h.pieceId).not.toBe('A')
    expect(canPlace(puzzle, placements, h.pieceId, h.at)).toBe(true)
  })

  it('points out a piece that can never be part of a solution where it is', () => {
    // F lying across the middle of the bottom row leaves the corners impossible to fill.
    const placements = place({}, 'F', { row: 4, col: 1, rotated: false })
    expect(hint(puzzle, placements)).toEqual({ kind: 'rethink', pieceId: 'F' })
  })

  it('ignores pieces that overlap, since those are still being tried', () => {
    let placements = place({}, 'A', { row: 0, col: 0, rotated: false })
    placements = place(placements, 'B', { row: 1, col: 1, rotated: false }) // overlaps A
    expect(hint(puzzle, placements).kind).toBe('place')
  })
})

describe('solutionKey', () => {
  it('is the same whatever order the pieces were put down in', () => {
    const a = place(place({}, 'A', { row: 0, col: 0, rotated: false }), 'F', { row: 4, col: 2, rotated: true })
    const b = place(place({}, 'F', { row: 4, col: 2, rotated: true }), 'A', { row: 0, col: 0, rotated: false })
    expect(solutionKey(a)).toBe(solutionKey(b))
  })
  it('turns back into the same placements', () => {
    const placements = place(place({}, 'A', { row: 0, col: 0, rotated: false }), 'F', { row: 4, col: 2, rotated: true })
    expect(parseSolutionKey(solutionKey(placements))).toEqual(placements)
  })
})
