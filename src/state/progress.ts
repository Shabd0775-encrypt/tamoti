// Remembers, in this browser only (localStorage), every way you've found to
// fill each board. A board counts as solved once you've found one way.
// Private windows and some browser settings block storage, so every read and
// write is wrapped in try/catch: the game still works, it just forgets.

import { useEffect, useState } from 'react'

/**
 * Versioned, because a puzzle's number names a layout: when the library is
 * rebuilt, "6-3" is a different board, so older progress is set aside.
 * v2: the harder library, with blockers in tough spots (2026-10-31).
 */
const FOUND_KEY = 'grid-puzzle:found-v2'

/** For each puzzle id, the ways found (see solutionKey in game/hints.ts). */
export type Found = Record<string, string[]>

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

function load(): Found {
  const found = read<Found>(FOUND_KEY, {})
  return typeof found === 'object' && found ? found : {}
}

export function useProgress() {
  const [found, setFound] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(FOUND_KEY, JSON.stringify(found))
    } catch {
      // Storage unavailable: nothing to do.
    }
  }, [found])

  const solved = new Set(Object.keys(found).filter((id) => found[id].length > 0))

  /** Remember a way of filling a board, if it's new. */
  const recordSolution = (id: string, key: string) =>
    setFound((prev) => {
      const ways = prev[id] ?? []
      if (ways.includes(key)) return prev
      return { ...prev, [id]: [...ways, key] }
    })

  return { solved, found, recordSolution }
}
