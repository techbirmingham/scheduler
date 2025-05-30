import React, { useEffect, useState } from 'react'
import netlifyIdentity from 'netlify-identity-widget'

export const AuthGate: React.FC = () => {
  const [user, setUser] = useState(() => netlifyIdentity.currentUser())

  useEffect(() => {
    netlifyIdentity.on('login', user => setUser(user))
    netlifyIdentity.on('logout', () => setUser(null))
    netlifyIdentity.init()
    return () => {
      netlifyIdentity.off('login')
      netlifyIdentity.off('logout')
    }
  }, [])

  if (user) return null

  return (
    <div className="fixed inset-0 z-50 bg-gray bg-opacity-70 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg shadow-indigo-500/50 text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          You must be logged in to use this app
        </h2>
        <button
          onClick={() => netlifyIdentity.open()}
          className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Log In
        </button>
      </div>
    </div>
  )
}