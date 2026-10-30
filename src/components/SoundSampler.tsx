// TEMPORARY: a small bar on the play screen for choosing the sound a piece
// makes as it's put down. Pressing a name plays that sound and makes it the
// one used while playing. Delete this once a sound is chosen.

import { useState } from 'react'
import { choosePlaceSound, currentPlaceSound, placeSounds, type PlaceSound } from '../state/sound'

export function SoundSampler({ soundOn }: { soundOn: boolean }) {
  const [chosen, setChosen] = useState(currentPlaceSound)

  return (
    <div className="sound-sampler">
      <div role="group" aria-label="Sound when a piece is put down">
        <span className="sampler-label">Placing sound</span>
        {(Object.keys(placeSounds) as PlaceSound[]).map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={chosen === id}
            onClick={() => {
              choosePlaceSound(id)
              setChosen(id)
            }}
          >
            {placeSounds[id].label}
          </button>
        ))}
      </div>
      {!soundOn && (
        <p className="sampler-note">Sound is off while you play: switch it on at the top to hear your choice.</p>
      )}
    </div>
  )
}
