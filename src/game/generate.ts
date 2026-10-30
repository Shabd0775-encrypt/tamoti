// Making puzzles.
//
// Every board size has one fixed set of pieces, all different shapes, and a
// few blockers. A puzzle is just a choice of where the blockers sit.
//
// Blockers are dropped in tough spots (away from the edge, not touching each
// other), then the solver checks the pieces can still fill the rest, and
// counts how many ways (fewer is sharper). Each good layout is then rated
// for how hard it is for a person to solve.

import { countSolutions, reasoning } from './difficulty'
import type { Piece, Rect } from './types'

/** A shape as width × height, written as [w, h]. */
export type Shape = [number, number]

/**
 * The pieces for each board size, all different shapes and none as long as
 * the board. Found by scripts/find-piece-sets.ts: of many candidate sets,
 * these gave the hardest boards when blockers sit in tough spots. Smaller,
 * more numerous pieces are what let a board be filled around blockers in
 * the middle, and more pieces also means more ways to go wrong.
 */
export const pieceSets: Record<number, Shape[]> = {
  // 5×5 keeps its original set: on so small a board it gives the most boards, and the hardest ones.
  5: [
    [1, 3],
    [1, 4],
    [1, 5],
    [2, 2],
    [2, 3],
  ],
  6: [
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 2],
    [1, 5],
    [2, 3],
    [2, 4],
  ],
  7: [
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 2],
    [1, 5],
    [2, 3],
    [2, 4],
    [3, 4],
  ],
  8: [
    [1, 2],
    [1, 3],
    [2, 2],
    [1, 4],
    [1, 5],
    [2, 3],
    [1, 6],
    [1, 7],
    [3, 3],
    [3, 4],
  ],
  9: [
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 2],
    [1, 5],
    [1, 6],
    [2, 4],
    [3, 3],
    [2, 5],
    [2, 6],
    [3, 4],
  ],
  10: [
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 2],
    [1, 5],
    [2, 3],
    [1, 6],
    [1, 7],
    [2, 4],
    [3, 3],
    [3, 4],
    [2, 6],
    [3, 5],
  ],
}

/**
 * How the blocked squares are split up. The total is fixed by the piece set:
 * every square no piece covers is blocked. Many small blockers are harder
 * than a few big ones, since each single square carves an awkward pocket, so
 * most are single squares, sometimes with one pair. Each layout picks one
 * of these splits at random.
 */
export function blockerSplits(area: number): Shape[][] {
  const singles = (count: number): Shape[] => Array.from({ length: count }, () => [1, 1] as Shape)
  return area >= 3 ? [singles(area), singles(area), [...singles(area - 2), [1, 2]]] : [singles(area)]
}

/** The number of squares on a board that no piece covers. */
export function blockedArea(size: number, shapes: Shape[] = pieceSets[size]): number {
  return size * size - shapes.reduce((sum, [w, h]) => sum + w * h, 0)
}

/** The pieces for a board size, biggest first, lettered A, B, C... Each starts lying flat. */
export function piecesFor(size: number): Piece[] {
  return piecesFrom(pieceSets[size])
}

/** Shapes made into pieces: biggest first, lettered A, B, C..., each lying flat. */
export function piecesFrom(shapes: Shape[]): Piece[] {
  return [...shapes]
    .sort(([aw, ah], [bw, bh]) => bw * bh - aw * ah || aw - bw)
    .map(([a, b], i) => ({ id: String.fromCharCode(65 + i), w: Math.max(a, b), h: Math.min(a, b) }))
}

/**
 * How much of the blocked area may lie on the board's edge. Big boards need
 * some big pieces (every piece is a different shape), and big pieces can't
 * get round a blocked square in the middle, so they allow a little more.
 */
export function edgeShareFor(size: number): number {
  return size <= 7 ? 0.5 : 0.75
}

/**
 * Whether blockers sit in tough spots:
 *   - none in a corner, where a blocker only rounds off the board;
 *   - only some blocked squares on the edge (see edgeShareFor), so most
 *     carve pockets out of the middle instead of trimming the border;
 *   - no two blockers touching, even at a corner, since touching ones merge
 *     into one simpler shape.
 */
export function toughPositions(size: number, blocked: Rect[], edgeShare = edgeShareFor(size)): boolean {
  // 5×5 is too small for the rest: with its few blocked squares kept apart and inside, no board can be
  // filled at all. There, only corners are ruled out, and the hardest of every possible board are chosen.
  const smallest = size <= 5
  const cells = (r: Rect) => {
    const list: Array<[number, number]> = []
    for (let row = r.row; row < r.row + r.h; row++)
      for (let col = r.col; col < r.col + r.w; col++) list.push([row, col])
    return list
  }
  const last = size - 1
  const all = blocked.flatMap(cells)
  if (all.some(([r, c]) => (r === 0 || r === last) && (c === 0 || c === last))) return false
  if (smallest) return true
  const onEdge = all.filter(([r, c]) => r === 0 || c === 0 || r === last || c === last).length
  if (onEdge > all.length * edgeShare) return false

  for (let a = 0; a < blocked.length; a++) {
    for (let b = a + 1; b < blocked.length; b++) {
      for (const [r1, c1] of cells(blocked[a])) {
        for (const [r2, c2] of cells(blocked[b])) {
          if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) return false
        }
      }
    }
  }
  return true
}

/** How far into the middle the blocked squares sit, from 0 (all on the edge) to 1 (all at the centre). */
export function inwardness(size: number, blocked: Rect[]): number {
  let total = 0
  let count = 0
  for (const r of blocked) {
    for (let row = r.row; row < r.row + r.h; row++) {
      for (let col = r.col; col < r.col + r.w; col++) {
        total += Math.min(row, col, size - 1 - row, size - 1 - col)
        count++
      }
    }
  }
  return count ? total / count / ((size - 1) / 2) : 0
}

/**
 * Random blocker spots in tough positions: each blocker is dropped at a
 * random spot that keeps to the tough-position rules. Whether the
 * pieces can still fill the rest is checked afterwards, by `rate`.
 * Returns null if the blockers couldn't all be fitted in.
 */
export function randomBlockers(
  size: number,
  random: () => number,
  area = blockedArea(size),
  edgeShare = edgeShareFor(size),
): Rect[] | null {
  const splits = blockerSplits(area)
  const split = splits[Math.floor(random() * splits.length)]
  const blocked: Rect[] = []
  for (const [a, b] of split) {
    const [w, h] = random() < 0.5 ? [a, b] : [b, a]
    let placed = false
    for (let attempt = 0; attempt < 60 && !placed; attempt++) {
      const row = Math.floor(random() * (size - h + 1))
      const col = Math.floor(random() * (size - w + 1))
      const next = [...blocked, { row, col, w, h }]
      if (toughPositions(size, next, edgeShare)) {
        blocked.push({ row, col, w, h })
        placed = true
      }
    }
    if (!placed) return null
  }
  return blocked
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
  /**
   * Higher is harder, measured the way a person solves (see difficulty.ts):
   * how much guessing the board needs, how few pieces are forced at the
   * start, and a little for blockers that sit far into the middle.
   */
  difficulty: number
}

/** Counts solutions and rates difficulty. Returns null for layouts with too many solutions. */
export function rate(size: number, blocked: Rect[], maxSolutions: number, pieces = piecesFor(size)): Rated | null {
  const puzzle = { size, blocked, pieces }
  const result = countSolutions(puzzle, maxSolutions + 1)
  if (!result.finished || result.solutions === 0 || result.solutions > maxSolutions) return null
  const thinking = reasoning(puzzle)
  if (!thinking) return null
  const difficulty =
    thinking.guessing +
    2 * (1 - thinking.forcedAtStart) +
    0.6 * inwardness(size, blocked) -
    0.4 * (result.solutions - 1)
  return { blocked, solutions: result.solutions, difficulty }
}
