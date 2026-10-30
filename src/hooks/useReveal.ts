// Sections ink in as they scroll into view. Anything marked data-reveal
// starts faint and soft, and gets the class "is-in" once it's on screen
// (see the [data-reveal] rules in library.css). `--d` on an element delays
// it, so the parts of a section can arrive one after another.
//
// Without JavaScript, or with reduced motion, nothing is ever hidden.

import { useEffect } from 'react'

export function useReveal(dependency: unknown) {
  useEffect(() => {
    const waiting = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)')]
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const el of waiting) el.classList.add('is-in')
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    for (const el of waiting) observer.observe(el)
    return () => observer.disconnect()
  }, [dependency])
}
