// Remembers, in this browser only (localStorage), every way you've found to
// fill each board. A board counts as solved once you've found one way.
// Private windows and some browser settings block storage, so every read and
// write is wrapped in try/catch: the game still works, it just forgets.

import { useEffect, useState } from 'react'

const FOUND_KEY = 'grid-puzzle:found'
/** The older list of solved boards, from before ways were remembered. Still read, so nothing is lost. */
const SOLVED_KEY = 'grid-puzzle:solved'

/** For each puzzle id, the ways found (see solutionKey in game/hints.ts). */
export type Found = Record<string, string[]>

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

function load(): { found: Found; legacy: string[] } {
  const found = read<Found>(FOUND_KEY, {})
  const legacy = read<string[]>(SOLVED_KEY, [])
  return { found: typeof found === 'object' && found ? found : {}, legacy: Array.isArray(legacy) ? legacy : [] }
}

export function useProgress() {
  const [{ found, legacy }, setProgress] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(FOUND_KEY, JSON.stringify(found))
    } catch {
      // Storage unavailable: nothing to do.
    }
  }, [found])

  const solved = new Set([...legacy, ...Object.keys(found).filter((id) => found[id].length > 0)])

  /** Remember a way of filling a board, if it's new. */
  const recordSolution = (id: string, key: string) =>
    setProgress((prev) => {
      const ways = prev.found[id] ?? []
      if (ways.includes(key)) return prev
      return { ...prev, found: { ...prev.found, [id]: [...ways, key] } }
    })

  return { solved, found, recordSolution }
}
