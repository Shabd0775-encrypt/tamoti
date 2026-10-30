// A button painted with one calligraphy stroke of grey ink: a pressed blot to
// start, a long pull, and a dry split tail. On hover the ink spreads a little
// (see .brush-button in hero.css). Used for the one main action on a screen.

import type { ReactNode } from 'react'

export function BrushButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="brush-button" onClick={onClick}>
      <svg className="brush-stroke" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden="true">
        <g filter="url(#dry-brush)">
          <path d="M10 34C12 20 30 16 48 20C110 26 200 24 262 26C282 27 296 32 292 42C288 52 270 56 240 58C170 62 90 64 40 62C18 61 8 50 10 34Z" />
          <path className="brush-tail" d="M226 61C256 61 280 57 297 48L299 51C283 61 258 66 224 65Z" />
        </g>
      </svg>
      <span>{children}</span>
    </button>
  )
}
