// Tests for how moves change the game: overlaps are allowed, and placed pieces always turn.

import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../game/types'
import { gameReducer, newGame } from './gameReducer'

const puzzle: Puzzle = {
  size: 4,
  blocked: [],
  pieces: [
    { id: 'A', w: 2, h: 1 },
    { id: 'B', w: 3, h: 1 },
  ],
}

describe('gameReducer', () => {
  it('lets a piece go down on top of another', () => {
    let state = gameReducer(newGame(puzzle), { type: 'place', pieceId: 'A', at: { row: 0, col: 0, rotated: false } })
    state = gameReducer(state, { type: 'place', pieceId: 'B', at: { row: 0, col: 1, rotated: false } })
    expect(Object.keys(state.placements)).toEqual(['A', 'B'])
  })

  it('refuses a spot that hangs off the board', () => {
    const state = gameReducer(newGame(puzzle), { type: 'place', pieceId: 'B', at: { row: 0, col: 2, rotated: false } })
    expect(state.placements).toEqual({})
  })

  it('always turns a placed piece, even when it would cover another', () => {
    let state = gameReducer(newGame(puzzle), { type: 'place', pieceId: 'A', at: { row: 1, col: 0, rotated: false } })
    state = gameReducer(state, { type: 'place', pieceId: 'B', at: { row: 0, col: 0, rotated: false } })
    state = gameReducer(state, { type: 'rotate', pieceId: 'B' })
    expect(state.placements.B.rotated).toBe(true)
  })

  it('can undo a turn', () => {
    let state = gameReducer(newGame(puzzle), { type: 'place', pieceId: 'B', at: { row: 0, col: 0, rotated: false } })
    state = gameReducer(state, { type: 'rotate', pieceId: 'B' })
    state = gameReducer(state, { type: 'undo' })
    expect(state.placements.B).toEqual({ row: 0, col: 0, rotated: false })
  })
})
