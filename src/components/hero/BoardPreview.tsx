// The next puzzle's board, painted in ink: a sheet of paper with the grid
// brushed on it and the blocked squares filled in. Pressing it opens the puzzle.

import type { Ref } from 'react'
import type { Rect } from '../../game/types'

const SIZE = 600

type Props = {
  size: number
  blocked: Rect[]
  caption: string
  onOpen: () => void
  svgRef?: Ref<SVGSVGElement>
}

export function BoardPreview({ size, blocked, caption, onOpen, svgRef }: Props) {
  const cell = SIZE / size
  const lines = Array.from({ length: size - 1 }, (_, i) => (i + 1) * cell)

  return (
    <button type="button" className="board-preview" onClick={onOpen} aria-label={`Open ${caption}`}>
      <svg ref={svgRef} viewBox={`-20 -20 ${SIZE + 40} ${SIZE + 40}`} aria-hidden="true">
        <rect className="board-paper" x={0} y={0} width={SIZE} height={SIZE} filter="url(#tile-wash)" />
        <g className="board-lines" filter="url(#ink)" strokeLinecap="round">
          {lines.map((at) => (
            <g key={at}>
              <path d={`M${at} 6V${SIZE - 6}`} />
              <path d={`M6 ${at}H${SIZE - 6}`} />
            </g>
          ))}
        </g>
        <rect className="board-frame" x={2} y={2} width={SIZE - 4} height={SIZE - 4} filter="url(#tile-wash)" />
        <g className="board-blocked" filter="url(#tile-wash)">
          {blocked.map((r) => (
            <rect
              key={`${r.row},${r.col}`}
              x={r.col * cell + 9}
              y={r.row * cell + 9}
              width={r.w * cell - 18}
              height={r.h * cell - 18}
            />
          ))}
        </g>
      </svg>
      <span className="board-caption">{caption}</span>
    </button>
  )
}
