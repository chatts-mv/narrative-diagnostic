import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AppV2 from './v2/AppV2'
import AppV3 from './v3/AppV3'

// V2 is the default. Navigate to /v1 or /v3 for other versions.
const isV1 = window.location.pathname.startsWith('/v1')
const isV3 = window.location.pathname.startsWith('/v3')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isV1 ? <App /> : isV3 ? <AppV3 /> : <AppV2 />}
  </React.StrictMode>,
)
