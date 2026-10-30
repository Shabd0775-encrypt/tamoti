// TEMPORARY: a small bar for trying display typefaces. Each sets the font for
// headings and the name, and the italic used for picked-out words (see
// tokens.css, :root[data-font]). Kept in the address (?font=instrument) and
// remembered. Delete this once a typeface is chosen.

import { useEffect, useState } from 'react'

const fonts = {
  mincho: 'Mincho + Cormorant italic',
  cormorant: 'Cormorant',
  instrument: 'Instrument Serif',
  dmserif: 'DM Serif Display',
}

function initial(): string {
  const choices = Object.keys(fonts)
  const fromAddress = new URLSearchParams(window.location.search).get('font')
  let saved: string | null = null
  try {
    saved = localStorage.getItem('look-font')
  } catch {
    // Storage can be blocked; fall back to the first option.
  }
  return choices.find((c) => c === fromAddress) ?? choices.find((c) => c === saved) ?? choices[0]
}

export function FontSwitcher() {
  const [font, setFont] = useState(initial)

  useEffect(() => {
    if (font === 'mincho') delete document.documentElement.dataset.font
    else document.documentElement.dataset.font = font
  }, [font])

  const choose = (value: string) => {
    setFont(value)
    try {
      localStorage.setItem('look-font', value)
    } catch {
      // Not remembered; that's fine.
    }
  }

  return (
    <div className="font-switcher" role="group" aria-label="Display typeface">
      <span className="switcher-label">Type</span>
      {Object.entries(fonts).map(([value, label]) => (
        <button key={value} type="button" aria-pressed={font === value} onClick={() => choose(value)}>
          {label}
        </button>
      ))}
    </div>
  )
}
