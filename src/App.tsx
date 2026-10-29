import { Library } from './screens/Library'
import { Play } from './screens/Play'
import { useProgress } from './state/progress'
import { useRoute } from './state/route'

export default function App() {
  const [route, go] = useRoute()
  const { solved, markSolved } = useProgress()

  if (route.screen === 'play') {
    // `key` gives each puzzle a fresh Play screen, so nothing carries over between puzzles.
    return <Play key={route.id} id={route.id} go={go} onSolved={markSolved} />
  }
  return <Library size={route.size} go={go} solved={solved} />
}
