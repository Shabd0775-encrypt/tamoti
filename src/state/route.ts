// Which screen is showing, kept in the web address so that the browser's
// back button works and any puzzle can be linked to.
//
//   /?size=8   the library, showing 8×8 puzzles
//   /?p=8-12   playing 8×8 puzzle number 12

import { useEffect, useState } from 'react'
import { findPuzzle, sizes } from '../game/library'

export type Route = { screen: 'library'; size: number } | { screen: 'play'; id: string }

export type Go = (route: Route) => void

const DEFAULT_SIZE = 6

function readAddress(): Route {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('p')
  if (id && findPuzzle(id)) return { screen: 'play', id }
  const size = Number(params.get('size'))
  return { screen: 'library', size: sizes.includes(size) ? size : DEFAULT_SIZE }
}

function toAddress(route: Route): string {
  return route.screen === 'play' ? `?p=${route.id}` : `?size=${route.size}`
}

export function useRoute(): [Route, Go] {
  const [route, setRoute] = useState(readAddress)

  // The back and forward buttons change the address without asking us; follow along.
  useEffect(() => {
    const onPopState = () => setRoute(readAddress())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const go: Go = (next) => {
    window.history.pushState(null, '', toAddress(next))
    setRoute(next)
    // A new screen starts at the top; changing the size within the library keeps your place.
    if (next.screen !== route.screen) window.scrollTo(0, 0)
  }

  return [route, go]
}
