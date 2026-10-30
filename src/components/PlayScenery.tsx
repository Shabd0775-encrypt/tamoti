// The quiet painting behind the play screen: the same peak and far ranges as
// the library's hero, faded right back so the board stays the thing you
// look at, with the rose glow and a few petals drifting through.

import { FarRanges, Layer, Peak } from './hero/painting'
import { Petals } from './hero/Petals'

export function PlayScenery() {
  return (
    <div className="play-scenery" aria-hidden="true">
      <div className="hero-glow" />
      <div className="play-range">
        <Layer depth={0}>
          <FarRanges />
        </Layer>
        <Layer depth={0}>
          <Peak glow={0.8} />
        </Layer>
      </div>
      <Petals density={0.3} />
    </div>
  )
}

/**
 * A see-through layer in front of everything, for the gust of petals that
 * blows across when a board is solved. `gust` changes once per solve.
 */
export function SolveGust({ gust }: { gust: number }) {
  return (
    <div className="solve-gust" aria-hidden="true">
      <Petals density={0} gust={gust} />
    </div>
  )
}
