// The play screen: board, tray, and the controls around them.

import { useEffect, useReducer, useRef, type CSSProperties } from 'react'
import { Board } from '../components/Board'
import { BrushButton } from '../components/BrushButton'
import { Icon } from '../components/Icon'
import { Piece } from '../components/Piece'
import { LookSwitcher } from '../components/LookSwitcher'
import { PlayScenery } from '../components/PlayScenery'
import { toneFor } from '../components/tone'
import { Tray } from '../components/Tray'
import { clashes, footprint, isSolved } from '../game/board'
import { findPuzzle, library, puzzleId, tierNames } from '../game/library'
import { gameReducer, newGame } from '../state/gameReducer'
import type { Go } from '../state/route'
import { useDrag } from '../state/useDrag'

type Props = {
  id: string
  go: Go
  onSolved: (id: string) => void
}

/** The puzzle after this one: the next number, or the first of the next size up. */
function nextPuzzleId(size: number, number: number): string | null {
  if (findPuzzle(puzzleId(size, number + 1))) return puzzleId(size, number + 1)
  if (library.sizes[size + 1]) return puzzleId(size + 1, 1)
  return null
}

export function Play({ id, go, onSolved }: Props) {
  const entry = findPuzzle(id)!
  const [state, dispatch] = useReducer(gameReducer, entry.puzzle, newGame)
  const boardRef = useRef<HTMLDivElement>(null)
  const { drag, target, cellSize, startDrag } = useDrag(state, dispatch, boardRef)

  const { puzzle } = state
  const solved = isSolved(puzzle, state.placements)
  const piecesLeft = puzzle.pieces.length - Object.keys(state.placements).length
  const overlapping = clashes(puzzle, state.placements).pieces.size > 0
  const nextId = nextPuzzleId(entry.size, entry.number)

  useEffect(() => {
    if (solved) onSolved(id)
  }, [solved, id, onSolved])

  const rotate = (pieceId: string) => {
    if (!drag) dispatch({ type: 'rotate', pieceId })
  }

  const draggedIndex = drag ? puzzle.pieces.findIndex((p) => p.id === drag.pieceId) : -1
  const dragged = drag && { ...footprint(puzzle.pieces[draggedIndex], drag.rotated), tone: toneFor(draggedIndex) }

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
        <span className="play-tier">{tierNames[entry.tier]}</span>
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
        />

        <aside>
          <Tray state={state} liftedId={drag?.pieceId ?? null} onPiecePointerDown={startDrag} onRotate={rotate} />

          <p className="status" aria-live="polite">
            {solved ? (
              <>
                <strong>Every square is filled.</strong>
                {entry.solutions === 1
                  ? 'This board has only one solution, and you found it.'
                  : `This board can be filled ${entry.solutions} different ways. You found one of them.`}
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
            {solved && nextId ? (
              <BrushButton onClick={() => go({ screen: 'play', id: nextId })}>Next puzzle</BrushButton>
            ) : (
              <button type="button" onClick={() => dispatch({ type: 'undo' })} disabled={state.history.length === 0}>
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={() => dispatch({ type: 'reset' })}
              disabled={piecesLeft === puzzle.pieces.length}
            >
              Start over
            </button>
          </div>
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
