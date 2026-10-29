import type { CSSProperties, PointerEvent, Ref } from 'react'
import { footprint } from '../game/board'
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

        {puzzle.pieces.map((piece, index) => {
          const at = placements[piece.id]
          if (!at) return null
          const { w, h } = footprint(piece, at.rotated)
          return (
            <Piece
              key={piece.id}
              w={w}
              h={h}
              tone={toneFor(index)}
              className={`on-board ${piece.id === liftedId ? 'is-lifted' : ''}`}
              style={spot(at.row, at.col, w, h)}
              onPointerDown={(event) => onPiecePointerDown(event, piece.id)}
              onContextMenu={() => onRotate(piece.id)}
            />
          )
        })}

        {ghost && (
          <div
            className={`ghost on-board ${ghost.fits ? '' : 'is-blocked'}`}
            style={spot(ghost.row, ghost.col, ghost.w, ghost.h)}
          />
        )}
      </div>
    </div>
  )
}
