// The close of the library: the name again, large, with its seal, one line
// about the game, and a quiet way back up. A last faint ridge of mountains
// sits behind it, so the page ends the way it began.

import type { CSSProperties } from 'react'
import { ridge, silhouette } from './hero/ridge'
import { Seal } from './hero/Seal'

const range = ridge(
  [
    [-20, 150],
    [180, 96],
    [360, 128],
    [560, 70],
    [760, 118],
    [980, 84],
    [1220, 122],
    [1420, 60],
    [1620, 110],
  ],
  0.2,
  81,
)

export function Footer() {
  return (
    <footer className="site-footer">
      <svg className="footer-range" viewBox="0 0 1600 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="g-footer-range" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="60" y2="240">
            <stop offset="0" style={{ stopColor: 'var(--mist-teal)', stopOpacity: 0.35 }} />
            <stop offset="1" style={{ stopColor: 'var(--mist-teal)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path d={silhouette(range, 240)} fill="url(#g-footer-range)" filter="url(#wash)" />
      </svg>
      <div className="footer-inner">
        <p className="footer-mark" data-reveal>
          Grid Puzzle
          <Seal className="footer-seal" />
        </p>
        <p className="footer-line" data-reveal style={{ '--d': '120ms' } as CSSProperties}>
          A quiet puzzle to come back to. No timer, no score, nothing to lose.
        </p>
        <a className="footer-top" href="#top" data-reveal style={{ '--d': '220ms' } as CSSProperties}>
          Back to the top
        </a>
      </div>
    </footer>
  )
}
