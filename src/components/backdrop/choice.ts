// TEMPORARY: which background is being tried below the hero. Kept in the
// address (?backdrop=washes) and remembered. Delete with BackdropSwitcher.

import { createContext, useState } from 'react'

export const backdrops = {
  emaki: 'Scroll painting',
  vignettes: 'Vignettes',
  washes: 'Washes',
  none: 'None',
} as const

export type Backdrop = keyof typeof backdrops

export const BackdropContext = createContext<Backdrop>('none')

function initial(): Backdrop {
  const ids = Object.keys(backdrops) as Backdrop[]
  const fromAddress = new URLSearchParams(window.location.search).get('backdrop')
  let saved: string | null = null
  try {
    saved = localStorage.getItem('look-backdrop')
  } catch {
    // Storage can be blocked; fall back to the first option.
  }
  return ids.find((id) => id === fromAddress) ?? ids.find((id) => id === saved) ?? ids[0]
}

export function useBackdropChoice(): [Backdrop, (b: Backdrop) => void] {
  const [backdrop, setBackdrop] = useState(initial)
  const choose = (b: Backdrop) => {
    setBackdrop(b)
    try {
      localStorage.setItem('look-backdrop', b)
    } catch {
      // Not remembered; that's fine.
    }
  }
  return [backdrop, choose]
}
