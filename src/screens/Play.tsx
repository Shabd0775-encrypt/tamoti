// The play screen: board, tray, and the controls around them.

import { useEffect, useReducer, useRef, useState, type CSSProperties, type Dispatch, type KeyboardEvent } from 'react'
import { Board } from '../components/Board'
import { BrushButton } from '../components/BrushButton'
import { Icon } from '../components/Icon'
import { Piece } from '../components/Piece'
import { PlayScenery, SolveGust } from '../components/PlayScenery'
import { SolutionThumb } from '../components/SolutionThumb'
import { toneFor } from '../components/tone'
import { Tray } from '../components/Tray'
import { canPlace, clashes, footprint, isSolved, onBoard, turnInPlace } from '../game/board'
import { dailyPuzzleId } from '../game/daily'
import { hint, parseSolutionKey, solutionKey } from '../game/hints'
import { findPuzzle, library, puzzleId, tierNames } from '../game/library'
import { currentFootprint, gameReducer, newGame, type GameAction } from '../state/gameReducer'
import type { Go } from '../state/route'
import { play, useSound } from '../state/sound'
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
  const [state, rawDispatch] = useReducer(gameReducer, entry.puzzle, newGame)
  const [soundOn, setSoundOn] = useSound()
  // Every move goes through here, so it can make its sound (when sound is on).
  const dispatch: Dispatch<GameAction> = (action) => {
    rawDispatch(action)
    if (!soundOn) return
    if (action.type === 'place') play('place')
    if (action.type === 'rotate') play('turn')
  }
  const boardRef = useRef<HTMLDivElement>(null)
  const { drag, target, cellSize, startDrag } = useDrag(state, dispatch, boardRef)
  const [shownHint, setShownHint] = useState<ShownHint | null>(null)
  const [shared, setShared] = useState(false)
  /** Whether the way just found was a new one (null until the board is filled). */
  const [newWay, setNewWay] = useState<boolean | null>(null)
  /** Counts solves on this screen; each one sends a gust of petals. */
  const [gusts, setGusts] = useState(0)

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
    setGusts((g) => g + 1)
    if (soundOn) play('solve')
    onSolved(id, key)
  }, [key, found, id, onSolved, soundOn])

  // ----- Playing from the keyboard -----
  // Tab reaches every piece. In the tray, Enter (or Space) puts a piece on the
  // board, in the first spot where it fits cleanly. On the board, the arrow
  // keys move it a square at a time, R turns it, and Delete sends it back.
  // After each move, focus returns to the same piece, and a hidden line of
  // text tells screen readers where it is now.
  const [announcement, setAnnouncement] = useState('')
  const refocus = useRef<string | null>(null)
  useEffect(() => {
    if (!refocus.current) return
    document.querySelector<HTMLElement>(`[data-piece="${refocus.current}"]`)?.focus()
    refocus.current = null
  })

  const firstCleanSpot = (pieceId: string) => {
    const { rotated } = currentFootprint(state, pieceId)
    for (const turn of [rotated, !rotated]) {
      for (let row = 0; row < puzzle.size; row++) {
        for (let col = 0; col < puzzle.size; col++) {
          const at = { row, col, rotated: turn }
          if (canPlace(puzzle, state.placements, pieceId, at)) return at
        }
      }
    }
    return { row: 0, col: 0, rotated } // nowhere clean: it goes in the corner, overlapping, to be moved
  }

  const onPieceKeyDown = (event: KeyboardEvent<HTMLDivElement>, pieceId: string) => {
    const at = state.placements[pieceId]
    const say = (where: { row: number; col: number }) =>
      setAnnouncement(`Row ${where.row + 1}, column ${where.col + 1}.`)
    const key = event.key
    if (!at) {
      if (key === 'Enter' || key === ' ') {
        event.preventDefault()
        const spot = firstCleanSpot(pieceId)
        dispatch({ type: 'place', pieceId, at: spot })
        refocus.current = pieceId
        say(spot)
      } else if (key === 'r' || key === 'R') {
        dispatch({ type: 'rotate', pieceId })
        refocus.current = pieceId
      }
      return
    }
    const step: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    }
    if (step[key]) {
      event.preventDefault()
      const next = { ...at, row: at.row + step[key][0], col: at.col + step[key][1] }
      if (onBoard(puzzle, pieceId, next)) {
        dispatch({ type: 'place', pieceId, at: next })
        say(next)
      }
      refocus.current = pieceId
    } else if (key === 'r' || key === 'R') {
      dispatch({ type: 'rotate', pieceId })
      say(turnInPlace(puzzle, pieceId, at))
      refocus.current = pieceId
    } else if (key === 'Delete' || key === 'Backspace') {
      event.preventDefault()
      dispatch({ type: 'remove', pieceId })
      setAnnouncement('Back in the tray.')
      refocus.current = pieceId
    }
  }

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
  // The tray's square size: about 34px, smaller for big sets, so all the pieces fit in a tray about
  // 340px wide and 260px tall (their total area × square² is roughly what the tray has to hold).
  const totalArea = puzzle.pieces.reduce((sum, piece) => sum + piece.w * piece.h, 0)
  const trayCap = Math.min(34, Math.floor(Math.sqrt(52_000 / totalArea)))
  const allWays = [...found, ...(key && !found.includes(key) ? [key] : [])]

  return (
    <main className="play" style={{ '--size': puzzle.size, '--tray-cap': `${trayCap}px` } as CSSProperties}>
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
        <button type="button" className="sound-toggle" aria-pressed={soundOn} onClick={() => setSoundOn(!soundOn)}>
          {soundOn ? 'Sound on' : 'Sound off'}
        </button>
      </header>

      <div className="play-area">
        <Board
          ref={boardRef}
          state={state}
          liftedId={drag?.pieceId ?? null}
          target={target}
          onPiecePointerDown={startDrag}
          onRotate={rotate}
          onPieceKeyDown={onPieceKeyDown}
          solved={solved}
          hinted={hintNow?.kind === 'place' ? hintNow.pieceId : null}
          flagged={hintNow?.kind === 'rethink' ? hintNow.pieceId : null}
        />

        <aside>
          <Tray
            state={state}
            liftedId={drag?.pieceId ?? null}
            onPiecePointerDown={startDrag}
            onRotate={rotate}
            onPieceKeyDown={onPieceKeyDown}
          />
          <p className="visually-hidden" aria-live="polite">
            {announcement}
          </p>

          <p className="status" aria-live="polite">
            {solved ? (
              <>
                <strong>
                  Every square is <mark className="highlight">filled</mark>.
                </strong>
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
                <strong>
                  This one is <em className="accent">in the way</em>
                </strong>
                Where it sits now, the marked piece can't be part of any solution. Try it somewhere else.
              </>
            ) : hintNow?.kind === 'place' ? (
              <>
                <strong>
                  One piece, <em className="accent">placed for you</em>
                </strong>
                It fits with everything you've put down so far. Move it if you'd rather.
              </>
            ) : overlapping && piecesLeft === 0 ? (
              <>
                <strong>
                  Some pieces <em className="accent">overlap</em>
                </strong>
                That's fine while you try things. Slide them apart to finish.
              </>
            ) : (
              <>
                <strong>
                  {piecesLeft} {piecesLeft === 1 ? 'piece' : 'pieces'} to place
                </strong>
                Drag a piece onto the board; pieces can overlap while you try things. Tap a piece to turn it
                <span className="keyboard-tip">, or press R while dragging. Keys: Tab, Enter, arrows, R, Delete</span>
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
      <SolveGust gust={gusts} />
    </main>
  )
}
