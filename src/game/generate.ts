// Making puzzles.
//
// Every board size has one fixed set of pieces, all different shapes, and a
// few blockers. A puzzle is just a choice of where the blockers sit.
//
// To find blocker spots that are guaranteed to work, we go backwards: fill an
// empty board with the pieces *and* the blockers in a random arrangement, then
// keep only where the blockers landed. Then we count how many ways the pieces
// can fill the rest. Fewer ways means a sharper puzzle.

import { solve } from './solve'
import type { Piece, Puzzle, Rect } from './types'

/** A shape as width × height, written as [w, h]. */
type Shape = [number, number]

/**
 * The pieces for each board size. An N×N board has exactly N pieces, and no
 * two share a shape. These sets were picked by testing many candidates and
 * keeping the ones that gave the most puzzles with only a few solutions.
 */
export const pieceSets: Record<number, Shape[]> = {
  5: [
    [1, 3],
    [1, 4],
    [1, 5],
    [2, 2],
    [2, 3],
  ],
  6: [
    [1, 3],
    [1, 4],
    [1, 5],
    [2, 2],
    [2, 4],
    [3, 3],
  ],
  7: [
    [1, 4],
    [1, 5],
    [1, 6],
    [1, 7],
    [2, 2],
    [2, 4],
    [3, 3],
  ],
  8: [
    [1, 4],
    [1, 5],
    [1, 6],
    [2, 2],
    [2, 4],
    [2, 5],
    [3, 3],
    [3, 4],
  ],
  9: [
    [1, 4],
    [1, 6],
    [1, 7],
    [1, 8],
    [2, 2],
    [2, 5],
    [3, 3],
    [3, 4],
    [3, 5],
  ],
  10: [
    [1, 5],
    [1, 6],
    [1, 7],
    [1, 9],
    [2, 2],
    [2, 5],
    [2, 8],
    [3, 3],
    [3, 4],
    [4, 4],
  ],
}

/** Blockers: small boards get two, bigger boards three. */
export function blockerShapes(size: number): Shape[] {
  return size <= 6
    ? [
        [1, 1],
        [1, 2],
      ]
    : [
        [1, 1],
        [1, 2],
        [1, 3],
      ]
}

/** The pieces for a board size, biggest first, lettered A, B, C... Each starts lying flat. */
export function piecesFor(size: number): Piece[] {
  return [...pieceSets[size]]
    .sort(([aw, ah], [bw, bh]) => bw * bh - aw * ah || aw - bw)
    .map(([a, b], i) => ({ id: String.fromCharCode(65 + i), w: Math.max(a, b), h: Math.min(a, b) }))
}

/** Random blocker spots that the pieces can definitely fill around, or null if this attempt got stuck. */
export function randomBlockers(size: number, random: () => number): Rect[] | null {
  const blockers = blockerShapes(size).map(([w, h], i) => ({ id: `blocker-${i}`, w, h }))
  const everything: Puzzle = { size, blocked: [], pieces: [...piecesFor(size), ...blockers] }
  const { first } = solve(everything, { maxSolutions: 1, maxSteps: 5000, random })
  if (!first) return null

  return blockers.map(({ id, w, h }) => {
    const at = first[id]
    return at.rotated ? { row: at.row, col: at.col, w: h, h: w } : { row: at.row, col: at.col, w, h }
  })
}

/**
 * A key that's the same for a layout and its mirror images and rotations,
 * so the library never holds the same puzzle twice in disguise.
 */
export function layoutKey(size: number, blocked: Rect[]): string {
  const grid = Array.from({ length: size }, () => Array<number>(size).fill(0))
  for (const rect of blocked) {
    for (let r = rect.row; r < rect.row + rect.h; r++) {
      for (let c = rect.col; c < rect.col + rect.w; c++) grid[r][c] = rect.w * rect.h
    }
  }
  const last = size - 1
  const views: Array<(r: number, c: number) => number> = [
    (r, c) => grid[r][c],
    (r, c) => grid[c][last - r],
    (r, c) => grid[last - r][last - c],
    (r, c) => grid[last - c][r],
    (r, c) => grid[r][last - c],
    (r, c) => grid[last - r][c],
    (r, c) => grid[c][r],
    (r, c) => grid[last - c][last - r],
  ]
  return views
    .map((view) => Array.from({ length: size * size }, (_, i) => view(Math.floor(i / size), i % size)).join(''))
    .sort()[0]
}

export type Rated = {
  blocked: Rect[]
  solutions: number
  /** Higher is harder. Based on how much searching it takes per solution. */
  difficulty: number
}

/** Counts solutions and rates difficulty. Returns null for layouts with too many solutions. */
export function rate(size: number, blocked: Rect[], maxSolutions: number): Rated | null {
  const result = solve(
    { size, blocked, pieces: piecesFor(size) },
    { maxSolutions: maxSolutions + 1, maxSteps: 2_000_000 },
  )
  if (!result.finished || result.solutions === 0 || result.solutions > maxSolutions) return null
  return { blocked, solutions: result.solutions, difficulty: Math.log2(result.steps + 1) - Math.log2(result.solutions) }
}
