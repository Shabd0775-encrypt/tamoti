// The hero painting: a snow peak in alpine glow, a temple glimpsed in the
// mist below it, and a still lake in the lower right that holds their
// reflection. As the page scrolls, the reflection stretches down the water
// and fades, as if the surface were stirring.

import { Fade, FarRanges, H, InkedRidge, Layer, Pagoda, Peak, W } from './painting'
import { heightAt, ridge, silhouette, type Point } from './ridge'
import type { TreeShape } from './Tree'

const midLeft = ridge(
  [
    [540, 810],
    [380, 708],
    [260, 646],
    [140, 676],
    [-40, 626],
  ],
  0.25,
  22,
)
const near = ridge(
  [
    [760, 1000],
    [600, 904],
    [460, 852],
    [340, 806],
    [220, 776],
    [100, 748],
    [-40, 708],
  ],
  0.3,
  31,
)
const templeHill = ridge(
  [
    [380, 840],
    [480, 748],
    [580, 720],
    [700, 732],
    [820, 772],
    [930, 800],
  ],
  0.2,
  41,
)

// The lake: its far shore is a level line; its near shore curves away to the lower left.
const HORIZON = 790
const lake = `M${W + 20} ${HORIZON}L860 ${HORIZON}C800 ${HORIZON + 30} 790 880 720 ${H + 20}L${W + 20} ${H + 20}Z`
// Low hills along the far shore: they sit just under the words, and their reflection fills the lake.
const farShore = ridge([[880, HORIZON + 2], [980, 752], [1090, 724], [1210, 744], [1340, 708], [1480, 736], [1620, 718]], 0.22, 71) // prettier-ignore
const ripples = [
  [960, 812, 140],
  [1240, 822, 220],
  [1060, 846, 260],
  [1400, 858, 160],
  [900, 884, 180],
  [1180, 900, 300],
  [1450, 930, 140],
  [1000, 950, 240],
]

/** A few birds far off, each a single flick of the brush: x, y and size. */
const birds = [
  [700, 150, 1],
  [752, 188, 0.7],
  [792, 166, 0.55],
]

function MidRidge({ id, points }: { id: string; points: Point[] }) {
  return (
    <>
      <defs>
        <Fade
          id={`${id}-fill`}
          y1={630}
          y2={900}
          stops={[
            [0, 'var(--mtn-mid)'],
            [1, 'var(--mtn-mid)', 0],
          ]}
        />
        <Fade
          id={`${id}-ink`}
          y1={630}
          y2={840}
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

export function Backdrop() {
  return (
    <>
      <Layer depth={0.42}>
        <g id="art-far">
          <FarRanges />
        </g>
        <g className="birds" filter="url(#ink)" fill="none" strokeLinecap="round" style={{ stroke: 'var(--ink-700)' }}>
          {birds.map(([x, y, s]) => (
            <path
              key={x}
              d={`M${x - 11 * s} ${y + 2 * s}Q${x - 5 * s} ${y - 6 * s} ${x} ${y}Q${x + 5 * s} ${y - 6 * s} ${x + 11 * s} ${y + 2 * s}`}
              strokeWidth={2.4}
            />
          ))}
        </g>
      </Layer>

      <Layer depth={0.36}>
        <g id="art-peak">
          <Peak glow={1} />
        </g>
      </Layer>

      <div className="mist mist-high" data-depth={0.3} />

      {/* The water itself: a pale teal wash. */}
      <Layer depth={0.28}>
        <defs>
          <Fade
            id="g-water"
            y1={HORIZON}
            y2={H}
            stops={[
              [0, 'var(--mist-teal)', 0.45],
              [1, 'var(--mist-teal)', 0.1],
            ]}
          />
          <Fade
            id="g-shore"
            y1={706}
            y2={HORIZON}
            stops={[
              [0, 'var(--ink-500)', 0.85],
              [1, 'var(--ink-300)', 0.9],
            ]}
          />
        </defs>
        <g id="art-shore" filter="url(#wash)">
          <path d={silhouette(farShore, HORIZON + 4)} fill="url(#g-shore)" />
        </g>
        <path d={lake} fill="url(#g-water)" filter="url(#wash)" />
      </Layer>

      {/*
        The reflection: the peak and far ranges, flipped upside down at the
        shoreline and blurred by ripples. It's its own sheet so the scroll can
        stretch it downward and fade it (see useParallax: data-stretch, data-fade).
      */}
      <svg
        className="mtn-layer reflection"
        data-depth={0.28}
        data-stretch={2.2}
        data-fade={1.6}
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
      >
        <defs>
          <clipPath id="clip-lake">
            <path d={lake} />
          </clipPath>
        </defs>
        <g clipPath="url(#clip-lake)">
          <g filter="url(#ripple)" opacity={0.95} transform={`translate(0 ${HORIZON * 2}) scale(1 -1)`}>
            <use href="#art-far" />
            <use href="#art-peak" />
            <use href="#art-shore" />
          </g>
        </g>
      </svg>

      {/* The surface on top: the reflection fades toward the near shore, and a few ripples catch the light. */}
      <Layer depth={0.28}>
        <defs>
          <Fade
            id="g-surface"
            y1={HORIZON}
            y2={H}
            stops={[
              [0, 'var(--paper)', 0],
              [0.5, 'var(--paper)', 0.15],
              [1, 'var(--paper)', 0.6],
            ]}
          />
        </defs>
        <path d={lake} fill="url(#g-surface)" />
        <g filter="url(#dry-brush)" strokeLinecap="round" style={{ stroke: 'var(--ink-300)' }}>
          {ripples.map(([x, y, length]) => (
            <path key={`${x},${y}`} d={`M${x} ${y}h${length}`} strokeWidth={2.4} opacity={0.75} />
          ))}
        </g>
      </Layer>

      <Layer depth={0.26}>
        <MidRidge id="mid-left" points={midLeft} />
        <MidRidge id="temple-hill" points={templeHill} />
        <Pagoda id="pagoda" x={760} y={heightAt(templeHill, 760) + 6} scale={0.66} lanterns />
      </Layer>

      <div className="mist mist-low" data-depth={0.18} />

      <Layer depth={0.12}>
        <defs>
          <Fade
            id="g-near"
            y1={700}
            y2={990}
            stops={[
              [0, 'var(--mtn-near)', 0.8],
              [0.55, 'var(--mtn-near)', 0.4],
              [1, 'var(--mtn-near)', 0],
            ]}
          />
          <Fade
            id="g-near-ink"
            y1={700}
            y2={920}
            stops={[
              [0, 'var(--ink-900)', 0.45],
              [1, 'var(--ink-900)', 0],
            ]}
          />
        </defs>
        <g filter="url(#wash)">
          <path d={silhouette(near, H)} fill="url(#g-near)" />
          <InkedRidge id="clip-near" points={near} ink="url(#g-near-ink)" width={30} />
        </g>
      </Layer>
    </>
  )
}

/** Two cherry trees on one rock: a tall one, and a lower one spreading out to the right. */
export const treeShape: TreeShape = {
  seed: 12,
  hill: [
    [-20, 760],
    [80, 736],
    [190, 744],
    [300, 782],
    [420, 846],
    [560, 910],
    [700, 960],
    [860, 1000],
  ],
  trunks: [
    { base: [190, 750], angle: -82, length: 190, width: 30, spread: 32, depth: 5 },
    { base: [262, 774], angle: -42, length: 150, width: 22, spread: 30, depth: 4 },
  ],
  reach: 650,
  flatten: 1,
}
