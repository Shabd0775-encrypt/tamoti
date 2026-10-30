// How to play, shown rather than told: a little 4×4 board that fills itself
// piece by piece from a tray beside it, one piece turning on the way in,
// then the seal, then it all begins again. The motion is in library.css.
//
//   A A C #      # = blocked
//   A A C B
//   D D D B
//   # E E B

import type { CSSProperties } from 'react'
import { Seal } from './hero/Seal'
import { Piece } from './Piece'

// Where each piece ends up (column, row), and its size there.
const demo = [
  { id: 'a', x: 0, y: 0, w: 2, h: 2, tone: 1 },
  { id: 'd', x: 0, y: 2, w: 3, h: 1, tone: 2 },
  { id: 'c', x: 2, y: 0, w: 1, h: 2, tone: 3 },
  { id: 'e', x: 1, y: 3, w: 2, h: 1, tone: 4 },
  { id: 'b', x: 3, y: 1, w: 1, h: 3, tone: 1 }, // arrives lying down, and turns
]

export function HowToPlay() {
  return (
    <section className="howto" aria-labelledby="howto-title">
      <div className="howto-text" data-reveal>
        <h2 id="howto-title">How to play</h2>
        <ol className="howto-steps">
          <li>
            <strong>Drag</strong> a piece onto the board.
          </li>
          <li>
            <strong>Tap</strong> a piece to turn it.
          </li>
          <li>
            <strong>Fill</strong> every open square. Pieces can overlap while you try things, and a hint is always there
            if you want one.
          </li>
        </ol>
      </div>

      <div className="howto-demo" data-reveal style={{ '--d': '150ms' } as CSSProperties} aria-hidden="true">
        <div className="demo-board">
          <span className="demo-blocked" style={{ '--x': 3, '--y': 0 } as CSSProperties} />
          <span className="demo-blocked" style={{ '--x': 0, '--y': 3 } as CSSProperties} />
          {demo.map((p) => (
            <Piece
              key={p.id}
              w={p.w}
              h={p.h}
              tone={p.tone}
              className={`demo-piece demo-${p.id}`}
              style={{ '--x': p.x, '--y': p.y } as CSSProperties}
            />
          ))}
          <Seal className="demo-seal" />
        </div>
      </div>
    </section>
  )
}
