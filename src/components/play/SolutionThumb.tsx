// A small picture of one way you filled a board: the blocked squares in ink,
// each piece in its own color, as it lay when the board was done.

import type { Placements, Puzzle } from '../../game/types'
import { footprint } from '../../game/board'
import { toneFor } from '../pieces/tone'

export function SolutionThumb({ puzzle, placements }: { puzzle: Puzzle; placements: Placements }) {
  const n = puzzle.size
  return (
    <svg className="solution-thumb" viewBox={`-0.4 -0.4 ${n + 0.8} ${n + 0.8}`} aria-hidden="true">
      <rect className="thumb-paper" x={-0.4} y={-0.4} width={n + 0.8} height={n + 0.8} rx={0.3} />
      {puzzle.blocked.map((r) => (
        <rect
          key={`${r.row},${r.col}`}
          className="thumb-blocked"
          x={r.col + 0.08}
          y={r.row + 0.08}
          width={r.w - 0.16}
          height={r.h - 0.16}
          rx={0.12}
        />
      ))}
      {puzzle.pieces.map((piece, index) => {
        const at = placements[piece.id]
        if (!at) return null
        const { w, h } = footprint(piece, at.rotated)
        return (
          <rect
            key={piece.id}
            x={at.col + 0.08}
            y={at.row + 0.08}
            width={w - 0.16}
            height={h - 0.16}
            rx={0.12}
            style={{ fill: `var(--tone-${toneFor(index)})` }}
          />
        )
      })}
    </svg>
  )
}
