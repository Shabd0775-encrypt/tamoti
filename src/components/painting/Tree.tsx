// The cherry trees on their rock, grown by code.
//
// Growing: each limb splits into two or three thinner, shorter ones, again
// and again, and every split turns a little: that's how real branches look.
// The ends of the limbs are gathered into masses where the blossom goes.
//
// Painting: the rock is a dark wet wash; the branches and blossom are
// painted in Blossom.tsx.

import { seededRandom } from '../../game/rng'
import { Blossom } from './Blossom'
import { Fade, InkedRidge } from './landscape'
import { blob, ridge, silhouette, type Point } from './ridge'
import type { Dab, Limb, Mass } from './treeParts'

const SIZE = 1000

export type Trunk = {
  /** Where it leaves the ground. */
  base: Point
  /** Direction in degrees: -90 is straight up, larger numbers lean right. */
  angle: number
  length: number
  width: number
  /** How far limbs fan out at each split, in degrees. */
  spread: number
  /** How many times it splits. */
  depth: number
}

export type TreeShape = {
  seed: number
  /** The rock, as rough ridge points on the 1000×1000 canvas. */
  hill: Point[]
  trunks: Trunk[]
  /** Limbs stop and blossom once they pass this x, so the crown stays clear of the words. */
  reach: number
  /**
   * How much the upper limbs climb, from 1 (as much as they like) toward 0
   * (flat). Lower values spread the crown sideways, like an old cherry.
   */
  flatten: number
}

function grow(shape: TreeShape, random: () => number) {
  const limbs: Limb[] = []
  const tips: Point[] = []

  const branch = (start: Point, angle: number, length: number, width: number, depth: number, spread: number) => {
    const points: Point[] = [start]
    let [x, y] = start
    let a = angle
    const steps = 7
    for (let i = 0; i < steps; i++) {
      // Wander, with now and then a sharp kink: old cherry wood is crooked.
      a += (random() - 0.5) * 0.55 + (random() < 0.14 ? (random() - 0.5) * 1.2 : 0)
      x += (Math.cos(a) * length) / steps
      y += ((Math.sin(a) * length) / steps) * (depth <= 3 ? shape.flatten : 1)
      points.push([x, y])
      // Small spurs: the scratchy little twigs all along a cherry branch.
      if (depth <= 2 && random() < 0.3) {
        const side = random() < 0.5 ? -1 : 1
        const sa = a + side * (0.7 + random() * 0.8)
        const sl = 10 + random() * 22
        const spur: Point = [x + Math.cos(sa) * sl, y + Math.sin(sa) * sl]
        limbs.push({ points: [[x, y], spur], from: 1.6, to: 0.6, depth: -1 })
      }
      if (x > shape.reach) {
        depth = 0
        break
      }
    }
    const end = Math.max(width * 0.6, 1)
    limbs.push({ points, from: width, to: end, depth })
    if (depth === 0) {
      tips.push([x, y])
      return
    }
    const forks = random() < 0.45 ? 3 : 2
    for (let k = 0; k < forks; k++) {
      const side = forks === 2 ? k * 2 - 1 : k - 1
      const turn = side * spread * (0.55 + random() * 0.7) + 0.05
      branch([x, y], a + turn, length * (0.68 + random() * 0.2), end * 0.92, depth - 1, spread)
    }
    if (depth >= 2 && random() < 0.6) {
      const side = random() < 0.5 ? -1 : 1
      branch(points[3], a + side * (0.8 + random() * 0.5), length * 0.5, width * 0.4, depth - 2, spread)
    }
  }

  for (const t of shape.trunks) {
    branch(t.base, (t.angle * Math.PI) / 180, t.length, t.width, t.depth, (t.spread * Math.PI) / 180)
  }
  return { limbs, tips }
}

/** Gather nearby branch ends into masses of blossom, bigger where more ends meet. */
function gather(tips: Point[]): Mass[] {
  const cell = 105
  const buckets = new Map<string, Point[]>()
  for (const [x, y] of tips) {
    const key = `${Math.floor(x / cell)},${Math.floor(y / cell)}`
    buckets.set(key, [...(buckets.get(key) ?? []), [x, y]])
  }
  return [...buckets.values()].map((group) => ({
    x: group.reduce((sum, [x]) => sum + x, 0) / group.length,
    y: group.reduce((sum, [, y]) => sum + y, 0) / group.length,
    r: 42 + 16 * Math.sqrt(group.length),
  }))
}

/** The rock's wet blots: overlapping washes that bleed past its outline. */
function paintRock(hill: Point[], random: () => number): Dab[] {
  const crest = hill.reduce((best, p) => (p[1] < best[1] ? p : best))
  return Array.from({ length: 11 }, (_, i) => {
    // Most blots sit near the crest, a few trail down the slope to the right.
    const along = i < 7 ? random() * 0.35 : 0.35 + random() * 0.5
    const [x, y] = hill[Math.floor(along * (hill.length - 1))]
    return {
      x: x + (random() - 0.5) * 60,
      y: y + 30 + random() * (i < 7 ? 90 : 50),
      r: 30 + random() * (i < 7 ? 80 : 40),
      tone: random() < 0.5 ? '--ink-700' : '--ink-500',
      alpha: 0.22 + random() * 0.3 + (Math.abs(x - crest[0]) < 120 ? 0.15 : 0),
    }
  })
}

export function Tree({ shape, id }: { shape: TreeShape; id: string }) {
  const random = seededRandom(shape.seed)
  const { limbs, tips } = grow(shape, random)
  const hill = ridge(shape.hill, 0.24, shape.seed + 1)
  const rock = paintRock(hill, random)

  return (
    <svg className="hero-tree" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <defs>
        <Fade
          id={`${id}-hill`}
          y1={Math.min(...shape.hill.map(([, y]) => y))}
          y2={SIZE}
          stops={[
            [0, 'var(--ink-900)', 0.9],
            [0.3, 'var(--ink-700)', 0.75],
            [0.7, 'var(--ink-500)', 0.35],
            [1, 'var(--ink-300)', 0],
          ]}
        />
      </defs>

      <g filter="url(#wash)">
        <path d={silhouette(hill, SIZE)} fill={`url(#${id}-hill)`} />
        <InkedRidge id={`${id}-hill-clip`} points={hill} ink="var(--ink-900)" width={46} bottom={SIZE} />
        {rock.map((b, i) => (
          <path
            key={i}
            d={blob(b.x, b.y, b.r, random, 0.6)}
            opacity={b.alpha}
            style={{ fill: `var(${b.tone})`, mixBlendMode: 'multiply' }}
          />
        ))}
      </g>

      <Blossom limbs={limbs} tips={tips} masses={gather(tips)} random={random} />
    </svg>
  )
}
