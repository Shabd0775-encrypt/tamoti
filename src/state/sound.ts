// Soft sounds, made on the spot with the Web Audio API (no sound files):
// a wooden "tok" when a piece is put down, a lighter tick when it turns,
// and a quiet three-note chime when a board is filled. Off by default, and
// the choice is remembered in this browser.

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

/** One soft note: a sine wave that starts at once and fades away. */
function note(ctx: AudioContext, frequency: number, start: number, length: number, volume: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + length + 0.05)
}

/** A short burst of filtered noise: the "click" of wood touching wood. */
function knock(ctx: AudioContext, start: number, pitch: number, volume: number) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  source.buffer = buffer
  filter.type = 'bandpass'
  filter.frequency.value = pitch
  filter.Q.value = 4
  gain.gain.value = volume
  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start(start)
}

export type Sound = 'place' | 'turn' | 'solve'

export function play(sound: Sound) {
  const ctx = audio()
  if (!ctx) return
  const now = ctx.currentTime
  if (sound === 'place') {
    knock(ctx, now, 900, 0.5)
    note(ctx, 220, now, 0.18, 0.12)
  } else if (sound === 'turn') {
    knock(ctx, now, 1800, 0.25)
  } else {
    // D, G and A from the "in" scale (D E♭ G A B♭), rising slowly, each left to ring.
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
