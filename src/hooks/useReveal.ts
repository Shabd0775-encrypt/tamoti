// Sections ink in as they scroll into view. Anything marked data-reveal
// starts faint and soft, and gets the class "is-in" once it's on screen
// (see the [data-reveal] rules in library.css). `--d` on an element delays
// it, so the parts of a section can arrive one after another.
//
// It is built so content can never stay hidden:
//   - without JavaScript, with reduced motion, or in a browser that can't
//     watch scrolling, nothing is ever hidden;
//   - anything any part of which is on screen is shown;
//   - after a jump (a menu link, the back button), everything above the
//     bottom of the screen is shown at once;
//   - and as a last resort, a few seconds after the page settles,
//     everything already scrolled past or on screen is shown.

import { useEffect } from 'react'

const SAFETY_NET_MS = 2500

export function useReveal(dependency: unknown) {
  useEffect(() => {
    const all = () => [...document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)')]
    const show = (el: Element) => el.classList.add('is-in')
    /** Shows everything whose top is above the bottom of the screen: on screen, or already passed. */
    const showUpToHere = () => {
      for (const el of all()) if (el.getBoundingClientRect().top < window.innerHeight) show(el)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      for (const el of all()) show(el)
      return
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        show(entry.target)
        observer.unobserve(entry.target)
      }
    })
    for (const el of all()) observer.observe(el)

    // Jumps skip the in-between, so catch up straight away (and once more when a smooth scroll ends).
    const onJump = () => {
      showUpToHere()
      window.setTimeout(showUpToHere, 1200)
    }
    window.addEventListener('hashchange', onJump)
    window.addEventListener('popstate', onJump)
    const safetyNet = window.setInterval(showUpToHere, SAFETY_NET_MS)

    return () => {
      observer.disconnect()
      window.removeEventListener('hashchange', onJump)
      window.removeEventListener('popstate', onJump)
      window.clearInterval(safetyNet)
    }
  }, [dependency])
}
