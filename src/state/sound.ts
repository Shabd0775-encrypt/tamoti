// Soft sounds, made on the spot with the Web Audio API (no sound files):
// a wooden "tok" when a piece is put down, a light tick when it turns, and
// a quiet three-note chime when a board is filled. Off by default, and the
// choice is remembered in this browser.
//
// Every sound is built from two simple parts: a "note" (a pure tone that
// starts at once and fades) and a "knock" (a burst of noise, filtered to a
// pitch, which is what makes a sound feel like something touching something).

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'grid-puzzle:sound'

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

/** A small random nudge to pitch, so the same sound never repeats exactly. */
const vary = (f: number) => f * (0.97 + Math.random() * 0.06)

export type Sound = 'place' | 'turn' | 'solve'

export function play(sound: Sound) {
  const ctx = audio()
  if (!ctx) return
  const now = ctx.currentTime
  if (sound === 'place') {
    // Wood on wood: a knock, with a low note under it for body.
    knock(ctx, now, vary(900), 0.5)
    note(ctx, vary(220), now, 0.18, 0.12)
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
