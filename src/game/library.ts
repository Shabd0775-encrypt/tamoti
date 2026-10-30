// The puzzle library, built ahead of time by scripts/build-library.ts.

import data from './library.json'
import type { Piece, Puzzle, Rect } from './types'

export type Tier = 'gentle' | 'steady' | 'tricky' | 'deep'

export type LibraryPuzzle = {
  number: number
  tier: Tier
  blocked: Rect[]
  /** How many different ways there are to fill it. */
  solutions: number
  /** How hard it is for a person, from the human-style rating (see difficulty.ts). Higher is harder. */
  difficulty?: number
}

export type Library = {
  sizes: Record<number, { pieces: Piece[]; puzzles: LibraryPuzzle[] }>
}

export const library = data as Library

export const sizes = Object.keys(library.sizes).map(Number)

export const tierNames: Record<Tier, string> = {
  gentle: 'Gentle',
  steady: 'Steady',
  tricky: 'Tricky',
  deep: 'Deep',
}

/** A puzzle's id, used in links and saved progress: "8-12" is 8×8, number 12. */
export const puzzleId = (size: number, number: number) => `${size}-${number}`

export function findPuzzle(id: string): (LibraryPuzzle & { size: number; puzzle: Puzzle }) | null {
  const [size, number] = id.split('-').map(Number)
  const entry = library.sizes[size]?.puzzles.find((p) => p.number === number)
  if (!entry) return null
  return { ...entry, size, puzzle: { size, blocked: entry.blocked, pieces: library.sizes[size].pieces } }
}
