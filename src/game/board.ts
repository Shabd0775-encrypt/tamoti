// The "verbs" of the game: the rules. Every function here is pure, meaning it
// only reads its inputs and returns a result, never changing anything else.
// That makes the rules easy to test without a screen.
//
// Pieces may be put down anywhere on the board, even on top of each other or
// on a blocked square, so the player can try things out freely. Overlaps are
// allowed while playing; the puzzle is only solved once there are none.

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

function rectOf(puzzle: Puzzle, pieceId: string, at: Placement): Rect {
  return { row: at.row, col: at.col, ...footprint(findPiece(puzzle, pieceId), at.rotated) }
}

function forEachCell(rect: Rect, visit: (row: number, col: number) => void) {
  for (let r = rect.row; r < rect.row + rect.h; r++) {
    for (let c = rect.col; c < rect.col + rect.w; c++) visit(r, c)
  }
}

/**
 * A size × size map of what fills each cell. Where pieces overlap, the one on
 * top wins. Pass `ignoreId` to leave one piece out, which is how a piece
 * that's being moved stops getting in its own way.
 */
export function occupancy(puzzle: Puzzle, placements: Placements, ignoreId?: string): CellContent[][] {
  const grid: CellContent[][] = Array.from({ length: puzzle.size }, () => Array<CellContent>(puzzle.size).fill(null))
  for (const rect of puzzle.blocked) forEachCell(rect, (r, c) => (grid[r][c] = 'blocked'))
  for (const [pieceId, at] of Object.entries(placements)) {
    if (pieceId === ignoreId) continue
    forEachCell(rectOf(puzzle, pieceId, at), (r, c) => (grid[r][c] = pieceId))
  }
  return grid
}

/** True when the piece lies fully on the board (whatever it covers). */
export function onBoard(puzzle: Puzzle, pieceId: string, at: Placement): boolean {
  const { w, h } = footprint(findPiece(puzzle, pieceId), at.rotated)
  return at.row >= 0 && at.col >= 0 && at.row + h <= puzzle.size && at.col + w <= puzzle.size
}

/** True when the piece would sit fully on the board, covering only empty cells: a clean fit. */
export function canPlace(puzzle: Puzzle, placements: Placements, pieceId: string, at: Placement): boolean {
  if (!onBoard(puzzle, pieceId, at)) return false
  const grid = occupancy(puzzle, placements, pieceId)
  let clean = true
  forEachCell(rectOf(puzzle, pieceId, at), (r, c) => {
    if (grid[r][c] !== null) clean = false
  })
  return clean
}

/**
 * Where pieces are doubled up: every cell covered by two or more pieces, or
 * by a piece lying on a blocked square, and which pieces are involved.
 */
export function clashes(puzzle: Puzzle, placements: Placements): { cells: Rect[]; pieces: Set<string> } {
  const blocked = occupancy(puzzle, {})
  const covering: string[][][] = Array.from({ length: puzzle.size }, () =>
    Array.from({ length: puzzle.size }, () => [] as string[]),
  )
  for (const [pieceId, at] of Object.entries(placements)) {
    forEachCell(rectOf(puzzle, pieceId, at), (r, c) => covering[r][c].push(pieceId))
  }

  const cells: Rect[] = []
  const pieces = new Set<string>()
  covering.forEach((row, r) =>
    row.forEach((ids, c) => {
      if (ids.length > 1 || (ids.length === 1 && blocked[r][c] === 'blocked')) {
        cells.push({ row: r, col: c, w: 1, h: 1 })
        for (const id of ids) pieces.add(id)
      }
    }),
  )
  return { cells, pieces }
}

/**
 * Returns new placements with the piece put down (or moved). It goes on top
 * of the pile, so the piece you touched last is the one you see.
 * The old placements are left untouched.
 */
export function place(placements: Placements, pieceId: string, at: Placement): Placements {
  const { [pieceId]: _previous, ...rest } = placements
  return { ...rest, [pieceId]: at }
}

/** Returns new placements with the piece sent back to the tray. */
export function remove(placements: Placements, pieceId: string): Placements {
  const { [pieceId]: _removed, ...rest } = placements
  return rest
}

/**
 * A placed piece turned a quarter about its own centre, so it stays where it
 * was rather than swinging off to one side. If turning would poke it over an
 * edge, it's nudged back onto the board.
 */
export function turnInPlace(puzzle: Puzzle, pieceId: string, at: Placement): Placement {
  const before = footprint(findPiece(puzzle, pieceId), at.rotated)
  const after = footprint(findPiece(puzzle, pieceId), !at.rotated)
  const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max)
  return {
    row: clamp(Math.round(at.row + (before.h - after.h) / 2), puzzle.size - after.h),
    col: clamp(Math.round(at.col + (before.w - after.w) / 2), puzzle.size - after.w),
    rotated: !at.rotated,
  }
}

/** Solved when every open cell is covered exactly once, and nothing lies on a blocked square. */
export function isSolved(puzzle: Puzzle, placements: Placements): boolean {
  const filled = occupancy(puzzle, placements).every((row) => row.every((cell) => cell !== null))
  return filled && clashes(puzzle, placements).cells.length === 0
}
