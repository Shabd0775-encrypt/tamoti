// Falling cherry petals, drawn on a <canvas>: a blank bitmap we repaint about
// sixty times a second. Petals leave the tree on the left and ride a light
// wind to the right, swaying, spinning, and tumbling (squashing sideways as
// they turn over). Each one fades in as it lets go of its branch.
//
// It stops drawing whenever nobody can see it: when the tab is hidden, when
// the hero has scrolled out of view, or when the visitor prefers less motion.

import { useEffect, useRef } from 'react'

type Petal = {
  x: number
  y: number
  size: number
  fall: number // pixels per second downward
  drift: number // pixels per second sideways
  sway: number // how far it swings
  phase: number
  spin: number
  angle: number
  tumble: number
  color: string
  alpha: number
  age: number // seconds since it let go
  /** Part of a gust: blown through once, then gone, rather than falling again. */
  gust?: boolean
}

const COLORS = ['--sakura-300', '--sakura-300', '--sakura-500', '--sakura-100']

function makePetal(width: number, height: number, colors: string[], anywhere: boolean): Petal {
  const r = Math.random
  return {
    // They let go from the crown of the tree, on the left; at the start some are already on their way.
    x: anywhere ? r() * width : width * (0.02 + r() * 0.36),
    y: anywhere ? r() * height : height * (0.08 + r() * 0.42),
    size: 8 + r() * 8,
    fall: 14 + r() * 20,
    drift: 22 + r() * 34,
    sway: 14 + r() * 26,
    phase: r() * Math.PI * 2,
    spin: (r() - 0.5) * 1.2,
    angle: r() * Math.PI * 2,
    tumble: 0.6 + r() * 1.2,
    color: colors[Math.floor(r() * colors.length)],
    alpha: 0.6 + r() * 0.35,
    age: anywhere ? 9 : 0,
  }
}

/** One petal: a rounded teardrop with the small notch sakura petals have at the tip. */
function drawPetal(ctx: CanvasRenderingContext2D, p: Petal, time: number) {
  const s = p.size
  ctx.save()
  ctx.translate(p.x + Math.sin(time * 0.6 + p.phase) * p.sway, p.y)
  ctx.rotate(p.angle)
  ctx.scale(Math.cos(time * p.tumble + p.phase) * 0.8 + 0.2, 1)
  ctx.globalAlpha = p.alpha * Math.min(p.age / 1.2, 1)
  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.moveTo(0, s * 0.55)
  ctx.bezierCurveTo(-s * 0.62, s * 0.2, -s * 0.5, -s * 0.48, -s * 0.13, -s * 0.52)
  ctx.lineTo(0, -s * 0.36)
  ctx.lineTo(s * 0.13, -s * 0.52)
  ctx.bezierCurveTo(s * 0.5, -s * 0.48, s * 0.62, s * 0.2, 0, s * 0.55)
  ctx.fill()
  ctx.restore()
}

/** A gust of petals that blows across from the left, faster than the drift, once. */
function gustPetal(width: number, height: number, colors: string[]): Petal {
  const p = makePetal(width, height, colors, false)
  const r = Math.random
  return {
    ...p,
    x: -40 - r() * width * 0.3,
    y: height * (0.1 + r() * 0.6),
    drift: 120 + r() * 120,
    fall: 10 + r() * 30,
    size: 9 + r() * 9,
    gust: true,
  }
}

type Props = {
  /** How many petals fall: 1 for the hero, less where the page should stay quiet. */
  density?: number
  /** Change this number to send a gust of petals across (used when a board is solved). */
  gust?: number
}

export function Petals({ density = 1, gust = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // The running animation, shared with the gust below: its petals, and a way to wake it.
  const scene = useRef<{ petals: Petal[]; width: number; height: number; colors: string[]; start: () => void } | null>(
    null,
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const style = getComputedStyle(document.documentElement)
    const colors = COLORS.map((name) => style.getPropertyValue(name).trim())

    let width = 0
    let height = 0
    let petals: Petal[] = []
    const share = () => {
      scene.current = { petals, width, height, colors, start }
    }

    // Match the canvas bitmap to its size on screen, at the screen's pixel density, so petals stay crisp.
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      const count = Math.round((width < 640 ? 18 : 34) * density)
      petals = Array.from({ length: count }, () => makePetal(width, height, colors, true))
      share()
    }

    let frame = 0
    let last = 0
    let onScreen = true

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      ctx.clearRect(0, 0, width, height)
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i]
        p.y += p.fall * dt
        p.x += p.drift * dt
        p.angle += p.spin * dt
        p.age += dt
        const gone = p.y > height + 30 || p.x > width + 60
        if (gone && p.gust) petals.splice(i, 1)
        else if (gone) Object.assign(p, makePetal(width, height, colors, false))
        else drawPetal(ctx, p, now / 1000)
      }
      // Nothing left to draw (a gust layer between gusts): rest until the next gust wakes it.
      frame = petals.length > 0 ? requestAnimationFrame(tick) : 0
    }

    const start = () => {
      if (frame || document.hidden || !onScreen) return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      if (onScreen) start()
      else stop()
    })
    const onVisibility = () => (document.hidden ? stop() : start())

    resize()
    share()
    observer.observe(canvas)
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      stop()
      observer.disconnect()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      scene.current = null
    }
  }, [density])

  // A gust: a couple of dozen petals blown across from the left, once.
  useEffect(() => {
    const s = scene.current
    if (!gust || !s) return
    for (let i = 0; i < 26; i++) s.petals.push(gustPetal(s.width, s.height, s.colors))
    s.start()
  }, [gust])

  return <canvas className="petals" ref={canvasRef} aria-hidden="true" />
}
