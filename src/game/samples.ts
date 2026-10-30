// A few hand-drawn puzzles to play with until the puzzle generator exists.
//
// Each puzzle is drawn as its own solution. A letter marks one piece, a digit
// marks one blocked area. Drawing the answer guarantees the puzzle can be solved.

import type { Piece, Placements, Puzzle, Rect } from './types'

/** Turns a drawing into a puzzle, plus the solution it was drawn from. */
export function parseLayout(art: string): { puzzle: Puzzle; solution: Placements } {
  const rows = art
    .trim()
    .split('\n')
    .map((line) => line.trim())
  const size = rows.length

  // Find the bounding box and cell count of every symbol.
  const boxes = new Map<string, { top: number; left: number; bottom: number; right: number; count: number }>()
  rows.forEach((line, r) => {
    if (line.length !== size) throw new Error(`Row ${r} should be ${size} wide: "${line}"`)
    ;[...line].forEach((symbol, c) => {
      const box = boxes.get(symbol)
      if (!box) {
        boxes.set(symbol, { top: r, left: c, bottom: r, right: c, count: 1 })
        return
      }
      box.top = Math.min(box.top, r)
      box.left = Math.min(box.left, c)
      box.bottom = Math.max(box.bottom, r)
      box.right = Math.max(box.right, c)
      box.count++
    })
  })

  const blocked: Rect[] = []
  const pieces: Piece[] = []
  const solution: Placements = {}

  for (const [symbol, box] of boxes) {
    const rect = { row: box.top, col: box.left, w: box.right - box.left + 1, h: box.bottom - box.top + 1 }
    if (rect.w * rect.h !== box.count) throw new Error(`"${symbol}" is not a filled rectangle`)

    if (/[0-9]/.test(symbol)) {
      blocked.push(rect)
    } else {
      pieces.push({ id: symbol, w: rect.w, h: rect.h })
      solution[symbol] = { row: rect.row, col: rect.col, rotated: false }
    }
  }

  // Biggest pieces first in the tray, so the drawing order gives nothing away.
  pieces.sort((a, b) => b.w * b.h - a.w * a.h || b.w - a.w)

  return { puzzle: { size, blocked, pieces }, solution }
}

export const samples = {
  5: parseLayout(`
    AABB1
    AABBC
    DD2EC
    DD2EC
    DDFFC
  `),
  6: parseLayout(`
    AAA1BB
    CDDDBB
    CDDDEE
    C22FFG
    HHIFFG
    HHIJJJ
  `),
  8: parseLayout(`
    AAAABB1C
    DDEEBBFC
    DDEEGGFC
    DD2HGGFI
    JJ2HKKKI
    JJLLKKKM
    NNLL3OOM
    NNPPPOOM
  `),
}

export type SampleSize = keyof typeof samples
