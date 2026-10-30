// How hard a board is for a person, not for a computer.
//
// A person solving these mostly makes forced moves: "this long piece only
// fits in one place", or "this square can only be reached by one piece".
// When there are no forced moves left, they have to try something and see,
// which is where a puzzle gets hard.
//
// This solver works the same way. It makes every forced move it can, and only
// when stuck does it guess, at the square with the fewest choices. The score
// is how much guessing it took to reach a solution: each guess between k
// choices counts log₂(k), so a 50:50 guess is 1 and a 1-in-4 guess is 2.
// A board solved by forced moves alone scores 0.

import type { Piece, Placement, Placements, Puzzle } from './types'

type Spot = { id: string; cells: number[] }

/** Every place each piece could lie on the empty board, both ways round, as lists of cell numbers. */
function allSpots(puzzle: Puzzle, blocked: Set<number>): Map<string, Spot[]> {
  const n = puzzle.size
  const spots = new Map<string, Spot[]>()
  for (const piece of puzzle.pieces) {
    const turns: Array<[number, number]> =
      piece.w === piece.h
        ? [[piece.w, piece.h]]
        : [
            [piece.w, piece.h],
            [piece.h, piece.w],
          ]
    const list: Spot[] = []
    for (const [w, h] of turns) {
      for (let row = 0; row + h <= n; row++) {
        for (let col = 0; col + w <= n; col++) {
          const cells: number[] = []
          for (let r = row; r < row + h; r++) for (let c = col; c < col + w; c++) cells.push(r * n + c)
          if (cells.every((cell) => !blocked.has(cell))) list.push({ id: piece.id, cells })
        }
      }
    }
    spots.set(piece.id, list)
  }
  return spots
}

export type Reasoning = {
  /** Bits of guessing on the way to a solution (0 means forced moves alone were enough). */
  guessing: number
  /** How many separate times the solver had to guess. */
  guesses: number
  /** The share of pieces placed by forced moves before the first guess, 0 to 1. */
  forcedAtStart: number
}

export function reasoning(puzzle: Puzzle): Reasoning | null {
  const n = puzzle.size
  const blocked = new Set<number>()
  for (const r of puzzle.blocked) {
    for (let row = r.row; row < r.row + r.h; row++)
      for (let col = r.col; col < r.col + r.w; col++) blocked.add(row * n + col)
  }
  const spots = allSpots(puzzle, blocked)
  const open = Array.from({ length: n * n }, (_, i) => i).filter((i) => !blocked.has(i))
  let forcedAtStart = -1

  /** Returns the guessing needed to solve from here, or null if this position has no solution. */
  function solveFrom(
    filled: Set<number>,
    left: Piece[],
    guessesSoFar: number,
  ): { bits: number; guesses: number } | null {
    filled = new Set(filled)
    left = [...left]
    const fits = (s: Spot) => s.cells.every((c) => !filled.has(c))
    const place = (s: Spot) => {
      for (const c of s.cells) filled.add(c)
      left = left.filter((p) => p.id !== s.id)
    }

    // Forced moves, until there are none.
    for (;;) {
      if (left.length === 0) return { bits: 0, guesses: 0 }
      let forced: Spot | null = null
      const options = new Map<string, Spot[]>()
      for (const p of left) {
        const here = spots.get(p.id)!.filter(fits)
        if (here.length === 0) return null
        options.set(p.id, here)
        if (here.length === 1) forced = here[0]
      }
      if (!forced) {
        for (const cell of open) {
          if (filled.has(cell)) continue
          const covering = left.flatMap((p) => options.get(p.id)!.filter((s) => s.cells.includes(cell)))
          if (covering.length === 0) return null
          if (covering.length === 1) {
            forced = covering[0]
            break
          }
        }
      }
      if (!forced) break
      place(forced)
    }

    if (forcedAtStart < 0) forcedAtStart = 1 - left.length / puzzle.pieces.length

    // Stuck: guess at the open square with the fewest ways to fill it.
    let best: Spot[] | null = null
    for (const cell of open) {
      if (filled.has(cell)) continue
      const covering = left.flatMap((p) => spots.get(p.id)!.filter((s) => fits(s) && s.cells.includes(cell)))
      if (!best || covering.length < best.length) best = covering
    }
    if (!best || best.length === 0) return null
    if (guessesSoFar > 40) return null // far too deep for a person; treat as no clean answer

    for (const choice of best) {
      const next = new Set(filled)
      for (const c of choice.cells) next.add(c)
      const result = solveFrom(
        next,
        left.filter((p) => p.id !== choice.id),
        guessesSoFar + 1,
      )
      if (result) return { bits: result.bits + Math.log2(best.length), guesses: result.guesses + 1 }
    }
    return null
  }

  const result = solveFrom(new Set(), puzzle.pieces, 0)
  if (!result) return null
  return { guessing: result.bits, guesses: result.guesses, forcedAtStart: forcedAtStart < 0 ? 1 : forcedAtStart }
}

/**
 * Counts the ways to fill a board, stopping once it has found `cap` of them.
 * This is the fast counter used when building the library. Like a careful
 * person, it always works on the tightest spot: the piece with the fewest
 * places left to go, or the open square with the fewest pieces that can
 * reach it, whichever is tighter. If that's one, the move is forced; if
 * none, it's a dead end. Every solution places that piece (or covers that
 * square) in exactly one way, so trying each way in turn counts every
 * solution exactly once.
 *
 * `finished` is false if it gave up after `maxSteps`. `first` is the first
 * solution found. Pieces in `fixed` stay where they are.
 */
export function countSolutions(
  puzzle: Puzzle,
  cap: number,
  maxSteps = 300_000,
  fixed: Placements = {},
): { solutions: number; finished: boolean; first?: Placements } {
  const n = puzzle.size
  const filled = new Uint8Array(n * n)
  for (const r of puzzle.blocked) {
    for (let row = r.row; row < r.row + r.h; row++) {
      for (let col = r.col; col < r.col + r.w; col++) filled[row * n + col] = 1
    }
  }
  const blocked = new Set<number>()
  filled.forEach((v, i) => v && blocked.add(i))
  const spots = allSpots(puzzle, blocked)
  const ids = puzzle.pieces.map((p) => p.id)
  type Option = { piece: number; cells: number[]; key: string }
  // Every spot, listed by piece and by each square it covers.
  const byPiece: Option[][] = ids.map((id, piece) =>
    spots.get(id)!.map((spot) => ({ piece, cells: spot.cells, key: spot.cells.join(',') })),
  )
  // Pieces that share their shape with another. Swapping two of them gives the same picture, so it
  // mustn't count as a new solution: they're only ever placed square by square (below), never piece first.
  const twin = puzzle.pieces.map((p, i) =>
    puzzle.pieces.some(
      (q, j) => j !== i && Math.min(p.w, p.h) === Math.min(q.w, q.h) && Math.max(p.w, p.h) === Math.max(q.w, q.h),
    ),
  )
  const covering: Option[][] = Array.from({ length: n * n }, () => [])
  for (const options of byPiece) for (const o of options) for (const cell of o.cells) covering[cell].push(o)

  const used = new Uint8Array(ids.length)
  // Pieces fixed in place: their squares are taken, and they aren't placed again.
  for (const [id, at] of Object.entries(fixed)) {
    const piece = ids.indexOf(id)
    const { w, h } = at.rotated ? { w: puzzle.pieces[piece].h, h: puzzle.pieces[piece].w } : puzzle.pieces[piece]
    for (let row = at.row; row < at.row + h; row++)
      for (let col = at.col; col < at.col + w; col++) filled[row * n + col] = 1
    used[piece] = 1
  }
  const startPlaced = Object.keys(fixed).length
  const chosen: Option[] = []
  let first: Placements | undefined
  /** An option back as a placement: its top-left square, and whether it's turned. */
  const toPlacement = (o: Option): Placement => {
    const top = Math.min(...o.cells)
    const across = new Set(o.cells.map((c) => c % n)).size
    return { row: Math.floor(top / n), col: top % n, rotated: across !== puzzle.pieces[o.piece].w }
  }
  let solutions = 0
  let steps = 0
  let gaveUp = false

  /** A spot is open if its piece is still to place and all its squares are empty. */
  const open = (o: Option) => {
    if (used[o.piece]) return false
    for (const c of o.cells) if (filled[c]) return false
    return true
  }
  /** How many of these spots are open, counting no further than `limit`. */
  const countOpen = (options: Option[], limit: number) => {
    let count = 0
    for (const o of options) if (open(o) && ++count >= limit) break
    return count
  }

  const search = (placed: number) => {
    if (solutions >= cap || gaveUp) return
    if (placed === ids.length) {
      solutions++
      first ??= { ...fixed, ...Object.fromEntries(chosen.map((o) => [ids[o.piece], toPlacement(o)])) }
      return
    }
    if (++steps > maxSteps) {
      gaveUp = true
      return
    }
    let choices: Option[] | null = null
    let fewest = Infinity
    for (let p = 0; p < ids.length && fewest > 1; p++) {
      if (used[p] || twin[p]) continue
      const count = countOpen(byPiece[p], fewest)
      if (count === 0) return // a piece with nowhere to go: dead end
      if (count < fewest) {
        fewest = count
        choices = byPiece[p]
      }
    }
    for (let cell = 0; cell < n * n && fewest > 1; cell++) {
      if (filled[cell]) continue
      const count = countOpen(covering[cell], fewest)
      if (count === 0) return // a square nothing can fill: dead end
      if (count < fewest) {
        fewest = count
        choices = covering[cell]
      }
    }
    if (!choices) return
    const tried = new Set<string>() // the same squares, by a twin piece, would only repeat a solution
    for (const o of choices) {
      if (!open(o) || tried.has(o.key)) continue
      tried.add(o.key)
      for (const c of o.cells) filled[c] = 1
      used[o.piece] = 1
      chosen.push(o)
      search(placed + 1)
      chosen.pop()
      used[o.piece] = 0
      for (const c of o.cells) filled[c] = 0
      if (solutions >= cap || gaveUp) return
    }
  }

  search(startPlaced)
  return { solutions, finished: !gaveUp, first }
}
