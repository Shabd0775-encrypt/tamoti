import type { CSSProperties, PointerEvent, Ref } from 'react'
import { clashes, footprint } from '../game/board'
import type { GameState } from '../state/gameReducer'
import type { DropTarget } from '../state/useDrag'
import { Seal } from './hero/Seal'
import { Piece } from './Piece'
import { toneFor } from './tone'

type Props = {
  ref: Ref<HTMLDivElement>
  state: GameState
  liftedId: string | null
  target: DropTarget | null
  onPiecePointerDown: (event: PointerEvent<HTMLDivElement>, pieceId: string) => void
  onRotate: (pieceId: string) => void
  /** Once solved, the red seal is stamped in the corner. */
  solved: boolean
  /** A piece a hint just placed, which glows softly as it settles. */
  hinted?: string | null
  /** A piece a hint has marked as being in the way. */
  flagged?: string | null
}

/**
 * The board's paper: a sheet with a softly wobbling ink edge. It reaches a
 * little past the grid on every side, as a margin of paper around it.
 */
function BoardSheet() {
  return (
    <svg className="board-paint" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
      <rect x={0} y={0} width={1000} height={1000} className="board-sheet" filter="url(#sheet-edge)" />
      <rect x={4} y={4} width={992} height={992} className="board-edge" filter="url(#sheet-edge)" />
    </svg>
  )
}

/**
 * The grid lines, drawn over exactly the playing area so every line falls
 * on a true boundary between squares, in the gaps between pieces.
 */
function BoardRules({ size }: { size: number }) {
  const lines = Array.from({ length: size - 1 }, (_, i) => {
    const at = ((i + 1) * 1000) / size
    return `M${at} 0V1000M0 ${at}H1000`
  }).join('')
  return (
    <svg className="board-rules" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
      <path d={lines} />
    </svg>
  )
}

/** CSS variables that place something on the board: row, column, width, height. */
const spot = (row: number, col: number, w: number, h: number) =>
  ({ '--r': row, '--c': col, '--w': w, '--h': h }) as CSSProperties

export function Board({ ref, state, liftedId, target, onPiecePointerDown, onRotate, solved, hinted, flagged }: Props) {
  const { puzzle, placements } = state
  const dragged = puzzle.pieces.find((p) => p.id === liftedId)
  const ghost = target && dragged && { ...target, ...footprint(dragged, target.rotated) }
  const clash = clashes(puzzle, placements)

  return (
    <div className={`board ${solved ? 'is-solved' : ''}`}>
      <BoardSheet />
      <div className="board-grid" ref={ref}>
        <BoardRules size={puzzle.size} />

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
            clash.onTop.has(pieceId) && 'is-overlapping',
            pieceId === hinted && 'is-hinted',
            pieceId === flagged && 'is-flagged',
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

        {ghost && (
          <div
            className={`ghost on-board ${ghost.fits ? '' : 'is-overlapping'}`}
            style={spot(ghost.row, ghost.col, ghost.w, ghost.h)}
          />
        )}
      </div>
      {solved && <Seal className="board-seal" />}
    </div>
  )
}
