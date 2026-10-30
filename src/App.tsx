import { WashFilters } from './components/hero/WashFilters'
import { Library } from './screens/Library'
import { Play } from './screens/Play'
import { useProgress } from './state/progress'
import { useRoute } from './state/route'

export default function App() {
  const [route, go] = useRoute()
  const { solved, markSolved } = useProgress()

  return (
    <>
      {/* The watercolor brushes (SVG filters), shared by every screen. */}
      <WashFilters />
      {route.screen === 'play' ? (
        // `key` gives each puzzle a fresh Play screen, so nothing carries over between puzzles.
        <Play key={route.id} id={route.id} go={go} onSolved={markSolved} />
      ) : (
        <Library size={route.size} go={go} solved={solved} />
      )}
    </>
  )
}
