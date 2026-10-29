// The "verbs" of the game: the rules. Every function here is pure, meaning it
// only reads its inputs and returns a result, never changing anything else.
// That makes the rules easy to test without a screen.

import type { CellContent, Piece, Placement, Placements, Puzzle, Rect } from './types'

/** The width and height a piece takes up on the board, given its rotation. */
export function footprint(piece: Piece, rotated: boolean): { w: number; h: number } {
  return rotated ? { w: piece.h, h: piece.w } : { w: piece.w, h: piece.h }
}

function findPiece(puzzle: Puzzle, pieceId: string): Piece {
  const piece = puzzle.pieces.find((p) => p.id === pieceId)
  if (!piece) throw new Error(`Unknown piece: ${pieceId}`)
  return piece
}

/**
 * A size × size map of what fills each cell. Pass `ignoreId` to leave one
 * piece out, which is how a piece that's being moved stops blocking itself.
 */
export function occupancy(puzzle: Puzzle, placements: Placements, ignoreId?: string): CellContent[][] {
  const grid: CellContent[][] = Array.from({ length: puzzle.size }, () =>
    Array<CellContent>(puzzle.size).fill(null),
  )
  const fill = (rect: Rect, value: CellContent) => {
    for (let r = rect.row; r < rect.row + rect.h; r++) {
      for (let c = rect.col; c < rect.col + rect.w; c++) grid[r][c] = value
    }
  }

  for (const rect of puzzle.blocked) fill(rect, 'blocked')
  for (const [pieceId, at] of Object.entries(placements)) {
    if (pieceId === ignoreId) continue
    fill({ row: at.row, col: at.col, ...footprint(findPiece(puzzle, pieceId), at.rotated) }, pieceId)
  }
  return grid
}

/** True when the piece would sit fully on the board, covering only empty cells. */
export function canPlace(puzzle: Puzzle, placements: Placements, pieceId: string, at: Placement): boolean {
  const { w, h } = footprint(findPiece(puzzle, pieceId), at.rotated)
  if (at.row < 0 || at.col < 0 || at.row + h > puzzle.size || at.col + w > puzzle.size) return false

  const grid = occupancy(puzzle, placements, pieceId)
  for (let r = at.row; r < at.row + h; r++) {
    for (let c = at.col; c < at.col + w; c++) {
      if (grid[r][c] !== null) return false
    }
  }
  return true
}

/** Returns new placements with the piece put down (or moved). The old ones are left untouched. */
export function place(placements: Placements, pieceId: string, at: Placement): Placements {
  return { ...placements, [pieceId]: at }
}

/** Returns new placements with the piece sent back to the tray. */
export function remove(placements: Placements, pieceId: string): Placements {
  const { [pieceId]: _removed, ...rest } = placements
  return rest
}

/** Solved when no cell is left empty. */
export function isSolved(puzzle: Puzzle, placements: Placements): boolean {
  return occupancy(puzzle, placements).every((row) => row.every((cell) => cell !== null))
}
