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

/** An irregular closed blob: a circle whose radius wanders, smoothed into curves. */
/** `squash` is how tall it is compared with its width: 1 is round, 0.5 is twice as wide as tall. */
export function blob(cx: number, cy: number, r: number, random: () => number, wobble = 0.45, squash = 0.8): string {
  const n = 14
  const raw = Array.from({ length: n }, () => 1 - wobble / 2 + random() * wobble)
  const radii = raw.map((v, i) => (raw[(i + n - 1) % n] + v * 2 + raw[(i + 1) % n]) / 4)
  const pts = radii.map((k, i) => {
    const a = (i / n) * Math.PI * 2
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * squash] as const
  })
  const mid = (i: number) => {
    const [x1, y1] = pts[i % n]
    const [x2, y2] = pts[(i + 1) % n]
    return `${((x1 + x2) / 2).toFixed(1)} ${((y1 + y2) / 2).toFixed(1)}`
  }
  return `M${mid(0)}${pts.map((_, i) => `Q${pts[(i + 1) % n][0].toFixed(1)} ${pts[(i + 1) % n][1].toFixed(1)} ${mid(i + 1)}`).join('')}Z`
}
