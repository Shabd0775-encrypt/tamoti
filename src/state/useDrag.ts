// Dragging pieces around with a mouse, finger or pen.
//
// Pointer Events cover all three with one API: pointerdown when you press,
// pointermove while you move, pointerup when you let go. A press that barely
// moves counts as a tap, and tapping a piece turns it sideways.
//
// To turn a piece while dragging it: press R, right-click, or (on a touch
// screen) tap anywhere with a second finger.

import { useEffect, useState, type Dispatch, type PointerEvent, type RefObject } from 'react'
import { canPlace, footprint } from '../game/board'
import type { Placement } from '../game/types'
import type { GameAction, GameState } from './gameReducer'

/** How far (in pixels) a press must travel before it counts as a drag, not a tap. */
const DRAG_THRESHOLD = 6

export type Drag = {
  pieceId: string
  /** Which pointer (mouse, or one particular finger) is doing the dragging. */
  pointerId: number
  from: 'tray' | 'board'
  rotated: boolean
  /** Where on the piece the pointer holds it, from 0 to 1 across and down. */
  grab: { x: number; y: number }
  pointer: { x: number; y: number }
  start: { x: number; y: number }
  moved: boolean
  /** The board's position and width on screen, measured as the pointer moves. */
  board: { left: number; top: number; width: number }
}

/** Where the piece would land. `fits` is true for a clean fit; false means it would overlap something. */
export type DropTarget = Placement & { fits: boolean }

export function useDrag(state: GameState, dispatch: Dispatch<GameAction>, boardRef: RefObject<HTMLDivElement | null>) {
  const [drag, setDrag] = useState<Drag | null>(null)

  // Only called from event handlers: React wants screen measurements kept out of drawing.
  const measureBoard = () => {
    const rect = boardRef.current!.getBoundingClientRect()
    return { left: rect.left, top: rect.top, width: rect.width }
  }

  /** The board spot under the dragged piece, or null when it's off the board. */
  function dropTarget(d: Drag): DropTarget | null {
    const { board } = d
    const cell = board.width / state.puzzle.size
    const piece = state.puzzle.pieces.find((p) => p.id === d.pieceId)!
    const { w, h } = footprint(piece, d.rotated)

    // The piece's centre has to be over the board for it to count.
    const left = d.pointer.x - d.grab.x * w * cell
    const top = d.pointer.y - d.grab.y * h * cell
    const centreX = left + (w * cell) / 2 - board.left
    const centreY = top + (h * cell) / 2 - board.top
    if (centreX < 0 || centreX > board.width || centreY < 0 || centreY > board.width) return null

    // Snap to the nearest cell, nudged back inside if it pokes over an edge.
    const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max)
    const at = {
      row: clamp(Math.round((top - board.top) / cell), state.puzzle.size - h),
      col: clamp(Math.round((left - board.left) / cell), state.puzzle.size - w),
      rotated: d.rotated,
    }
    return { ...at, fits: canPlace(state.puzzle, state.placements, d.pieceId, at) }
  }

  function startDrag(event: PointerEvent<HTMLElement>, pieceId: string) {
    if (event.button !== 0) return // only the main mouse button, or a finger
    if (drag) return // a second finger on another piece turns the dragged one instead (see onDown)
    event.preventDefault()
    const box = event.currentTarget.getBoundingClientRect()
    const placed = state.placements[pieceId]
    setDrag({
      pieceId,
      pointerId: event.pointerId,
      from: placed ? 'board' : 'tray',
      rotated: placed?.rotated ?? state.trayRotated[pieceId] ?? false,
      grab: { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height },
      pointer: { x: event.clientX, y: event.clientY },
      start: { x: event.clientX, y: event.clientY },
      moved: false,
      board: measureBoard(),
    })
  }

  // While a drag is happening, listen to the whole window, so the piece keeps
  // following even when the pointer leaves the piece itself.
  useEffect(() => {
    if (!drag) return
    // While dragging, a second finger shouldn't scroll or zoom the page.
    document.documentElement.classList.add('is-dragging')

    const turn = () =>
      // Turning keeps the same spot under the pointer: what was down becomes across.
      setDrag((d) => d && { ...d, rotated: !d.rotated, grab: { x: 1 - d.grab.y, y: d.grab.x } })

    const onMove = (e: globalThis.PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return
      const board = measureBoard() // re-measured in case the page scrolled
      setDrag((d) => {
        if (!d) return d
        const travelled = Math.hypot(e.clientX - d.start.x, e.clientY - d.start.y)
        return { ...d, board, pointer: { x: e.clientX, y: e.clientY }, moved: d.moved || travelled > DRAG_THRESHOLD }
      })
    }

    // A second finger touching down while the first one drags: turn the piece.
    const onDown = (e: globalThis.PointerEvent) => {
      if (e.pointerId === drag.pointerId) return
      e.preventDefault()
      turn()
    }

    const onUp = (e: globalThis.PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return
      setDrag(null)
      if (!drag.moved) {
        dispatch({ type: 'rotate', pieceId: drag.pieceId })
        return
      }
      const target = dropTarget(drag)
      if (target) {
        // Over the board it always goes down, even on top of other pieces.
        dispatch({ type: 'place', pieceId: drag.pieceId, at: target })
      } else if (drag.from === 'board') {
        dispatch({ type: 'remove', pieceId: drag.pieceId }) // dropped off the board: back to the tray
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') turn()
      if (e.key === 'Escape') setDrag(null)
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault() // right-click while dragging turns the piece instead of opening a menu
      turn()
    }

    const cancel = (e: globalThis.PointerEvent) => {
      if (e.pointerId === drag.pointerId) setDrag(null)
    }

    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('keydown', onKey)
    window.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.documentElement.classList.remove('is-dragging')
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('contextmenu', onContextMenu)
    }
  })

  const isDragging = drag?.moved ?? false
  return {
    drag: isDragging ? drag : null,
    target: drag && isDragging ? dropTarget(drag) : null,
    cellSize: drag ? drag.board.width / state.puzzle.size : 0,
    startDrag,
  }
}
