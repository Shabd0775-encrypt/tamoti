import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import './styles/hero.css'
import './styles/library.css'
import './styles/play.css'
import './styles/transitions.css'
import App from './App.tsx'

// Lets the styles know scripts are running, so things that reveal on scroll may start hidden.
document.documentElement.classList.add('js')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
