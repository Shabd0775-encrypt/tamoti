import { describe, expect, it } from 'vitest'
import { isSolved } from './board'
import { parseLayout, samples } from './samples'
import { solve } from './solve'

describe('solve', () => {
  it('finds a real solution to each sample', () => {
    for (const { puzzle } of Object.values(samples)) {
      const result = solve(puzzle, { maxSolutions: 1 })
      expect(result.solutions).toBe(1)
      expect(isSolved(puzzle, result.first!)).toBe(true)
    }
  })

  it('counts every solution of a small board', () => {
    // Two identical 1×2 pieces fill a 2×2 square standing up or lying down.
    // Swapping two identical pieces isn't a new solution, so that's two.
    const { puzzle } = parseLayout(`
      AB
      AB
    `)
    expect(solve(puzzle).solutions).toBe(2)
  })

  it('reports no solutions when the pieces cannot fit', () => {
    const { puzzle } = parseLayout(`
      AA1
      BBB
      CCC
    `)
    puzzle.blocked = [{ row: 1, col: 1, w: 1, h: 1 }] // block the middle instead: a 3-wide piece can't fit any row
    expect(solve(puzzle).solutions).toBe(0)
  })

  it('respects pieces that are already placed', () => {
    const { puzzle, solution } = samples[5]
    const result = solve(puzzle, { fixed: { A: solution.A } })
    expect(result.first?.A).toEqual(solution.A)
  })

  it('gives up when the step limit is reached', () => {
    const result = solve(samples[8].puzzle, { maxSteps: 3 })
    expect(result.finished).toBe(false)
  })
})
