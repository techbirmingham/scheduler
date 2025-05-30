// src/components/AuthGate.tsx
import React, { ReactNode, useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

interface AuthGateProps {
  children: ReactNode
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    // 1) fetch the initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    // 2) subscribe to any future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 3) if we have a session, render the app
  if (session) return <>{children}</>

  // 4) otherwise block + show “Log In with Google”
  return (
    <div
      onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white p-6 rounded-lg shadow-lg text-center"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Please log in to continue
        </h2>
        <button
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Log In with Google
        </button>
      </div>
    </div>
  )
}