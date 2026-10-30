// The play screen: board, tray, and the controls around them.

import { useEffect, useReducer, useRef, useState, type CSSProperties } from 'react'
import { Board } from '../components/Board'
import { BrushButton } from '../components/BrushButton'
import { Icon } from '../components/Icon'
import { LookSwitcher } from '../components/LookSwitcher'
import { Piece } from '../components/Piece'
import { PlayScenery } from '../components/PlayScenery'
import { SolutionThumb } from '../components/SolutionThumb'
import { toneFor } from '../components/tone'
import { Tray } from '../components/Tray'
import { clashes, footprint, isSolved } from '../game/board'
import { dailyPuzzleId } from '../game/daily'
import { hint, parseSolutionKey, solutionKey } from '../game/hints'
import { findPuzzle, library, puzzleId, tierNames } from '../game/library'
import { gameReducer, newGame } from '../state/gameReducer'
import type { Go } from '../state/route'
import { useDrag } from '../state/useDrag'

type Props = {
  id: string
  go: Go
  /** The ways of filling this board found so far. */
  found: string[]
  onSolved: (id: string, key: string) => void
}

/** A hint that's showing: which piece, what kind, and the move it belongs to (it fades on the next move). */
type ShownHint = { pieceId: string; kind: 'place' | 'rethink'; move: number }

/** The puzzle after this one: the next number, or the first of the next size up. */
function nextPuzzleId(size: number, number: number): string | null {
  if (findPuzzle(puzzleId(size, number + 1))) return puzzleId(size, number + 1)
  if (library.sizes[size + 1]) return puzzleId(size + 1, 1)
  return null
}

export function Play({ id, go, found, onSolved }: Props) {
  const entry = findPuzzle(id)!
  const [state, dispatch] = useReducer(gameReducer, entry.puzzle, newGame)
  const boardRef = useRef<HTMLDivElement>(null)
  const { drag, target, cellSize, startDrag } = useDrag(state, dispatch, boardRef)
  const [shownHint, setShownHint] = useState<ShownHint | null>(null)
  const [shared, setShared] = useState(false)
  /** Whether the way just found was a new one (null until the board is filled). */
  const [newWay, setNewWay] = useState<boolean | null>(null)

  const { puzzle } = state
  const solved = isSolved(puzzle, state.placements)
  const key = solved ? solutionKey(state.placements) : null
  const piecesLeft = puzzle.pieces.length - Object.keys(state.placements).length
  const overlapping = clashes(puzzle, state.placements).pieces.size > 0
  const nextId = nextPuzzleId(entry.size, entry.number)
  const isDaily = id === dailyPuzzleId()
  const ways = entry.solutions
  const foundCount = key && !found.includes(key) ? found.length + 1 : found.length

  // When the board is filled, remember this way of filling it, and whether it was new.
  const recorded = useRef<string | null>(null)
  useEffect(() => {
    if (!key) {
      recorded.current = null
      return
    }
    if (recorded.current === key) return
    recorded.current = key
    setNewWay(!found.includes(key))
    onSolved(id, key)
  }, [key, found, id, onSolved])

  // A hint only shows until the next move.
  const hintNow = shownHint && shownHint.move === state.history.length ? shownHint : null

  const rotate = (pieceId: string) => {
    if (!drag) dispatch({ type: 'rotate', pieceId })
  }

  const askForHint = () => {
    const h = hint(puzzle, state.placements)
    if (h.kind === 'place') {
      dispatch({ type: 'place', pieceId: h.pieceId, at: h.at })
      setShownHint({ pieceId: h.pieceId, kind: 'place', move: state.history.length + 1 })
    } else if (h.kind === 'rethink') {
      setShownHint({ pieceId: h.pieceId, kind: 'rethink', move: state.history.length })
    }
  }

  // Share the board: the phone's share sheet where there is one, otherwise copy the link.
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?p=${id}`
    const title = `Grid Puzzle, ${entry.size}×${entry.size} No. ${entry.number}`
    try {
      if (navigator.share) await navigator.share({ title, url })
      else {
        await navigator.clipboard.writeText(url)
        setShared(true)
        window.setTimeout(() => setShared(false), 2400)
      }
    } catch {
      // The visitor closed the share sheet, or the clipboard isn't allowed: nothing to do.
    }
  }

  const draggedIndex = drag ? puzzle.pieces.findIndex((p) => p.id === drag.pieceId) : -1
  const dragged = drag && { ...footprint(puzzle.pieces[draggedIndex], drag.rotated), tone: toneFor(draggedIndex) }
  const allWays = [...found, ...(key && !found.includes(key) ? [key] : [])]

  return (
    <main className="play" style={{ '--size': puzzle.size } as CSSProperties}>
      <PlayScenery />
      <header className="play-bar">
        <button type="button" className="back" onClick={() => go({ screen: 'library', size: entry.size })}>
          <Icon name="back" />
          Library
        </button>
        <h1>
          {entry.size}×{entry.size} <span className="play-number">No. {entry.number}</span>
        </h1>
        <span className="play-tier">
          {isDaily && <span className="play-daily">Today's board</span>}
          {tierNames[entry.tier]}
        </span>
      </header>

      <div className="play-area">
        <Board
          ref={boardRef}
          state={state}
          liftedId={drag?.pieceId ?? null}
          target={target}
          onPiecePointerDown={startDrag}
          onRotate={rotate}
          solved={solved}
          hinted={hintNow?.kind === 'place' ? hintNow.pieceId : null}
          flagged={hintNow?.kind === 'rethink' ? hintNow.pieceId : null}
        />

        <aside>
          <Tray state={state} liftedId={drag?.pieceId ?? null} onPiecePointerDown={startDrag} onRotate={rotate} />

          <p className="status" aria-live="polite">
            {solved ? (
              <>
                <strong>Every square is filled.</strong>
                {ways === 1
                  ? 'This board has only one solution, and you found it.'
                  : foundCount >= ways
                    ? `That's every way to fill it: all ${ways}.`
                    : newWay === false
                      ? `You found this way before. ${ways - foundCount} more to find.`
                      : `That's ${foundCount} of the ${ways} ways to fill this board.`}
              </>
            ) : hintNow?.kind === 'rethink' ? (
              <>
                <strong>This one is in the way</strong>
                Where it sits now, the marked piece can't be part of any solution. Try it somewhere else.
              </>
            ) : hintNow?.kind === 'place' ? (
              <>
                <strong>One piece, placed for you</strong>
                It fits with everything you've put down so far. Move it if you'd rather.
              </>
            ) : overlapping && piecesLeft === 0 ? (
              <>
                <strong>Some pieces overlap</strong>
                That's fine while you try things. Slide them apart to finish.
              </>
            ) : (
              <>
                <strong>
                  {piecesLeft} {piecesLeft === 1 ? 'piece' : 'pieces'} to place
                </strong>
                Drag a piece onto the board; pieces can overlap while you try things. Tap a piece to turn it
                <span className="keyboard-tip">, or press R while dragging</span>
                <span className="touch-tip">, or tap with a second finger while dragging</span>.
              </>
            )}
          </p>

          <div className="actions">
            {solved ? (
              <>
                {nextId && <BrushButton onClick={() => go({ screen: 'play', id: nextId })}>Next puzzle</BrushButton>}
                {foundCount < ways && (
                  <button type="button" onClick={() => dispatch({ type: 'reset' })}>
                    Find another way
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" onClick={askForHint}>
                  Hint
                </button>
                <button type="button" onClick={() => dispatch({ type: 'undo' })} disabled={state.history.length === 0}>
                  Undo
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'reset' })}
                  disabled={piecesLeft === puzzle.pieces.length}
                >
                  Start over
                </button>
              </>
            )}
            <button type="button" onClick={share}>
              {shared ? 'Link copied' : 'Share'}
            </button>
          </div>

          {allWays.length > 0 && ways > 1 && (
            <section className="ways" aria-labelledby="ways-title">
              <h2 id="ways-title">
                Ways you've found: {Math.min(allWays.length, ways)} of {ways}
              </h2>
              <ul role="list">
                {allWays.map((way) => (
                  <li key={way} className={way === key ? 'is-current' : ''}>
                    <SolutionThumb puzzle={puzzle} placements={parseSolutionKey(way)} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {drag && dragged && (
        <Piece
          w={dragged.w}
          h={dragged.h}
          tone={dragged.tone}
          className="drag-layer"
          style={{
            left: drag.pointer.x - drag.grab.x * dragged.w * cellSize,
            top: drag.pointer.y - drag.grab.y * dragged.h * cellSize,
            width: dragged.w * cellSize,
            height: dragged.h * cellSize,
          }}
        />
      )}
      <LookSwitcher />
    </main>
  )
}
