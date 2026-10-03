import React from 'react'
import ReactDOM from 'react-dom/client'
import MainInterface from './MainInterface'
import 'leaflet/dist/leaflet.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainInterface />
  </React.StrictMode>
)
