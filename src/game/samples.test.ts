import { describe, expect, it } from 'vitest'
import { isSolved } from './board'
import { parseLayout, samples } from './samples'

describe('parseLayout', () => {
  it('reads pieces and blocked areas from a drawing', () => {
    const { puzzle } = parseLayout(`
      AA1
      BBC
      BBC
    `)
    expect(puzzle.size).toBe(3)
    expect(puzzle.blocked).toEqual([{ row: 0, col: 2, w: 1, h: 1 }])
    expect(puzzle.pieces).toContainEqual({ id: 'B', w: 2, h: 2 })
  })

  it('rejects a piece that is not a rectangle', () => {
    expect(() =>
      parseLayout(`
        AA
        A1
      `),
    ).toThrow('not a filled rectangle')
  })
})

describe('samples', () => {
  for (const [size, { puzzle, solution }] of Object.entries(samples)) {
    it(`${size}×${size} is solved by the drawing it came from`, () => {
      expect(isSolved(puzzle, solution)).toBe(true)
    })
  }
})
