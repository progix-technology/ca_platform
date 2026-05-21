import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './style/custom.css'
import './style/dashboard-addon.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
