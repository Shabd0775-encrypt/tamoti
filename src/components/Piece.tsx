// One rectangle. The same component draws a piece in the tray, on the board,
// and under your finger while dragging; only its wrapper class changes.

import type { CSSProperties, PointerEvent } from 'react'

type Props = {
  w: number
  h: number
  tone: number
  className?: string
  style?: CSSProperties
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void
  onContextMenu?: () => void
}

export function Piece({ w, h, tone, className = '', style, onPointerDown, onContextMenu }: Props) {
  return (
    <div
      className={`piece ${className}`}
      data-tone={tone}
      style={{ '--w': w, '--h': h, ...style } as CSSProperties}
      aria-label={`${w} by ${h} piece`}
      onPointerDown={onPointerDown}
      onContextMenu={(event) => {
        if (!onContextMenu) return
        event.preventDefault()
        onContextMenu()
      }}
    >
      <div className="piece-body" />
    </div>
  )
}
