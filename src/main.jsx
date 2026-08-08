import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted Noto Serif SC (思源宋体), variable weight axis 200-900.
// Imported here rather than via CSS `@import` so Vite fingerprints and emits the
// woff2 files as build assets. The package ships 101 unicode-range chunks, so a
// visitor downloads only the chunks their page actually needs (~64 KB each),
// not the 5.7 MB total. One chunk covers every weight, which is why the
// variable package is used instead of separate 400/700/900 static weights.
import '@fontsource-variable/noto-serif-sc'
// Self-hosted JetBrains Mono for code, same variable-font reasoning. Latin-only,
// so the whole family is 264 KB / 12 woff2 rather than the serif's 5.7 MB — the
// serif is expensive only because CJK needs 101 unicode-range chunks.
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
