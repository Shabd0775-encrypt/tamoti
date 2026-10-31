// Phones: dry the paint. The watercolor look comes from SVG filters (noise,
// displacement, blur), and phone browsers, Safari above all, work them out
// again whenever a painted sheet is stretched or a new part of it slides into
// view. On a phone that means every frame of a scroll.
//
// So on touch screens each moving sheet is painted once into a plain picture
// (a canvas) the moment the page is quiet, and the picture takes the sheet's
// place: same classes, same data attributes, so the scroll effects move it
// just the same. Computers keep the live drawing, which they handle easily.

import { useEffect, type RefObject } from 'react'

/** The styles a painted shape can take from the page, written onto the copy so it looks the same on its own. */
const PAINT = [
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'opacity',
  'stop-color',
  'stop-opacity',
  'flood-color',
  'flood-opacity',
  'mix-blend-mode',
  'display',
  'visibility',
  'color-interpolation-filters',
]

/** Sharper than this costs a lot of memory and looks no different in a soft wash. */
const MAX_SCALE = 2
/** Phones refuse canvases much bigger than this (in pixels); stay well under. */
const MAX_PIXELS = 12_000_000

const urlRef = /url\(\s*["']?[^"')#]*#([^"')]+)["']?\s*\)/g

/** Copies an element and everything in it, with each part's page styles written onto it. */
function copyWithStyles(original: Element): Element {
  const copy = original.cloneNode(true) as Element
  const from = [original, ...original.querySelectorAll('*')]
  const to = [copy, ...copy.querySelectorAll('*')]
  from.forEach((el, i) => {
    const style = getComputedStyle(el)
    const target = to[i]
    target.setAttribute(
      'style',
      PAINT.map((p) => `${p}:${style.getPropertyValue(p).replace(urlRef, 'url(#$1)')}`).join(';'),
    )
    target.removeAttribute('class')
  })
  return copy
}

/** The ids a copy points to (gradients, clips, filters, reused shapes) that live elsewhere on the page. */
function missingRefs(root: Element): string[] {
  const ids = new Set<string>()
  const text = new XMLSerializer().serializeToString(root)
  for (const m of text.matchAll(urlRef)) ids.add(m[1])
  for (const m of text.matchAll(/href="#([^"]+)"/g)) ids.add(m[1])
  return [...ids].filter((id) => !root.querySelector(`[id="${CSS.escape(id)}"]`))
}

/** Paints one sheet into a canvas `width` × `height` CSS pixels at `scale`. */
async function paint(svg: SVGSVGElement, width: number, height: number, scale: number) {
  const copy = copyWithStyles(svg) as SVGSVGElement
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  copy.setAttribute('width', String(width))
  copy.setAttribute('height', String(height))
  copy.removeAttribute('style')
  // Bring along what it points to, and what those point to, until nothing is missing.
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  copy.prepend(defs)
  for (let ids = missingRefs(copy); ids.length > 0; ids = missingRefs(copy)) {
    let found = 0
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) {
        defs.append(copyWithStyles(el))
        found++
      }
    }
    if (found === 0) break
  }

  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Runs `task` when the page has a quiet moment (Safari has no requestIdleCallback, so a short wait there). */
const whenQuiet = (task: () => void) => {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(task, { timeout: 1500 })
  else setTimeout(task, 200)
}

export const shouldBake = () => window.matchMedia('(pointer: coarse)').matches

/**
 * On touch screens, swaps each sheet matching `selector` inside `root` for a painted copy.
 * Sheets are done one at a time, in quiet moments, so the page stays responsive meanwhile.
 * `maxScale` caps the sharpness: pale, far-off sheets can be painted coarser to save memory.
 */
export function useBakedSheets(root: RefObject<HTMLElement | null>, selector: string, maxScale = MAX_SCALE) {
  useEffect(() => {
    const el = root.current
    if (!el || !shouldBake()) return
    let cancelled = false
    const swaps: Array<{ svg: SVGSVGElement; canvas: HTMLCanvasElement }> = []

    const bakeNext = (queue: SVGSVGElement[]) => {
      const svg = queue.shift()
      if (!svg || cancelled) return
      whenQuiet(async () => {
        if (cancelled) return
        const style = getComputedStyle(svg)
        const width = parseFloat(style.width)
        const height = parseFloat(style.height)
        if (width > 0 && height > 0 && style.display !== 'none') {
          const scale = Math.min(window.devicePixelRatio || 1, maxScale, Math.sqrt(MAX_PIXELS / (width * height)))
          try {
            const canvas = await paint(svg, width, height, scale)
            if (cancelled) return
            // The picture takes the sheet's place, with everything the styles and scroll effects look for.
            canvas.setAttribute('class', svg.getAttribute('class') ?? '')
            canvas.setAttribute('aria-hidden', 'true')
            for (const [key, value] of Object.entries(svg.dataset)) canvas.dataset[key] = value
            canvas.style.cssText = svg.style.cssText
            svg.after(canvas)
            svg.style.display = 'none'
            // The sheet itself no longer needs moving.
            for (const key of Object.keys(svg.dataset)) delete svg.dataset[key]
            swaps.push({ svg, canvas })
          } catch {
            // If a browser can't paint it, the live drawing simply stays.
          }
        }
        bakeNext(queue)
      })
    }
    bakeNext([...el.querySelectorAll<SVGSVGElement>(selector)])

    return () => {
      cancelled = true
      for (const { svg, canvas } of swaps) {
        for (const [key, value] of Object.entries(canvas.dataset)) svg.dataset[key] = value
        svg.style.display = ''
        canvas.remove()
      }
    }
  }, [root, selector, maxScale])
}
