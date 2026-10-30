// The scroll painting (emaki: a long painted scroll, unrolled sideways as
// you read). A landscape is held behind the page below the hero. As you
// scroll down it slides sideways, near things faster than far ones, so the
// scene unrolls: snow peaks in alpine glow, a lake with a torii gate and a
// boat, then hills with a pagoda and cherry trees in flower. The sky drifts
// from the hero's rose dawn toward dusk.
//
// Three sheets, back to front, each its own <svg> so it can slide on its own:
//   far   peaks and the distant range, birds
//   mid   hills, the lake, the torii, the boat, the pagoda, cherry trees
//   near  dark ink rocks along the bottom edge, with a cherry tree or two

import { useEffect, useRef, type JSX } from 'react'
import { seededRandom } from '../../game/rng'
import { Fade, InkedRidge, Pagoda, Peak } from '../hero/painting'
import { heightAt, ridge, silhouette, taper, type Point } from '../hero/ridge'
import { blob } from '../hero/treeParts'

const W = 4800
const H = 1000

/*
 * Every landform here is painted with the hero's own brushes, so the two
 * read as one painting: ridgelines roughened the same way, the same washes,
 * ink gathered along each ridge, and the hero's snow peak placed again at
 * other sizes. Hills have a clear summit every short stretch, never a long
 * flat run.
 */

/* ---------- Far: the distant range, snow peaks in alpine glow, birds ---------- */

const range = ridge(
  [
    [-40, 640],
    [180, 560],
    [420, 610],
    [700, 540],
    [980, 600],
    [1300, 520],
    [1600, 590],
    [1900, 610],
    [2300, 550],
    [2650, 600],
    [3000, 530],
    [3350, 590],
    [3700, 560],
    [4050, 610],
    [4400, 540],
    [4840, 620],
  ],
  0.18,
  91,
)

/** Snow peaks along the scroll: summit (x, top), size, and a seed so each has its own ridgelines. */
const peaks = [
  { x: 560, top: 330, scale: 0.8, seed: 21 },
  { x: 1300, top: 420, scale: 0.6, seed: 31 },
  { x: 2600, top: 450, scale: 0.55, seed: 41 },
  { x: 3950, top: 350, scale: 0.75, seed: 51 },
]

/** Birds far off, each a flick of the brush: x, y and size. */
const birds = [
  [760, 200, 1],
  [820, 236, 0.75],
  [870, 212, 0.6],
  [2400, 260, 0.9],
  [2460, 282, 0.7],
  [4350, 230, 0.8],
]

function Far() {
  return (
    <>
      <defs>
        <Fade
          id="ek-range"
          y1={520}
          y2={860}
          stops={[
            [0, 'var(--mtn-far)'],
            [1, 'var(--mtn-far)', 0],
          ]}
        />
      </defs>
      <g filter="url(#wash)">
        <path d={silhouette(range, H)} fill="url(#ek-range)" />
      </g>
      {peaks.map((p, i) => (
        <Peak key={i} id={`ek-peak-${i}`} x={p.x} top={p.top} scale={p.scale} seed={p.seed} glow={1} />
      ))}
      <g filter="url(#ink)" fill="none" strokeLinecap="round" style={{ stroke: 'var(--ink-700)' }}>
        {birds.map(([x, y, s]) => (
          <path
            key={x}
            d={`M${x - 14 * s} ${y + 3 * s}Q${x - 6 * s} ${y - 8 * s} ${x} ${y}Q${x + 6 * s} ${y - 8 * s} ${x + 14 * s} ${y + 3 * s}`}
            strokeWidth={2.6}
          />
        ))}
      </g>
    </>
  )
}

/* ---------- Mid: hills, the lake, the torii, the boat, the pagoda, cherry trees ---------- */

const LAKE = 840
const hillsLeft = ridge(
  [
    [-40, 760],
    [120, 680],
    [260, 712],
    [420, 646],
    [560, 700],
    [720, 736],
    [880, 684],
    [1040, 724],
    [1200, 792],
    [1360, 868],
  ],
  0.25,
  92,
)
const hillsRight = ridge(
  [
    [3000, 868],
    [3140, 780],
    [3300, 716],
    [3460, 758],
    [3620, 676],
    [3780, 708],
    [3940, 650],
    [4120, 716],
    [4300, 686],
    [4500, 736],
    [4660, 690],
    [4840, 720],
  ],
  0.25,
  93,
)
const island = ridge(
  [
    [2120, LAKE + 4],
    [2180, 822],
    [2250, 808],
    [2320, 818],
    [2380, LAKE + 4],
  ],
  0.25,
  94,
)
const ripples = [
  [1700, 880, 160],
  [2000, 905, 240],
  [2500, 885, 200],
  [1850, 940, 300],
  [2650, 950, 180],
  [2300, 975, 260],
]

/** A band of hills in the hero's middle-distance style: a wash fading downward, ink along the ridge. */
function Hills({ id, points }: { id: string; points: Point[] }) {
  return (
    <>
      <defs>
        <Fade
          id={`${id}-fill`}
          y1={630}
          y2={940}
          stops={[
            [0, 'var(--mtn-mid)'],
            [1, 'var(--mtn-mid)', 0],
          ]}
        />
        <Fade
          id={`${id}-ink`}
          y1={630}
          y2={860}
          stops={[
            [0, 'var(--ink-700)', 0.55],
            [1, 'var(--ink-700)', 0],
          ]}
        />
      </defs>
      <g filter="url(#wash)">
        <path d={silhouette(points, H)} fill={`url(#${id}-fill)`} />
        <InkedRidge id={`${id}-clip`} points={points} ink={`url(#${id}-ink)`} width={26} />
      </g>
    </>
  )
}

/** A small cherry tree: a crooked trunk, a few limbs, and a crown of pink blots. */
function CherryTree({ x, y, scale = 1, seed }: { x: number; y: number; scale?: number; seed: number }) {
  const random = seededRandom(seed)
  const s = scale
  const trunk: Point[] = [
    [x, y],
    [x + 6 * s, y - 40 * s],
    [x - 4 * s, y - 80 * s],
    [x + 8 * s, y - 120 * s],
  ]
  const top = trunk[3]
  const limbs = [-1, 0, 1].map((side) => {
    const end: Point = [top[0] + side * (50 + random() * 30) * s, top[1] - (25 + random() * 35) * s]
    return ridge([top, end], 0.2, seed + side + 5, 3)
  })
  const crown = [top, ...limbs.map((l) => l[l.length - 1])]
  const dab = (key: string, d: string, tone: string, opacity: number) => (
    <path key={key} d={d} opacity={opacity} style={{ fill: `var(${tone})`, mixBlendMode: 'multiply' }} />
  )
  return (
    <g>
      <g filter="url(#ink)" style={{ fill: 'var(--ink-900)' }} opacity={0.8}>
        <path d={taper(trunk, 9 * s, 4 * s)} />
        {limbs.map((l, i) => (
          <path key={i} d={taper(l, 4 * s, 1)} />
        ))}
      </g>
      <g filter="url(#bloom)">
        {crown.flatMap(([cx, cy], i) => [
          dab(`a${i}`, blob(cx, cy - 6 * s, 34 * s, random, 0.5, 0.75), '--sakura-100', 0.55),
          dab(`b${i}`, blob(cx + 6 * s, cy, 20 * s, random, 0.5, 0.8), '--sakura-300', 0.6),
          dab(`c${i}`, blob(cx - 8 * s, cy + 4 * s, 8 * s, random, 0.5, 0.8), '--sakura-500', 0.6),
        ])}
      </g>
    </g>
  )
}

/** A torii, the gate of a shrine: two posts, a beam across, and a curved lintel on top. */
function Torii({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const s = scale
  return (
    <g filter="url(#ink)" style={{ fill: 'var(--seal-red)' }} opacity={0.85}>
      <rect x={x - 38 * s} y={y - 92 * s} width={8 * s} height={92 * s} />
      <rect x={x + 30 * s} y={y - 92 * s} width={8 * s} height={92 * s} />
      <rect x={x - 48 * s} y={y - 76 * s} width={96 * s} height={7 * s} />
      <rect x={x - 54 * s} y={y - 96 * s} width={108 * s} height={6 * s} />
      <path
        d={`M${x - 62 * s} ${y - 98 * s}Q${x} ${y - 90 * s} ${x + 62 * s} ${y - 98 * s}L${x + 58 * s} ${y - 108 * s}Q${x} ${y - 101 * s} ${x - 58 * s} ${y - 108 * s}Z`}
        style={{ fill: 'var(--ink-900)' }}
      />
    </g>
  )
}

/** A small boat with a figure and a pole, the way they sit in ink paintings of lakes. */
function Boat({ x, y }: { x: number; y: number }) {
  return (
    <g filter="url(#ink)" style={{ fill: 'var(--ink-900)', stroke: 'var(--ink-900)' }} opacity={0.75}>
      <path
        d={`M${x - 46} ${y - 6}Q${x} ${y + 10} ${x + 52} ${y - 8}L${x + 44} ${y + 2}Q${x} ${y + 12} ${x - 38} ${y + 3}Z`}
        stroke="none"
      />
      <path d={`M${x - 4} ${y - 4}L${x - 1} ${y - 26}L${x + 6} ${y - 26}L${x + 8} ${y - 4}Z`} stroke="none" />
      <circle cx={x + 2} cy={y - 31} r={5} stroke="none" />
      <path d={`M${x + 8} ${y - 22}L${x + 46} ${y - 64}`} strokeWidth={2} fill="none" />
    </g>
  )
}

function Mid() {
  return (
    <>
      <defs>
        <Fade
          id="ek-lake"
          y1={LAKE}
          y2={H}
          stops={[
            [0, 'var(--mist-teal)', 0.55],
            [1, 'var(--mist-teal)', 0.15],
          ]}
        />
        <Fade
          id="ek-island"
          y1={800}
          y2={LAKE + 6}
          stops={[
            [0, 'var(--ink-700)', 0.8],
            [1, 'var(--ink-500)', 0.4],
          ]}
        />
      </defs>
      {/* The lake: its ends slope away under the hills on either side, so the water has no edge of its own. */}
      <path d={`M1300 ${LAKE}H3020L3170 ${H}H1180Z`} fill="url(#ek-lake)" filter="url(#wash)" />
      <g filter="url(#dry-brush)" strokeLinecap="round" style={{ stroke: 'var(--ink-300)' }}>
        {ripples.map(([x, y, l]) => (
          <path key={`${x},${y}`} d={`M${x} ${y}h${l}`} strokeWidth={2.4} opacity={0.8} />
        ))}
      </g>
      <g filter="url(#wash)">
        <path d={silhouette(island, LAKE + 8)} fill="url(#ek-island)" />
      </g>
      <CherryTree x={2250} y={812} scale={0.8} seed={61} />
      <Torii x={1600} y={LAKE + 8} scale={1.1} />
      <Boat x={2620} y={LAKE + 60} />
      <Hills id="ek-hills-left" points={hillsLeft} />
      <Hills id="ek-hills-right" points={hillsRight} />
      <Pagoda id="ek-pagoda" x={3700} y={heightAt(hillsRight, 3700) + 8} scale={1.05} lanterns />
      <CherryTree x={320} y={heightAt(hillsLeft, 320) + 6} seed={62} />
      <CherryTree x={1050} y={heightAt(hillsLeft, 1050) + 6} scale={0.85} seed={63} />
      <CherryTree x={3420} y={heightAt(hillsRight, 3420) + 6} scale={0.9} seed={64} />
      <CherryTree x={4060} y={heightAt(hillsRight, 4060) + 6} seed={65} />
      <CherryTree x={4450} y={heightAt(hillsRight, 4450) + 6} scale={0.8} seed={66} />
    </>
  )
}

/* ---------- Near: dark ink rocks along the bottom edge, as in the hero ---------- */

const rocks = [
  ridge(
    [
      [-40, 1000],
      [80, 900],
      [220, 860],
      [360, 890],
      [520, 960],
      [620, 1000],
    ],
    0.3,
    95,
  ),
  ridge(
    [
      [2900, 1000],
      [3020, 920],
      [3180, 880],
      [3320, 910],
      [3460, 980],
      [3540, 1000],
    ],
    0.3,
    96,
  ),
  ridge(
    [
      [4300, 1000],
      [4420, 900],
      [4600, 870],
      [4840, 900],
    ],
    0.3,
    97,
  ),
]

function Near() {
  return (
    <>
      <defs>
        <Fade
          id="ek-rock"
          y1={860}
          y2={990}
          stops={[
            [0, 'var(--mtn-near)', 0.8],
            [0.55, 'var(--mtn-near)', 0.4],
            [1, 'var(--mtn-near)', 0],
          ]}
        />
        <Fade
          id="ek-rock-ink"
          y1={860}
          y2={960}
          stops={[
            [0, 'var(--ink-900)', 0.45],
            [1, 'var(--ink-900)', 0],
          ]}
        />
      </defs>
      <g filter="url(#wash)">
        {rocks.map((r, i) => (
          <g key={i}>
            <path d={silhouette(r, H)} fill="url(#ek-rock)" />
            <InkedRidge id={`ek-rock-${i}`} points={r} ink="url(#ek-rock-ink)" width={30} />
          </g>
        ))}
      </g>
      <CherryTree x={220} y={866} scale={1.25} seed={71} />
      <CherryTree x={3180} y={886} scale={1.1} seed={72} />
    </>
  )
}

export function Emaki() {
  const stage = useRef<HTMLDivElement>(null)

  // How far through the page you are, from 0 to 1, drives the slide and the light.
  useEffect(() => {
    const el = stage.current?.parentElement
    if (!el || !stage.current) return
    // How far each sheet slides across its width: far ones a little, near ones all the way.
    const sheets: Array<[SVGSVGElement, number]> = [
      [stage.current.querySelector<SVGSVGElement>('.emaki-far')!, 0.45],
      [stage.current.querySelector<SVGSVGElement>('.emaki-mid')!, 0.75],
      [stage.current.querySelector<SVGSVGElement>('.emaki-near')!, 1],
    ]
    const dusk = stage.current.querySelector<HTMLElement>('.emaki-dusk')
    let frame = 0
    const update = () => {
      frame = 0
      const box = el.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, -box.top / Math.max(1, box.height - window.innerHeight)))
      // Each sheet is moved directly (a transform the graphics card handles alone), which keeps scrolling smooth.
      for (const [sheet, pace] of sheets) {
        // The sheet's width follows from its height and the painting's proportions (W × H), which every
        // browser reports the same way; how far it can slide is whatever of it is off screen.
        const width = (sheet.getBoundingClientRect().height * W) / H
        const travel = Math.max(0, width - window.innerWidth)
        sheet.style.transform = `translate3d(${(-progress * travel * pace).toFixed(1)}px, 0, 0)`
      }
      if (dusk) dusk.style.opacity = (progress * 0.85).toFixed(3)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  const sheet = (name: string, content: JSX.Element) => (
    <svg className={`emaki-layer emaki-${name}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMax slice">
      {content}
    </svg>
  )

  return (
    <div className="emaki" aria-hidden="true">
      <div className="emaki-stage" ref={stage}>
        <div className="emaki-dusk" />
        {sheet('far', <Far />)}
        <div className="emaki-mist emaki-mist-high" />
        {sheet('mid', <Mid />)}
        <div className="emaki-mist emaki-mist-low" />
        {sheet('near', <Near />)}
      </div>
    </div>
  )
}
