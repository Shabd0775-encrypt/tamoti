// The top of the library: a quiet painting to arrive in. The tree stands on
// its hill at the left; the name, one sentence, the next board and a single
// way in sit on the right, in the open sky.
//
// Layers, back to front: paper and glow (CSS), mountains and buildings,
// the tree, falling petals, then the words.

import { useEffect, useRef, type RefObject } from 'react'
import { BrushButton } from '../BrushButton'
import type { Rect } from '../../game/types'
import { Backdrop, treeShape } from './Backdrop'
import { BoardPreview } from './BoardPreview'
import { Petals } from './Petals'
import { Seal } from './Seal'
import { Tree } from './Tree'

type Props = {
  size: number
  /** The puzzle the button opens: the first one not yet solved at this size. */
  next: { number: number; blocked: Rect[]; tier: string }
  /** Open that puzzle. `from` is the painted board, which flows into the play screen's board. */
  onBegin: (from: Element | null) => void
}

/**
 * On scroll, everything marked with data-depth lags behind by that fraction:
 * far things move least. Two extras, for the lake's reflection:
 *   data-stretch: grow taller by this much (from its top edge) over one screen of scrolling;
 *   data-fade: fade out this fast over the same distance.
 */
function useParallax(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const update = () => {
      frame = 0
      const y = Math.min(window.scrollY, window.innerHeight)
      const progress = y / window.innerHeight
      for (const layer of el.querySelectorAll<HTMLElement | SVGElement>('[data-depth]')) {
        const { depth, stretch, fade } = layer.dataset
        const scale = stretch ? ` scaleY(${(1 + progress * Number(stretch)).toFixed(3)})` : ''
        layer.style.transform = `translate3d(0, ${(y * Number(depth)).toFixed(1)}px, 0)${scale}`
        if (fade) layer.style.opacity = String(Math.max(0, 1 - progress * Number(fade)))
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [root])
}

export function Hero({ size, next, onBegin }: Props) {
  const root = useRef<HTMLElement>(null)
  const preview = useRef<SVGSVGElement>(null)
  useParallax(root)

  const label = `${size}×${size}, No. ${next.number}`

  return (
    <section className="hero" ref={root} aria-labelledby="hero-title">
      <div className="hero-glow" aria-hidden="true" />
      <div className="mountains" aria-hidden="true">
        <Backdrop />
      </div>
      <div className="hero-tree-wrap" data-depth={0.05}>
        <Tree id="tree" shape={treeShape} />
      </div>
      <Petals />

      <div className="hero-copy">
        <div className="hero-title-row">
          <h1 id="hero-title">Grid Puzzle</h1>
          <Seal className="hero-seal" />
        </div>
        <p className="hero-lede">
          Fill every open square with the pieces you are given. No timer, no score. Only a quiet board, for as long as
          you like.
        </p>
        <BoardPreview
          size={size}
          blocked={next.blocked}
          caption={`${label} · ${next.tier}`}
          onOpen={() => onBegin(preview.current)}
          svgRef={preview}
        />
        <div className="hero-actions">
          <BrushButton onClick={() => onBegin(preview.current)}>Begin {label}</BrushButton>
          <a className="hero-more" href="#boards">
            or choose a board
          </a>
        </div>
      </div>

      {/* "One piece at a time, quietly." 枚 is the counter for flat things, like these pieces. */}
      <p className="hero-vertical" lang="ja" aria-hidden="true">
        一枚ずつ、静かに。
      </p>
    </section>
  )
}
