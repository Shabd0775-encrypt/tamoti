// The library: pick a board size, see its pieces, choose a puzzle.

import type { CSSProperties } from 'react'
import { Icon } from '../components/Icon'
import { MiniBoard } from '../components/MiniBoard'
import { Piece } from '../components/Piece'
import { toneFor } from '../components/tone'
import { library, puzzleId, sizes, tierNames, type Tier } from '../game/library'
import type { Go } from '../state/route'

const tierNotes: Record<Tier, string> = {
  gentle: 'A warm-up. More than one way to finish.',
  steady: 'Look a little longer before you place.',
  tricky: 'Most pieces have only one home.',
  deep: 'Slow down. Every turn matters.',
}

type Props = {
  size: number
  go: Go
  solved: Set<string>
}

export function Library({ size, go, solved }: Props) {
  const { pieces, puzzles } = library.sizes[size]
  const solvedHere = puzzles.filter((p) => solved.has(puzzleId(size, p.number))).length
  const tiers = Object.keys(tierNames) as Tier[]

  return (
    <main className="library">
      <header className="library-intro">
        <h1>Grid Puzzle</h1>
        <p>
          Fill every open square. Each board size comes with its own set of pieces, no two the same shape, and
          the dark blocks never move.
        </p>
      </header>

      <nav className="size-picker" aria-label="Board size">
        {sizes.map((s) => {
          const done = library.sizes[s].puzzles.filter((p) => solved.has(puzzleId(s, p.number))).length
          return (
            <button
              key={s}
              type="button"
              aria-pressed={s === size}
              onClick={() => go({ screen: 'library', size: s })}
            >
              <span className="size-name">
                {s}×{s}
              </span>
              <span className="size-meta">
                {done}/{library.sizes[s].puzzles.length}
              </span>
            </button>
          )
        })}
      </nav>

      <section className="piece-set" aria-labelledby="piece-set-title" style={{ '--size': size } as CSSProperties}>
        <h2 id="piece-set-title">
          The {pieces.length} pieces for {size}×{size}
        </h2>
        <div className="piece-set-row">
          {pieces.map((piece, index) => (
            <figure key={piece.id}>
              <Piece w={piece.w} h={piece.h} tone={toneFor(index)} />
              <figcaption>
                {piece.w}×{piece.h}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="piece-set-progress">
          {solvedHere === 0
            ? `${puzzles.length} puzzles, from gentle to deep.`
            : `${solvedHere} of ${puzzles.length} solved.`}
        </p>
      </section>

      {tiers.map((tier) => {
        const inTier = puzzles.filter((p) => p.tier === tier)
        if (inTier.length === 0) return null
        return (
          <section key={tier} className="tier" aria-labelledby={`tier-${tier}`}>
            <div className="tier-head">
              <h2 id={`tier-${tier}`}>{tierNames[tier]}</h2>
              <p>{tierNotes[tier]}</p>
            </div>
            <ol className="puzzle-grid">
              {inTier.map((p) => {
                const id = puzzleId(size, p.number)
                const isSolved = solved.has(id)
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`puzzle-tile ${isSolved ? 'is-solved' : ''}`}
                      onClick={() => go({ screen: 'play', id })}
                      aria-label={`Puzzle ${p.number}, ${tierNames[tier]}${isSolved ? ', solved' : ''}`}
                    >
                      <MiniBoard size={size} blocked={p.blocked} />
                      <span className="puzzle-number">
                        No. {p.number}
                        {isSolved && <Icon name="check" size={14} />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </main>
  )
}
