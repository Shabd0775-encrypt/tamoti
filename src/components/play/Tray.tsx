import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import { currentFootprint, type GameState } from '../../state/gameReducer'
import { Piece } from '../pieces/Piece'
import { toneFor } from '../pieces/tone'

type Props = {
  state: GameState
  liftedId: string | null
  onPiecePointerDown: (event: PointerEvent<HTMLDivElement>, pieceId: string) => void
  onRotate: (pieceId: string) => void
  onPieceKeyDown: (event: KeyboardEvent<HTMLDivElement>, pieceId: string) => void
}

/** The pieces still waiting to be placed. */
export function Tray({ state, liftedId, onPiecePointerDown, onRotate, onPieceKeyDown }: Props) {
  return (
    <div className="tray">
      {state.puzzle.pieces.map((piece, index) => {
        if (state.placements[piece.id]) return null
        const { w, h } = currentFootprint(state, piece.id)
        return (
          <Piece
            key={piece.id}
            w={w}
            h={h}
            tone={toneFor(index)}
            className={piece.id === liftedId ? 'is-lifted' : ''}
            // Its place in the tray, so the pieces can be laid out one after another (see play.css).
            style={{ '--i': index } as CSSProperties}
            onPointerDown={(event) => onPiecePointerDown(event, piece.id)}
            onContextMenu={() => onRotate(piece.id)}
            onKeyDown={(event) => onPieceKeyDown(event, piece.id)}
            label={`${w} by ${h} piece, in the tray. Enter puts it on the board; R turns it.`}
            pieceId={piece.id}
          />
        )
      })}
    </div>
  )
}
