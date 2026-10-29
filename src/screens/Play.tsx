// The play screen: board, tray, and the controls around them.

import { useReducer, useRef, type CSSProperties } from 'react'
import { Board } from '../components/Board'
import { Piece } from '../components/Piece'
import { toneFor } from '../components/tone'
import { Tray } from '../components/Tray'
import { footprint, isSolved } from '../game/board'
import { samples, type SampleSize } from '../game/samples'
import { gameReducer, newGame } from '../state/gameReducer'
import { useDrag } from '../state/useDrag'

const sizes = Object.keys(samples).map(Number) as SampleSize[]

export function Play() {
  const [state, dispatch] = useReducer(gameReducer, samples[6].puzzle, newGame)
  const boardRef = useRef<HTMLDivElement>(null)
  const { drag, target, cellSize, startDrag } = useDrag(state, dispatch, boardRef)

  const { puzzle } = state
  const solved = isSolved(puzzle, state.placements)
  const piecesLeft = puzzle.pieces.length - Object.keys(state.placements).length
  const rotate = (pieceId: string) => {
    if (!drag) dispatch({ type: 'rotate', pieceId })
  }

  const draggedIndex = drag ? puzzle.pieces.findIndex((p) => p.id === drag.pieceId) : -1
  const dragged = drag && { ...footprint(puzzle.pieces[draggedIndex], drag.rotated), tone: toneFor(draggedIndex) }

  return (
    <main className="play" style={{ '--size': puzzle.size } as CSSProperties}>
      <header className="play-bar">
        <h1>Grid Puzzle</h1>
        <div className="sizes" role="group" aria-label="Board size">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={puzzle.size === size}
              onClick={() => dispatch({ type: 'load', puzzle: samples[size].puzzle })}
            >
              {size}×{size}
            </button>
          ))}
        </div>
      </header>

      <div className="play-area">
        <Board
          ref={boardRef}
          state={state}
          liftedId={drag?.pieceId ?? null}
          target={target}
          onPiecePointerDown={startDrag}
          onRotate={rotate}
        />

        <aside>
          <Tray state={state} liftedId={drag?.pieceId ?? null} onPiecePointerDown={startDrag} onRotate={rotate} />

          <p className="status" aria-live="polite">
            {solved ? (
              <>
                <strong>Every cell is filled.</strong>
                Take a breath, or try another size.
              </>
            ) : (
              <>
                <strong>
                  {piecesLeft} {piecesLeft === 1 ? 'piece' : 'pieces'} to place
                </strong>
                Drag a piece onto the board. Tap a piece to turn it
                <span className="keyboard-tip">, or press R while dragging</span>.
              </>
            )}
          </p>

          <div className="actions">
            <button type="button" onClick={() => dispatch({ type: 'undo' })} disabled={state.history.length === 0}>
              Undo
            </button>
            <button type="button" onClick={() => dispatch({ type: 'reset' })} disabled={piecesLeft === puzzle.pieces.length}>
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
    </main>
  )
}
