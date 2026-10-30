// Option 1, the scroll painting (emaki: a long painted scroll, unrolled
// sideways as you read). A pale landscape is held behind the page below the
// hero. As you scroll down, it slides sideways, nearer hills faster than far
// ones, so the scene unrolls: mountains, then a lake, then hills with a
// pagoda. The sky drifts from the hero's rose dawn toward dusk.
//
// It's kept very pale, because it always sits behind text.

import { useEffect, useRef } from 'react'
import { Fade, Pagoda } from '../hero/painting'
import { heightAt, ridge, silhouette } from '../hero/ridge'

const W = 4800
const H = 1000

const far = ridge(
  [
    [-40, 640],
    [400, 520],
    [800, 600],
    [1300, 470],
    [1800, 590],
    [2600, 610],
    [3200, 520],
    [3800, 600],
    [4300, 540],
    [4840, 610],
  ],
  0.16,
  91,
)
// Near hills on either side of the lake, dipping down into it.
const nearLeft = ridge(
  [
    [-40, 800],
    [500, 720],
    [1000, 790],
    [1400, 900],
    [1620, 1000],
  ],
  0.22,
  92,
)
const nearRight = ridge(
  [
    [2850, 1000],
    [3020, 880],
    [3300, 740],
    [3700, 700],
    [4100, 760],
    [4840, 780],
  ],
  0.22,
  93,
)

export function Emaki() {
  const stage = useRef<HTMLDivElement>(null)

  // How far through the page you are, from 0 to 1, drives the slide and the light.
  useEffect(() => {
    const el = stage.current?.parentElement
    if (!el) return
    let frame = 0
    const update = () => {
      frame = 0
      const box = el.getBoundingClientRect()
      const progress = Math.min(1, Math.max(0, -box.top / Math.max(1, box.height - window.innerHeight)))
      stage.current?.style.setProperty('--p', progress.toFixed(4))
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

  return (
    <div className="emaki" aria-hidden="true">
      <div className="emaki-stage" ref={stage}>
        <div className="emaki-dusk" />
        <svg className="emaki-layer emaki-far" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMax slice">
          <defs>
            <Fade
              id="emaki-g-far"
              y1={460}
              y2={820}
              stops={[
                [0, 'var(--mtn-far)'],
                [1, 'var(--mtn-far)', 0],
              ]}
            />
          </defs>
          <path d={silhouette(far, H)} fill="url(#emaki-g-far)" filter="url(#wash)" />
        </svg>
        <svg className="emaki-layer emaki-near" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMinYMax slice">
          <defs>
            <Fade
              id="emaki-g-near"
              y1={690}
              y2={960}
              stops={[
                [0, 'var(--mtn-mid)'],
                [1, 'var(--mtn-mid)', 0],
              ]}
            />
            <Fade
              id="emaki-g-lake"
              y1={850}
              y2={H}
              stops={[
                [0, 'var(--mist-teal)', 0.4],
                [1, 'var(--mist-teal)', 0.1],
              ]}
            />
          </defs>
          {/* The lake, in the middle stretch of the scroll. */}
          <path d={`M1300 860H3100V${H}H1300Z`} fill="url(#emaki-g-lake)" filter="url(#wash)" />
          <path d={silhouette(nearLeft, H)} fill="url(#emaki-g-near)" filter="url(#wash)" />
          <path d={silhouette(nearRight, H)} fill="url(#emaki-g-near)" filter="url(#wash)" />
          <Pagoda id="emaki-pagoda" x={3700} y={heightAt(nearRight, 3700) + 8} scale={0.9} />
        </svg>
      </div>
    </div>
  )
}
