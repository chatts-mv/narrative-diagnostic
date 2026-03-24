import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AppV2 from './v2/AppV2'
import AppV3 from './v3/AppV3'

// V3 is the default. Use /v1 or /v2 for other versions.
const isV1 = window.location.pathname.startsWith('/v1')
const isV2 = window.location.pathname.startsWith('/v2')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isV1 ? <App /> : isV2 ? <AppV2 /> : <AppV3 />}
  </React.StrictMode>,
)
