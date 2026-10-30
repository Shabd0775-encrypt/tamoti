// A single dry stroke of pale ink between sections, in place of a ruled line.

import { ridge, taper } from './hero/ridge'

const stroke = (() => {
  const points = ridge(
    [
      [4, 14],
      [90, 11],
      [180, 13],
      [256, 10],
    ],
    0.04,
    61,
    4,
  )
  // Thick where the brush lands, thinning as it lifts away.
  return taper(points, 7, 1)
})()

export function BrushDivider() {
  return (
    <svg className="brush-divider" viewBox="0 0 260 24" aria-hidden="true" data-reveal>
      <path d={stroke} filter="url(#dry-brush)" />
    </svg>
  )
}
