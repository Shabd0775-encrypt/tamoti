// The painting behind one section of the library, for options 2 and 3:
//
//   vignettes  one small painted thing per section, in the page's margins,
//              never behind the words: a branch, a pagoda in mist, reeds at
//              a shoreline, a far range with birds;
//   washes     soft, wide blots of watercolor bleeding across the paper,
//              a different color behind each section.
//
// Option 1 (the scroll painting) is drawn once for the whole page instead: see Emaki.tsx.

import { useContext, type JSX } from 'react'
import { seededRandom } from '../../game/rng'
import { Fade, Pagoda } from '../hero/painting'
import { heightAt, ridge, silhouette, taper, type Point } from '../hero/ridge'
import { Tree, type TreeShape } from '../hero/Tree'
import { blob } from '../hero/treeParts'
import { BackdropContext } from './choice'

export type SectionName = 'howto' | 'boards' | 'pieces' | 'puzzles'

/* ---------- Vignettes ---------- */

/** One flowering limb reaching in from the left edge (its rock lies out of sight below the frame). */
const branch: TreeShape = {
  seed: 21,
  hill: [
    [-20, 1200],
    [1020, 1200],
  ],
  trunks: [{ base: [-30, 430], angle: -10, length: 280, width: 20, spread: 34, depth: 4 }],
  reach: 920,
  flatten: 0.75,
}

function PagodaInMist() {
  const hill = ridge(
    [
      [0, 430],
      [90, 395],
      [200, 372],
      [320, 398],
      [400, 420],
    ],
    0.2,
    71,
  )
  return (
    <svg viewBox="0 0 400 500">
      <defs>
        <Fade
          id="vg-hill"
          y1={360}
          y2={500}
          stops={[
            [0, 'var(--mtn-mid)'],
            [1, 'var(--mtn-mid)', 0],
          ]}
        />
        <Fade
          id="vg-mist"
          y1={300}
          y2={480}
          stops={[
            [0, 'var(--paper)', 0],
            [1, 'var(--paper)', 0.95],
          ]}
        />
      </defs>
      <Pagoda id="vg-pagoda" x={200} y={heightAt(hill, 200) + 6} scale={1.35} lanterns />
      <path d={silhouette(hill, 500)} fill="url(#vg-hill)" filter="url(#wash)" />
      <rect x={0} y={300} width={400} height={200} fill="url(#vg-mist)" />
    </svg>
  )
}

function Reeds() {
  const random = seededRandom(33)
  const reeds = Array.from({ length: 11 }, (_, i) => {
    const x = 60 + i * 26 + random() * 14
    const height = 120 + random() * 110
    const lean = (random() - 0.4) * 50
    const points: Point[] = Array.from({ length: 6 }, (_, k) => {
      const t = k / 5
      return [x + lean * t * t, 290 - height * t]
    })
    return { d: taper(points, 3.2, 0.6), head: points[5], tall: i % 3 === 0 }
  })
  const ripples = [
    [40, 296, 120],
    [200, 304, 160],
    [110, 318, 220],
    [300, 312, 120],
  ]
  return (
    <svg viewBox="0 0 460 340">
      <defs>
        <Fade
          id="vg-water"
          y1={280}
          y2={340}
          stops={[
            [0, 'var(--mist-teal)', 0.45],
            [1, 'var(--mist-teal)', 0],
          ]}
        />
      </defs>
      <path d="M0 282Q230 272 460 284V340H0Z" fill="url(#vg-water)" filter="url(#wash)" />
      <g filter="url(#ink)" style={{ fill: 'var(--ink-700)' }} opacity={0.75}>
        {reeds.map((r, i) => (
          <path key={i} d={r.d} />
        ))}
        {reeds
          .filter((r) => r.tall)
          .map((r, i) => (
            <ellipse key={i} cx={r.head[0]} cy={r.head[1] + 10} rx={3.5} ry={11} style={{ fill: 'var(--ink-900)' }} />
          ))}
      </g>
      <g filter="url(#dry-brush)" style={{ stroke: 'var(--ink-300)' }} strokeLinecap="round">
        {ripples.map(([x, y, l]) => (
          <path key={`${x},${y}`} d={`M${x} ${y}h${l}`} strokeWidth={2} />
        ))}
      </g>
    </svg>
  )
}

function FarRangeWithBirds() {
  const back = ridge(
    [
      [0, 240],
      [120, 170],
      [260, 205],
      [380, 140],
      [520, 190],
      [600, 175],
    ],
    0.18,
    81,
  )
  const front = ridge(
    [
      [0, 270],
      [140, 232],
      [300, 258],
      [460, 222],
      [600, 250],
    ],
    0.2,
    82,
  )
  const birds = [
    [230, 70, 1],
    [280, 98, 0.75],
    [318, 80, 0.6],
  ]
  return (
    <svg viewBox="0 0 600 320">
      <defs>
        <Fade
          id="vg-back"
          y1={140}
          y2={300}
          stops={[
            [0, 'var(--mtn-far)'],
            [1, 'var(--mtn-far)', 0],
          ]}
        />
        <Fade
          id="vg-front"
          y1={220}
          y2={320}
          stops={[
            [0, 'var(--mtn-mid)'],
            [1, 'var(--mtn-mid)', 0],
          ]}
        />
      </defs>
      <path d={silhouette(back, 320)} fill="url(#vg-back)" filter="url(#wash)" />
      <path d={silhouette(front, 320)} fill="url(#vg-front)" filter="url(#wash)" />
      <g filter="url(#ink)" fill="none" strokeLinecap="round" style={{ stroke: 'var(--ink-700)' }}>
        {birds.map(([x, y, s]) => (
          <path
            key={x}
            d={`M${x - 11 * s} ${y + 2 * s}Q${x - 5 * s} ${y - 6 * s} ${x} ${y}Q${x + 5 * s} ${y - 6 * s} ${x + 11 * s} ${y + 2 * s}`}
            strokeWidth={2.2}
          />
        ))}
      </g>
    </svg>
  )
}

const vignettes: Record<SectionName, () => JSX.Element> = {
  howto: () => <Tree id="vg-branch" shape={branch} />,
  boards: PagodaInMist,
  pieces: Reeds,
  puzzles: FarRangeWithBirds,
}

/* ---------- Washes ---------- */

/** Big soft blots for each section: where (x, y in a 1600 × 800 frame), how big, and which color. */
const washes: Record<SectionName, Array<[number, number, number, string]>> = {
  howto: [
    [260, 380, 380, '--mist-teal'],
    [1380, 220, 260, '--sakura-100'],
  ],
  boards: [
    [1320, 420, 420, '--sakura-100'],
    [180, 560, 240, '--glow-100'],
  ],
  pieces: [
    [300, 420, 400, '--glow-100'],
    [1400, 300, 280, '--mist-teal'],
  ],
  puzzles: [
    [1300, 260, 380, '--mist-teal'],
    [260, 620, 420, '--sakura-100'],
  ],
}

function Wash({ name }: { name: SectionName }) {
  const random = seededRandom(name.length * 97)
  return (
    <svg viewBox="0 0 1600 800" preserveAspectRatio="none">
      <g filter="url(#bloom-wet)">
        {washes[name].flatMap(([x, y, r, tone], i) => [
          <path key={`${i}a`} d={blob(x, y, r, random, 0.5, 0.7)} opacity={0.3} style={{ fill: `var(${tone})` }} />,
          <path
            key={`${i}b`}
            d={blob(x + r * 0.25, y + r * 0.1, r * 0.55, random, 0.6, 0.7)}
            opacity={0.2}
            style={{ fill: `var(${tone})`, mixBlendMode: 'multiply' }}
          />,
        ])}
      </g>
    </svg>
  )
}

/* ---------- The piece each section includes ---------- */

export function SectionArt({ name }: { name: SectionName }) {
  const backdrop = useContext(BackdropContext)
  if (backdrop === 'vignettes') {
    const Vignette = vignettes[name]
    return (
      <div className={`section-art vignette vignette-${name}`} aria-hidden="true">
        <Vignette />
      </div>
    )
  }
  if (backdrop === 'washes') {
    return (
      <div className="section-art wash" aria-hidden="true">
        <Wash name={name} />
      </div>
    )
  }
  return null
}
