// Shared pieces for painting trees: the shapes a grown tree is made of, and
// the two brushes every style uses (round dabs of color, and ink limbs).

import { taper, type Point } from './ridge'

/** One stroke of a branch. depth counts down to 0 at the outermost twigs; spurs are -1. */
export type Limb = { points: Point[]; from: number; to: number; depth: number }
export type Mass = { x: number; y: number; r: number }

export type Growth = {
  limbs: Limb[]
  tips: Point[]
  masses: Mass[]
  random: () => number
}

export type Dab = { x: number; y: number; r: number; tone: string; alpha: number }

/** Circles of color. Multiply: where two overlap the color deepens, like glazes of watercolor. */
export function Dabs({ dabs, blend = true }: { dabs: Dab[]; blend?: boolean }) {
  return dabs.map((b, i) => (
    <circle
      key={i}
      cx={b.x}
      cy={b.y}
      r={b.r}
      opacity={b.alpha}
      style={{ fill: `var(${b.tone})`, mixBlendMode: blend ? 'multiply' : undefined }}
    />
  ))
}

/** Branches in black ink. `scale` thickens or thins every stroke. */
export function Limbs({ limbs, scale = 1, opacity = 1 }: { limbs: Limb[]; scale?: number; opacity?: number }) {
  return (
    <g filter="url(#ink)" style={{ fill: 'var(--ink-900)' }} opacity={opacity}>
      {limbs.map((limb, i) => (
        <path key={i} d={taper(limb.points, limb.from * scale, limb.to * scale)} />
      ))}
    </g>
  )
}
