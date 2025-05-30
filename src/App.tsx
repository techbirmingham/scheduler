// src/App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import netlifyIdentity from 'netlify-identity-widget'

import { AuthGate } from './components/AuthGate'
import { Layout } from './components/Layout'
import { GridView } from './views/GridView'
import { TimelineView } from './views/TimelineView'
import { ListView } from './views/ListView'
import { MapView } from './views/MapView'
import { SpeakersView } from './views/SpeakersView'
import { SettingsView } from './views/SettingsView'

// Initialize Netlify Identity (point APIUrl at your site)
netlifyIdentity.init({
  APIUrl: 'https://tb-scheduler.netlify.app/.netlify/identity'
})

function App() {
  return (
    <Router>
      {/* This overlay blocks everything until you log in */}
      <AuthGate>
        {/* Once authenticated, your normal layout & routes appear */}
        <Layout>
          <Routes>
            <Route path="/"        element={<GridView     />} />
            <Route path="/timeline" element={<TimelineView />} />
            <Route path="/list"     element={<ListView     />} />
            <Route path="/map"      element={<MapView      />} />
            <Route path="/speakers" element={<SpeakersView/>} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </Layout>
      </AuthGate>
    </Router>
  )
}

export default App