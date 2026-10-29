// Remembers which puzzles you've solved, in this browser only (localStorage).
// Private windows and some browser settings block storage, so every read and
// write is wrapped in try/catch: the game still works, it just forgets.

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'grid-puzzle:solved'

function load(): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(saved) ? saved : [])
  } catch {
    return new Set()
  }
}

export function useProgress() {
  const [solved, setSolved] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...solved]))
    } catch {
      // Storage unavailable: nothing to do.
    }
  }, [solved])

  const markSolved = (id: string) => setSolved((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))

  return { solved, markSolved }
}
