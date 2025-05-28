import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { GridView } from './views/GridView';
import { TimelineView } from './views/TimelineView';
import { ListView } from './views/ListView';
import { MapView } from './views/MapView';
import { SpeakersView } from './views/SpeakersView';
import { SettingsView } from './views/SettingsView';

// start built-in modal UI you can open with netlifyIdentity.open()
import netlifyIdentity from 'netlify-identity-widget';

// when your app boots:
netlifyIdentity.init({
  APIUrl: 'https://<your-netlify-subdomain>/.netlify/identity'
});
// end built-in modal UI you can open with netlifyIdentity.open()

function App() {
  return (
    <Router>
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