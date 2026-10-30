// Soft sounds, made on the spot with the Web Audio API (no sound files):
// a sound when a piece is put down (one of several, being chosen), a light
// tick when it turns, and a quiet three-note chime when a board is filled.
// Off by default, and the choices are remembered in this browser.
//
// Every sound is built from two simple parts: a "note" (a pure tone that
// starts at once and fades) and a "knock" (a burst of noise, filtered to a
// pitch, which is what makes a sound feel like something touching something).

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'grid-puzzle:sound'
const PLACE_KEY = 'grid-puzzle:place-sound'

let context: AudioContext | null = null

/** The audio context is made on first use: browsers only allow sound after the visitor has clicked or tapped. */
function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  context ??= new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

/** A pure tone that starts at once and fades away. `to` slides the pitch, for a drop of water. */
function note(ctx: AudioContext, frequency: number, start: number, length: number, volume: number, to?: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, start)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + length * 0.6)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + length + 0.05)
}

/** A short burst of noise, filtered around `pitch`: the click of one thing touching another. */
function knock(
  ctx: AudioContext,
  start: number,
  pitch: number,
  volume: number,
  length = 0.05,
  type: BiquadFilterType = 'bandpass',
) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  source.buffer = buffer
  filter.type = type
  filter.frequency.value = pitch
  filter.Q.value = type === 'bandpass' ? 4 : 0.7
  gain.gain.value = volume
  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start(start)
}

/**
 * A plucked string (the Karplus-Strong method): a burst of noise fed round a
 * short loop, losing a little brightness each time round, which is close to
 * how a real string rings down. Worked out in advance, then played.
 */
function pluck(ctx: AudioContext, frequency: number, start: number, volume: number) {
  const length = Math.floor(ctx.sampleRate * 1.6)
  const period = Math.round(ctx.sampleRate / frequency)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const out = buffer.getChannelData(0)
  const loop = Float32Array.from({ length: period }, () => Math.random() * 2 - 1)
  for (let i = 0; i < length; i++) {
    const j = i % period
    const next = loop[(j + 1) % period]
    out[i] = loop[j]
    loop[j] = (loop[j] + next) * 0.4985 // average with the neighbour: the string mellows as it rings
  }
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = buffer
  gain.gain.value = volume
  source.connect(gain).connect(ctx.destination)
  source.start(start)
}

// The "in" scale, from D: D E♭ G A B♭ (and on up). Koto notes are taken from it.
const inScale = [293.7, 311.1, 392, 440, 466.2, 587.3, 622.3, 784]

/** A small random nudge to pitch, so the same sound never repeats exactly. */
const vary = (f: number) => f * (0.97 + Math.random() * 0.06)

/** The sounds a piece can make as it's put down. `size` is the piece's area in squares. */
export const placeSounds = {
  wood: {
    label: 'Wood',
    play: (ctx: AudioContext, t: number) => {
      knock(ctx, t, vary(900), 0.5)
      note(ctx, vary(220), t, 0.18, 0.12)
    },
  },
  stone: {
    label: 'Stone',
    play: (ctx: AudioContext, t: number) => {
      knock(ctx, t, vary(2600), 0.55, 0.03)
      note(ctx, vary(1240), t, 0.09, 0.05)
      note(ctx, vary(2480), t, 0.05, 0.025)
    },
  },
  felt: {
    label: 'Felt',
    play: (ctx: AudioContext, t: number) => {
      knock(ctx, t, vary(380), 0.7, 0.07, 'lowpass')
      note(ctx, vary(130), t, 0.22, 0.16)
    },
  },
  bamboo: {
    label: 'Bamboo',
    play: (ctx: AudioContext, t: number) => {
      const f = vary(430)
      knock(ctx, t, f * 3, 0.35, 0.03)
      note(ctx, f, t, 0.32, 0.12)
      note(ctx, f * 2.76, t, 0.12, 0.05) // a bamboo tube's overtone isn't a whole multiple: that's its hollow sound
    },
  },
  drop: {
    label: 'Drop',
    play: (ctx: AudioContext, t: number) => {
      note(ctx, vary(1300), t, 0.16, 0.12, 520)
      knock(ctx, t, 3000, 0.08, 0.015)
    },
  },
  bell: {
    label: 'Bell',
    play: (ctx: AudioContext, t: number) => {
      const f = vary(1760)
      note(ctx, f, t, 0.9, 0.05)
      note(ctx, f * 2.4, t, 0.5, 0.02)
    },
  },
  paper: {
    label: 'Paper',
    play: (ctx: AudioContext, t: number) => {
      knock(ctx, t, vary(3400), 0.4, 0.04, 'highpass')
      knock(ctx, t + 0.012, vary(1500), 0.25, 0.03)
    },
  },
  koto: {
    label: 'Koto',
    play: (ctx: AudioContext, t: number, size = 4) => {
      // Big pieces play low notes, small ones high, so a game becomes a quiet tune.
      const index = Math.max(0, Math.min(inScale.length - 1, inScale.length - 1 - Math.floor(size / 2)))
      pluck(ctx, inScale[index], t, 0.32)
    },
  },
} satisfies Record<string, { label: string; play: (ctx: AudioContext, t: number, size?: number) => void }>

export type PlaceSound = keyof typeof placeSounds

let placeSound: PlaceSound = (() => {
  try {
    const saved = localStorage.getItem(PLACE_KEY)
    return saved && saved in placeSounds ? (saved as PlaceSound) : 'wood'
  } catch {
    return 'wood'
  }
})()

export const currentPlaceSound = () => placeSound

/** Choose the sound pieces make as they go down, and play it once to hear it. */
export function choosePlaceSound(id: PlaceSound) {
  placeSound = id
  try {
    localStorage.setItem(PLACE_KEY, id)
  } catch {
    // Not remembered; that's fine.
  }
  play('place', 4)
}

export type Sound = 'place' | 'turn' | 'solve'

/** Play a sound. For 'place', `size` is the piece's area, which some sounds use for pitch. */
export function play(sound: Sound, size?: number) {
  const ctx = audio()
  if (!ctx) return
  const now = ctx.currentTime
  if (sound === 'place') {
    placeSounds[placeSound].play(ctx, now, size)
  } else if (sound === 'turn') {
    knock(ctx, now, vary(1800), 0.25)
  } else {
    // D, G and A from the "in" scale, rising slowly, each left to ring.
    ;[587.3, 784, 880].forEach((f, i) => note(ctx, f, now + i * 0.22, 2.4, 0.09))
  }
}

/** Whether sound is on, and a way to switch it. */
export function useSound(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'on'
    } catch {
      return false
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
    } catch {
      // Not remembered; that's fine.
    }
  }, [on])
  return [on, setOn]
}
