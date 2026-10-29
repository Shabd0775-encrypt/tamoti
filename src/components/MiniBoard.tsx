import type { CSSProperties } from 'react'
import type { Rect } from '../game/types'

/** A small picture of a puzzle: just the grid and where the blockers sit. */
export function MiniBoard({ size, blocked }: { size: number; blocked: Rect[] }) {
  return (
    <div className="mini-board" style={{ '--size': size } as CSSProperties} aria-hidden="true">
      {blocked.map((rect, i) => (
        <div
          key={i}
          className="mini-blocked on-board"
          style={{ '--r': rect.row, '--c': rect.col, '--w': rect.w, '--h': rect.h } as CSSProperties}
        />
      ))}
    </div>
  )
}
