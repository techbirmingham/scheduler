// src/components/Layout.tsx

import React, { useState, useEffect } from 'react'

import { NavLink, useLocation } from 'react-router-dom'
import { Calendar, Clock, List, Map, Users, Settings } from 'lucide-react'
import { Sidebar } from './Sidebar'




  return user ? (
    <button
      onClick={() => netlifyIdentity.logout()}
      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
    >
      Log out
    </button>
  ) : (
    <button
      onClick={() => netlifyIdentity.open()}
      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
    >
      Log in
    </button>
  )
}

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const isMapView      = location.pathname === '/map'
  const isSpeakersView = location.pathname === '/speakers'
  const isSettingsView = location.pathname === '/settings'

  return (
    <div className="flex h-screen bg-gray-50">
      {!isMapView && !isSpeakersView && !isSettingsView && (
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(o => !o)}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">
              Scheduler
            </h1>
            <nav className="flex items-center space-x-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md flex items-center space-x-1 text-sm ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
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

        <main className="flex-1 overflow-auto bg-gray-50 p-4">
          {children}
        </main>
      </div>
    </div>
  )
}