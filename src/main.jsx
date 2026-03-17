import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AppV2 from './v2/AppV2'

// V2 is the default. Navigate to /v1 to load the original.
const isV1 = window.location.pathname.startsWith('/v1')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isV1 ? <App /> : <AppV2 />}
  </React.StrictMode>,
)
