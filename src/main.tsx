import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Preference context lives inside App so it can be colocated with the theme
// effect, but the pre-paint theme bootstrapping happens in index.html.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
