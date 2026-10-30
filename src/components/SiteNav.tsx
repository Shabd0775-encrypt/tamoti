// The menu along the top of the library: three plain links on the right,
// to "How to play", the puzzle library, and today's board. It stays put as
// you scroll; once you're past the top of the painting it gets a paper
// background, and the name appears on the left as a way back up.

import { useEffect, useState } from 'react'

/** `onDaily` opens today's board. */
export function SiteNav({ onDaily }: { onDaily: () => void }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const check = () => setScrolled(window.scrollY > 80)
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])

  return (
    <nav className={`site-nav ${scrolled ? 'is-scrolled' : ''}`} aria-label="Main">
      <a className="site-nav-mark" href="#top" tabIndex={scrolled ? 0 : -1} aria-hidden={!scrolled}>
        Tamoti
      </a>
      <ul role="list">
        <li>
          <a href="#how-to-play">How to play</a>
        </li>
        <li>
          <a href="#boards">Puzzle library</a>
        </li>
        <li>
          <button type="button" onClick={onDaily}>
            Today's board
          </button>
        </li>
      </ul>
    </nav>
  )
}
