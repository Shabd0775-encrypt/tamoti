// A small board, painted in ink: a sheet of paper with the grid brushed on
// and the blocked squares filled in. Used for the hero's next puzzle and for
// every puzzle in the library's lists.

import type { Ref } from 'react'
import type { Rect } from '../../game/types'

const SIZE = 600

type Props = {
  size: number
  blocked: Rect[]
  svgRef?: Ref<SVGSVGElement>
}

export function PaintedBoard({ size, blocked, svgRef }: Props) {
  const cell = SIZE / size
  const lines = Array.from({ length: size - 1 }, (_, i) => (i + 1) * cell)

  return (
    <svg ref={svgRef} className="painted-board" viewBox={`-20 -20 ${SIZE + 40} ${SIZE + 40}`} aria-hidden="true">
      <rect className="pb-paper" x={0} y={0} width={SIZE} height={SIZE} filter="url(#tile-wash)" />
      <g className="pb-lines" filter="url(#ink)" strokeLinecap="round">
        {lines.map((at) => (
          <g key={at}>
            <path d={`M${at} 6V${SIZE - 6}`} />
            <path d={`M6 ${at}H${SIZE - 6}`} />
          </g>
        ))}
      </g>
      <rect className="pb-frame" x={2} y={2} width={SIZE - 4} height={SIZE - 4} filter="url(#tile-wash)" />
      <g className="pb-blocked" filter="url(#tile-wash)">
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
  )
}
