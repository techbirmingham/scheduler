import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, Clock, List, Map, Users, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';

// added for netlify authentication controls
import { useEffect } from 'react'; // removed useState from here since it was already declared above
import netlifyIdentity from 'netlify-identity-widget';

function AuthControls() {
  const [user, setUser] = useState(netlifyIdentity.currentUser());

  useEffect(() => {
    netlifyIdentity.on('login', u => setUser(u));
    netlifyIdentity.on('logout', () => setUser(null));
    return () => netlifyIdentity.off();
  }, []);

  if (user) {
    return <button onClick={() => netlifyIdentity.logout()}>Log out</button>;
  } else {
    return <button onClick={() => netlifyIdentity.open()}>Log in</button>;
  }
}
// end of authentication controls

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  const isMapView = location.pathname === '/map';
  const isSpeakersView = location.pathname === '/speakers';
  const isSettingsView = location.pathname === '/settings';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - only show on views that need filtering */}
      {!isMapView && !isSpeakersView && !isSettingsView && (
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      )}
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">Conference Agenda Builder</h1>
            <nav className="flex space-x-1">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md flex items-center space-x-1 text-sm ${
                    isActive 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
                end
              >
                <Calendar size={16} />
                <span>Grid</span>
              </NavLink>
              <NavLink 
                to="/timeline" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md flex items-center space-x-1 text-sm ${
                    isActive 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Clock size={16} />
                <span>Timeline</span>
              </NavLink>
              <NavLink 
                to="/list" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md flex items-center space-x-1 text-sm ${
                    isActive 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <List size={16} />
                <span>List</span>
              </NavLink>
              <NavLink 
                to="/map" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md flex items-center space-x-1 text-sm ${
                    isActive 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Map size={16} />
                <span>Map</span>
              </NavLink>
              <NavLink 
                to="/speakers" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md flex items-center space-x-1 text-sm ${
                    isActive 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Users size={16} />
                <span>Speakers</span>
              </NavLink>
              <NavLink 
                to="/settings" 
                className={({ isActive }) => 
                  `px-3 py-2 rounded-md flex items-center space-x-1 text-sm ${
                    isActive 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Settings size={16} />
                <span>Settings</span>
              </NavLink>
            </nav>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};