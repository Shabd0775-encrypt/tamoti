// A solver: finds every way to fill a puzzle, by trying things like a very
// patient person would.
//
// It always looks at the first empty cell (reading left to right, top to
// bottom). Whatever piece covers that cell must have its top-left corner
// there, because every cell before it is already full. So it tries each
// unused piece, both ways round, in that one spot. If a piece fits, it moves
// on to the next empty cell; if it gets stuck, it takes the piece back out
// and tries the next one. This is called backtracking.

import type { Placement, Placements, Puzzle } from './types'

export type SolveResult = {
  /** How many different solutions were found (stops counting at `maxSolutions`). */
  solutions: number
  /** How many dead ends and choices the search went through: a rough measure of difficulty. */
  steps: number
  /** False if the search gave up early because it hit `maxSteps`. */
  finished: boolean
  /** The first solution found, if any. */
  first?: Placements
}

type Options = {
  maxSolutions?: number
  maxSteps?: number
  /** Pieces already on the board that must stay where they are. */
  fixed?: Placements
  /** Pass a random number source to try pieces in a shuffled order, for varied solutions. */
  random?: () => number
}

export function solve(
  puzzle: Puzzle,
  { maxSolutions = Infinity, maxSteps = Infinity, fixed = {}, random }: Options = {},
): SolveResult {
  const n = puzzle.size
  const full = new Uint8Array(n * n) // 1 = covered, 0 = empty

  const fill = (row: number, col: number, w: number, h: number, value: 0 | 1) => {
    for (let r = row; r < row + h; r++) full.fill(value, r * n + col, r * n + col + w)
  }
  const fits = (row: number, col: number, w: number, h: number) => {
    if (row + h > n || col + w > n) return false
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) if (full[r * n + c]) return false
    }
    return true
  }

  for (const rect of puzzle.blocked) fill(rect.row, rect.col, rect.w, rect.h, 1)
  for (const [id, at] of Object.entries(fixed)) {
    const piece = puzzle.pieces.find((p) => p.id === id)!
    const [w, h] = at.rotated ? [piece.h, piece.w] : [piece.w, piece.h]
    fill(at.row, at.col, w, h, 1)
  }

  // Each loose piece with the ways it can be turned. A square only has one.
  const loose = puzzle.pieces
    .filter((p) => !fixed[p.id])
    .map((p) => ({
      id: p.id,
      turns: p.w === p.h ? [{ w: p.w, h: p.h, rotated: false }] : [
        { w: p.w, h: p.h, rotated: false },
        { w: p.h, h: p.w, rotated: true },
      ],
    }))
  const used = new Array<boolean>(loose.length).fill(false)
  const current: Placements = { ...fixed }

  let solutions = 0
  let steps = 0
  let first: Placements | undefined
  let gaveUp = false

  /** Returns true when the search should stop completely. */
  function search(from: number): boolean {
    let cell = from
    while (cell < n * n && full[cell]) cell++
    if (cell === n * n) {
      solutions++
      first ??= { ...current }
      return solutions >= maxSolutions
    }
    if (++steps > maxSteps) {
      gaveUp = true
      return true
    }

    const row = Math.floor(cell / n)
    const col = cell % n
    const triedHere = new Set<string>() // two identical pieces would only repeat the same work
    const order = random ? shuffled(loose.length, random) : loose.keys()
    for (const i of order) {
      if (used[i]) continue
      const turns = random && random() < 0.5 ? [...loose[i].turns].reverse() : loose[i].turns
      for (const turn of turns) {
        const shape = `${turn.w}x${turn.h}`
        if (triedHere.has(shape) || !fits(row, col, turn.w, turn.h)) continue
        triedHere.add(shape)

        fill(row, col, turn.w, turn.h, 1)
        used[i] = true
        current[loose[i].id] = { row, col, rotated: turn.rotated } satisfies Placement
        const stop = search(cell)
        delete current[loose[i].id]
        used[i] = false
        fill(row, col, turn.w, turn.h, 0)
        if (stop) return true
      }
    }
    return false
  }

  search(0)
  return { solutions, steps, finished: !gaveUp, first }
}

/** The numbers 0 to length - 1 in a random order. */
function shuffled(length: number, random: () => number): number[] {
  const list = Array.from({ length }, (_, i) => i)
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return list
}
