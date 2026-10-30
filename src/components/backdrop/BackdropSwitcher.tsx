// TEMPORARY: a small bar for comparing backgrounds below the hero.

import { backdrops, type Backdrop } from './choice'

export function BackdropSwitcher({ value, onChoose }: { value: Backdrop; onChoose: (b: Backdrop) => void }) {
  return (
    <div className="backdrop-switcher" role="group" aria-label="Background below the hero">
      <span className="switcher-label">Background</span>
      {(Object.keys(backdrops) as Backdrop[]).map((id) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChoose(id)}>
          {backdrops[id]}
        </button>
      ))}
    </div>
  )
}
