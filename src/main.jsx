import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './utils/gsapSetup'
import './styles/globals.css'
import siteConfig from './config/siteConfig'
import App from './App.jsx'

// Keep the accent in sync with siteConfig during development (index.html
// already applied it before paint for production).
const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}
const rootStyle = document.documentElement.style
rootStyle.setProperty('--accent-base', hexToRgb(siteConfig.settings.accent))
rootStyle.setProperty('--accent-ink-light', hexToRgb(siteConfig.settings.accentInk || siteConfig.settings.accent))

// The router restores scroll itself (see PageTransition)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
