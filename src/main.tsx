import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { iniciarEscalaFonte } from './utils/escalaFonte'

// Antes do Sienna (script defer depois deste em index.html) ler a config dele.
iniciarEscalaFonte()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
