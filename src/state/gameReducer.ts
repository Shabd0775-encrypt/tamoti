// All the ways the game can change, in one place.
//
// A reducer takes the current state and an "action" (a description of what
// the player did) and returns the next state. React calls it for us through
// `useReducer`. Keeping every change here means the screen code only ever
// says what happened, never how to update things.

import { canPlace, footprint, place, remove } from '../game/board'
import type { Placement, Placements, Puzzle } from '../game/types'

export type GameState = {
  puzzle: Puzzle
  placements: Placements
  /** Which tray pieces the player has turned sideways before placing them. */
  trayRotated: Record<string, boolean>
  /** Earlier placements, newest last, so moves can be undone. */
  history: Placements[]
}

export type GameAction =
  | { type: 'place'; pieceId: string; at: Placement }
  | { type: 'remove'; pieceId: string }
  | { type: 'rotate'; pieceId: string }
  | { type: 'undo' }
  | { type: 'reset' }
  | { type: 'load'; puzzle: Puzzle }

export function newGame(puzzle: Puzzle): GameState {
  return { puzzle, placements: {}, trayRotated: {}, history: [] }
}

/** Records the old placements in history and switches to the new ones. */
function commit(state: GameState, placements: Placements): GameState {
  return { ...state, placements, history: [...state.history, state.placements] }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'place': {
      if (!canPlace(state.puzzle, state.placements, action.pieceId, action.at)) return state
      const trayRotated = { ...state.trayRotated, [action.pieceId]: action.at.rotated }
      return { ...commit(state, place(state.placements, action.pieceId, action.at)), trayRotated }
    }

    case 'remove':
      if (!state.placements[action.pieceId]) return state
      return commit(state, remove(state.placements, action.pieceId))

    case 'rotate': {
      const placed = state.placements[action.pieceId]
      if (!placed) {
        const trayRotated = { ...state.trayRotated, [action.pieceId]: !state.trayRotated[action.pieceId] }
        return { ...state, trayRotated }
      }
      // On the board, turn the piece about its top-left corner, and only if it still fits.
      const turned = { ...placed, rotated: !placed.rotated }
      if (!canPlace(state.puzzle, state.placements, action.pieceId, turned)) return state
      return commit(state, place(state.placements, action.pieceId, turned))
    }

    case 'undo': {
      const previous = state.history.at(-1)
      if (!previous) return state
      return { ...state, placements: previous, history: state.history.slice(0, -1) }
    }

    case 'reset':
      return newGame(state.puzzle)

    case 'load':
      return newGame(action.puzzle)
  }
}

/** The size a piece currently shows at: its board rotation if placed, else its tray rotation. */
export function currentFootprint(state: GameState, pieceId: string) {
  const piece = state.puzzle.pieces.find((p) => p.id === pieceId)!
  const rotated = state.placements[pieceId]?.rotated ?? state.trayRotated[pieceId] ?? false
  return { ...footprint(piece, rotated), rotated }
}
