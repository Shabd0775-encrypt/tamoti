import type { CSSProperties, PointerEvent, Ref } from 'react'
import { clashes, footprint } from '../game/board'
import type { GameState } from '../state/gameReducer'
import type { DropTarget } from '../state/useDrag'
import { Piece } from './Piece'
import { toneFor } from './tone'

type Props = {
  ref: Ref<HTMLDivElement>
  state: GameState
  liftedId: string | null
  target: DropTarget | null
  onPiecePointerDown: (event: PointerEvent<HTMLDivElement>, pieceId: string) => void
  onRotate: (pieceId: string) => void
}

/** CSS variables that place something on the board: row, column, width, height. */
const spot = (row: number, col: number, w: number, h: number) =>
  ({ '--r': row, '--c': col, '--w': w, '--h': h }) as CSSProperties

export function Board({ ref, state, liftedId, target, onPiecePointerDown, onRotate }: Props) {
  const { puzzle, placements } = state
  const dragged = puzzle.pieces.find((p) => p.id === liftedId)
  const ghost = target && dragged && { ...target, ...footprint(dragged, target.rotated) }
  const clash = clashes(puzzle, placements)

  return (
    <div className="board">
      <div className="board-grid" ref={ref}>
        <div className="cells" aria-hidden="true">
          {Array.from({ length: puzzle.size * puzzle.size }, (_, i) => (
            <span key={i} />
          ))}
        </div>

        {puzzle.blocked.map((rect, i) => (
          <div key={i} className="blocked on-board" style={spot(rect.row, rect.col, rect.w, rect.h)} />
        ))}

        {/* In the order they were put down, so the piece moved last sits on top. */}
        {Object.entries(placements).map(([pieceId, at]) => {
          const index = puzzle.pieces.findIndex((p) => p.id === pieceId)
          const { w, h } = footprint(puzzle.pieces[index], at.rotated)
          const classes = [
            'on-board',
            pieceId === liftedId && 'is-lifted',
            clash.pieces.has(pieceId) && 'is-overlapping',
          ]
          return (
            <Piece
              key={pieceId}
              w={w}
              h={h}
              tone={toneFor(index)}
              className={classes.filter(Boolean).join(' ')}
              style={spot(at.row, at.col, w, h)}
              onPointerDown={(event) => onPiecePointerDown(event, pieceId)}
              onContextMenu={() => onRotate(pieceId)}
            />
          )
        })}

        {/* Squares covered twice (or a piece on a blocked square), marked softly. */}
        {clash.cells.map((cell) => (
          <div
            key={`${cell.row},${cell.col}`}
            className="clash on-board"
            style={spot(cell.row, cell.col, 1, 1)}
            aria-hidden="true"
          />
        ))}

        {ghost && (
          <div
            className={`ghost on-board ${ghost.fits ? '' : 'is-overlapping'}`}
            style={spot(ghost.row, ghost.col, ghost.w, ghost.h)}
          />
        )}
      </div>
    </div>
  )
}
