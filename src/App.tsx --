// src/App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import netlifyIdentity from 'netlify-identity-widget'

// initialize Netlify Identity once
netlifyIdentity.init({
  APIUrl: 'https://tb-scheduler.netlify.app/.netlify/identity',
})

// import { AuthGate }     from './components/AuthGate'
import { Layout }       from './components/Layout'
import { GridView }     from './views/GridView'
import { TimelineView } from './views/TimelineView'
import { ListView }     from './views/ListView'
import { MapView }      from './views/MapView'
import { SpeakersView } from './views/SpeakersView'
import { SettingsView } from './views/SettingsView'

function App() {
  return (
    <Router>
      {/* blocks everything until you’ve logged in */}
{/*      <AuthGate> */}
        {/* once you’re past the gate, you get your layout + routes */}
        <Layout>
          <Routes>
            <Route path="/"          element={<GridView />}     />
            <Route path="/timeline"  element={<TimelineView />} />
            <Route path="/list"      element={<ListView />}     />
            <Route path="/map"       element={<MapView />}      />
            <Route path="/speakers"  element={<SpeakersView />} />
            <Route path="/settings"  element={<SettingsView />}  />
          </Routes>
        </Layout>
{/*   </AuthGate> */}
    </Router>
  )
}

export default App 