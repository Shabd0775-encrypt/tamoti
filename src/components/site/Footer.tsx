// The close of the library: the name again, large, with its seal, one line
// about the game, and a quiet way back up. It sits on the scroll painting,
// which runs on behind it to the end of the page.

import type { CSSProperties } from 'react'
import { Seal } from '../painting/Seal'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-mark" data-reveal>
          Tamoti
          <Seal className="footer-seal" />
        </p>
        <p className="footer-line" data-reveal style={{ '--d': '120ms' } as CSSProperties}>
          A quiet puzzle to come back to. No timer, no score, <mark className="highlight">nothing to lose</mark>.
        </p>
        <a className="footer-top" href="#top" data-reveal style={{ '--d': '220ms' } as CSSProperties}>
          Back to the top
        </a>
      </div>
    </footer>
  )
}
