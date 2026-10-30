// A button painted with one stroke of ink. On hover the ink spreads a little
// (see .brush-button in hero.css). Used for the one main action on a screen.

import type { ReactNode } from 'react'

export function BrushButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="brush-button" onClick={onClick}>
      <svg className="brush-stroke" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
        <path
          filter="url(#dry-brush)"
          d="M10 46C24 28 78 19 150 20S270 22 291 31C299 40 292 54 268 57S146 64 74 61 6 59 10 46Z"
        />
      </svg>
      <span>{children}</span>
    </button>
  )
}
