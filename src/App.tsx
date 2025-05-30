import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { GridView } from './views/GridView';
import { TimelineView } from './views/TimelineView';
import { ListView } from './views/ListView';
import { MapView } from './views/MapView';
import { SpeakersView } from './views/SpeakersView';
import { SettingsView } from './views/SettingsView';
import { AuthGate } from './components/AuthGate'; // Import the auth overlay

// start built-in modal UI you can open with netlifyIdentity.open()
import netlifyIdentity from 'netlify-identity-widget';

// Initialize Netlify Identity
netlifyIdentity.init({
  APIUrl: 'https://tb-scheduler/.netlify/identity'
});
// end built-in modal UI

function App() {
  return (
    <Router>
      {/* Blocks access unless user is logged in */}
      <AuthGate />

      {/* Your app still loads underneath, but gets blocked by overlay */}
      <Layout>
        <Routes>
          <Route path="/" element={<GridView />} />
          <Route path="/timeline" element={<TimelineView />} />
          <Route path="/list" element={<ListView />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/speakers" element={<SpeakersView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;