// The brushes and motifs the hero scenes are painted with. Every scene draws
// on the same 1600×1000 canvas, so a point like [600, 250] (the peak) means
// the same spot in all of them.

import type { ReactNode } from 'react'
import { lineTo, ridge, silhouette, type Point } from './ridge'

export const W = 1600
export const H = 1000

type Stop = [offset: number, color: string, opacity?: number]

/** A vertical gradient in canvas units, from the first stop at y1 down to the last at y2. */
export function Fade({ id, y1, y2, stops }: { id: string; y1: number; y2: number; stops: Stop[] }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={y1} y2={y2}>
      {stops.map(([offset, color, opacity = 1]) => (
        <stop key={offset} offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />
      ))}
    </linearGradient>
  )
}

/**
 * One sheet of the painting. Sheets are stacked; `depth` says how far away it
 * is, and so how much it lags behind as the page scrolls (see useParallax).
 */
export function Layer({ depth, children }: { depth: number; children: ReactNode }) {
  return (
    <svg className="mtn-layer" data-depth={depth} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {children}
    </svg>
  )
}

export const ridgeInk = (points: Point[]) => `M${points[0][0]} ${points[0][1]}${lineTo(points.slice(1))}`

/**
 * Ink gathered along a ridgeline, the way a loaded brush leaves its darkest
 * pigment at the top edge of a stroke. It's a wide, blurred line along the
 * ridge, clipped to the shape so only the inside half shows.
 */
export function InkedRidge({
  id,
  points,
  ink,
  width = 34,
  bottom = H,
  children,
}: {
  id: string
  points: Point[]
  ink: string
  width?: number
  bottom?: number
  children?: ReactNode
}) {
  return (
    <>
      <clipPath id={id}>
        <path d={silhouette(points, bottom)} />
      </clipPath>
      <g clipPath={`url(#${id})`} filter="url(#ink-bleed)" fill="none" strokeLinecap="round">
        <path d={ridgeInk(points)} strokeWidth={width} style={{ stroke: ink }} />
        {children}
      </g>
    </>
  )
}

/* ---------- The peak ---------- */

// Up the shaded right-hand face, down the sunlit left one.
const peakRight = ridge(
  [
    [1100, 720],
    [910, 560],
    [740, 398],
    [600, 250],
  ],
  0.26,
  11,
)
const peakLeft = ridge(
  [
    [600, 250],
    [482, 362],
    [300, 522],
    [40, 700],
  ],
  0.26,
  12,
)
export const peak = [...peakRight, ...peakLeft.slice(1)]

// The face that catches the light: down the left ridge, back up a ragged shadow line.
const litEdge = peakLeft.filter(([x]) => x >= 270)
const shadowLine = ridge(
  [
    [600, 250],
    [564, 342],
    [508, 438],
    [440, 530],
    [350, 612],
  ],
  0.32,
  13,
)
const litFace = `M600 250${lineTo(litEdge)}${lineTo([...shadowLine].reverse())}Z`

// Soft wash streaks down the shaded face, like gullies of snow and rock.
const gullies = [120, 138, 152, 164, 175, 186].map((i, n) => {
  const [x, y] = peakRight[i]
  const length = 90 + ((n * 53) % 110)
  return `M${x} ${y}Q${x - 22} ${y + length * 0.5} ${x - 40 - n * 6} ${y + length}`
})

/** The snow peak with alpine glow on its left face. `glow` from 0 (none) to 1 (full dusk). */
export function Peak({ glow = 0.85 }: { glow?: number }) {
  return (
    <>
      <defs>
        <Fade
          id="g-peak"
          y1={250}
          y2={780}
          stops={[
            [0, 'var(--mtn-snow)'],
            [0.22, 'var(--mtn-peak)'],
            [0.6, 'var(--mtn-far)', 0.7],
            [1, 'var(--mtn-far)', 0],
          ]}
        />
        <Fade
          id="g-lit"
          y1={250}
          y2={650}
          stops={[
            [0, 'var(--glow-100)', glow],
            [0.3, 'var(--glow-300)', glow],
            [0.7, 'var(--sakura-100)', glow * 0.5],
            [1, 'var(--sakura-100)', 0],
          ]}
        />
        <Fade
          id="g-ridge-ink"
          y1={250}
          y2={660}
          stops={[
            [0, 'var(--ink-700)', 0.7],
            [1, 'var(--ink-700)', 0],
          ]}
        />
      </defs>
      <g filter="url(#wash)">
        <path d={silhouette(peak, H)} fill="url(#g-peak)" />
        <path d={litFace} fill="url(#g-lit)" filter="url(#glow-wash)" />
        <InkedRidge id="clip-peak" points={peak} ink="url(#g-ridge-ink)">
          {gullies.map((d) => (
            <path key={d} d={d} strokeWidth="14" strokeOpacity="0.09" style={{ stroke: 'var(--ink-700)' }} />
          ))}
        </InkedRidge>
      </g>
    </>
  )
}

/* ---------- Distant ranges ---------- */

const farRight = ridge(
  [
    [1620, 640],
    [1460, 585],
    [1330, 612],
    [1190, 558],
    [1040, 604],
    [880, 628],
  ],
  0.18,
  1,
)
const farLeft = ridge(
  [
    [360, 640],
    [230, 566],
    [120, 590],
    [-40, 545],
  ],
  0.18,
  2,
)
export const farRanges = [farLeft, farRight]

export function FarRanges() {
  return (
    <>
      <defs>
        <Fade
          id="g-far"
          y1={540}
          y2={780}
          stops={[
            [0, 'var(--mtn-far)'],
            [1, 'var(--mtn-far)', 0],
          ]}
        />
      </defs>
      <g filter="url(#wash)">
        {farRanges.map((r) => (
          <path key={r[0][0]} d={silhouette(r, H)} fill="url(#g-far)" />
        ))}
      </g>
    </>
  )
}

/* ---------- The pagoda ---------- */

/**
 * A pagoda in silhouette, standing on [x, y]: stacked storeys, each under a
 * roof whose eaves turn up at the tips, with a spire on top. Drawn in ink
 * that fades out at its foot, as if mist is rising around it.
 *
 * At scale 1 it is 100 units wide at the base and about 190 tall.
 */
export function Pagoda({
  id,
  x,
  y,
  scale = 1,
  tiers = 5,
  lanterns = false,
}: {
  id: string
  x: number
  y: number
  scale?: number
  tiers?: number
  lanterns?: boolean
}) {
  const parts: ReactNode[] = []
  const lights: Point[] = []
  let base = 0 // y of the current storey's floor, going up (negative)

  parts.push(<rect key="plinth" x={-46} y={-8} width={92} height={10} />)
  base = -8

  for (let i = 0; i < tiers; i++) {
    const bodyW = 58 - i * 7
    const bodyH = 21 - i * 1.4
    const roofW = bodyW + 48 - i * 2
    const roofH = 11
    const eave = base - bodyH // the roof's lower edge
    const top = eave - roofH
    const topW = bodyW * 0.5

    parts.push(<rect key={`body-${i}`} x={-bodyW / 2} y={eave} width={bodyW} height={bodyH} opacity={0.72} />)
    parts.push(
      <path
        key={`roof-${i}`}
        d={`M${-roofW / 2} ${eave - 6}
            Q${-roofW * 0.3} ${eave + 3} 0 ${eave + 2.5}
            Q${roofW * 0.3} ${eave + 3} ${roofW / 2} ${eave - 6}
            Q${roofW * 0.3} ${eave - 3} ${topW / 2} ${top}
            L${-topW / 2} ${top}
            Q${-roofW * 0.3} ${eave - 3} ${-roofW / 2} ${eave - 6}Z`}
      />,
    )
    lights.push([-roofW / 2 + 6, eave + 4], [roofW / 2 - 6, eave + 4])
    base = top
  }

  // Spire: a mast with a few rings.
  parts.push(<rect key="mast" x={-1.6} y={base - 34} width={3.2} height={34} />)
  for (let r = 0; r < 4; r++)
    parts.push(<rect key={`ring-${r}`} x={-5 + r * 0.6} y={base - 8 - r * 6} width={10 - r * 1.2} height={2.4} />)

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <defs>
        <Fade
          id={`${id}-fade`}
          y1={-190}
          y2={0}
          stops={[
            [0, 'var(--ink-700)', 0.92],
            [0.7, 'var(--ink-500)', 0.7],
            [1, 'var(--ink-500)', 0.1],
          ]}
        />
      </defs>
      <g filter="url(#ink)" style={{ fill: `url(#${id}-fade)` }}>
        {parts}
      </g>
      {lanterns &&
        lights.map(([lx, ly]) => (
          <ellipse
            key={`${lx},${ly}`}
            cx={lx}
            cy={ly}
            rx={1.8}
            ry={2.6}
            style={{ fill: 'var(--seal-red)' }}
            opacity={0.8}
          />
        ))}
    </g>
  )
}
