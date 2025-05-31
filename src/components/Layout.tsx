z// src/components/Layout.tsx
import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Calendar, Clock, List, Map, Users, Settings } from 'lucide-react'
import { supabase } from '../utils/supabaseClient'
import { Sidebar } from './Sidebar'

function AuthControls() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // initial fetch
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    // subscribe
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  if (session) {
    return (
      <button
        onClick={() => supabase.auth.signOut()}
        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
      >
        Log out
      </button>
    )
  } else {
    return (
      <button
        onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
      >
        Log in
      </button>
    )
  }
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const loc = useLocation()
  const hideSidebar = ['/map','/speakers','/settings'].includes(loc.pathname)

  return (
    <div className="flex h-screen bg-gray-50">
      {!hideSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(open => !open)}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">Scheduler</h1>
            <nav className="flex items-center space-x-2">
              {/* … your NavLinks … */}
              <AuthControls />
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