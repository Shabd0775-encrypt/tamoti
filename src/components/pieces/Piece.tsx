// One rectangle. The same component draws a piece in the tray, on the board,
// and under your finger while dragging; only its wrapper class changes.

import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'

type Props = {
  w: number
  h: number
  tone: number
  className?: string
  style?: CSSProperties
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void
  onContextMenu?: () => void
  /** With a key handler, the piece can be reached with Tab and played from the keyboard. */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void
  /** What a screen reader says for it, e.g. "3 by 2 piece, row 2, column 4". */
  label?: string
  /** Lets the screen find this piece again, to put keyboard focus back on it after a move. */
  pieceId?: string
}

export function Piece({
  w,
  h,
  tone,
  className = '',
  style,
  onPointerDown,
  onContextMenu,
  onKeyDown,
  label,
  pieceId,
}: Props) {
  return (
    <div
      className={`piece ${className}`}
      data-tone={tone}
      style={{ '--w': w, '--h': h, ...style } as CSSProperties}
      aria-label={label ?? `${w} by ${h} piece`}
      role={onKeyDown ? 'button' : undefined}
      tabIndex={onKeyDown ? 0 : undefined}
      data-piece={pieceId}
      onKeyDown={onKeyDown}
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
