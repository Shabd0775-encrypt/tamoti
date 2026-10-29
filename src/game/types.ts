// The "nouns" of the game. These are just shapes of data, with no behavior.
// Rows go top to bottom and columns go left to right, both counting from 0.

/** A rectangle on the grid: its top-left cell plus its width and height in cells. */
export type Rect = {
  row: number
  col: number
  w: number
  h: number
}

/** A piece in the tray, defined by its size when it isn't rotated. */
export type Piece = {
  id: string
  w: number
  h: number
}

/** Where a piece sits on the board. A rotated piece swaps its width and height. */
export type Placement = {
  row: number
  col: number
  rotated: boolean
}

/** Every placed piece, looked up by piece id. Pieces still in the tray are absent. */
export type Placements = Record<string, Placement>

export type Puzzle = {
  size: number // the board is size × size
  blocked: Rect[]
  pieces: Piece[]
}

/** What occupies one cell: nothing, a blocker, or the id of a placed piece. */
export type CellContent = null | 'blocked' | string
