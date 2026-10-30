// TEMPORARY: a small bar on the play screen for trying out textures on the
// pieces. The choice is kept in the address (?texture=washi) and remembered.
// The styles for each are in play.css, keyed on data-texture on <html>.
// Delete this once a texture is chosen.

import { useEffect, useState } from 'react'

const textures = {
  polished: 'Polished',
  paper: 'Paper',
  silk: 'Silk',
  crackle: 'Crackle',
  wood: 'Wood',
  stone: 'Stone',
  washi: 'Washi',
  grain: 'Grain',
  brush: 'Brush',
  granulation: 'Granulation',
  none: 'None',
}

function initial(): string {
  const choices = Object.keys(textures)
  const fromAddress = new URLSearchParams(window.location.search).get('texture')
  let saved: string | null = null
  try {
    saved = localStorage.getItem('look-texture')
  } catch {
    // Storage can be blocked; fall back to the first option.
  }
  return choices.find((c) => c === fromAddress) ?? choices.find((c) => c === saved) ?? choices[0]
}

export function LookSwitcher() {
  const [texture, setTexture] = useState(initial)

  useEffect(() => {
    document.documentElement.dataset.texture = texture
  }, [texture])

  const choose = (value: string) => {
    setTexture(value)
    const params = new URLSearchParams(window.location.search)
    params.set('texture', value)
    window.history.replaceState(null, '', `?${params}`)
    try {
      localStorage.setItem('look-texture', value)
    } catch {
      // Not remembered; that's fine.
    }
  }

  return (
    <div className="look-switcher">
      <div role="group" aria-label="Piece texture">
        <span className="look-label">Texture</span>
        {Object.entries(textures).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={texture === value} onClick={() => choose(value)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
