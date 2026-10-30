// Choosing a board size. Each size is drawn as a small ink grid that grows
// with the board, so the choice can be seen at a glance; the chosen one sits
// on a soft wash of pink watercolor.

import type { CSSProperties } from 'react'
import { seededRandom } from '../game/rng'
import { blob } from './hero/treeParts'

type Props = {
  sizes: number[]
  current: number
  /** How many puzzles are solved, and how many there are, for each size. */
  progress: Record<number, { done: number; total: number }>
  onChoose: (size: number) => void
}

// The chosen board sits on a pale wash of pink, as if a brush of watercolor
// was laid down behind it: an irregular blot, darker where the paint pooled.
const wash = (() => {
  const random = seededRandom(9)
  return [blob(62, 64, 50, random, 0.4, 0.86), blob(56, 58, 30, random, 0.5, 0.9)]
})()

/** A hand-drawn n×n grid: every line wobbles very slightly, as if ruled by hand with a brush. */
function gridLines(n: number) {
  const random = seededRandom(n * 7)
  const jitter = () => (random() - 0.5) * 1.4
  return Array.from({ length: n - 1 }, (_, i) => {
    const at = ((i + 1) * 100) / n
    return `M${at + jitter()} 3L${at + jitter()} 97M3 ${at + jitter()}L97 ${at + jitter()}`
  }).join('')
}

export function SizePicker({ sizes, current, progress, onChoose }: Props) {
  return (
    <section className="size-picker" id="boards" aria-labelledby="boards-title">
      <div className="size-picker-intro">
        <h2 id="boards-title">Choose a board</h2>
        <p>Six sizes, from a few quiet minutes at 5×5 to a long, slow sit with 10×10.</p>
      </div>

      <ul className="size-options" role="list">
        {sizes.map((n) => {
          const { done, total } = progress[n]
          return (
            <li key={n} style={{ '--n': n } as CSSProperties}>
              <button
                type="button"
                aria-pressed={n === current}
                aria-label={`${n} by ${n}, ${done} of ${total} solved`}
                onClick={() => onChoose(n)}
              >
                <span className="size-art" aria-hidden="true">
                  <svg className="size-wash" viewBox="0 0 120 120">
                    <g filter="url(#tile-wash)">
                      <path d={wash[0]} className="size-wash-pale" />
                      <path d={wash[1]} className="size-wash-deep" />
                    </g>
                  </svg>
                  <svg className="size-grid" viewBox="0 0 100 100">
                    <rect x={2} y={2} width={96} height={96} className="size-grid-paper" />
                    <path d={gridLines(n)} className="size-grid-lines" />
                    <rect x={2} y={2} width={96} height={96} className="size-grid-frame" />
                  </svg>
                </span>
                <span className="size-name">
                  {n}×{n}
                </span>
                <span className="size-meta">
                  {done} of {total}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
