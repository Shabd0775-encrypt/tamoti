// The library: pick a board size, see its pieces, choose a puzzle.

import type { CSSProperties } from 'react'
import { BrushDivider } from '../components/BrushDivider'
import { Footer } from '../components/Footer'
import { Hero } from '../components/hero/Hero'
import { HowToPlay } from '../components/HowToPlay'
import { Seal } from '../components/hero/Seal'
import { PaintedBoard } from '../components/PaintedBoard'
import { Piece } from '../components/Piece'
import { SizePicker } from '../components/SizePicker'
import { toneFor } from '../components/tone'
import { dailyPuzzleId } from '../game/daily'
import { findPuzzle, library, puzzleId, sizes, tierNames, type Tier } from '../game/library'
import { useReveal } from '../hooks/useReveal'
import type { Found } from '../state/progress'
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
  /** The ways found for each puzzle. */
  found: Found
}

export function Library({ size, go, solved, found }: Props) {
  const { pieces, puzzles } = library.sizes[size]
  const solvedHere = puzzles.filter((p) => solved.has(puzzleId(size, p.number))).length
  const tiers = Object.keys(tierNames) as Tier[]
  const next = puzzles.find((p) => !solved.has(puzzleId(size, p.number))) ?? puzzles[0]
  useReveal(size) // new boards appear when the size changes, so look again
  const dailyId = dailyPuzzleId()
  const daily = findPuzzle(dailyId)!

  return (
    <main className="library">
      <Hero
        size={size}
        next={{ number: next.number, blocked: next.blocked, tier: tierNames[next.tier] }}
        onBegin={(from) => go({ screen: 'play', id: puzzleId(size, next.number) }, from)}
        daily={{
          label: `${daily.size}×${daily.size}, No. ${daily.number}`,
          onOpen: () => go({ screen: 'play', id: dailyId }),
        }}
      />

      <div className="library-body">
        <HowToPlay />

        <BrushDivider />

        <SizePicker
          sizes={sizes}
          current={size}
          progress={Object.fromEntries(
            sizes.map((s) => [
              s,
              {
                done: library.sizes[s].puzzles.filter((p) => solved.has(puzzleId(s, p.number))).length,
                total: library.sizes[s].puzzles.length,
              },
            ]),
          )}
          onChoose={(s) => go({ screen: 'library', size: s })}
        />

        <BrushDivider />

        <section className="piece-set" aria-labelledby="piece-set-title" style={{ '--size': size } as CSSProperties}>
          <div className="section-head" data-reveal>
            <h2 id="piece-set-title">
              The pieces for {size}×{size}
            </h2>
            <p>
              Every {size}×{size} board is filled with these {pieces.length}. No two are the same shape, and the dark
              squares never move.
            </p>
          </div>
          <ul className="piece-sheet" role="list">
            {pieces.map((piece, index) => (
              <li key={piece.id} data-reveal style={{ '--d': `${index * 70}ms` } as CSSProperties}>
                <Piece w={piece.w} h={piece.h} tone={toneFor(index)} />
                <span className="piece-size">
                  {piece.w}×{piece.h}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <BrushDivider />

        <section className="puzzles" aria-labelledby="puzzles-title">
          <div className="section-head" data-reveal>
            <h2 id="puzzles-title">The {puzzles.length} boards</h2>
            <p>
              {solvedHere === 0
                ? 'From gentle to deep. Start anywhere; nothing is locked.'
                : `${solvedHere} of ${puzzles.length} solved. Start anywhere; nothing is locked.`}
            </p>
          </div>

          {tiers.map((tier) => {
            const inTier = puzzles.filter((p) => p.tier === tier)
            if (inTier.length === 0) return null
            return (
              <div key={tier} className="tier">
                <div className="tier-head" data-reveal>
                  <h3 id={`tier-${tier}`}>{tierNames[tier]}</h3>
                  <p>{tierNotes[tier]}</p>
                </div>
                <ol className="puzzle-grid" aria-labelledby={`tier-${tier}`}>
                  {inTier.map((p, index) => {
                    const id = puzzleId(size, p.number)
                    const isSolved = solved.has(id)
                    return (
                      <li key={id} data-reveal style={{ '--d': `${index * 60}ms` } as CSSProperties}>
                        <button
                          type="button"
                          className={`puzzle-tile ${isSolved ? 'is-solved' : ''}`}
                          onClick={(event) =>
                            go({ screen: 'play', id }, event.currentTarget.querySelector('.painted-board'))
                          }
                          aria-label={`Puzzle ${p.number}, ${tierNames[tier]}${isSolved ? ', solved' : ''}`}
                        >
                          <span className="tile-board">
                            <PaintedBoard size={size} blocked={p.blocked} />
                            {isSolved && <Seal className="tile-seal" />}
                          </span>
                          <span className="puzzle-number">
                            No. {p.number}
                            {(found[id]?.length ?? 0) > 0 && p.solutions > 1 && (
                              <span className="puzzle-ways">
                                {found[id].length} of {p.solutions} ways
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )
          })}
        </section>
      </div>

      <Footer />
    </main>
  )
}
