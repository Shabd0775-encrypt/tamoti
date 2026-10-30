// Hints, worked out by the solver. Two kinds, both gentle:
//
//   place:  the pieces you've put down can still be part of a solution, so
//           here is one more piece, in a spot that keeps that true;
//   rethink: they can't, and this is the piece that's in the way.
//
// Pieces that overlap are left out of the reckoning: you're still trying
// those, so they don't count as decisions yet.

import { clashes, footprint, occupancy } from './board'
import { countSolutions } from './difficulty'
import type { Placement, Placements, Puzzle } from './types'

export type Hint =
  { kind: 'place'; pieceId: string; at: Placement } | { kind: 'rethink'; pieceId: string } | { kind: 'none' }

/** Enough search for any board in the library without making the page wait long. */
const MAX_STEPS = 400_000

/** The placements that are decisions: everything on the board that doesn't overlap something. */
function settled(puzzle: Puzzle, placements: Placements): Placements {
  const { pieces } = clashes(puzzle, placements)
  return Object.fromEntries(Object.entries(placements).filter(([id]) => !pieces.has(id)))
}

export function hint(puzzle: Puzzle, placements: Placements): Hint {
  const fixed = settled(puzzle, placements)
  const { first: solution } = countSolutions(puzzle, 1, MAX_STEPS, fixed)

  if (solution) {
    // Of the pieces still to settle, suggest the one that fills the first empty square,
    // reading left to right, top to bottom: the same order the player is likely working in.
    const grid = occupancy(puzzle, fixed)
    const loose = Object.entries(solution).filter(([id]) => !fixed[id])
    if (loose.length === 0) return { kind: 'none' }
    const firstEmpty = grid.flat().findIndex((cell) => cell === null)
    const covers = ([id, at]: [string, Placement]) => {
      const piece = puzzle.pieces.find((p) => p.id === id)!
      const { w, h } = footprint(piece, at.rotated)
      const row = Math.floor(firstEmpty / puzzle.size)
      const col = firstEmpty % puzzle.size
      return row >= at.row && row < at.row + h && col >= at.col && col < at.col + w
    }
    const [pieceId, at] = loose.find(covers) ?? loose[0]
    return { kind: 'place', pieceId, at }
  }

  // No solution keeps every settled piece where it is. Find one whose removal opens a way,
  // trying the most recently placed first: that's usually the one still being thought about.
  const ids = Object.keys(fixed).reverse()
  for (const id of ids) {
    const { [id]: _without, ...rest } = fixed
    if (countSolutions(puzzle, 1, MAX_STEPS, rest).first) {
      return { kind: 'rethink', pieceId: id }
    }
  }
  return ids.length > 0 ? { kind: 'rethink', pieceId: ids[0] } : { kind: 'none' }
}

/**
 * A solution written as text, so two solutions can be compared and saved:
 * each piece's id and spot, in a fixed order. Every piece in a set has its
 * own shape, so this names one way of filling the board exactly.
 */
export function solutionKey(placements: Placements): string {
  return Object.entries(placements)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, at]) => `${id}${at.row},${at.col}${at.rotated ? 'r' : ''}`)
    .join(' ')
}

/** Turns a key from solutionKey back into placements, to draw a way you found. */
export function parseSolutionKey(key: string): Placements {
  return Object.fromEntries(
    key.split(' ').map((part) => {
      const [, id, row, col, r] = part.match(/^([A-Za-z]+)(\d+),(\d+)(r?)$/)!
      return [id, { row: Number(row), col: Number(col), rotated: r === 'r' }]
    }),
  )
}
