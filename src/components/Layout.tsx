// src/components/Layout.tsx

import React, { useState } from 'react'

import { NavLink, useLocation } from 'react-router-dom'
import { Calendar, Clock, List, Map, Users, Building2, Settings, LogOut } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { EventPicker } from './EventPicker'
import { useStore } from '../store'
import { supabase } from '../utils/supabaseClient'



interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const currentUserEmail = useStore(s => s.currentUserEmail)
  const currentUserRole = useStore(s => s.currentUserRole)

  const isMapView      = location.pathname === '/map'
  const isSpeakersView = location.pathname === '/speakers'
  const isOrgsView     = location.pathname === '/organizations'
  const isSettingsView = location.pathname === '/settings'

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <EventPicker />
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
                <span>Sessions</span>
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
                to="/organizations"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md flex items-center space-x-1 text-sm ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Building2 size={16} />
                <span>Organizations</span>
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

            {currentUserEmail && (
              <div
                className="ml-3 pl-3 border-l border-gray-200 flex items-center gap-2 text-xs"
                title={currentUserEmail}
              >
                <span className="text-gray-600 max-w-[14rem] truncate">{currentUserEmail}</span>
                {currentUserRole && (
                  <span
                    className={`px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${
                      currentUserRole === 'admin'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {currentUserRole}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => supabase.auth.signOut()}
                  className="p-1 text-gray-400 hover:text-gray-700"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!isMapView && !isSpeakersView && !isOrgsView && !isSettingsView && (
          <Sidebar
            isOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(o => !o)}
          />
        )}
        <main className="flex-1 overflow-auto bg-gray-50 p-4 pb-16">
          {children}
        </main>
      </div>
    </div>
  )
}