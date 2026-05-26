// src/App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthGate }      from './components/AuthGate'
import { Layout }        from './components/Layout'
import { GridView }      from './views/GridView'
import { TimelineView }  from './views/TimelineView'
import { ListView }      from './views/ListView'
import { MapView }       from './views/MapView'
import { SpeakersView }       from './views/SpeakersView'
import { OrganizationsView }  from './views/OrganizationsView'
import { SettingsView }       from './views/SettingsView'

function App() {
  return (
    <AuthGate>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            <Route path="/"         element={<GridView />}     />
            <Route path="/timeline" element={<TimelineView />} />
            <Route path="/list"     element={<ListView />}     />
            <Route path="/map"      element={<MapView />}      />
            <Route path="/speakers" element={<SpeakersView />} />
            <Route path="/organizations" element={<OrganizationsView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </Layout>
      </Router>
    </AuthGate>
  )
}

export default App
