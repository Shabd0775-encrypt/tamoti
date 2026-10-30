import { describe, expect, it } from 'vitest'
import { dailyPuzzleId, dayNumber } from './daily'
import { findPuzzle } from './library'

describe('dailyPuzzleId', () => {
  it('is the same all day, and a real puzzle', () => {
    const morning = dailyPuzzleId(new Date(2026, 9, 30, 7, 0))
    const night = dailyPuzzleId(new Date(2026, 9, 30, 23, 30))
    expect(morning).toBe(night)
    expect(findPuzzle(morning)).not.toBeNull()
  })

  it('never gives the same board two days running', () => {
    for (let day = 0; day < 400; day++) {
      const today = dailyPuzzleId(new Date(2026, 0, 1 + day))
      const tomorrow = dailyPuzzleId(new Date(2026, 0, 2 + day))
      expect(tomorrow).not.toBe(today)
    }
  })

  it('counts days from the start of 2026', () => {
    expect(dayNumber(new Date(2026, 0, 1))).toBe(0)
    expect(dayNumber(new Date(2026, 0, 31))).toBe(30)
  })
})
