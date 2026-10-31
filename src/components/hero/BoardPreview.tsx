// The next puzzle's board in the hero. Pressing it opens the puzzle.

import type { Ref } from 'react'
import type { Rect } from '../../game/types'
import { PaintedBoard } from '../pieces/PaintedBoard'

type Props = {
  size: number
  blocked: Rect[]
  caption: string
  onOpen: () => void
  svgRef?: Ref<SVGSVGElement>
}

export function BoardPreview({ size, blocked, caption, onOpen, svgRef }: Props) {
  return (
    <button type="button" className="board-preview" onClick={onOpen} aria-label={`Open ${caption}`}>
      <PaintedBoard size={size} blocked={blocked} svgRef={svgRef} />
      <span className="board-caption">{caption}</span>
    </button>
  )
}
