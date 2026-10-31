// Mountain ridgelines, made by "midpoint displacement": take a straight line
// between two points, nudge its middle up or down a little, then do the same
// to each half, and each half of those. Each round the nudges get smaller,
// which is roughly how real ridges look: big shapes, then smaller bumps.
//
// It uses the seeded generator, so the same seed always draws the same mountain.
//
// Also here: the other shapes the brushes are built from, such as tapered
// strokes and round blobs.

import { seededRandom } from '../../game/rng'

export type Point = [x: number, y: number]

/** Rough up a line through `points`. `rough` is how jagged (0.1 smooth, 0.4 craggy). */
export function ridge(points: Point[], rough: number, seed: number, depth = 6): Point[] {
  const random = seededRandom(seed)
  const out: Point[] = [points[0]]

  const split = (a: Point, b: Point, level: number) => {
    if (level === 0) {
      out.push(b)
      return
    }
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (random() - 0.5) * length * rough]
    split(a, mid, level - 1)
    split(mid, b, level - 1)
  }

  for (let i = 1; i < points.length; i++) split(points[i - 1], points[i], depth)
  return out
}

/** A line as SVG path commands, without the opening M. */
export const lineTo = (points: Point[]) => points.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join('')

/** A filled silhouette: the ridge on top, closed along the bottom of the picture. */
export function silhouette(points: Point[], bottom: number): string {
  const [first] = points
  const last = points[points.length - 1]
  return `M${first[0]} ${bottom}${lineTo(points)}L${last[0]} ${bottom}Z`
}

/** Where a ridge is at a given x: the y of its nearest point. Used to stand things on a hilltop. */
export function heightAt(points: Point[], x: number): number {
  return points.reduce((best, p) => (Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best))[1]
}

/** A brush stroke that starts `from` wide and tapers to `to`: a polygon either side of a line. */
export function taper(points: Point[], from: number, to: number): string {
  const left: Point[] = []
  const right: Point[] = []
  points.forEach(([x, y], i) => {
    const [nx, ny] = points[Math.min(i + 1, points.length - 1)]
    const [px, py] = points[Math.max(i - 1, 0)]
    const angle = Math.atan2(ny - py, nx - px) + Math.PI / 2
    const half = (from + (to - from) * (i / (points.length - 1))) / 2
    left.push([x + Math.cos(angle) * half, y + Math.sin(angle) * half])
    right.push([x - Math.cos(angle) * half, y - Math.sin(angle) * half])
  })
  return `M${[...left, ...right.reverse()].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`
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
